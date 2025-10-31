import React, { useState } from 'react';
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
import { InviteTenant } from './components/InviteTenant';
import { SelectExistingTenant } from './components/SelectExistingTenant';
import { AddLandlord } from './components/AddLandlord';
import { AddLandlordWizard } from './components/AddLandlordWizard';
import { ContractsPage } from './components/ContractsPage';
import { propertyService } from './services/propertyService';
import { tenantService } from './services/tenantService';
import { storage } from './config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  type: 'market-trend' | 'regulatory-change' | 'demand-shift' | 'price-change';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  date: Date;
  area?: string;
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
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main-app');
  const [navigationScreen, setNavigationScreen] = useState<NavigationScreen>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('landlord');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedLandlord, setSelectedLandlord] = useState<any | null>(null);
  const [selectedVacancyAlert, setSelectedVacancyAlert] = useState<VacancyRiskAlert | null>(null);
  const [selectedArrearsAlert, setSelectedArrearsAlert] = useState<ArrearsAlert | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [vacancyAlerts, setVacancyAlerts] = useState<VacancyRiskAlert[]>([]);
  const [arrearsAlerts, setArrearsAlerts] = useState<ArrearsAlert[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  
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
    additionalNotes: ''
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

  // Listen for AUTH_STATE messages from the embedding tenant app (bridge)
  React.useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      const data: any = (event as any).data;
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
      }
    };

    window.addEventListener('message', handleAuthMessage);

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
        }
      }
    } catch (err) {
      // ignore parse errors
    }

    return () => {
      window.removeEventListener('message', handleAuthMessage);
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

  // Convert property setup data to Property object
  const createPropertyFromSetupData = (): Property => {
    const { propertyType, propertyDetails, amenities, images, additionalNotes } = propertySetupData;
    
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

    return {
      id: 'setup-property',
      address: propertyDetails.address,
      type: propertyType || 'Property',
      bedrooms: parseInt(propertyDetails.bedrooms) || 1,
      bathrooms: parseInt(propertyDetails.bathrooms) || undefined,
      squareFootage: parseInt(propertyDetails.squareFootage) || undefined,
      rent: parseInt(propertyDetails.monthlyRent) || 0,
      status: 'vacant',
      amenities: amenities,
      notes: additionalNotes,
      photos: photos,
      documents: documents,
      createdAt: new Date()
    };
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
    // Load tenants from Firestore; show empty state on no data/error
    (async () => {
      try {
        const fetched = await tenantService.getTenants();
        console.log('Tenants loaded from Firestore:', fetched.length);
        setTenants(fetched);
      } catch (e) {
        console.warn('Failed to load tenants from Firestore, showing empty list');
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
    setProperties(mockProperties);

    // Mock market insights
    const mockInsights: MarketInsight[] = [
      {
        id: '1',
        type: 'market-trend',
        title: 'Rental demand increased 12% in your area',
        description: 'East London properties showing strong growth. Consider reviewing rent prices.',
        severity: 'medium',
        actionRequired: false,
        date: new Date('2024-06-01'),
        area: 'East London'
      },
      {
        id: '2',
        type: 'regulatory-change',
        title: 'New EPC requirements coming 2025',
        description: 'Properties must achieve minimum grade C by April 2025. Review your compliance status.',
        severity: 'high',
        actionRequired: true,
        date: new Date('2024-06-15')
      }
    ];
    setMarketInsights(mockInsights);

    // Mock vacancy alerts
    const mockVacancyAlerts: VacancyRiskAlert[] = [
      {
        id: 'v1',
        propertyId: '1',
        propertyAddress: '123 Regent Street, London W1B 4EA',
        riskScore: 85,
        predictedVacancyDate: new Date('2025-03-15'),
        currentTenantEndDate: new Date('2025-02-28'),
        factors: {
          marketTrend: 75,
          seasonality: 90,
          tenantHistory: 60,
          propertyCondition: 80
        },
        recommendations: {
          optimalRentPrice: 2650,
          marketingStartDate: new Date('2025-01-15'),
          urgencyLevel: 'high'
        },
        status: 'new'
      }
    ];
    setVacancyAlerts(mockVacancyAlerts);

    // Mock arrears alerts
    const mockArrearsAlerts: ArrearsAlert[] = [
      {
        id: 'a1',
        tenantId: 't1',
        tenantName: 'Sarah Johnson',
        propertyAddress: '123 Regent Street, London W1B 4EA',
        overdueAmount: 2400,
        daysPastDue: 12,
        defaultRiskScore: 65,
        lastPaymentDate: new Date('2024-10-01'),
        status: 'new'
      }
    ];
    setArrearsAlerts(mockArrearsAlerts);
  }, []);

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

  // Load properties from Firebase on mount
  React.useEffect(() => {
    const loadProperties = async () => {
      try {
        const fetchedProperties = await propertyService.getProperties();
        console.log('Properties loaded from Firebase:', fetchedProperties.length);
        // Log photos for each property
        fetchedProperties.forEach((prop, idx) => {
          console.log(`Property ${idx + 1} (${prop.address}):`, {
            id: prop.id,
            photosCount: prop.photos?.length || 0,
            photos: prop.photos
          });
        });
        setProperties(fetchedProperties);
      } catch (error) {
        console.error('Error loading properties:', error);
        // Keep existing mock data if Firebase fails
      }
    };
    loadProperties();
  }, []);

  const addProperty = async (property: Omit<Property, 'id' | 'createdAt'>) => {
    try {
      // Strip any accidental id/createdAt fields before saving
      const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...safeProperty } = property as any;
      // Save to Firebase
      const propertyId = await propertyService.createProperty(safeProperty);
      
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
      console.log('[App] addTenant called with:', tenant);
      const id = await tenantService.createTenant(tenant);
      console.log('[App] tenant created with id:', id);
      const saved = await tenantService.getTenant(id);
      if (saved) {
        console.log('[App] fetched saved tenant:', saved);
        setTenants(prev => [...prev, saved]);
        return;
      }
    } catch (e) {
      console.warn('[App] addTenant failed, falling back:', e);
      // ignore and fallback
    }
    const fallback: Tenant = { ...tenant, id: `tenant-${Date.now()}` };
    setTenants(prev => [...prev, fallback]);
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
            onViewInsights={() => navigateToScreen('portfolio-insights')}
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
                additionalNotes: property.notes || ''
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
            onDeleteDocuments={(documentIds) => {
              // In real app, this would delete documents from properties
              console.log('Delete documents:', documentIds);
            }}
            onArchiveDocuments={(documentIds) => {
              // In real app, this would archive documents
              console.log('Archive documents:', documentIds);
            }}
            onExportDocuments={(format) => {
              // In real app, this would export document data
              console.log('Export documents as:', format);
            }}
          />
        );

      case 'contracts':
        return (
          <ContractsPage
            tenants={tenants}
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
            onAddTenant={() => navigateToScreen('tenant-selection')}
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

      case 'inbox':
        return (
          <TenantInbox
            onBack={() => setNavigationScreen('dashboard')}
          />
        );

      case 'insights':
        return (
          <PortfolioInsights
            properties={properties}
            userProfile={userProfile}
            onBack={() => setNavigationScreen('dashboard')}
            marketInsights={marketInsights}
          />
        );

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
            onViewInsights={() => navigateToScreen('portfolio-insights')}
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
    console.log('🔍 Current screen:', currentScreen, 'Type:', typeof currentScreen);
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
            onNavigate={setNavigationScreen}
            userProfile={userProfile}
          >
            {renderMainAppScreen()}
          </MainLayout>
        );
      
      case 'property-details':
        return (
          <PropertyDetails
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
                additionalNotes: property.notes || ''
              });
              navigateToScreen('property-setup-step1');
            }}
            onManageDocuments={() => navigateToScreen('document-management')}
            onManagePhotos={() => navigateToScreen('photo-management')}
            onViewInsights={() => navigateToScreen('property-insights')}
            updateProperty={updateProperty}
            onViewTenant={(tenantId) => {
              const tenant = tenants.find(t => t.id === tenantId);
              if (tenant) {
                selectTenant(tenant);
                navigateToScreen('tenant-details');
              }
            }}
            onAddTenant={() => navigateToScreen('add-tenant')}
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
      
      case 'portfolio-insights':
        return (
          <PortfolioInsights
            properties={properties}
            userProfile={userProfile}
            onBack={() => navigateToScreen('main-app')}
            marketInsights={marketInsights}
          />
        );
      
      case 'property-insights':
        return (
          <PropertyInsights
            property={selectedProperty}
            onBack={() => navigateToScreen('property-details')}
          />
        );
      
      case 'tenant-details':
        return (
          <TenantDetails
            tenant={selectedTenant}
            onBack={() => navigateToScreen('main-app')}
            onEdit={(tenant) => {
              setSelectedTenant(tenant);
              // Could add tenant editing functionality here
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
        return (
          <ArrearsManagement
            alert={selectedArrearsAlert!}
            tenant={{
              id: selectedArrearsAlert?.tenantId || '',
              name: selectedArrearsAlert?.tenantName || '',
              email: 'tenant@example.com',
              phone: '+44 7700 900000',
              propertyAddress: selectedArrearsAlert?.propertyAddress || '',
              propertyId: '1',
              rentAmount: 2400,
              leaseStart: new Date('2023-03-01'),
              leaseEnd: new Date('2025-03-01'),
              status: 'active',
              referencingStatus: 'complete',
              paymentStatus: 'overdue',
              defaultRiskScore: selectedArrearsAlert?.defaultRiskScore,
              lastPaymentDate: selectedArrearsAlert?.lastPaymentDate,
              overdueAmount: selectedArrearsAlert?.overdueAmount
            }}
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
      
      case 'tenant-inbox':
        return (
          <TenantInbox
            onBack={() => navigateToScreen('main-app')}
          />
        );
      
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
            onViewInsights={() => {}}
            updateProperty={() => {}}
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
                
                // 2. Convert setup data to property
                const newProperty = createPropertyFromSetupData();
                
                // 3. Replace preview URLs with uploaded Firebase Storage URLs
                if (uploadedPhotos.length > 0) {
                  console.log('Replacing preview URLs with Firebase Storage URLs');
                  newProperty.photos = uploadedPhotos;
                } else {
                  console.warn('No photos to add to property');
                  newProperty.photos = [];
                }
                
                if (isEditing && editingPropertyId) {
                  // Update existing property
                  await updateProperty(editingPropertyId, {
                    address: newProperty.address,
                    type: newProperty.type,
                    bedrooms: newProperty.bedrooms,
                  bathrooms: newProperty.bathrooms,
                  squareFootage: newProperty.squareFootage,
                    rent: newProperty.rent,
                    amenities: newProperty.amenities,
                    notes: newProperty.notes,
                  });
                  // Optionally handle photos update here later
                  const updated = await propertyService.getProperty(editingPropertyId);
                  if (updated) {
                    setSelectedProperty(updated);
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
                  
                  // 5. Fetch created property to get full data
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
          />
        );
      
      case 'tenant-selection':
        return (
          <TenantSelection
            onManualInput={() => navigateToScreen('add-tenant')}
            onInviteEmail={() => navigateToScreen('invite-tenant')}
            onSelectExisting={() => navigateToScreen('select-existing-tenant')}
            onBack={() => {
              navigateToScreen('main-app');
              setNavigationScreen('clients');
            }}
          />
        );

      case 'add-tenant':
        return (
          <AddTenant
            properties={properties}
            preselectedPropertyId={selectedProperty?.id}
            onSave={(tenant) => {
              addTenant(tenant);
              navigateToScreen('main-app');
              setNavigationScreen('clients');
            }}
            onBack={() => navigateToScreen('tenant-selection')}
          />
        );

      case 'invite-tenant':
        return (
          <InviteTenant
            properties={properties}
            onBack={() => navigateToScreen('tenant-selection')}
            onSuccess={() => {
              navigateToScreen('main-app');
              setNavigationScreen('clients');
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
              navigateToScreen('main-app');
              setNavigationScreen('clients');
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