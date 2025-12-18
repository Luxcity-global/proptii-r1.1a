import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RoleSelection } from './components/RoleSelection';
import { ProfileSetup } from './components/ProfileSetup';
import { PropertySetup } from './components/PropertySetup';
import { PropertySetupStep1 } from './components/PropertySetupStep1';
import { PropertyTypeSelection } from './components/PropertyTypeSelection';
import { PropertyDetailsSelection } from './components/PropertyDetailsSelection';
import { AmenitiesSelection } from './components/AmenitiesSelection';
import { ImagesAndNotesSelection } from './components/ImagesAndNotesSelection';
import { PhotoUpload } from './components/PhotoUpload';
import { Dashboard } from './components/Dashboard';
import { PropertyDetails } from './components/PropertyDetails';
import { DocumentManagement } from './components/DocumentManagement';
import { PhotoManagement } from './components/PhotoManagement';
import { PortfolioInsights } from './components/PortfolioInsights';
import { PropertyInsights } from './components/PropertyInsights';
import { MainLayout, NavigationScreen } from './components/MainLayout';
import { PropertiesPage } from './components/PropertiesPage';
import { DocumentsPage } from './components/DocumentsPage';
import { ClientsPage } from './components/ClientsPage';
import { TenantDetails } from './components/TenantDetails';
import { LandlordDetails } from './components/LandlordDetails';
import { OnboardingOptions } from './components/OnboardingOptions';
import { CompanyProfileSetup } from './components/CompanyProfileSetup';
import { VacancyPrevention } from './components/VacancyPrevention';
import { ArrearsManagement } from './components/ArrearsManagement';
import { TenantInbox } from './components/TenantInbox';
import { PropertyPreview } from './components/PropertyPreview';
import { TenantSelection } from './components/TenantSelection';
import { AddTenant } from './components/AddTenant';
import { alertService, type Alert } from './services/alertService';
import { InviteTenant } from './components/InviteTenant';
import { SelectExistingTenant } from './components/SelectExistingTenant';
import { AddLandlord } from './components/AddLandlord';
import { AddLandlordWizard } from './components/AddLandlordWizard';
import { ContractsPage } from './components/ContractsPage';
import { propertyService } from './services/propertyService';
import { tenantService } from './services/tenantService';
import { marketInsightService } from './services/marketInsightService';
import ViewingsPage from './components/ViewingsPage';
import { storage, db } from './config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, onSnapshot, Unsubscribe, doc, updateDoc, Timestamp } from 'firebase/firestore';

export type UserRole = 'landlord' | 'agent';

export interface CompanyProfile {
  companyName: string;
  companyDescription?: string;
  website?: string;
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  logo?: string;
  brandColor?: string;
  vatNumber?: string;
  registrationNumber?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  logo?: string;
  companyProfile?: CompanyProfile;
}

export interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms?: number;
  squareFootage?: number;
  rent: number;
  status: 'vacant' | 'occupied' | 'under-renovation';
  amenities: string[];
  notes: string;
  photos: PropertyPhoto[];
  documents: PropertyDocument[];
  createdAt: Date;
  tenant?: Tenant;
  tenantId?: string;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  filename: string;
  room?: string;
  isCover: boolean;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'epc' | 'gas-cert' | 'tenancy-agreement' | 'insurance' | 'other';
  url: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring-soon' | 'expired';
}

export interface MarketInsight {
  id: string;
  type: 'market-trend' | 'regulatory-change' | 'demand-shift' | 'price-change' | 'rental-demand' | 'epc-requirements' | 'property-values';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  date: Date;
  area?: string;
  region?: string;
  value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  source?: string;
  link?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  propertyId: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'ended';
  referencingStatus: 'not-started' | 'in-progress' | 'complete';
  paymentStatus: 'current' | 'overdue' | 'payment-plan';
  paymentFrequency?: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate?: Date;
  paymentIntervalDays?: number;
  avatar?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  defaultRiskScore?: number;
  lastPaymentDate?: Date;
  overdueAmount?: number;
}

export interface PropertyMarketData {
  averagePrice: number;
  priceChange12Months: number;
  rentalDemandIndex: number;
  occupancyRate: number;
  averageRent: number;
  growthScore: number;
  demographics: {
    averageAge: number;
    averageIncome: number;
    householdSize: number;
    rentersRatio: number;
  };
  nearbyDevelopments: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface VacancyRiskAlert {
  id: string;
  propertyId: string;
  propertyAddress: string;
  riskScore: number;
  predictedVacancyDate: Date;
  currentTenantEndDate: Date;
  factors: {
    marketTrend: number;
    seasonality: number;
    tenantHistory: number;
    propertyCondition: number;
  };
  recommendations: {
    optimalRentPrice: number;
    marketingStartDate: Date;
    urgencyLevel: 'low' | 'medium' | 'high';
  };
  status: 'new' | 'pre-marketing' | 'marketing-active' | 'resolved';
}

export interface ArrearsAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyAddress: string;
  overdueAmount: number;
  daysPastDue: number;
  defaultRiskScore: number;
  lastPaymentDate: Date;
  status: 'new' | 'reminder-sent' | 'payment-plan' | 'legal-action' | 'resolved';
  interventionType?: 'reminder' | 'payment-plan' | 'legal';
}

export interface TenantMessage {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyAddress: string;
  subject: string;
  content: string;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  status: 'new' | 'read' | 'replied' | 'resolved';
  category: 'maintenance' | 'lease-query' | 'payment' | 'emergency' | 'general';
  priority: 'low' | 'medium' | 'high';
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface AIMarketingAssets {
  optimalRentPrice: number;
  marketingCopy: string;
  virtualStagingImages: string[];
  marketData: {
    comparableProperties: {
      address: string;
      rent: number;
      distance: string;
    }[];
    demandScore: number;
    competitionLevel: 'low' | 'medium' | 'high';
  };
}

export type Screen = 
  | 'welcome'
  | 'role-selection'
  | 'profile-setup'
  | 'onboarding-options'
  | 'company-profile-setup'
  | 'property-setup-step1'
  | 'property-type-selection'
  | 'property-details-selection'
  | 'amenities-selection'
  | 'images-notes-selection'
  | 'property-setup'
  | 'photo-upload'
  | 'main-app'
  | 'property-details'
  | 'document-management'
  | 'photo-management'
  | 'portfolio-insights'
  | 'property-insights'
  | 'tenant-details'
  | 'vacancy-prevention'
  | 'arrears-management'
  | 'tenant-inbox'
  | 'property-preview'
  | 'tenant-selection'
  | 'add-tenant'
  | 'invite-tenant'
  | 'select-existing-tenant'
  | 'add-landlord'
  | 'landlord-details';

// Property setup data interface
interface PropertySetupData {
  propertyType: string | null;
  propertyDetails: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
  };
  amenities: string[];
  images: string[]; // Blob URLs for preview
  imageFiles: File[]; // Actual File objects for upload
  additionalNotes: string;
  status?: 'vacant' | 'occupied' | 'under-renovation'; // Preserve status when editing
  pendingTenants?: Omit<Tenant, 'id'>[]; // Tenants added before property is published
}

// Main App Content Component (wrapped by Routes)
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main-app');
  const [navigationScreen, setNavigationScreen] = useState<NavigationScreen>('dashboard');
  
  // Sync URL to navigation state
  useEffect(() => {
    const pathToScreen: Record<string, NavigationScreen> = {
      '/': 'dashboard',
      '/dashboard': 'dashboard',
      '/viewings': 'viewings',
      '/properties': 'properties',
      '/documents': 'documents',
      '/contracts': 'contracts',
      '/clients': 'clients',
    };
    
    const path = location.pathname;
    const targetScreen = pathToScreen[path] || 'dashboard';
    
    if (targetScreen !== navigationScreen) {
      console.log('🧭 URL changed, updating navigationScreen to:', targetScreen);
      setNavigationScreen(targetScreen);
      setCurrentScreen('main-app');
    }
  }, [location.pathname, navigationScreen]);
  
  // Wrapper function to log navigation changes and update URL
  const handleNavigation = (screen: NavigationScreen) => {
    console.log('🧭 Navigation triggered to:', screen);
    console.log('🧭 Current navigationScreen before change:', navigationScreen);
    setNavigationScreen(screen);
    
    // Update URL
    const screenToPath: Record<NavigationScreen, string> = {
      'dashboard': '/dashboard',
      'viewings': '/viewings',
      'properties': '/properties',
      'documents': '/documents',
      'contracts': '/contracts',
      'clients': '/clients',
      'insights': '/insights',
      'inbox': '/inbox',
    };
    
    const path = screenToPath[screen] || '/dashboard';
    if (location.pathname !== path) {
      navigate(path);
    }
  };
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('landlord');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const editingTenantRef = React.useRef<Tenant | null>(null);
  const [selectedLandlord, setSelectedLandlord] = useState<any | null>(null);
  const [selectedVacancyAlert, setSelectedVacancyAlert] = useState<VacancyRiskAlert | null>(null);
  const [selectedArrearsAlert, setSelectedArrearsAlert] = useState<ArrearsAlert | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [vacancyAlerts, setVacancyAlerts] = useState<VacancyRiskAlert[]>([]);
  const [arrearsAlerts, setArrearsAlerts] = useState<ArrearsAlert[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);

  const resolveManagerId = useCallback((): string | null => {
    try {
      if (userProfile && (userProfile as any).id) {
        return (userProfile as any).id;
      }

      const params = new URLSearchParams(window.location.search);
      const uidFromQuery = params.get('uid');
      if (uidFromQuery) {
        return uidFromQuery;
      }

      if (typeof (window as any).getUserInfo === 'function') {
        const info = (window as any).getUserInfo();
        if (info?.id || info?.sub || info?.oid) {
          return info.id || info.sub || info.oid;
        }
      }

      const cached = localStorage.getItem('proptii_auth_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        const uid = parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId;
        if (uid) {
          return uid;
        }
      }
    } catch (err) {
      console.error('Error resolving manager id:', err);
    }
    return null;
  }, [userProfile]);
  
  // Property setup state
  const [propertySetupData, setPropertySetupData] = useState<PropertySetupData>({
    propertyType: null,
    propertyDetails: {
      address: '',
      monthlyRent: '',
      bedrooms: '',
      bathrooms: '',
      squareFootage: '',
      uploadedDocuments: []
    },
    amenities: [],
    images: [], // Blob URLs for preview
    imageFiles: [], // File objects for upload
    additionalNotes: '',
    pendingTenants: [] // Tenants added before property is published
  });

  // Helper functions to update property setup data
  const updatePropertySetupData = (updates: Partial<PropertySetupData>) => {
    setPropertySetupData(prev => ({ ...prev, ...updates }));
  };

  const updatePropertyDetails = (updates: Partial<PropertySetupData['propertyDetails']>) => {
    setPropertySetupData(prev => ({
      ...prev,
      propertyDetails: { ...prev.propertyDetails, ...updates }
    }));
  };

  // Listen for authentication changes from the bridge script
  React.useEffect(() => {
    const handleAuthStateChange = () => {
      // Check if authentication bridge functions are available
      if (typeof window.getUserInfo === 'function') {
        const userInfo = window.getUserInfo();
        if (userInfo && userInfo.isAuthenticated) {
          setUserProfile({
            name: userInfo.name,
            email: userInfo.email,
            phone: '+44 7911 123456', // Default phone, could be enhanced later
            companyName: 'Proptii',
            logo: undefined
          });
          console.log('✅ Updated userProfile with authentication data:', userInfo);
        }
      }
    };

    // Listen for authentication state changes
    window.addEventListener('authStateChanged', handleAuthStateChange);
    window.addEventListener('userAuthenticated', handleAuthStateChange);

    // Also check immediately
    handleAuthStateChange();

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      window.removeEventListener('userAuthenticated', handleAuthStateChange);
    };
  }, []);

  // Listen for AUTH_STATE and NAVIGATE messages from the embedding tenant app (bridge)
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data: any = (event as any).data;
      
      // Handle AUTH_STATE messages
      if (data && data.type === 'AUTH_STATE' && data.payload) {
        const { isAuthenticated, user } = data.payload;
        if (isAuthenticated && user) {
          setUserProfile({
            name: user.name || user.givenName || '',
            email: user.email || '',
            phone: user.phone || '+44 7911 123456',
            companyName: 'Proptii',
            logo: undefined
          });
          console.log('✅ Received AUTH_STATE from parent, updated userProfile:', user);
        }
        setIsAuthLoading(false);
      }
      
      // Handle NAVIGATE messages
      if (data && data.type === 'NAVIGATE' && data.payload) {
        const { path } = data.payload;
        console.log('🧭 Received NAVIGATE message with path:', path);
        
        // Map URL paths to navigation screens
        const pathToScreen: Record<string, NavigationScreen> = {
          '/': 'dashboard',
          '/dashboard': 'dashboard',
          '/viewings': 'viewings',
          '/properties': 'properties',
          '/documents': 'documents',
          '/contracts': 'contracts',
          '/clients': 'clients',
        };
        
        // Remove leading slash and get the screen
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const targetScreen = pathToScreen[normalizedPath] || 'dashboard';
        
        console.log('🧭 Navigating to screen:', targetScreen);
        setCurrentScreen('main-app');
        setNavigationScreen(targetScreen);
      }
    };

    window.addEventListener('message', handleMessage);

    // Fallback: read cached auth state if present
    try {
      const cached = localStorage.getItem('proptii_auth_state');
      if (cached) {
        const authState = JSON.parse(cached);
        if (authState?.isAuthenticated && authState?.user) {
          const user = authState.user;
          setUserProfile({
            name: user.name || user.givenName || '',
            email: user.email || '',
            phone: user.phone || '+44 7911 123456',
            companyName: 'Proptii',
            logo: undefined
          });
          console.log('✅ Loaded auth state from localStorage and updated userProfile:', user);
          setIsAuthLoading(false);
        }
      }
    } catch (err) {
      // ignore parse errors
    }

    // Set a timeout to stop loading if no auth state is received
    const timer = setTimeout(() => {
        setIsAuthLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, []);

  // Check localStorage for role selection (from AgentHome)
  React.useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'agent') {
      setUserRole('agent');
      // Clear the stored role after using it
      localStorage.removeItem('userRole');
    }
  }, []);

  // Handle URL hash navigation (from iframe src hash) and initial path
  React.useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (hash) {
        console.log('🧭 Detected hash in URL:', hash);
        
        // Map URL paths to navigation screens
        const pathToScreen: Record<string, NavigationScreen> = {
          '/': 'dashboard',
          '/dashboard': 'dashboard',
          '/viewings': 'viewings',
          '/properties': 'properties',
          '/documents': 'documents',
          '/contracts': 'contracts',
          '/clients': 'clients',
        };
        
        // Normalize the hash path
        const normalizedPath = hash.startsWith('/') ? hash : `/${hash}`;
        const targetScreen = pathToScreen[normalizedPath] || 'dashboard';
        
        console.log('🧭 Navigating to screen from hash:', targetScreen);
        setCurrentScreen('main-app');
        setNavigationScreen(targetScreen);
      }
    };

    // Also check the actual pathname (for direct navigation)
    const handlePathnameNavigation = () => {
      const pathToScreen: Record<string, NavigationScreen> = {
        '/': 'dashboard',
        '/dashboard': 'dashboard',
        '/viewings': 'viewings',
        '/properties': 'properties',
        '/documents': 'documents',
        '/contracts': 'contracts',
        '/clients': 'clients',
      };
      
      const path = location.pathname;
      const targetScreen = pathToScreen[path] || 'dashboard';
      
      if (targetScreen !== navigationScreen) {
        console.log('🧭 Navigating to screen from pathname:', targetScreen);
        setCurrentScreen('main-app');
        setNavigationScreen(targetScreen);
      }
    };

    // Check both hash and pathname on initial load
    handleHashNavigation();
    handlePathnameNavigation();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, [location.pathname, navigationScreen]);

  // Optional deep-link: start directly at specific flows when requested
  React.useEffect(() => {
    try {
      // Prefer query param if present
      const params = new URLSearchParams(window.location.search);
      const qpStart = params.get('start');
      if (qpStart === 'property-setup-step1' || qpStart === 'company-profile-setup') {
        setCurrentScreen(qpStart as Screen);
        return;
      }
      const startScreen = localStorage.getItem('startScreen');
      if (startScreen === 'property-setup-step1') {
        setCurrentScreen('property-setup-step1');
        localStorage.removeItem('startScreen');
      } else if (startScreen === 'company-profile-setup') {
        setCurrentScreen('company-profile-setup');
        localStorage.removeItem('startScreen');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Helper: Compress image to reduce size for Firestore
  const compressImage = (file: File, maxSizeKB: number = 150): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size <= maxSizeKB * 1024) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const timeout = setTimeout(() => resolve(file), 3000);

      img.onload = () => {
        clearTimeout(timeout);
        let { width, height } = img;
        const maxDimension = 600;

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`Compressed: ${(compressedFile.size / 1024).toFixed(1)}KB (was ${(file.size / 1024).toFixed(1)}KB)`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.4);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Convert images to base64 and return PropertyPhoto objects
  const uploadPropertyImages = async (imageFiles: File[]): Promise<PropertyPhoto[]> => {
    if (imageFiles.length === 0) {
      return [];
    }
    
    console.log(`Processing ${imageFiles.length} images...`);
    
    const convertFileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };
    
    const photoPromises = imageFiles.map(async (file, index) => {
      try {
        const timestamp = Date.now();
        // Compress large images before converting to base64
        let processedFile = file;
        if (file.type.startsWith('image/') && file.size > 500 * 1024) {
          processedFile = await compressImage(file, 150);
        }
        const base64Url = await convertFileToBase64(processedFile);
        
        console.log(`✅ Processed image ${index + 1}/${imageFiles.length} to base64`);
        
        return {
          id: `photo-${timestamp}-${index}`,
          url: base64Url,
          filename: file.name,
          isCover: index === 0,
          room: index === 0 ? 'Exterior' : undefined
        };
      } catch (error) {
        console.error(`❌ Error converting image ${index + 1}:`, error);
        throw error;
      }
    });
    
    const uploadedPhotos = await Promise.all(photoPromises);
    console.log(`✅ All ${uploadedPhotos.length} images processed successfully`);
    return uploadedPhotos;
  };

  const uploadPropertyDocuments = async (documentFiles: File[]): Promise<PropertyDocument[]> => {
    if (documentFiles.length === 0) {
      return [];
    }

    console.log(`Processing ${documentFiles.length} documents...`);

    const convertFileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const documentPromises = documentFiles.map(async (file, index) => {
      try {
        const timestamp = Date.now();
        const base64Url = await convertFileToBase64(file);
        
        console.log(`✅ Processed document ${index + 1}/${documentFiles.length}: ${file.name}`);
        
        return {
          id: `doc-${timestamp}-${index}`,
          name: file.name,
          type: 'other', // Default classification; can be refined later
          url: base64Url, // Store as base64 data URL
          issueDate: new Date(),
          status: 'valid'
        } as PropertyDocument;
      } catch (error) {
        console.error(`❌ Error processing document ${file.name}:`, error);
        throw error;
      }
    });

    const uploadedDocuments = await Promise.all(documentPromises);
    console.log(`✅ All ${uploadedDocuments.length} documents processed successfully`);
    return uploadedDocuments;
  };

  // Convert property setup data to Property object
  const createPropertyFromSetupData = (): Property => {
    const { propertyType, propertyDetails, amenities, images, additionalNotes, pendingTenants } = propertySetupData;
    
    // Convert images to PropertyPhoto format
    const photos: PropertyPhoto[] = images.map((imageUrl, index) => ({
      id: `photo-${index}`,
      url: imageUrl,
      filename: `property-photo-${index + 1}.jpg`,
      isCover: index === 0,
      room: index === 0 ? 'Exterior' : undefined
    }));

    // Convert documents to PropertyDocument format
    const documents: PropertyDocument[] = propertyDetails.uploadedDocuments.map((file, index) => ({
      id: `doc-${index}`,
      name: file.name,
      type: 'other',
      url: URL.createObjectURL(file),
      issueDate: new Date(),
      status: 'valid'
    }));

    // Parse numeric values, omit if invalid (Firestore doesn't accept undefined)
    const bedrooms = parseInt(propertyDetails.bedrooms) || 1;
    const bathrooms = parseInt(propertyDetails.bathrooms);
    const squareFootage = parseInt(propertyDetails.squareFootage);
    const rent = parseInt(propertyDetails.monthlyRent) || 0;

    // Preserve original property status when editing, otherwise default to 'vacant'
    // First try propertySetupData.status (most reliable), then selectedProperty, then default to 'vacant'
    const preservedStatus = propertySetupData.status 
      || (isEditing && selectedProperty ? selectedProperty.status : undefined)
      || 'vacant';

    // Convert pending tenants to Tenant format with temporary IDs for preview
    const tenantForPreview = pendingTenants && pendingTenants.length > 0 
      ? {
          ...pendingTenants[0],
          id: 'pending-tenant',
          propertyId: 'setup-property'
        } as Tenant
      : undefined;

    const propertyData: any = {
      id: 'setup-property',
      address: propertyDetails.address,
      type: propertyType || 'Property',
      bedrooms,
      rent,
      status: preservedStatus,
      amenities: amenities,
      notes: additionalNotes,
      photos: photos,
      documents: documents,
      createdAt: new Date()
    };

    // Include tenant if there are pending tenants
    if (tenantForPreview) {
      propertyData.tenant = tenantForPreview;
    }

    // Only include optional fields if they have valid values
    if (!isNaN(bathrooms)) {
      propertyData.bathrooms = bathrooms;
    }
    if (!isNaN(squareFootage)) {
      propertyData.squareFootage = squareFootage;
    }

    return propertyData;
  };

  // Initialize with mock data for better demonstration
  React.useEffect(() => {
    // Mock tenants are defined only to link mock properties below. We do NOT inject them into UI state.
    const mockTenants: Tenant[] = [
      {
        id: 't1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+44 7700 900123',
        propertyAddress: '123 Regent Street, London W1B 4EA',
        propertyId: '1',
        rentAmount: 2400,
        leaseStart: new Date('2023-03-01'),
        leaseEnd: new Date('2025-02-28'),
        status: 'active',
        referencingStatus: 'complete',
        paymentStatus: 'overdue',
        defaultRiskScore: 65,
        lastPaymentDate: new Date('2024-10-01'),
        overdueAmount: 2400,
        emergencyContact: {
          name: 'Michael Johnson',
          phone: '+44 7700 900124',
          relationship: 'Spouse'
        }
      },
      {
        id: 't2',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+44 7700 900456',
        propertyAddress: '45 Victoria Park Road, London E9 7JN',
        propertyId: '2',
        rentAmount: 2100,
        leaseStart: new Date('2024-01-15'),
        leaseEnd: new Date('2025-01-14'),
        status: 'active',
        referencingStatus: 'complete',
        paymentStatus: 'current',
        defaultRiskScore: 25,
        lastPaymentDate: new Date('2024-12-01'),
        emergencyContact: {
          name: 'Lisa Chen',
          phone: '+44 7700 900457',
          relationship: 'Partner'
        }
      },
      {
        id: 't3',
        name: 'Emma Watson',
        email: 'emma.watson@email.com',
        phone: '+44 7700 900789',
        propertyAddress: '78 Oak Gardens, London SW4 9AL',
        propertyId: '3',
        rentAmount: 2800,
        leaseStart: new Date('2023-06-01'),
        leaseEnd: new Date('2025-05-31'),
        status: 'active',
        referencingStatus: 'complete',
        paymentStatus: 'current',
        defaultRiskScore: 15,
        lastPaymentDate: new Date('2024-12-01'),
        emergencyContact: {
          name: 'James Watson',
          phone: '+44 7700 900790',
          relationship: 'Father'
        }
      },
      {
        id: 't4',
        name: 'David Rodriguez',
        email: 'david.rodriguez@email.com',
        phone: '+44 7700 900321',
        propertyAddress: '92 Maple Court, London N1 5QT',
        propertyId: '4',
        rentAmount: 1950,
        leaseStart: new Date('2024-04-01'),
        leaseEnd: new Date('2025-03-31'),
        status: 'active',
        referencingStatus: 'complete',
        paymentStatus: 'current',
        defaultRiskScore: 30,
        lastPaymentDate: new Date('2024-12-01'),
        emergencyContact: {
          name: 'Maria Rodriguez',
          phone: '+44 7700 900322',
          relationship: 'Sister'
        }
      }
    ];
    // Delay tenant load until after initial render; properties will be fetched in another effect
    (async () => {
      try {
        // Initial unscoped load to avoid blocking UI; will be refined in the effect below
        const initialTenants = await tenantService.getTenants();
        console.log('[Init] Tenants initially loaded (unscoped):', initialTenants.length);
        setTenants(initialTenants);
      } catch (e) {
        console.warn('Failed initial tenant load, leaving empty list', e);
        setTenants([]);
      }
    })();

    // Mock properties with tenant relationships
    const mockProperties: Property[] = [
      {
        id: '1',
        address: '123 Regent Street, London W1B 4EA',
        type: '2 Bedroom Apartment',
        bedrooms: 2,
        rent: 2400,
        status: 'occupied',
        amenities: ['Central Heating', 'Double Glazing', 'Balcony', 'Fitted Kitchen'],
        notes: 'Recently renovated apartment in prime central location. Close to Oxford Circus.',
        photos: [
          {
            id: 'p1',
            url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDB8fHx8MTczMTQyMzc2OXww&ixlib=rb-4.1.0&q=80&w=800',
            filename: 'living-room.jpg',
            room: 'Living Room',
            isCover: true
          }
        ],
        documents: [
          {
            id: 'd1',
            name: 'Energy Performance Certificate',
            type: 'epc',
            url: '#',
            issueDate: new Date('2024-01-15'),
            expiryDate: new Date('2034-01-15'),
            status: 'valid'
          },
          {
            id: 'd2',
            name: 'Gas Safety Certificate',
            type: 'gas-cert',
            url: '#',
            issueDate: new Date('2024-03-01'),
            expiryDate: new Date('2025-03-01'),
            status: 'expiring-soon'
          }
        ],
        createdAt: new Date('2023-01-15'),
        tenantId: 't1',
        tenant: mockTenants[0]
      },
      {
        id: '2',
        address: '45 Victoria Park Road, London E9 7JN',
        type: '3 Bedroom House',
        bedrooms: 3,
        rent: 2100,
        status: 'occupied',
        amenities: ['Garden', 'Parking', 'Central Heating', 'Fireplace', 'Storage'],
        notes: 'Beautiful Victorian house with original features. Recently updated bathroom and kitchen.',
        photos: [
          {
            id: 'p2',
            url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTczMTQyMzc2OXww&ixlib=rb-4.1.0&q=80&w=800',
            filename: 'exterior.jpg',
            room: 'Exterior',
            isCover: true
          }
        ],
        documents: [
          {
            id: 'd3',
            name: 'Energy Performance Certificate',
            type: 'epc',
            url: '#',
            issueDate: new Date('2024-01-20'),
            expiryDate: new Date('2034-01-20'),
            status: 'valid'
          }
        ],
        createdAt: new Date('2023-02-10'),
        tenantId: 't2',
        tenant: mockTenants[1]
      },
      {
        id: '3',
        address: '78 Oak Gardens, London SW4 9AL',
        type: '1 Bedroom Flat',
        bedrooms: 1,
        rent: 2800,
        status: 'occupied',
        amenities: ['Concierge', 'Gym Access', 'Balcony', 'Underground Parking', 'Modern Kitchen'],
        notes: 'Luxury apartment in premium development. High-end finishes throughout.',
        photos: [
          {
            id: 'p3',
            url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBraXRjaGVufGVufDB8fHx8MTczMTQyMzc2OXww&ixlib=rb-4.1.0&q=80&w=800',
            filename: 'kitchen.jpg',
            room: 'Kitchen',
            isCover: true
          }
        ],
        documents: [
          {
            id: 'd4',
            name: 'Energy Performance Certificate',
            type: 'epc',
            url: '#',
            issueDate: new Date('2024-02-01'),
            expiryDate: new Date('2034-02-01'),
            status: 'valid'
          },
          {
            id: 'd5',
            name: 'Building Insurance',
            type: 'insurance',
            url: '#',
            issueDate: new Date('2024-01-01'),
            expiryDate: new Date('2025-01-01'),
            status: 'valid'
          }
        ],
        createdAt: new Date('2023-03-20'),
        tenantId: 't3',
        tenant: mockTenants[2]
      },
      {
        id: '4',
        address: '92 Maple Court, London N1 5QT',
        type: '2 Bedroom Flat',
        bedrooms: 2,
        rent: 1950,
        status: 'occupied',
        amenities: ['Central Heating', 'Double Glazing', 'Communal Garden', 'Storage'],
        notes: 'Bright and airy flat in sought-after area. Close to transport links.',
        photos: [
          {
            id: 'p4',
            url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tfGVufDB8fHx8MTczMTQyMzc2OXww&ixlib=rb-4.1.0&q=80&w=800',
            filename: 'bedroom.jpg',
            room: 'Master Bedroom',
            isCover: true
          }
        ],
        documents: [
          {
            id: 'd6',
            name: 'Energy Performance Certificate',
            type: 'epc',
            url: '#',
            issueDate: new Date('2024-04-01'),
            expiryDate: new Date('2034-04-01'),
            status: 'valid'
          }
        ],
        createdAt: new Date('2023-04-01'),
        tenantId: 't4',
        tenant: mockTenants[3]
      },
      {
        id: '5',
        address: '156 Camden High Street, London NW1 8QP',
        type: '1 Bedroom Apartment',
        bedrooms: 1,
        rent: 1800,
        status: 'vacant',
        amenities: ['Central Heating', 'Double Glazing', 'Near Tube', 'Shops Nearby'],
        notes: 'Well-located apartment available immediately. Recently cleaned and painted.',
        photos: [
          {
            id: 'p5',
            url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDB8fHx8MTczMTQyMzc2OXww&ixlib=rb-4.1.0&q=80&w=800',
            filename: 'living-area.jpg',
            room: 'Living Area',
            isCover: true
          }
        ],
        documents: [
          {
            id: 'd7',
            name: 'Energy Performance Certificate',
            type: 'epc',
            url: '#',
            issueDate: new Date('2024-01-10'),
            expiryDate: new Date('2034-01-10'),
            status: 'valid'
          }
        ],
        createdAt: new Date('2023-05-10')
      },
      {
        id: '6',
        address: '23 Kensington Gardens Square, London W2 4BG',
        type: 'Studio Apartment',
        bedrooms: 0,
        rent: 1650,
        status: 'under-renovation',
        amenities: ['Period Features', 'High Ceilings', 'Near Hyde Park', 'Central Heating'],
        notes: 'Historic studio undergoing renovation. Beautiful period features being restored.',
        photos: [
          {
            id: 'p6',
            url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBhcGFydG1lbnR8ZW58MHx8fHwxNzMxNDIzNzY5fDA&ixlib=rb-4.1.0&q=80&w=800',
            filename: 'studio.jpg',
            room: 'Studio',
            isCover: true
          }
        ],
        documents: [
          {
            id: 'd8',
            name: 'Energy Performance Certificate',
            type: 'epc',
            url: '#',
            issueDate: new Date('2024-06-01'),
            expiryDate: new Date('2034-06-01'),
            status: 'valid'
          }
        ],
        createdAt: new Date('2023-06-15')
      }
    ];
    // DISABLED: Mock data - replaced by Firestore data scoped to user
    // setProperties(mockProperties);
    console.log('🚫 Mock properties disabled - using Firestore data scoped to user');

    // Market insights will be loaded from Firestore via useEffect
    // This allows real-time updates and actual UK market data
    console.log('📊 Market insights will be loaded from Firestore');

    // Alerts will be loaded from Firestore in useEffect below
    console.log('🚫 Alerts will be loaded from Firestore');
    setVacancyAlerts([]);
    setArrearsAlerts([]);
    setAlerts([]);
  }, []);

  const loadScopedTenants = React.useCallback(async () => {
    try {
      // Use the same userId extraction logic as addTenant and loadProperties
      const getCurrentUserId = (): string | null => {
        try {
          // PRIORITY 1: Direct from userProfile (most reliable)
          if (userProfile && (userProfile as any).id) {
            const uid = (userProfile as any).id;
            console.log('🔍 UserId from userProfile.id:', uid);
            return uid;
          }

          // PRIORITY 2: Query parameter
          const params = new URLSearchParams(window.location.search);
          const uidFromQuery = params.get('uid');
          if (uidFromQuery) {
            console.log('🔍 UserId from query param:', uidFromQuery);
            return uidFromQuery;
          }

          // PRIORITY 3: getUserInfo function
          if (typeof (window as any).getUserInfo === 'function') {
            const info = (window as any).getUserInfo();
            console.log('🔍 getUserInfo() returned:', info);
            if (info?.id || info?.sub || info?.oid) {
              const uid = info.id || info.sub || info.oid;
              console.log('🔍 UserId from getUserInfo:', uid);
              return uid;
            }
          }

          // PRIORITY 4: localStorage auth state
          const cached = localStorage.getItem('proptii_auth_state');
          if (cached) {
            const parsed = JSON.parse(cached);
            console.log('🔍 Cached auth state:', parsed);
            // Check both nested user.id AND top-level user id fields
            const uid = parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId;
            if (uid) {
              console.log('🔍 UserId from localStorage:', uid);
              return uid;
            }
          }
        } catch (e) {
          console.error('🔍 Error extracting userId:', e);
        }

        // Don't use email as fallback - it won't match stored userIds
        console.warn('⚠️ No userId found - tenants may not load correctly');
        return null;
      };

      const userId = getCurrentUserId();
      let list = await tenantService.getTenants(userId || undefined);

      // If docs lack userId, fall back to scoping by owned property IDs
      if (userId) {
        const ownedPropertyIds = new Set(properties.map(p => p.id));
        if (ownedPropertyIds.size > 0) {
          list = list.filter(t => !t.propertyId || ownedPropertyIds.has(t.propertyId));
        }
      }
      setTenants(list);
    } catch (e) {
      console.error('Failed to load tenants:', e);
    }
  }, [properties, userProfile]);

  // Reload and scope tenants once we know the current user's properties
  React.useEffect(() => {
    loadScopedTenants();
  }, [loadScopedTenants]);

  const navigateToScreen = (screen: Screen) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
      
      // Clear selected property when navigating to certain screens
      if (screen === 'main-app' || screen === 'property-setup') {
        if (screen === 'property-setup' && currentScreen === 'main-app') {
          // Don't clear when adding new property from main app
          setSelectedProperty(null);
        }
      }
    }, 2); // Half of the transition duration
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    setCurrentScreen('main-app');
    setNavigationScreen('dashboard');
  };

  // Load properties from Firebase on mount (scoped to current user)
  React.useEffect(() => {
    const loadProperties = async () => {
      try {
        const getCurrentUserId = (): string | null => {
          try {
            // PRIORITY 1: Direct from userProfile (most reliable)
            if (userProfile && (userProfile as any).id) {
              const uid = (userProfile as any).id;
              console.log('🔍 UserId from userProfile.id:', uid);
              return uid;
            }
            
            // PRIORITY 2: Query parameter
            const params = new URLSearchParams(window.location.search);
            const uidFromQuery = params.get('uid');
            if (uidFromQuery) {
              console.log('🔍 UserId from query param:', uidFromQuery);
              return uidFromQuery;
            }
            
            // PRIORITY 3: getUserInfo function
            if (typeof (window as any).getUserInfo === 'function') {
              const info = (window as any).getUserInfo();
              console.log('🔍 getUserInfo() returned:', info);
              if (info?.id || info?.sub || info?.oid) {
                const uid = info.id || info.sub || info.oid;
                console.log('🔍 UserId from getUserInfo:', uid);
                return uid;
              }
            }
            
            // PRIORITY 4: localStorage auth state
            const cached = localStorage.getItem('proptii_auth_state');
            if (cached) {
              const parsed = JSON.parse(cached);
              console.log('🔍 Cached auth state:', parsed);
              // Check both nested user.id AND top-level user id fields
              const uid = parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId;
              if (uid) {
                console.log('🔍 UserId from localStorage:', uid);
                return uid;
              }
            }
          } catch (e) {
            console.error('🔍 Error extracting userId:', e);
          }
          
          // FALLBACK: Email
          const emailFallback = userProfile?.email;
          console.log('🔍 Using email as userId fallback:', emailFallback);
          return emailFallback || null;
        };

        const currentUserId = getCurrentUserId();
        
        if (!currentUserId) {
          console.warn('⚠️ No userId found');
        }
        
        const fetchedProperties = await propertyService.getProperties(currentUserId ? { userId: currentUserId } : undefined);
        setProperties(fetchedProperties);
      } catch (error) {
        console.error('Error loading properties:', error);
        // Don't set mock data - keep empty array if Firebase fails
        setProperties([]);
      }
    };
    loadProperties();
  }, [userProfile, loadScopedTenants]);

  // Helper function to get current user ID
  const getCurrentUserId = (): string | null => {
    try {
      if (userProfile && (userProfile as any).id) {
        return (userProfile as any).id;
      }
      const params = new URLSearchParams(window.location.search);
      const uidFromQuery = params.get('uid');
      if (uidFromQuery) return uidFromQuery;
      if (typeof (window as any).getUserInfo === 'function') {
        const info = (window as any).getUserInfo();
        return info?.id || info?.sub || info?.oid || null;
      }
      const cached = localStorage.getItem('proptii_auth_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId || null;
      }
    } catch (e) {
      console.error('Error extracting userId for alerts:', e);
    }
    return userProfile?.email || null;
  };

  // Function to process alerts and update state
  const processAlerts = (activeAlerts: Alert[]) => {
    setAlerts(activeAlerts);

    // Convert alerts to Dashboard format
    const vacancyAlertsList: VacancyRiskAlert[] = [];
    const arrearsAlertsList: ArrearsAlert[] = [];

    for (const alert of activeAlerts) {
      if (alert.type === 'lease-expiry' && alert.leaseExpiryDate) {
        // Convert lease expiry alert to vacancy alert format
        vacancyAlertsList.push({
          id: alert.id,
          propertyId: alert.propertyId || '',
          propertyAddress: alert.propertyAddress || '',
          riskScore: alert.daysUntilExpiry ? Math.min(100, Math.max(0, 100 - (alert.daysUntilExpiry * 3))) : 50,
          predictedVacancyDate: alert.leaseExpiryDate,
          currentTenantEndDate: alert.leaseExpiryDate,
          factors: {
            marketTrend: 50,
            seasonality: 50,
            tenantHistory: 50,
            propertyCondition: 50
          },
          recommendations: {
            optimalRentPrice: 0,
            marketingStartDate: new Date(),
            urgencyLevel: alert.severity === 'critical' ? 'high' : alert.severity === 'high' ? 'medium' : 'low'
          },
          status: 'new'
        });
      } else if (alert.type === 'rent-arrears') {
        arrearsAlertsList.push({
          id: alert.id,
          tenantId: alert.tenantId || '',
          tenantName: alert.tenantName || '',
          propertyAddress: alert.propertyAddress || '',
          overdueAmount: alert.overdueAmount || 0,
          daysPastDue: alert.daysPastDue || 0,
          defaultRiskScore: 65, // Default risk score
          lastPaymentDate: alert.lastPaymentDate || new Date(),
          status: 'new'
        });
      }
    }

    setVacancyAlerts(vacancyAlertsList);
    setArrearsAlerts(arrearsAlertsList);
  };

  // Ensure tenant state reflects arrears alerts for immediate UI feedback
  React.useEffect(() => {
    setTenants(prev => {
      if (prev.length === 0 && arrearsAlerts.length === 0) {
        return prev;
      }

      const alertsByTenant = new Map<string, ArrearsAlert>();
      arrearsAlerts.forEach(alert => {
        if (alert.tenantId) {
          alertsByTenant.set(alert.tenantId, alert);
        }
      });

      let hasChanges = false;
      const updated = prev.map(tenant => {
        const alert = alertsByTenant.get(tenant.id);
        if (alert) {
          const overdueAmount = alert.overdueAmount ?? tenant.overdueAmount ?? 0;
          if (
            tenant.paymentStatus !== 'overdue' ||
            tenant.overdueAmount !== overdueAmount ||
            tenant.lastPaymentDate?.getTime() !== alert.lastPaymentDate?.getTime()
          ) {
            hasChanges = true;
            return {
              ...tenant,
              paymentStatus: 'overdue' as const,
              overdueAmount,
              lastPaymentDate: alert.lastPaymentDate ?? tenant.lastPaymentDate
            };
          }
        }
        return tenant;
      });

      return hasChanges ? updated : prev;
    });
  }, [arrearsAlerts]);

  // Real-time Firestore listeners for tenants, properties, and alerts
  React.useEffect(() => {
    const currentUserId = getCurrentUserId();
    const shouldLogRealtimeDebug = import.meta.env.DEV && import.meta.env.VITE_REALTIME_DEBUG === 'true';
    if (!currentUserId) {
      if (shouldLogRealtimeDebug) {
        console.warn('⚠️ No userId found - cannot set up real-time listeners');
      }
      return;
    }

    if (shouldLogRealtimeDebug) {
      console.log('🔔 Setting up real-time Firestore listeners for userId:', currentUserId);
    }
    const unsubscribes: Unsubscribe[] = [];

    // Track if we're currently generating alerts to prevent feedback loops
    let isGeneratingAlerts = false;
    let lastAlertGenerationTime = 0;
    const ALERT_GENERATION_COOLDOWN = 10000; // 10 seconds minimum between generations
    
    // Throttled function to prevent too many rapid alert generations
    let alertGenerationTimeout: NodeJS.Timeout | null = null;
    const debouncedGenerateAlerts = () => {
      if (isGeneratingAlerts) {
        return; // Skip if already generating to prevent loops
      }
      
      // Check cooldown period
      const now = Date.now();
      if (now - lastAlertGenerationTime < ALERT_GENERATION_COOLDOWN) {
        return; // Skip if cooldown period hasn't passed
      }
      
      if (alertGenerationTimeout) {
        clearTimeout(alertGenerationTimeout);
      }
      alertGenerationTimeout = setTimeout(async () => {
        try {
          isGeneratingAlerts = true;
          lastAlertGenerationTime = Date.now();
          if (shouldLogRealtimeDebug) {
            console.log('🔄 Regenerating alerts (throttled)');
          }
          await alertService.generateAlerts(currentUserId);
        } catch (error) {
          console.error('Error generating alerts from real-time update:', error);
        } finally {
          isGeneratingAlerts = false;
        }
      }, 3000); // 3 seconds delay
    };

    // Listen to tenants collection changes
    try {
      const tenantsQuery = query(
        collection(db, 'tenants'),
        where('userId', '==', currentUserId)
      );
      const tenantsUnsubscribe = onSnapshot(tenantsQuery, 
        async (snapshot) => {
          if (shouldLogRealtimeDebug) {
            console.log('👥 Real-time tenant update detected:', snapshot.docChanges().length, 'changes');
          }
          try {
            await loadScopedTenants();
          } catch (error) {
            console.error('Error refreshing tenants after snapshot update:', error);
          }
          // Only trigger alert generation if not already generating
          if (!isGeneratingAlerts) {
            debouncedGenerateAlerts();
          }
        },
        (error) => {
          console.error('Error listening to tenants:', error);
        }
      );
      unsubscribes.push(tenantsUnsubscribe);
    } catch (error) {
      console.error('Error setting up tenants listener:', error);
    }

    // Listen to properties collection changes
    try {
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('userId', '==', currentUserId)
      );
      const propertiesUnsubscribe = onSnapshot(propertiesQuery,
        (snapshot) => {
          if (shouldLogRealtimeDebug) {
            console.log('🏠 Real-time property update detected:', snapshot.docChanges().length, 'changes');
          }
          // Only trigger alert generation if not already generating
          if (!isGeneratingAlerts) {
            debouncedGenerateAlerts();
          }
        },
        (error) => {
          console.error('Error listening to properties:', error);
        }
      );
      unsubscribes.push(propertiesUnsubscribe);
    } catch (error) {
      console.error('Error setting up properties listener:', error);
    }

    // Listen to alerts collection changes (real-time alert updates)
    try {
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('userId', '==', currentUserId),
        where('status', '==', 'active')
      );
      const alertsUnsubscribe = onSnapshot(alertsQuery,
        async (snapshot) => {
          if (shouldLogRealtimeDebug) {
            console.log('🔔 Real-time alert update detected:', snapshot.docs.length, 'active alerts');
          }
          // Map Firestore documents to Alert objects
          const activeAlerts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              status: data.status,
              severity: data.severity,
              userId: data.userId,
              tenantId: data.tenantId,
              contractId: data.contractId,
              propertyId: data.propertyId,
              title: data.title,
              description: data.description,
              leaseExpiryDate: data.leaseExpiryDate?.toDate(),
              daysUntilExpiry: data.daysUntilExpiry,
              contractTitle: data.contractTitle,
              contractSentDate: data.contractSentDate?.toDate(),
              overdueAmount: data.overdueAmount,
              daysPastDue: data.daysPastDue,
              lastPaymentDate: data.lastPaymentDate?.toDate(),
              paymentFrequency: data.paymentFrequency,
              propertyAddress: data.propertyAddress,
              tenantName: data.tenantName,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              resolvedAt: data.resolvedAt?.toDate(),
              dismissedAt: data.dismissedAt?.toDate()
            } as Alert;
          });
          processAlerts(activeAlerts);
        },
        (error) => {
          console.error('Error listening to alerts:', error);
        }
      );
      unsubscribes.push(alertsUnsubscribe);
    } catch (error) {
      console.error('Error setting up alerts listener:', error);
      // Fallback: if listener fails, try initial load
      alertService.getActiveAlerts(currentUserId).then(processAlerts).catch(console.error);
    }

    // Initial alert generation
    alertService.generateAlerts(currentUserId).catch(console.error);

    // Cleanup
    return () => {
      if (shouldLogRealtimeDebug) {
        console.log('🧹 Cleaning up real-time Firestore listeners');
      }
      unsubscribes.forEach(unsub => unsub());
      if (alertGenerationTimeout) {
        clearTimeout(alertGenerationTimeout);
      }
    };
  }, [userProfile, loadScopedTenants]);

  // Load market insights from Firestore
  React.useEffect(() => {
    const currentUserId = getCurrentUserId();
    const shouldLogMarketInsights = import.meta.env.DEV && import.meta.env.VITE_MARKET_INSIGHTS_DEBUG === 'true';
    
    if (shouldLogMarketInsights) {
      console.log('📊 Setting up market insights listener');
    }
    
    // Fetch GOV.UK regulatory changes on app load (once per day)
    const lastFetchKey = 'govuk_insights_last_fetch';
    const lastFetch = localStorage.getItem(lastFetchKey);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Only fetch if we haven't fetched in the last 24 hours
    if (!lastFetch || (now - parseInt(lastFetch)) > oneDay) {
      if (shouldLogMarketInsights) {
        console.log('🔄 Fetching GOV.UK regulatory changes (24h check passed)...');
      }
      marketInsightService.fetchGOVUKRegulatoryChanges()
        .then(count => {
          if (shouldLogMarketInsights) {
            console.log(`✅ Fetched ${count} new GOV.UK insights`);
          }
          localStorage.setItem(lastFetchKey, now.toString());
        })
        .catch(error => {
          console.warn('⚠️ Failed to fetch GOV.UK insights (will retry later):', error);
          // Don't block the app if this fails
        });
    } else {
      if (shouldLogMarketInsights) {
        const hoursSinceFetch = Math.floor((now - parseInt(lastFetch)) / (60 * 60 * 1000));
        console.log(`ℹ️  GOV.UK insights fetched ${hoursSinceFetch} hours ago, skipping (fetch once per day)`);
      }
    }
    
    // Set up real-time listener for market insights
    const unsubscribe = marketInsightService.subscribeToInsights(
      (insights) => {
        if (shouldLogMarketInsights) {
          console.log(`✅ Loaded ${insights.length} market insights from Firestore`);
        }
        setMarketInsights(insights);
      },
      currentUserId || undefined
    );

    // Also try initial load
    if (currentUserId) {
      marketInsightService.getActiveInsights(currentUserId).then(insights => {
        if (shouldLogMarketInsights) {
          console.log(`✅ Initially loaded ${insights.length} market insights`);
        }
        setMarketInsights(insights);
      }).catch(error => {
        console.error('Error loading market insights:', error);
        // Fallback to empty array if Firestore query fails
        setMarketInsights([]);
      });
    } else {
      // If no userId, still try to load general insights (not user-specific)
      marketInsightService.getActiveInsights().then(insights => {
        if (shouldLogMarketInsights) {
          console.log(`✅ Loaded ${insights.length} general market insights`);
        }
        setMarketInsights(insights);
      }).catch(error => {
        console.error('Error loading market insights:', error);
        setMarketInsights([]);
      });
    }

    return () => {
      if (shouldLogMarketInsights) {
        console.log('🧹 Cleaning up market insights listener');
      }
      unsubscribe();
    };
  }, [userProfile]);

  const addProperty = async (property: Omit<Property, 'id' | 'createdAt'>) => {
    // Strip any accidental id/createdAt fields before saving (define outside try-catch for scope)
    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...safeProperty } = property as any;
    
    try {
      // Save to Firebase (scoped) - use same extraction logic as loading
      const currentUserId = (() => {
        try {
          // PRIORITY 1: Direct from userProfile
          if (userProfile && (userProfile as any).id) {
            const uid = (userProfile as any).id;
            console.log('✅ Creating property with userId from userProfile.id:', uid);
            return uid;
          }
          
          // PRIORITY 2: Query parameter
          const params = new URLSearchParams(window.location.search);
          const uidFromQuery = params.get('uid');
          if (uidFromQuery) {
            console.log('✅ Creating property with userId from query:', uidFromQuery);
            return uidFromQuery;
          }
          
          // PRIORITY 3: getUserInfo
          if (typeof (window as any).getUserInfo === 'function') {
            const info = (window as any).getUserInfo();
            const uid = info?.id || info?.sub || info?.oid;
            if (uid) {
              console.log('✅ Creating property with userId from getUserInfo:', uid);
              return uid;
            }
          }
          
          // PRIORITY 4: localStorage
          const cached = localStorage.getItem('proptii_auth_state');
          if (cached) {
            const parsed = JSON.parse(cached);
            const uid = parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId;
            if (uid) {
              console.log('✅ Creating property with userId from localStorage:', uid);
              return uid;
            }
          }
        } catch (e) {
          console.error('❌ Error extracting userId for property creation:', e);
        }
        const emailFallback = userProfile?.email || 'unknown';
        console.warn('⚠️ Using email as userId fallback for property creation:', emailFallback);
        return emailFallback;
      })();
      
      console.log('📝 About to create property with userId:', currentUserId);
      // Get owner email from userProfile for storing in property document
      const ownerEmail = userProfile?.email || (typeof (window as any).getUserInfo === 'function' ? (window as any).getUserInfo()?.email : undefined);
      const propertyId = await propertyService.createProperty(safeProperty, currentUserId, ownerEmail);
      
      // Fetch the created property to get full data with timestamps
      const newProperty = await propertyService.getProperty(propertyId);
      
      if (newProperty) {
        console.log('Retrieved property after creation:', {
          id: newProperty.id,
          address: newProperty.address,
          photosCount: newProperty.photos?.length || 0,
          photos: newProperty.photos
        });
        setProperties(prev => [...prev, newProperty]);
        console.log('Property added to Firebase:', propertyId);
        return propertyId;
      } else {
        throw new Error('Failed to retrieve created property');
      }
    } catch (error) {
      console.error('Error adding property to Firebase:', error);
      // Fallback to local state if Firebase fails
      const newProperty: Property = {
        ...(safeProperty as any),
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setProperties(prev => [...prev, newProperty]);
      return newProperty.id;
    }
  };

  const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
    try {
      // Update in Firebase (exclude id, createdAt, tenant from updates)
      const { id, createdAt, tenant, photos, documents, ...firebaseUpdates } = updates as any;
      await propertyService.updateProperty(propertyId, firebaseUpdates);
      
      // Update local state
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? { ...p, ...updates } : p)
      );
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(prev => prev ? { ...prev, ...updates } : null);
      }
      console.log('Property updated in Firebase:', propertyId);
      
      // Trigger alert regeneration after property update
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        console.log('🔄 Triggering alert regeneration after property update');
        alertService.generateAlerts(currentUserId).catch(error => {
          console.warn('⚠️ Failed to regenerate alerts after property update:', error);
        });
      }
    } catch (error) {
      console.error('Error updating property in Firebase:', error);
      // Fallback to local state update if Firebase fails
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? { ...p, ...updates } : p)
      );
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(prev => prev ? { ...prev, ...updates } : null);
      }
    }
  };

  const selectProperty = (property: Property) => {
    const tenantForProperty = tenants.find(t => t.propertyId === property.id || t.id === (property as any).tenantId);
    const enriched: Property = tenantForProperty 
      ? { ...property, tenant: tenantForProperty, status: 'occupied' as any }
      : property;
    setSelectedProperty(enriched);
  };

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  const selectLandlord = (landlord: any) => {
    setSelectedLandlord(landlord);
  };

  const addDocumentToProperty = (propertyId: string, document: Omit<PropertyDocument, 'id'>) => {
    const newDocument: PropertyDocument = {
      ...document,
      id: Date.now().toString(),
    };
    
    updateProperty(propertyId, {
      documents: [...(properties.find(p => p.id === propertyId)?.documents || []), newDocument]
    });
  };

  const addPhotoToProperty = (propertyId: string, photo: Omit<PropertyPhoto, 'id'>) => {
    const newPhoto: PropertyPhoto = {
      ...photo,
      id: Date.now().toString(),
    };
    
    updateProperty(propertyId, {
      photos: [...(properties.find(p => p.id === propertyId)?.photos || []), newPhoto]
    });
  };

  const addTenant = async (tenant: Omit<Tenant, 'id'>) => {
    try {
      console.log('📝 [App] addTenant called with tenant data:', tenant);
      const currentUserId = (() => {
        try {
          // PRIORITY 1: Direct from userProfile
          if (userProfile && (userProfile as any).id) {
            return (userProfile as any).id;
          }
          // PRIORITY 2: Query parameter
          const params = new URLSearchParams(window.location.search);
          const uidFromQuery = params.get('uid');
          if (uidFromQuery) return uidFromQuery;
          // PRIORITY 3: getUserInfo
          if (typeof (window as any).getUserInfo === 'function') {
            const info = (window as any).getUserInfo();
            const uid = info?.id || info?.sub || info?.oid;
            if (uid) return uid;
          }
          // PRIORITY 4: localStorage
          const cached = localStorage.getItem('proptii_auth_state');
          if (cached) {
            const parsed = JSON.parse(cached);
            return parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId || null;
          }
        } catch (e) {
          console.error('❌ [App] Error extracting userId:', e);
        }
        return userProfile?.email || 'unknown';
      })();
      console.log('📝 [App] Creating tenant with userId:', currentUserId);
      
      const id = await tenantService.createTenant(tenant, currentUserId);
      console.log('✅ [App] Tenant created with id:', id);
      
      const saved = await tenantService.getTenant(id);
      if (saved) {
        console.log('✅ [App] Fetched saved tenant from Firestore:', saved);
        // Ensure userId is preserved when adding to state
        const tenantWithUserId = { ...saved, userId: currentUserId } as any;
        console.log('✅ [App] Adding tenant to state with userId:', currentUserId);
        
        // Trigger alert generation after tenant is created (to check for lease expiry, etc.)
        try {
          console.log('🔄 Triggering alert generation after tenant creation...');
          await alertService.generateAlerts(currentUserId);
          console.log('✅ Alerts updated after tenant creation');
        } catch (alertError) {
          console.warn('⚠️ Failed to generate alerts after tenant creation:', alertError);
        }
        
        setTenants(prev => {
          // Check if tenant already exists (avoid duplicates)
          if (prev.some(t => t.id === tenantWithUserId.id)) {
            console.log('[App] Tenant already in list, updating instead');
            return prev.map(t => t.id === tenantWithUserId.id ? tenantWithUserId : t);
          }
          return [...prev, tenantWithUserId];
        });
        return;
      } else {
        console.error('❌ [App] ERROR: Tenant was not found in Firestore after creation!');
        throw new Error('Tenant was not saved to Firestore');
      }
    } catch (e) {
      console.error('❌ [App] addTenant failed:', e);
      console.error('❌ [App] Error details:', {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      });
      // Re-throw the error so it can be caught by the calling code
      throw e;
    }
  };

  const addLandlord = (landlordData: any) => {
    // This would typically save to a landlords state or database
    // For now, we'll just log it since we don't have a landlords state
    console.log('New landlord added:', landlordData);
    // In a real app, you'd have: setLandlords(prev => [...prev, newLandlord]);
  };

  const deleteProperty = async (property: Property) => {
    try {
      await propertyService.deleteProperty(property.id);
      setProperties(prev => prev.filter(p => p.id !== property.id));
      if (selectedProperty?.id === property.id) {
        setSelectedProperty(null);
      }
      console.log('Deleted property via Firestore client and updated state:', property.id);
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert(`Failed to delete property: ${(error as any)?.message || 'Unknown error'}`);
    }
  };

  const archiveProperty = (property: Property) => {
    // In a real app, you might have an archived state or mark as archived
    console.log('Archiving property:', property.id);
    // For now, we'll just log it
  };

  const duplicateProperty = (property: Property) => {
    const duplicatedProperty: Property = {
      ...property,
      id: `property-${Date.now()}`,
      address: `${property.address} (Copy)`,
      createdAt: new Date()
    };
    setProperties(prev => [...prev, duplicatedProperty]);
  };

  const exportProperties = (propertiesToExport: Property[], format: string) => {
    console.log(`Exporting properties as ${format}:`, propertiesToExport);
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'json':
        const dataStr = JSON.stringify(propertiesToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `properties-export-${timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
        break;
        
      case 'csv':
        const csvHeaders = 'Address,Type,Bedrooms,Rent,Status,Amenities,Notes,Created Date\n';
        const csvData = propertiesToExport.map(property => {
          const amenities = property.amenities.join('; ');
          const notes = (property.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');
          return `"${property.address}","${property.type}","${property.bedrooms}","${property.rent}","${property.status}","${amenities}","${notes}","${property.createdAt.toLocaleDateString()}"`;
        }).join('\n');
        const csvContent = csvHeaders + csvData;
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `properties-export-${timestamp}.csv`;
        csvLink.click();
        URL.revokeObjectURL(csvUrl);
        break;
        
      case 'excel':
        // For Excel, we'll create a CSV that can be opened in Excel
        // In a real app, you'd use a library like xlsx
        const excelHeaders = 'Address\tType\tBedrooms\tRent\tStatus\tAmenities\tNotes\tCreated Date\n';
        const excelData = propertiesToExport.map(property => {
          const amenities = property.amenities.join('; ');
          const notes = (property.notes || '').replace(/\t/g, ' ').replace(/\n/g, ' ');
          return `"${property.address}"\t"${property.type}"\t"${property.bedrooms}"\t"${property.rent}"\t"${property.status}"\t"${amenities}"\t"${notes}"\t"${property.createdAt.toLocaleDateString()}"`;
        }).join('\n');
        const excelContent = excelHeaders + excelData;
        const excelBlob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        const excelUrl = URL.createObjectURL(excelBlob);
        const excelLink = document.createElement('a');
        excelLink.href = excelUrl;
        excelLink.download = `properties-export-${timestamp}.xls`;
        excelLink.click();
        URL.revokeObjectURL(excelUrl);
        break;
        
      case 'pdf':
        // For PDF, we'll create a simple text representation
        // In a real app, you'd use a library like jsPDF
        const pdfContent = `PROPERTIES EXPORT - ${timestamp}\n\n` +
          propertiesToExport.map((property, index) => 
            `${index + 1}. ${property.address}\n` +
            `   Type: ${property.type}\n` +
            `   Bedrooms: ${property.bedrooms}\n` +
            `   Rent: £${property.rent.toLocaleString()}/month\n` +
            `   Status: ${property.status}\n` +
            `   Amenities: ${property.amenities.join(', ')}\n` +
            `   Notes: ${property.notes || 'None'}\n` +
            `   Created: ${property.createdAt.toLocaleDateString()}\n`
          ).join('\n');
        
        const pdfBlob = new Blob([pdfContent], { type: 'text/plain' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfLink = document.createElement('a');
        pdfLink.href = pdfUrl;
        pdfLink.download = `properties-export-${timestamp}.txt`;
        pdfLink.click();
        URL.revokeObjectURL(pdfUrl);
        break;
        
      default:
        console.error('Unsupported export format:', format);
    }
  };

  const importProperties = (importedProperties: Property[]) => {
    console.log('Importing properties:', importedProperties);
    setProperties(prev => [...prev, ...importedProperties]);
  };

  const renderMainAppScreen = () => {
    console.log('🔄 renderMainAppScreen called with navigationScreen:', navigationScreen);
    switch (navigationScreen) {
      case 'dashboard':
        return (
          <Dashboard
            properties={properties}
            tenants={tenants}
            userProfile={userProfile}
            onAddProperty={() => navigateToScreen('property-setup-step1')}
            onViewProperty={(property) => {
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onManageDocuments={(property) => {
              selectProperty(property);
              navigateToScreen('document-management');
            }}
            onManagePhotos={(property) => {
              selectProperty(property);
              navigateToScreen('photo-management');
            }}
            // COMMENTED OUT FOR THIS RELEASE - Insights page not in scope
            onViewInsights={() => {/* navigateToScreen('portfolio-insights') */}}
            onViewVacancyAlert={(alertId) => {
              const alert = vacancyAlerts.find(a => a.id === alertId);
              if (alert) {
                setSelectedVacancyAlert(alert);
                navigateToScreen('vacancy-prevention');
              }
            }}
            onViewArrearsAlert={(alertId) => {
              const alert = arrearsAlerts.find(a => a.id === alertId);
              if (alert) {
                setSelectedArrearsAlert(alert);
                navigateToScreen('arrears-management');
              }
            }}
            marketInsights={marketInsights}
            vacancyAlerts={vacancyAlerts}
            arrearsAlerts={arrearsAlerts}
          />
        );

      case 'properties':
        return (
          <PropertiesPage
            properties={properties}
            tenants={tenants}
            arrearsAlerts={arrearsAlerts}
            onAddProperty={() => navigateToScreen('property-setup-step1')}
            onViewProperty={(property) => {
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onEditProperty={(property) => {
              // Prefill edit state when editing from the Properties list
              selectProperty(property);
              setIsEditing(true);
              setEditingPropertyId(property.id);
              setPropertySetupData({
                propertyType: property.type || null,
                propertyDetails: {
                  address: property.address || '',
                  monthlyRent: String(property.rent ?? ''),
                  bedrooms: String(property.bedrooms ?? ''),
                  bathrooms: String((property as any).bathrooms ?? ''),
                  squareFootage: String((property as any).squareFootage ?? ''),
                  uploadedDocuments: []
                },
                amenities: property.amenities || [],
                images: (property.photos || []).map(p => p.url),
                imageFiles: [],
                additionalNotes: property.notes || '',
                status: property.status // Preserve the original status
              });
              navigateToScreen('property-setup-step1');
            }}
            onManageDocuments={(property) => {
              selectProperty(property);
              navigateToScreen('document-management');
            }}
            onManagePhotos={(property) => {
              selectProperty(property);
              navigateToScreen('photo-management');
            }}
            onViewTenant={(tenant) => {
              selectTenant(tenant);
              navigateToScreen('tenant-details');
            }}
            onDeleteProperty={deleteProperty}
            onArchiveProperty={archiveProperty}
            onDuplicateProperty={duplicateProperty}
            onExportProperties={exportProperties}
            onImportProperties={importProperties}
          />
        );

      case 'documents':
        return (
          <DocumentsPage
            properties={properties}
            onViewProperty={(property) => {
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onManageDocuments={(property) => {
              selectProperty(property);
              navigateToScreen('document-management');
            }}
            onDeleteDocuments={async (documentIds) => {
              try {
                // Group documents by property
                const documentsByProperty = new Map<string, string[]>();
                
                properties.forEach(property => {
                  property.documents.forEach(doc => {
                    if (documentIds.includes(doc.id)) {
                      if (!documentsByProperty.has(property.id)) {
                        documentsByProperty.set(property.id, []);
                      }
                      documentsByProperty.get(property.id)!.push(doc.id);
                    }
                  });
                });

                // Update each property
                const updatePromises = Array.from(documentsByProperty.entries()).map(async ([propertyId, docIdsToDelete]) => {
                  const property = properties.find(p => p.id === propertyId);
                  if (!property) return;

                  // Filter out deleted documents
                  const updatedDocuments = property.documents.filter(doc => !docIdsToDelete.includes(doc.id));
                  
                  // Update Firebase - convert dates to Timestamps
                  await propertyService.updateProperty(propertyId, { 
                    documents: updatedDocuments.map(doc => ({
                      id: doc.id,
                      name: doc.name,
                      type: doc.type,
                      url: doc.url,
                      issueDate: Timestamp.fromDate(doc.issueDate),
                      expiryDate: doc.expiryDate ? Timestamp.fromDate(doc.expiryDate) : undefined,
                      status: doc.status
                    }))
                  });
                  
                  // Update local state
                  setProperties(prev => 
                    prev.map(p => p.id === propertyId 
                      ? { ...p, documents: updatedDocuments }
                      : p
                    )
                  );
                  
                  if (selectedProperty && selectedProperty.id === propertyId) {
                    setSelectedProperty(prev => prev ? { ...prev, documents: updatedDocuments } : null);
                  }
                });

                await Promise.all(updatePromises);
                console.log(`✅ Deleted ${documentIds.length} document(s)`);
              } catch (error) {
                console.error('Error deleting documents:', error);
                alert('Failed to delete documents. Please try again.');
              }
            }}
            onArchiveDocuments={async (documentIds) => {
              try {
                // Group documents by property
                const documentsByProperty = new Map<string, string[]>();
                
                properties.forEach(property => {
                  property.documents.forEach(doc => {
                    if (documentIds.includes(doc.id)) {
                      if (!documentsByProperty.has(property.id)) {
                        documentsByProperty.set(property.id, []);
                      }
                      documentsByProperty.get(property.id)!.push(doc.id);
                    }
                  });
                });

                // Update each property
                const updatePromises = Array.from(documentsByProperty.entries()).map(async ([propertyId, docIdsToArchive]) => {
                  const property = properties.find(p => p.id === propertyId);
                  if (!property) return;

                  // Mark documents as archived
                  const updatedDocuments = property.documents.map(doc => 
                    docIdsToArchive.includes(doc.id)
                      ? { ...doc, archived: true }
                      : doc
                  );
                  
                  // Update Firebase - convert dates to Timestamps
                  await propertyService.updateProperty(propertyId, { 
                    documents: updatedDocuments.map(doc => ({
                      id: doc.id,
                      name: doc.name,
                      type: doc.type,
                      url: doc.url,
                      issueDate: Timestamp.fromDate(doc.issueDate),
                      expiryDate: doc.expiryDate ? Timestamp.fromDate(doc.expiryDate) : undefined,
                      status: doc.status,
                      archived: (doc as any).archived || false
                    }))
                  });
                  
                  // Update local state
                  setProperties(prev => 
                    prev.map(p => p.id === propertyId 
                      ? { ...p, documents: updatedDocuments }
                      : p
                    )
                  );
                  
                  if (selectedProperty && selectedProperty.id === propertyId) {
                    setSelectedProperty(prev => prev ? { ...prev, documents: updatedDocuments } : null);
                  }
                });

                await Promise.all(updatePromises);
                console.log(`✅ Archived ${documentIds.length} document(s)`);
              } catch (error) {
                console.error('Error archiving documents:', error);
                alert('Failed to archive documents. Please try again.');
              }
            }}
            onExportDocuments={(format, documentIds) => {
              try {
                // Get selected documents with property information
                const selectedDocsWithProperty: Array<PropertyDocument & { propertyAddress: string; propertyId: string }> = [];
                
                properties.forEach(property => {
                  property.documents.forEach(doc => {
                    if (documentIds.includes(doc.id)) {
                      selectedDocsWithProperty.push({
                        ...doc,
                        propertyAddress: property.address,
                        propertyId: property.id
                      });
                    }
                  });
                });

                if (selectedDocsWithProperty.length === 0) {
                  alert('No documents selected for export');
                  return;
                }

                // Export based on format
                switch (format) {
                  case 'json':
                    const jsonData = JSON.stringify(selectedDocsWithProperty, null, 2);
                    const jsonBlob = new Blob([jsonData], { type: 'application/json' });
                    const jsonUrl = URL.createObjectURL(jsonBlob);
                    const jsonLink = document.createElement('a');
                    jsonLink.href = jsonUrl;
                    jsonLink.download = `documents-export-${new Date().toISOString().split('T')[0]}.json`;
                    jsonLink.click();
                    URL.revokeObjectURL(jsonUrl);
                    break;

                  case 'csv':
                    const csvHeaders = ['Document Name', 'Property Address', 'Type', 'Issue Date', 'Expiry Date', 'Status', 'URL'];
                    const csvRows = selectedDocsWithProperty.map(doc => [
                      doc.name,
                      doc.propertyAddress,
                      doc.type,
                      doc.issueDate.toISOString().split('T')[0],
                      doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : '',
                      doc.status,
                      doc.url
                    ]);
                    const csvContent = [csvHeaders, ...csvRows]
                      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                      .join('\n');
                    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const csvUrl = URL.createObjectURL(csvBlob);
                    const csvLink = document.createElement('a');
                    csvLink.href = csvUrl;
                    csvLink.download = `documents-export-${new Date().toISOString().split('T')[0]}.csv`;
                    csvLink.click();
                    URL.revokeObjectURL(csvUrl);
                    break;

                  case 'excel':
                    // For Excel, we'll create a CSV file with .xlsx extension
                    // In a production app, you'd use a library like xlsx
                    const excelHeaders = ['Document Name', 'Property Address', 'Type', 'Issue Date', 'Expiry Date', 'Status', 'URL'];
                    const excelRows = selectedDocsWithProperty.map(doc => [
                      doc.name,
                      doc.propertyAddress,
                      doc.type,
                      doc.issueDate.toISOString().split('T')[0],
                      doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : '',
                      doc.status,
                      doc.url
                    ]);
                    const excelContent = [excelHeaders, ...excelRows]
                      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                      .join('\n');
                    const excelBlob = new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const excelUrl = URL.createObjectURL(excelBlob);
                    const excelLink = document.createElement('a');
                    excelLink.href = excelUrl;
                    excelLink.download = `documents-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                    excelLink.click();
                    URL.revokeObjectURL(excelUrl);
                    break;

                  case 'pdf':
                    // For PDF, we'll create a simple text representation
                    // In a production app, you'd use a library like jsPDF
                    const pdfContent = `Documents Export\n${'='.repeat(50)}\n\n` +
                      selectedDocsWithProperty.map((doc, index) => 
                        `${index + 1}. ${doc.name}\n` +
                        `   Property: ${doc.propertyAddress}\n` +
                        `   Type: ${doc.type}\n` +
                        `   Issue Date: ${doc.issueDate.toISOString().split('T')[0]}\n` +
                        `   Expiry Date: ${doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : 'N/A'}\n` +
                        `   Status: ${doc.status}\n` +
                        `   URL: ${doc.url}\n`
                      ).join('\n');
                    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const pdfLink = document.createElement('a');
                    pdfLink.href = pdfUrl;
                    pdfLink.download = `documents-export-${new Date().toISOString().split('T')[0]}.pdf`;
                    pdfLink.click();
                    URL.revokeObjectURL(pdfUrl);
                    break;
                }

                console.log(`✅ Exported ${selectedDocsWithProperty.length} document(s) as ${format.toUpperCase()}`);
              } catch (error) {
                console.error('Error exporting documents:', error);
                alert('Failed to export documents. Please try again.');
              }
            }}
          />
        );

      case 'viewings':
        console.log('🔴🔴🔴 App.tsx: VIEWINGS CASE HIT 🔴🔴🔴');
        console.log('🔴 App.tsx: Rendering ViewingsPage');
        console.log('🔴 userProfile:', userProfile);
        console.log('🔴 userProfile?.email:', userProfile?.email);
        console.log('🔴 resolveManagerId():', resolveManagerId());
        const managerEmailValue = userProfile?.email;
        console.log('🔴 managerEmailValue being passed:', managerEmailValue);
        return (
          <ViewingsPage
            managerId={resolveManagerId()}
            managerName={userProfile?.name}
            managerEmail={managerEmailValue}
          />
        );

      case 'contracts':
        return (
          <ContractsPage
            tenants={tenants}
            userProfile={userProfile}
            onBack={() => setNavigationScreen('dashboard')}
          />
        );

      case 'clients':
        return (
          <ClientsPage
            tenants={tenants}
            properties={properties}
            arrearsAlerts={arrearsAlerts}
            userRole={userRole}
            onViewTenant={(tenant) => {
              selectTenant(tenant);
              navigateToScreen('tenant-details');
            }}
            onViewProperty={(property) => {
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onAddTenant={() => {
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('tenant-selection');
            }}
            onAddLandlord={() => navigateToScreen('add-landlord')}
            onViewLandlord={(landlord) => {
              selectLandlord(landlord);
              navigateToScreen('landlord-details');
            }}
            onDeleteTenant={async (tenantId) => {
              try {
                await tenantService.deleteTenant(tenantId);
              } catch (e) {
                // proceed to update UI regardless; rules are open in dev
              }
              setTenants(prev => prev.filter(t => t.id !== tenantId));
            }}
            onArchiveTenant={(tenantId) => {
              setTenants(prev => prev.map(t => 
                t.id === tenantId ? { ...t, status: 'archived' as any } : t
              ));
            }}
            onExportTenants={(format) => {
              const selectedTenants = tenants; // In real app, this would be the selected tenants
              exportData(selectedTenants, `tenants.${format}`, format);
            }}
            onDeleteLandlord={(landlordId) => {
              // In real app, this would delete from landlord state
              console.log('Delete landlord:', landlordId);
            }}
            onArchiveLandlord={(landlordId) => {
              // In real app, this would archive the landlord
              console.log('Archive landlord:', landlordId);
            }}
            onExportLandlords={(format) => {
              // In real app, this would export landlord data
              console.log('Export landlords as:', format);
            }}
          />
        );

      // COMMENTED OUT FOR THIS RELEASE - Inbox and Insights pages not in scope
      // case 'inbox':
      //   return (
      //     <TenantInbox
      //       onBack={() => setNavigationScreen('dashboard')}
      //     />
      //   );

      // case 'insights':
      //   return (
      //     <PortfolioInsights
      //       properties={properties}
      //       userProfile={userProfile}
      //       onBack={() => setNavigationScreen('dashboard')}
      //       marketInsights={marketInsights}
      //     />
      //   );

      default:
        return (
          <Dashboard
            properties={properties}
            userProfile={userProfile}
            onAddProperty={() => navigateToScreen('property-setup-step1')}
            onViewProperty={(property) => {
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onManageDocuments={(property) => {
              selectProperty(property);
              navigateToScreen('document-management');
            }}
            onManagePhotos={(property) => {
              selectProperty(property);
              navigateToScreen('photo-management');
            }}
            // COMMENTED OUT FOR THIS RELEASE - Insights page not in scope
            onViewInsights={() => {/* navigateToScreen('portfolio-insights') */}}
            onViewVacancyAlert={(alertId) => {
              const alert = vacancyAlerts.find(a => a.id === alertId);
              if (alert) {
                setSelectedVacancyAlert(alert);
                navigateToScreen('vacancy-prevention');
              }
            }}
            onViewArrearsAlert={(alertId) => {
              const alert = arrearsAlerts.find(a => a.id === alertId);
              if (alert) {
                setSelectedArrearsAlert(alert);
                navigateToScreen('arrears-management');
              }
            }}
            marketInsights={marketInsights}
            vacancyAlerts={vacancyAlerts}
            arrearsAlerts={arrearsAlerts}
          />
        );
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => navigateToScreen('role-selection')} />;
      
      case 'role-selection':
        return (
          <RoleSelection
            selectedRole={userRole}
            onRoleSelect={setUserRole}
            onContinue={() => navigateToScreen('profile-setup')}
          />
        );
      
      case 'profile-setup':
        return (
          <ProfileSetup
            role={userRole}
            onProfileComplete={(profile) => {
              setUserProfile(profile);
              navigateToScreen('onboarding-options');
            }}
            onSkip={() => navigateToScreen('onboarding-options')}
          />
        );
      
      case 'onboarding-options':
        return (
          <OnboardingOptions
            onGoToDashboard={() => {
              setIsOnboarding(false);
              setCurrentScreen('main-app');
              setNavigationScreen('dashboard');
            }}
            onAddProperty={() => navigateToScreen('property-setup-step1')}
            onSetupCompanyProfile={() => navigateToScreen('company-profile-setup')}
            userHasCompanyInfo={!!userProfile?.companyProfile}
          />
        );
      
      case 'company-profile-setup':
        return (
          <CompanyProfileSetup
            onCompanyProfileComplete={(companyProfile) => {
              if (userProfile) {
                setUserProfile({
                  ...userProfile,
                  companyProfile,
                  companyName: companyProfile.companyName,
                  logo: companyProfile.logo
                });
              }
              navigateToScreen('onboarding-options');
            }}
            onBack={() => navigateToScreen('onboarding-options')}
            initialProfile={userProfile?.companyProfile}
          />
        );
      
      case 'property-setup-step1':
        return (
          <PropertySetupStep1
            onNext={() => navigateToScreen('property-type-selection')}
            onBack={() => {
              if (properties.length > 0) {
                navigateToScreen('main-app');
              } else {
                navigateToScreen('onboarding-options');
              }
            }}
            onHome={() => navigateToScreen('main-app')}
            onSection1={() => navigateToScreen('property-type-selection')}
            onSection2={() => navigateToScreen('property-details-selection')}
            onSection3={() => navigateToScreen('amenities-selection')}
            onSection4={() => navigateToScreen('images-notes-selection')}
          />
        );
      
      case 'property-type-selection':
        return (
          <PropertyTypeSelection
            selectedType={propertySetupData.propertyType}
            onTypeSelect={(type) => updatePropertySetupData({ propertyType: type })}
            onNext={() => navigateToScreen('property-details-selection')}
            onBack={() => navigateToScreen('property-setup-step1')}
            onHome={() => navigateToScreen('main-app')}
            onPropertySetup={() => navigateToScreen('property-setup-step1')}
          />
        );
      
      case 'property-details-selection':
        return (
          <PropertyDetailsSelection
            propertyDetails={propertySetupData.propertyDetails}
            onPropertyDetailsChange={updatePropertyDetails}
            onNext={() => navigateToScreen('amenities-selection')}
            onBack={() => navigateToScreen('property-type-selection')}
            onHome={() => navigateToScreen('main-app')}
            onPropertySetup={() => navigateToScreen('property-setup-step1')}
          />
        );
      
      case 'amenities-selection':
        return (
          <AmenitiesSelection
            selectedAmenities={propertySetupData.amenities}
            onAmenitiesChange={(amenities) => updatePropertySetupData({ amenities })}
            onNext={() => navigateToScreen('images-notes-selection')}
            onBack={() => navigateToScreen('property-details-selection')}
            onHome={() => navigateToScreen('main-app')}
            onPropertySetup={() => navigateToScreen('property-setup-step1')}
          />
        );
      
      case 'images-notes-selection':
        return (
            <ImagesAndNotesSelection
            uploadedImages={propertySetupData.images}
            additionalNotes={propertySetupData.additionalNotes}
            onImagesChange={(images, imageFiles) => updatePropertySetupData({ images, imageFiles })}
            onNotesChange={(notes) => updatePropertySetupData({ additionalNotes: notes })}
            onNext={() => navigateToScreen('property-preview')}
            onBack={() => navigateToScreen('amenities-selection')}
            onHome={() => navigateToScreen('main-app')}
            onPropertySetup={() => navigateToScreen('property-setup-step1')}
          />
        );
      
      case 'property-setup':
        return (
          <PropertySetup
            property={selectedProperty}
            onPropertyComplete={async (property) => {
              if (selectedProperty) {
                // Editing existing property
                await updateProperty(selectedProperty.id, property);
                navigateToScreen('property-details');
              } else {
                // Adding new property
                const propertyId = await addProperty(property);
                const newProperty = properties.find(p => p.id === propertyId) || 
                  await propertyService.getProperty(propertyId) ||
                  { ...property, id: propertyId, createdAt: new Date() } as Property;
                setSelectedProperty(newProperty);
                if (isOnboarding) {
                  navigateToScreen('photo-upload');
                } else {
                  navigateToScreen('property-details');
                }
              }
            }}
            onSkip={isOnboarding ? () => navigateToScreen('onboarding-options') : () => navigateToScreen('main-app')}
            onBack={() => {
              // If user has properties, they're past onboarding - go to main app
              if (properties.length > 0) {
                setCurrentScreen('main-app');
                setNavigationScreen('dashboard');
              } else {
                // No properties yet, likely in onboarding - go back to onboarding
                navigateToScreen('onboarding-options');
              }
            }}
          />
        );
      
      case 'photo-upload':
        return (
          <PhotoUpload
            property={selectedProperty}
            onPhotosComplete={(photos) => {
              if (selectedProperty) {
                updateProperty(selectedProperty.id, { photos });
              }
              completeOnboarding();
            }}
            onSkip={completeOnboarding}
          />
        );
      
      case 'main-app':
        return (
          <MainLayout
            currentScreen={navigationScreen}
            onNavigate={handleNavigation}
            userProfile={userProfile}
          >
            {renderMainAppScreen()}
          </MainLayout>
        );
      
      case 'property-details':
        return (
          <PropertyDetails
            key={selectedProperty?.id || 'property-details'}
            property={selectedProperty}
            tenants={tenants}
            onBack={() => navigateToScreen('main-app')}
            onEdit={(property) => {
              // Enter editing mode and prefill setup data from the selected property
              setSelectedProperty(property);
              setIsEditing(true);
              setEditingPropertyId(property.id);
              setPropertySetupData({
                propertyType: property.type || null,
                propertyDetails: {
                  address: property.address || '',
                  monthlyRent: String(property.rent ?? ''),
                  bedrooms: String(property.bedrooms ?? ''),
                  bathrooms: String((property as any).bathrooms ?? ''),
                  squareFootage: String((property as any).squareFootage ?? ''),
                  uploadedDocuments: []
                },
                amenities: property.amenities || [],
                images: (property.photos || []).map(p => p.url),
                imageFiles: [],
                additionalNotes: property.notes || '',
                status: property.status // Preserve the original status
              });
              navigateToScreen('property-setup-step1');
            }}
            onManageDocuments={() => navigateToScreen('document-management')}
            onManagePhotos={() => navigateToScreen('photo-management')}
            updateProperty={updateProperty}
            onViewTenant={(tenantId) => {
              const tenant = tenants.find(t => t.id === tenantId);
              if (tenant) {
                selectTenant(tenant);
                navigateToScreen('tenant-details');
              }
            }}
            onAddTenant={() => {
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('add-tenant');
            }}
            onSelectExistingTenant={async (tenantId) => {
              if (!selectedProperty) return;
              
              const tenant = tenants.find(t => t.id === tenantId);
              if (!tenant) return;
              
              // Update the property to assign the tenant
              try {
                await updateProperty(selectedProperty.id, {
                  status: 'occupied',
                  tenantId: tenant.id
                });
                
                // Update the tenant's property assignment
                await tenantService.updateTenant(tenant.id, {
                  propertyId: selectedProperty.id,
                  propertyAddress: selectedProperty.address
                });
                
                // Refresh the tenant data
                const updatedTenant = await tenantService.getTenant(tenant.id);
                if (updatedTenant) {
                  setTenants(prev => prev.map(t => t.id === tenant.id ? updatedTenant : t));
                }
                
                // Update the property with tenant data
                const updatedProperty = await propertyService.getProperty(selectedProperty.id);
                if (updatedProperty) {
                  setSelectedProperty(updatedProperty);
                }
              } catch (error) {
                console.error('Failed to assign tenant to property:', error);
                alert('Failed to assign tenant to property');
              }
            }}
            onRemoveTenant={async (tenantId, propertyId) => {
              try {
                console.log(`🔄 Removing tenant ${tenantId} from property ${propertyId}`);
                
                // Remove tenant's property assignment
                await tenantService.updateTenant(tenantId, {
                  propertyId: '',
                  propertyAddress: ''
                });
                console.log(`✅ Updated tenant ${tenantId} to remove property assignment`);
                
                // Update property: remove tenantId field and set status to vacant
                const { deleteField } = await import('firebase/firestore');
                const propertyDocRef = doc(db, 'properties', propertyId);
                await updateDoc(propertyDocRef, {
                  status: 'vacant',
                  tenantId: deleteField(),
                  updatedAt: Timestamp.now()
                });
                console.log(`✅ Updated property ${propertyId} to remove tenantId and set status to vacant`);
                
                // Update local state immediately
                setProperties(prev => 
                  prev.map(p => 
                    p.id === propertyId 
                      ? { ...p, status: 'vacant' as const, tenantId: undefined, tenant: undefined }
                      : p
                  )
                );
                
                if (selectedProperty && selectedProperty.id === propertyId) {
                  setSelectedProperty(prev => prev ? { 
                    ...prev, 
                    status: 'vacant' as const, 
                    tenantId: undefined, 
                    tenant: undefined 
                  } : null);
                }
                
                // Refresh tenant data
                const updatedTenant = await tenantService.getTenant(tenantId);
                if (updatedTenant) {
                  setTenants(prev => prev.map(t => t.id === tenantId ? updatedTenant : t));
                  console.log(`✅ Refreshed tenant data for ${tenantId}`);
                }
                
                // Refresh property data from Firestore to ensure consistency
                const updatedProperty = await propertyService.getProperty(propertyId);
                if (updatedProperty) {
                  setSelectedProperty(updatedProperty);
                  setProperties(prev => 
                    prev.map(p => p.id === propertyId ? updatedProperty : p)
                  );
                  console.log(`✅ Refreshed property data for ${propertyId}`);
                }
                
                // Trigger alert regeneration after tenant removal
                const currentUserId = getCurrentUserId();
                if (currentUserId) {
                  console.log('🔄 Triggering alert regeneration after tenant removal');
                  alertService.generateAlerts(currentUserId).catch(error => {
                    console.warn('⚠️ Failed to regenerate alerts after tenant removal:', error);
                  });
                }
                
                console.log(`✅ Successfully removed tenant ${tenantId} from property ${propertyId}`);
              } catch (error) {
                console.error('❌ Failed to remove tenant from property:', error);
                alert('Failed to remove tenant from property. Please try again.');
              }
            }}
            onChangeTenant={async (propertyId, newTenantId) => {
              if (!selectedProperty) return;
              
              try {
                const currentTenant = selectedProperty.tenant;
                const newTenant = tenants.find(t => t.id === newTenantId);
                
                if (!newTenant) {
                  alert('Selected tenant not found');
                  return;
                }
                
                // Remove current tenant's property assignment
                if (currentTenant?.id) {
                  await tenantService.updateTenant(currentTenant.id, {
                    propertyId: '',
                    propertyAddress: ''
                  });
                  
                  // Refresh current tenant data
                  const updatedCurrentTenant = await tenantService.getTenant(currentTenant.id);
                  if (updatedCurrentTenant) {
                    setTenants(prev => prev.map(t => t.id === currentTenant.id ? updatedCurrentTenant : t));
                  }
                }
                
                // Assign new tenant to property
                await tenantService.updateTenant(newTenantId, {
                  propertyId: propertyId,
                  propertyAddress: selectedProperty.address
                });
                
                // Update property with new tenant
                await updateProperty(propertyId, {
                  status: 'occupied',
                  tenantId: newTenantId
                });
                
                // Refresh new tenant data
                const updatedNewTenant = await tenantService.getTenant(newTenantId);
                if (updatedNewTenant) {
                  setTenants(prev => prev.map(t => t.id === newTenantId ? updatedNewTenant : t));
                }
                
                // Refresh property data
                const updatedProperty = await propertyService.getProperty(propertyId);
                if (updatedProperty) {
                  setSelectedProperty(updatedProperty);
                }
                
                // Trigger alert regeneration after tenant change
                const currentUserId = getCurrentUserId();
                if (currentUserId) {
                  console.log('🔄 Triggering alert regeneration after tenant change');
                  alertService.generateAlerts(currentUserId).catch(error => {
                    console.warn('⚠️ Failed to regenerate alerts after tenant change:', error);
                  });
                }
              } catch (error) {
                console.error('Failed to change tenant:', error);
                alert('Failed to change tenant');
              }
            }}
          />
        );
      
      case 'document-management':
        return (
          <DocumentManagement
            property={selectedProperty}
            onBack={() => navigateToScreen('property-details')}
            onDocumentAdd={addDocumentToProperty}
          />
        );
      
      case 'photo-management':
        return (
          <PhotoManagement
            property={selectedProperty}
            onBack={() => navigateToScreen('property-details')}
            onPhotoAdd={addPhotoToProperty}
            updateProperty={updateProperty}
          />
        );
      
      // COMMENTED OUT FOR THIS RELEASE - Insights pages not in scope
      // case 'portfolio-insights':
      //   return (
      //     <PortfolioInsights
      //       properties={properties}
      //       userProfile={userProfile}
      //       onBack={() => navigateToScreen('main-app')}
      //       marketInsights={marketInsights}
      //     />
      //   );
      
      // case 'property-insights':
      //   return (
      //     <PropertyInsights
      //       property={selectedProperty}
      //       onBack={() => navigateToScreen('property-details')}
      //     />
      //   );
      
      case 'tenant-details':
        return (
          <TenantDetails
            tenant={selectedTenant}
            onBack={() => navigateToScreen('main-app')}
            onEdit={(tenant) => {
              console.log('🔍 Edit button clicked, tenant:', tenant);
              setSelectedTenant(tenant);
              editingTenantRef.current = tenant; // Store in ref for immediate access
              console.log('🔍 selectedTenant set to:', tenant);
              navigateToScreen('add-tenant');
            }}
            onTenantUpdate={(updatedTenant) => {
              setSelectedTenant(updatedTenant);
              setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
              setProperties(prev => prev.map(property => {
                if (property.tenant?.id === updatedTenant.id) {
                  return {
                    ...property,
                    tenant: {
                      ...property.tenant,
                      ...updatedTenant
                    }
                  };
                }
                return property;
              }));
              setArrearsAlerts(prev => {
                const remainingAlerts = prev.filter(alert => alert.tenantId !== updatedTenant.id);
                if (updatedTenant.paymentStatus === 'overdue') {
                  const nextAlert = {
                    id: `local-${updatedTenant.id}`,
                    tenantId: updatedTenant.id,
                    tenantName: updatedTenant.name,
                    propertyAddress: updatedTenant.propertyAddress,
                    overdueAmount: updatedTenant.overdueAmount || 0,
                    daysPastDue: 0,
                    defaultRiskScore: updatedTenant.defaultRiskScore || 65,
                    lastPaymentDate: updatedTenant.lastPaymentDate || undefined,
                    status: 'new' as const
                  };
                  return [...remainingAlerts, nextAlert];
                }
                return remainingAlerts;
              });
              const currentUserId = resolveManagerId();
              if (currentUserId) {
                alertService.generateAlerts(currentUserId).catch(error => {
                  console.warn('⚠️ Failed to regenerate alerts after tenant payment update:', error);
                });
              }
            }}
          />
        );

      case 'landlord-details':
        // Only agents can view landlord details
        if (userRole !== 'agent') {
          navigateToScreen('main-app');
          setNavigationScreen('clients');
          return null;
        }
        return (
          <LandlordDetails
            landlord={selectedLandlord}
            onBack={() => navigateToScreen('main-app')}
            onEdit={(landlord) => {
              setSelectedLandlord(landlord);
              // Could add landlord editing functionality here
            }}
          />
        );
      
      case 'vacancy-prevention':
        return (
          <VacancyPrevention
            alert={selectedVacancyAlert!}
            onBack={() => navigateToScreen('main-app')}
            onInitiatePreMarketing={(alert, assets) => {
              // Update alert status and handle pre-marketing initiation
              setVacancyAlerts(prev => 
                prev.map(a => a.id === alert.id ? { ...a, status: 'pre-marketing' } : a)
              );
              navigateToScreen('main-app');
            }}
          />
        );
      
      case 'arrears-management':
        const tenantForArrears = tenants.find(t => t.id === selectedArrearsAlert?.tenantId);
        if (!tenantForArrears) {
          // Fallback if tenant not found
          return (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Tenant not found</p>
              <Button onClick={() => navigateToScreen('main-app')} className="mt-4">Go Back</Button>
            </div>
          );
        }
        return (
          <ArrearsManagement
            alert={selectedArrearsAlert!}
            tenant={tenantForArrears}
            onBack={() => navigateToScreen('main-app')}
            onInitiateWorkflow={(workflowType, details) => {
              // Handle workflow initiation
              setArrearsAlerts(prev => 
                prev.map(a => a.id === selectedArrearsAlert?.id ? 
                  { ...a, status: workflowType === 'reminder' ? 'reminder-sent' : 
                           workflowType === 'payment-plan' ? 'payment-plan' : 'legal-action' } : a)
              );
              navigateToScreen('main-app');
            }}
          />
        );
      
      // COMMENTED OUT FOR THIS RELEASE - Tenant Inbox page not in scope
      // case 'tenant-inbox':
      //   return (
      //     <TenantInbox
      //       onBack={() => navigateToScreen('main-app')}
      //     />
      //   );
      
      case 'property-preview':
        console.log('Rendering PropertyPreview component with setup data:', propertySetupData);
        return (
          <PropertyPreview
            property={createPropertyFromSetupData()}
            isEditing={isEditing}
            onBack={() => navigateToScreen('images-notes-selection')}
            onEdit={() => navigateToScreen('property-type-selection')}
            onManageDocuments={() => {}}
            onManagePhotos={() => {}}
            updateProperty={() => {}}
            onHome={() => navigateToScreen('main-app')}
            onPropertySetup={() => navigateToScreen('property-setup-step1')}
            onPublishProperty={async () => {
              try {
                console.log(isEditing ? '💾 Saving property changes...' : '📤 Publishing property...');
                console.log('Property setup data:', {
                  imageFilesCount: propertySetupData.imageFiles.length,
                  imagesCount: propertySetupData.images.length
                });
                
                // 1. Upload images to Firebase Storage
                let uploadedPhotos: PropertyPhoto[] = [];
                if (propertySetupData.imageFiles.length > 0) {
                  console.log('Uploading images to Firebase Storage...');
                  uploadedPhotos = await uploadPropertyImages(propertySetupData.imageFiles);
                  console.log('Uploaded photos:', uploadedPhotos);
                } else {
                  console.warn('No image files to upload');
                }
                
                // 2. Upload documents to Firebase Storage
                let uploadedDocuments: PropertyDocument[] = [];
                if (propertySetupData.propertyDetails.uploadedDocuments.length > 0) {
                  console.log('Uploading property documents...');
                  uploadedDocuments = await uploadPropertyDocuments(propertySetupData.propertyDetails.uploadedDocuments);
                  console.log('Uploaded documents:', uploadedDocuments);
                }

                // 3. Convert setup data to property
                const newProperty = createPropertyFromSetupData();
                
                // 4. Replace preview URLs with uploaded Firebase Storage URLs
                if (uploadedPhotos.length > 0) {
                  console.log('Replacing preview URLs with Firebase Storage URLs');
                  newProperty.photos = uploadedPhotos;
                } else {
                  console.warn('No photos to add to property');
                  newProperty.photos = [];
                }
                
                if (uploadedDocuments.length > 0) {
                  newProperty.documents = uploadedDocuments;
                } else {
                  newProperty.documents = [];
                }
                
                if (isEditing && editingPropertyId) {
                  // Fetch the original property to preserve status and other important fields
                  const originalProperty = await propertyService.getProperty(editingPropertyId);
                  const preservedStatus = originalProperty?.status || selectedProperty?.status || 'vacant';
                  
                  // Prepare updates object with all changes, preserving status
                  const updates = {
                    address: newProperty.address,
                    type: newProperty.type,
                    bedrooms: newProperty.bedrooms,
                    bathrooms: newProperty.bathrooms,
                    squareFootage: newProperty.squareFootage,
                    rent: newProperty.rent,
                    amenities: newProperty.amenities,
                    notes: newProperty.notes,
                    status: preservedStatus, // Preserve the original status from database
                  };
                  
                  // Update in Firebase directly (bypass updateProperty to avoid double state updates)
                  const { id, createdAt, tenant, photos, documents, ...firebaseUpdates } = updates as any;
                  
                  // Filter out undefined values - Firestore doesn't accept undefined
                  const cleanUpdates = Object.fromEntries(
                    Object.entries(firebaseUpdates).filter(([_, value]) => value !== undefined)
                  ) as any;
                  
                  await propertyService.updateProperty(editingPropertyId, cleanUpdates);
                  
                  // Fetch the updated property from Firebase to get the latest data with proper mapping
                  const updated = await propertyService.getProperty(editingPropertyId);
                  if (updated) {
                    // Enrich property with tenant data if tenant exists (similar to selectProperty)
                    const tenantForProperty = tenants.find(t => t.propertyId === editingPropertyId || t.id === updated.tenantId);
                    
                    // Determine the correct status:
                    // 1. If property has a tenant, it should be 'occupied'
                    // 2. Otherwise, use the preserved status from the original property
                    let finalStatus = preservedStatus;
                    if (tenantForProperty) {
                      finalStatus = 'occupied';
                    } else if (updated.status) {
                      // Use the status from the database if no tenant
                      finalStatus = updated.status;
                    }
                    
                    // Build the complete property object with tenant and correct status
                    const propertyWithPreservedStatus = {
                      ...updated,
                      status: finalStatus,
                      tenant: tenantForProperty || updated.tenant,
                      tenantId: tenantForProperty?.id || updated.tenantId
                    };
                    
                    // Update both selectedProperty and properties array with fetched data
                    // This ensures we have the complete, properly mapped property object
                    setSelectedProperty(propertyWithPreservedStatus);
                    setProperties(prev => 
                      prev.map(p => p.id === editingPropertyId ? propertyWithPreservedStatus : p)
                    );
                    
                    console.log('✅ Property updated successfully:', {
                      id: editingPropertyId,
                      status: propertyWithPreservedStatus.status,
                      address: propertyWithPreservedStatus.address,
                      hasTenant: !!tenantForProperty
                    });
                    
                    // Trigger alert regeneration after property update
                    const currentUserId = getCurrentUserId();
                    if (currentUserId) {
                      console.log('🔄 Triggering alert regeneration after property update');
                      alertService.generateAlerts(currentUserId).catch(error => {
                        console.warn('⚠️ Failed to regenerate alerts after property update:', error);
                      });
                    }
                  } else {
                    console.error('❌ Failed to fetch updated property after save');
                  }
                  
                  setIsEditing(false);
                  setEditingPropertyId(null);
                  navigateToScreen('property-details');
                } else {
                  console.log('Creating property with photos:', newProperty.photos.length);
                  console.log('Property photos data:', JSON.stringify(newProperty.photos, null, 2));
                  
                  // 4. Create property in Firebase
                  const propertyId = await addProperty(newProperty);
                  console.log('Property created with ID:', propertyId);
                  
                  // 5. Update pending tenants with the correct propertyId
                  if (propertySetupData.pendingTenants && propertySetupData.pendingTenants.length > 0) {
                    console.log(`Updating ${propertySetupData.pendingTenants.length} pending tenant(s) with propertyId:`, propertyId);
                    try {
                      const { tenantService } = await import('./services/tenantService');
                      // Find tenants that were saved but need propertyId update
                      // Note: This assumes tenants were saved with a temporary propertyId or address match
                      const currentUserId = getCurrentUserId();
                      if (currentUserId) {
                        // Get all tenants for this user and update those matching the property address
                        const allTenants = await tenantService.getTenants(currentUserId);
                        const propertyAddress = newProperty.address;
                        const tenantsToUpdate = allTenants.filter(t => 
                          t.propertyAddress === propertyAddress && 
                          (!t.propertyId || t.propertyId === 'setup-property' || t.propertyId === 'pending')
                        );
                        
                        for (const tenant of tenantsToUpdate) {
                          await tenantService.updateTenant(tenant.id, {
                            propertyId: propertyId,
                            propertyAddress: propertyAddress
                          } as Partial<Tenant>);
                          console.log(`✅ Updated tenant ${tenant.id} with propertyId ${propertyId}`);
                        }
                      }
                    } catch (error) {
                      console.error('Error updating pending tenants:', error);
                      // Don't block property creation if tenant update fails
                    }
                  }
                  
                  // 6. Fetch created property to get full data
                  const createdProperty = await propertyService.getProperty(propertyId);
                  
                  if (createdProperty) {
                    selectProperty(createdProperty);
                    navigateToScreen('property-details');
                  } else {
                    console.error('Failed to retrieve created property');
                    alert('Property created but failed to load. Please refresh the page.');
                  }
                }
              } catch (error) {
                console.error('Error publishing property:', error);
                alert(`Failed to publish property: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            onAddTenant={() => {
              setPreviousScreen('property-preview');
              navigateToScreen('tenant-selection');
            }}
          />
        );
      
      case 'tenant-selection':
        return (
          <TenantSelection
            onManualInput={() => {
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('add-tenant');
            }}
            onInviteEmail={() => navigateToScreen('invite-tenant')}
            onSelectExisting={() => navigateToScreen('select-existing-tenant')}
            onBack={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-preview');
              } else {
                navigateToScreen('main-app');
                setNavigationScreen('clients');
              }
            }}
          />
        );

      case 'add-tenant':
        // Use ref value if available, otherwise fall back to state (for async updates)
        const tenantToEdit = editingTenantRef.current || selectedTenant;
        console.log('🔍 Rendering AddTenant with selectedTenant:', selectedTenant, 'ref:', editingTenantRef.current, 'using:', tenantToEdit);
        return (
          <AddTenant
            properties={properties}
            preselectedPropertyId={selectedProperty?.id}
            userProfile={userProfile}
            initialTenant={tenantToEdit}
            onBackToSelection={() => {
              setSelectedTenant(null);
              editingTenantRef.current = null;
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-preview');
              } else {
                navigateToScreen('tenant-selection');
              }
            }}
            onSave={async (tenant) => {
              const tenantId = editingTenantRef.current?.id || selectedTenant?.id;
              if (tenantId) {
                // Update existing tenant
                try {
                  const { tenantService } = await import('./services/tenantService');
                  await tenantService.updateTenant(tenantId, tenant);
                  // Refresh tenant list and update selected tenant
                  const updatedTenant = await tenantService.getTenant(tenantId);
                  if (updatedTenant) {
                    setTenants(prev => prev.map(t => t.id === tenantId ? updatedTenant : t));
                    // Keep the updated tenant selected so navigation works correctly
                    setSelectedTenant(updatedTenant);
                    editingTenantRef.current = updatedTenant;
                  }
                } catch (error) {
                  console.error('Error updating tenant:', error);
                  alert('Failed to update tenant. Please try again.');
                  return;
                }
              } else {
                // Add new tenant
                addTenant(tenant);
                
                // If coming from property-preview, also store tenant in propertySetupData for preview
                if (previousScreen === 'property-preview') {
                  setPropertySetupData(prev => ({
                    ...prev,
                    pendingTenants: [...(prev.pendingTenants || []), tenant]
                  }));
                  console.log('✅ Stored tenant in propertySetupData.pendingTenants for preview');
                }
              }
              // Don't clear selectedTenant here - let the Done button handle navigation
              // navigateToScreen('main-app');
              // setNavigationScreen('clients');
            }}
            onBack={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-preview');
              } else if (editingTenantRef.current) {
                const tenantToShow = editingTenantRef.current;
                editingTenantRef.current = null;
                setSelectedTenant(tenantToShow);
                navigateToScreen('tenant-details');
              } else if (selectedTenant) {
                navigateToScreen('tenant-details');
              } else {
                // If no tenant selected, go to clients list instead of tenant-selection
                navigateToScreen('main-app');
                setNavigationScreen('clients');
              }
            }}
          />
        );

      case 'invite-tenant':
        return (
          <InviteTenant
            properties={properties}
            onBack={() => navigateToScreen('tenant-selection')}
            onSuccess={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-preview');
              } else {
                navigateToScreen('main-app');
                setNavigationScreen('clients');
              }
            }}
          />
        );

      case 'select-existing-tenant':
        return (
          <SelectExistingTenant
            properties={properties}
            existingTenants={tenants}
            onBack={() => navigateToScreen('tenant-selection')}
            onSuccess={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-preview');
              } else {
                navigateToScreen('main-app');
                setNavigationScreen('clients');
              }
            }}
          />
        );
      
      case 'add-landlord':
        if (userRole !== 'agent') {
          navigateToScreen('main-app');
          setNavigationScreen('clients');
          return null;
        }
        // Use the new wizard
        return (
          <AddLandlordWizard
            userProfile={userProfile}
            onBack={() => {
              navigateToScreen('main-app');
              setNavigationScreen('clients');
            }}
            onSaved={() => {
              navigateToScreen('main-app');
              setNavigationScreen('clients');
            }}
          />
        );
      
      default:
        console.log('🚨 Falling through to default case! Current screen:', currentScreen);
        return <WelcomeScreen onGetStarted={() => navigateToScreen('role-selection')} />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E65D24] mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div 
        className={`transition-all duration-[4ms] ease-out ${
          isTransitioning 
            ? 'opacity-0 transform scale-75' 
            : 'opacity-100 transform scale-100'
        }`}
      >
        {renderScreen()}
      </div>
    </div>
  );
}

// Main App Component with Routes
export default function App() {
  return (
    <Routes>
      <Route path="*" element={<AppContent />} />
    </Routes>
  );
}
