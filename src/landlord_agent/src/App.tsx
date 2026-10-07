import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { toast } from "sonner";
import { TooltipProvider } from './components/ui/tooltip';
import { Routes, Route, useLocation, MemoryRouter, useInRouterContext } from 'react-router-dom';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LandlordEmptyState } from './components/LandlordEmptyState';
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
import { MainLayout, NavigationScreen } from './components/MainLayout';
import { PropertiesPage } from './components/PropertiesPage';
import { DocumentsPage } from './components/DocumentsPage';
import { ClientsPage } from './components/ClientsPage';
import { TenantDetails } from './components/TenantDetails';
import { LandlordDetails } from './components/LandlordDetails';
import { OnboardingOptions } from './components/OnboardingOptions';
import { CompanyProfileSetup } from './components/CompanyProfileSetup';
import { TenantInbox } from './components/TenantInbox';
import { PropertyPreview } from './components/PropertyPreview';
import { TenantSelection } from './components/TenantSelection';
import { AddTenant } from './components/AddTenant';
import { EditTenant } from './components/EditTenant';
import { alertService, type Alert } from './services/alertService';
import { InviteTenant } from './components/InviteTenant';
import { SelectExistingTenant } from './components/SelectExistingTenant';
import { AddLandlordWizard } from './components/AddLandlordWizard';
import { BulkTenantImport } from './components/BulkTenantImport';
import { BulkPropertyImport } from './components/BulkPropertyImport';
import { BulkAssignTable } from './components/BulkAssignTable';
import { PropertyEnrichmentQueue } from './components/PropertyEnrichmentQueue';
import { documentService } from './services/documentService';
import type { LandlordDocument } from './services/documentService';
import { propertyService } from './services/propertyService';
import { tenantService } from './services/tenantService';
import { marketInsightService } from './services/marketInsightService';
import { getResolvedApiBaseUrl } from '../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../services/msalAccessToken';
import AuthContext, { useAuth } from '../../contexts/AuthContext';
import { MessagingProvider } from '../../contexts/MessagingContext';
import { trackEvent } from '../../utils/analytics';
import { useTenants } from './hooks/useTenants';
import {
  AGENT_TEST_COMPANY,
  AGENT_TEST_COMPANY_PROFILE,
  getAgentDummyProperties,
  getAgentDummyTenants,
  isAgentTestAccount,
  mergeAgentDemoProperties,
  mergeById,
} from './data/agentTestPersona';

// Heavy page-level components — lazy loaded to cut initial bundle
const VacancyPrevention = lazy(() => import('./components/VacancyPrevention').then(m => ({ default: m.VacancyPrevention })));
const ArrearsManagement = lazy(() => import('./components/ArrearsManagement').then(m => ({ default: m.ArrearsManagement })));
const PortfolioInsights = lazy(() => import('./components/PortfolioInsights').then(m => ({ default: m.PortfolioInsights })));
const PropertyInsights  = lazy(() => import('./components/PropertyInsights').then(m => ({ default: m.PropertyInsights })));
const ReferencingPage   = lazy(() => import('./components/ReferencingPage').then(m => ({ default: m.ReferencingPage })));
const ContractsPage     = lazy(() => import('./components/ContractsPage').then(m => ({ default: m.ContractsPage })));
const ViewingsPage      = lazy(() => import('./components/ViewingsPage').then(m => ({ default: m.default })));
const LandlordAgentSettingsPage = lazy(() => import('./components/LandlordAgentSettingsPage').then(m => ({ default: m.default })));
const AddLandlord       = lazy(() => import('./components/AddLandlord').then(m => ({ default: m.AddLandlord })));

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E65D24]" />
  </div>
);

export type UserRole = 'landlord' | 'agent';

/** Azure B2C sign-in URL for guest users in empty state */
const SIGN_IN_URL = 'https://proptii.b2clogin.com/proptii.onmicrosoft.com/b2c_1_signupandsigninproptii/oauth2/v2.0/authorize?client_id=532e1fa0-18a6-4356-bd78-1f62bd6d5e2f&scope=openid%20profile%20email%20offline_access&redirect_uri=https%3A%2F%2Fproptii.co&client-request-id=019c89da-c0f9-7dde-8814-96ced1d1ac4a&response_mode=fragment&client_info=1&nonce=019c89da-c0fd-7ed4-acf5-ad3b2621c727&state=eyJpZCI6IjAxOWM4OWRhLWMwZmEtNzcwOC1iYjYwLTRiM2MzODZkZmJiZCIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0%3D&claims=%7B%22id_token%22%3A%7B%22extension_PhoneNumber%22%3Anull%7D%7D&x-client-SKU=msal.js.browser&x-client-VER=4.12.0&response_type=code&code_challenge=YWSXzXu9cBV85rUs9pzakoUBSnweIFd2NW-SzZdpjyI&code_challenge_method=S256';

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
  // Sale-related (optional)
  isForSale?: boolean;
  tenureType?: string;
  annualGroundRent?: number;
  councilTaxBand?: string;
  annualServiceCharge?: number;
  // Shortlet-related (optional)
  propertyMode?: 'long-term' | 'shortlet'; // Property rental mode
  nightlyRate?: number; // Nightly rate for shortlets
  minStay?: number; // Minimum stay in nights
  maxStay?: number; // Maximum stay in nights
  currentGuest?: any; // Current guest information
  calendarDates?: any[]; // Availability calendar
  pricingRules?: any[]; // Pricing rules for shortlets
  provisioningChecklist?: any[]; // Property readiness checklist
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
  notes?: string;
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
  | 'edit-tenant'
  | 'invite-tenant'
  | 'select-existing-tenant'
  | 'add-landlord'
  | 'landlord-details'
  | 'bulk-import-tenant'
  | 'bulk-import-property'
  | 'bulk-assign'
  | 'property-enrichment-queue'
  | 'document-management-vault';

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

// Map URL paths to main-app navigation screens (shared by routing helpers below)
const PATH_TO_NAV_SCREEN: Record<string, NavigationScreen> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/viewings': 'viewings',
  '/properties': 'properties',
  '/documents': 'documents',
  '/contracts': 'contracts',
  '/clients': 'clients',
  '/insights': 'insights',
  '/settings': 'settings',
  '/messages': 'messages',
  '/referencing': 'referencing',
};

const SCREEN_TO_PATH: Record<NavigationScreen, string> = {
  dashboard: '/dashboard',
  viewings: '/viewings',
  properties: '/properties',
  documents: '/documents',
  contracts: '/contracts',
  clients: '/clients',
  insights: '/insights',
  inbox: '/inbox',
  settings: '/settings',
  messages: '/messages',
  referencing: '/referencing',
};

function screenFromPathname(pathname: string): NavigationScreen | null {
  if (pathname === '/index.html') return 'dashboard';
  let normalizedPath = pathname.startsWith('/landlord')
    ? pathname.slice('/landlord'.length) || '/'
    : pathname;
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  if (!normalizedPath.startsWith('/')) normalizedPath = `/${normalizedPath}`;
  return PATH_TO_NAV_SCREEN[normalizedPath] ?? null;
}

function isEmbeddedInParent(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// Main App Content Component (wrapped by Routes)
export function AppContent() {
  const location = useLocation();
  const { user: hostUser, isAuthenticated: hostIsAuthenticated, isLoading: hostIsLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main-app');
  const [navigationScreen, setNavigationScreen] = useState<NavigationScreen>('dashboard');
  // Sync URL pathname → navigation state (do not depend on navigationScreen to avoid races)
  useEffect(() => {
    const targetScreen = screenFromPathname(location.pathname);
    if (targetScreen) {
      setNavigationScreen(targetScreen);
      setCurrentScreen('main-app');
    }
  }, [location.pathname]);
  // Wrapper function to log navigation changes and update URL
  const handleNavigation = useCallback((screen: NavigationScreen) => {
    trackEvent('landlord_nav_click', { section: screen });
    setCurrentScreen('main-app');
    setNavigationScreen(screen);

    const path = SCREEN_TO_PATH[screen] || '/dashboard';

    if (isEmbeddedInParent()) {
      try {
        const base = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, '', `${base}#${path}`);
      } catch { /* ignore */ }
      return;
    }

    const targetUrl = `/landlord${path === '/' ? '' : path}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
      // Notify React Router. pushState alone leaves the router on /landlord,
      // so the pathname effect snaps every section back to the dashboard.
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('landlord');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [portfolioRefreshKey, setPortfolioRefreshKey] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [clientDetailsTab, setClientDetailsTab] = useState('overview');
  const editingTenantRef = React.useRef<Tenant | null>(null);
  /** Email typed in TenantSelection — forwarded to AddTenant / InviteTenant as prefill */
  const prefillEmailRef = React.useRef<string | undefined>(undefined);
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  /** IDs returned from a completed bulk property import — passed to the enrichment queue */
  const importedPropertyIdsRef = React.useRef<string[]>([]);
  /** Where the enrichment queue was launched from: 'import' (post-CSV) or 'direct' (Properties page button) */
  const enrichmentSourceRef = React.useRef<'import' | 'direct'>('direct');
  /** Vault documents (no property) — loaded lazily when Documents screen is first opened */
  const [unassignedDocuments, setUnassignedDocuments] = React.useState<LandlordDocument[]>([]);
  const unassignedLoadedRef = React.useRef(false);
  /** When true, DocumentsPage will auto-open its upload modal on next mount */
  const [openDocsUploadOnMount, setOpenDocsUploadOnMount] = React.useState(false);
  const [openDocsDocumentId, setOpenDocsDocumentId] = React.useState<string | undefined>(undefined);

  // Fetch unassigned vault documents once the user opens the Documents tab
  const loadUnassignedDocuments = React.useCallback(async () => {
    if (unassignedLoadedRef.current) return;
    try {
      const docs = await documentService.getUnassignedDocuments();
      setUnassignedDocuments(docs);
      unassignedLoadedRef.current = true;
    } catch (err) {
      console.warn('[App] Failed to fetch unassigned docs:', err);
    }
  }, []);

  const clearSignInQueryParam = useCallback(() => {
    try {
      const currentUrl = new URL(window.location.href);
      if (!currentUrl.searchParams.has('signin')) return;
      currentUrl.searchParams.delete('signin');
      window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    } catch (error) {
      console.warn('Failed to clear signin query param:', error);
    }
  }, []);

  const getCachedAuthUser = useCallback((): { name?: string; email?: string; phone?: string; isAuthenticated: boolean } | null => {
    // P1-5: Use shared AuthContext (hostUser) — never read from stale localStorage cache
    if (hostIsAuthenticated && hostUser) {
      return {
        name: hostUser.name || '',
        email: hostUser.email || '',
        phone: hostUser.phone || '',
        isAuthenticated: true,
      };
    }
    return null;
  }, [hostIsAuthenticated, hostUser]);

  const resolveManagerId = useCallback((): string | null => {
    // P1-5: hostUser is the authoritative source — no localStorage fallbacks
    if (hostUser?.id) return hostUser.id;
    if (userProfile && (userProfile as any).id) return (userProfile as any).id;
    return null;
  }, [hostUser, userProfile]);

  // Tenant list for non-ClientsPage consumers (Dashboard, PropertyDetails, etc.)
  // ClientsPage has its own useTenants instance — these are intentionally separate.
  // appPropertyIds via useMemo so the ref inside useTenants stays stable.
  const appUserId = resolveManagerId();
  const appPropertyIds = React.useMemo(() => properties.map(p => p.id), [properties]);
  const { tenants, invalidate: invalidateTenants } = useTenants({ userId: appUserId, propertyIds: appPropertyIds });

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

  const updatePropertySetupData = useCallback((updates: Partial<PropertySetupData>) => {
    setPropertySetupData(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePropertyDetails = useCallback((updates: Partial<PropertySetupData['propertyDetails']>) => {
    setPropertySetupData(prev => ({
      ...prev,
      propertyDetails: { ...prev.propertyDetails, ...updates }
    }));
  }, []);

  // Sync with host authentication context
  React.useEffect(() => {
    setIsAuthLoading(hostIsLoading);
    setIsAuthenticated(hostIsAuthenticated);

    // Signal authReady so token acquisition in API calls unblocks immediately
    // when the host app resolves auth — without this the landlord app's API
    // calls hang for the full 5 s timeout on every request.
    if (hostIsAuthenticated && !hostIsLoading) {
      import('../../services/authReady').then(({ notifyAuthReady }) => {
        notifyAuthReady();
      }).catch(() => {});
    }

    // While host auth is still resolving, do not wipe portfolio state or force
    // loading off — that caused a skeleton → empty flash on first paint.
    if (hostIsLoading) {
      return;
    }

    if (hostIsAuthenticated && hostUser) {
      if (hostUser.roles?.includes('agent')) {
        setUserRole('agent');
      } else if (hostUser.roles?.includes('landlord')) {
        setUserRole('landlord');
      }

      const agentPersona = isAgentTestAccount(hostUser.id, hostUser.email);
      const nextName =
        hostUser.name ||
        `${hostUser.givenName || ''} ${hostUser.familyName || ''}`.trim() ||
        (hostUser.roles?.includes('agent') ? 'Agent' : 'Landlord');
      const nextPhone = hostUser.phone || '';

      setUserProfile((prev) => {
        const nextCompany = agentPersona
          ? AGENT_TEST_COMPANY
          : prev?.companyName || 'Proptii';
        const nextProfile = agentPersona
          ? AGENT_TEST_COMPANY_PROFILE
          : prev?.companyProfile;

        if (
          prev &&
          (prev as any).id === hostUser.id &&
          prev.email === hostUser.email &&
          prev.name === nextName &&
          (prev.phone || '') === nextPhone &&
          (prev.companyName || '') === nextCompany
        ) {
          return prev;
        }
        return {
          id: hostUser.id,
          name: nextName,
          email: hostUser.email,
          phone: nextPhone,
          companyProfile: nextProfile,
          companyName: nextCompany,
          logo: prev?.logo,
        } as any;
      });

      if (agentPersona) {
        setProperties((prev) =>
          prev.length === 0
            ? getAgentDummyProperties()
            : mergeAgentDemoProperties(getAgentDummyProperties(), prev),
        );
        setIsPortfolioLoading(false);
      }
    } else {
      setUserProfile(null);
      setProperties([]);
      setVacancyAlerts([]);
      setArrearsAlerts([]);
      setAlerts([]);
      setMarketInsights([]);
      setIsPortfolioLoading(false);
    }

    // Authentication state changes are now handled by the parent SPA bridging (AUTH_STATE message listener below)
  }, [hostIsAuthenticated, hostIsLoading, hostUser, clearSignInQueryParam, getCachedAuthUser]);

  // Listen for AUTH_STATE and NAVIGATE messages from the embedding tenant app (bridge)
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data: any = (event as any).data;

      // AUTH_STATE messages are no longer needed — auth is synced directly
      // from the shared AuthContext (hostUser). This branch is kept only to
      // avoid breaking any legacy callers that still send the message.
      if (data && data.type === 'AUTH_STATE') {
        // No-op: The useEffect above already syncs from hostUser / hostIsAuthenticated.
        // Do NOT write to localStorage here as it causes stale-cache race conditions.
        setIsAuthLoading(false);
        return;
      }
      
      // Handle NAVIGATE messages
      if (data && data.type === 'NAVIGATE' && data.payload) {
        const { path } = data.payload;
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const targetScreen = PATH_TO_NAV_SCREEN[normalizedPath] || 'dashboard';
        setCurrentScreen('main-app');
        setNavigationScreen(targetScreen);
      }
    };

    window.addEventListener('message', handleMessage);

    // Stop loading spinner after 2 s maximum even if no auth event fires
    const timer = setTimeout(() => { setIsAuthLoading(false); }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [clearSignInQueryParam]);

  // Check localStorage for role selection (from AgentHome)
  React.useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'agent') {
      setUserRole('agent');
      // Clear the stored role after using it
      localStorage.removeItem('userRole');
    }
  }, []);

  // Handle URL hash navigation (from iframe src hash on initial load)
  React.useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const normalizedPath = hash.startsWith('/') ? hash : `/${hash}`;
      const targetScreen = PATH_TO_NAV_SCREEN[normalizedPath];
      if (!targetScreen) return;

      setCurrentScreen('main-app');
      setNavigationScreen(targetScreen);
    };
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, []);

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
      if (qpStart === 'add-tenant') {
        setCurrentScreen('add-tenant');
        return;
      }
      if (qpStart === 'contracts') {
        setCurrentScreen('main-app');
        setNavigationScreen('contracts');
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

  // Restore current screen from sessionStorage on mount (survives page reload)
  // Skip restore when deep-linked from onboarding (start= query param) so Add Property flows correctly
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('start')) return; // Deep link takes priority
      const savedScreen = sessionStorage.getItem('proptii_current_screen') as Screen | null;
      const savedPreviousScreen = sessionStorage.getItem('proptii_previous_screen') as Screen | null;
      if (savedScreen && savedScreen !== 'main-app' && savedScreen !== 'welcome') {
        console.log('🔄 Restoring screen from sessionStorage:', savedScreen);
        setCurrentScreen(savedScreen);
        if (savedPreviousScreen) setPreviousScreen(savedPreviousScreen);
      }
    } catch (e) {
      console.warn('Failed to restore screen from sessionStorage:', e);
    }
  }, []);

  // Persist previousScreen to sessionStorage whenever it changes
  React.useEffect(() => {
    try {
      if (previousScreen) {
        sessionStorage.setItem('proptii_previous_screen', previousScreen);
      } else {
        sessionStorage.removeItem('proptii_previous_screen');
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [previousScreen]);

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

  // Helper to upload a file to backend storage endpoint with signed download tokens
  const uploadToBackendStorage = async (file: File | Blob, folder: string, filename?: string): Promise<string> => {
    const apiBase = getResolvedApiBaseUrl();
    const formData = new FormData();
    formData.append('file', file, filename || (file as File).name || 'file');
    formData.append('folder', folder);

    const token = await getAccessTokenForApiRequest().catch(() => null);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}/storage/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Upload failed (${response.status}): ${errText}`);
    }

    const result = await response.json();
    if (!result?.url) {
      throw new Error('Upload succeeded but no download URL returned');
    }
    return result.url;
  };

  // Upload images to Cloud Storage via the v2-backend storage endpoint.
  // No client-side Firebase SDK fallback — if the backend is unavailable the
  // error surfaces immediately rather than bypassing auth/ownership checks.
  const uploadPropertyImages = async (imageFiles: File[]): Promise<PropertyPhoto[]> => {
    if (imageFiles.length === 0) return [];

    const photoPromises = imageFiles.map(async (file, index) => {
      const timestamp = Date.now();
      let processedFile = file;
      if (file.type.startsWith('image/') && file.size > 500 * 1024) {
        processedFile = await compressImage(file, 150);
      }

      try {
        const downloadUrl = await uploadToBackendStorage(processedFile, 'properties/photos', file.name);
        console.log(`✅ Uploaded image ${index + 1}/${imageFiles.length}: ${downloadUrl}`);
        return {
          id: `photo-${timestamp}-${index}`,
          url: downloadUrl,
          filename: file.name,
          isCover: index === 0,
          room: index === 0 ? 'Exterior' : undefined
        };
      } catch (err) {
        console.error(`❌ Backend storage upload failed for image ${file.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(photoPromises);
    const validPhotos = results.filter((p): p is PropertyPhoto => p !== null && Boolean(p.url) && !p.url.startsWith('blob:'));
    console.log(`✅ ${validPhotos.length}/${imageFiles.length} images processed successfully`);
    return validPhotos;
  };

  const uploadPropertyDocuments = async (documentFiles: File[]): Promise<PropertyDocument[]> => {
    if (documentFiles.length === 0) return [];

    console.log(`Uploading ${documentFiles.length} documents...`);
    const documentPromises = documentFiles.map(async (file, index) => {
      const timestamp = Date.now();

      try {
        const downloadUrl = await uploadToBackendStorage(file, 'properties/documents', file.name);
        console.log(`✅ Uploaded document ${index + 1}/${documentFiles.length}: ${file.name}`);
        return {
          id: `doc-${timestamp}-${index}`,
          name: file.name,
          type: 'other',
          url: downloadUrl,
          issueDate: new Date(),
          status: 'valid'
        } as PropertyDocument;
      } catch (err) {
        console.error(`❌ Backend storage upload failed for document ${file.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(documentPromises);
    const validDocs = results.filter((d): d is PropertyDocument => d !== null && Boolean(d.url) && !d.url.startsWith('blob:'));
    console.log(`✅ ${validDocs.length}/${documentFiles.length} documents processed successfully`);
    return validDocs;
  };

  // Convert property setup data to Property object
  const createPropertyFromSetupData = (): Property => {
    const { propertyType, propertyDetails, amenities, images, additionalNotes, pendingTenants } = propertySetupData;

    // Convert images to PropertyPhoto format — allow blob: preview URLs so the
    // preview screen (screen 2) can display the images before they are uploaded.
    const photos: PropertyPhoto[] = images
      .filter((imageUrl) => !!imageUrl)
      .map((imageUrl, index) => ({
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

  // Initialize with empty arrays (mock data removed, using Firestore)
  React.useEffect(() => {
    console.log('🚫 Using Firestore data scoped to user');
    console.log('📊 Market insights will be loaded from Firestore');
    console.log('🚫 Alerts will be loaded from Firestore');
    setVacancyAlerts([]);
    setArrearsAlerts([]);
    setAlerts([]);
  }, []);

  const navigateToScreen = (screen: Screen) => {
    setIsTransitioning(true);
    trackEvent('landlord_screen_navigation', { screen, from_screen: currentScreen });
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);

      // Persist current screen to sessionStorage (survives reload within same tab)
      try {
        sessionStorage.setItem('proptii_current_screen', screen);
      } catch (e) {
        // Ignore storage errors
      }

      // Clear selected property when navigating back to main app
      if (screen === 'main-app') {
        setSelectedProperty(null);
        try {
          sessionStorage.removeItem('proptii_selected_property_id');
        } catch (e) {}
      }
    }, 2); // Half of the transition duration
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    setCurrentScreen('main-app');
    setNavigationScreen('dashboard');
  };

  // Load properties from Firebase when the signed-in identity is known.
  React.useEffect(() => {
    let cancelled = false;

    const loadProperties = async () => {
      const currentUserId = resolveManagerId();
      const userEmail = userProfile?.email;

      if (!currentUserId && !userEmail) {
        if (!hostIsAuthenticated && !hostIsLoading) {
          setIsPortfolioLoading(false);
        }
        return;
      }

      // Only show the full-page skeleton when we have nothing to display yet.
      if (properties.length === 0 && !isAgentTestAccount(currentUserId, userEmail)) {
        setIsPortfolioLoading(true);
      }

      try {
        const fetchedProperties = await propertyService.getProperties({
          ...(currentUserId ? { userId: currentUserId } : {}),
          ...(userEmail ? { email: userEmail } : {}),
        });
        if (!cancelled) {
          setProperties(
            isAgentTestAccount(currentUserId, userEmail)
              ? mergeAgentDemoProperties(getAgentDummyProperties(), fetchedProperties)
              : fetchedProperties
          );
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        if (!cancelled) {
          setProperties(
            isAgentTestAccount(currentUserId, userEmail)
              ? getAgentDummyProperties()
              : []
          );
        }
      } finally {
        if (!cancelled) {
          setIsPortfolioLoading(false);
        }
      }
    };

    loadProperties();
    return () => { cancelled = true; };
  }, [
    hostIsAuthenticated,
    hostIsLoading,
    hostUser?.id,
    userProfile?.email,
    resolveManagerId,
    portfolioRefreshKey,
  ]);

  // Load unassigned vault documents when the user navigates to the documents screen
  React.useEffect(() => {
    if (navigationScreen === 'documents' || navigationScreen === 'dashboard') {
      loadUnassignedDocuments();
    }
  }, [navigationScreen, loadUnassignedDocuments]);

  // Helper function to get current user ID — delegates to resolveManagerId
  const getCurrentUserId = (): string | null => resolveManagerId();

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
    const unsubscribes: (() => void)[] = [];

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

    // Initial alert generation only — no polling interval
    alertService.generateAlerts(currentUserId)
      .then(() => alertService.getActiveAlerts(currentUserId))
      .then(processAlerts)
      .catch(console.error);

    // Cleanup
    return () => {
      if (shouldLogRealtimeDebug) {
        console.log('🧹 Cleaning up alert timers');
      }
      if (alertGenerationTimeout) {
        clearTimeout(alertGenerationTimeout);
      }
    };
  }, [hostUser?.id]); // hostUser.id is the stable auth signal

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
  }, [hostUser?.id]); // was [userProfile] — hostUser.id is the stable signal for when auth is ready

  const addProperty = async (property: Omit<Property, 'id' | 'createdAt'>) => {
    // Strip any accidental id/createdAt fields before saving (define outside try-catch for scope)
    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...safeProperty } = property as any;

    try {
      // Save to Firebase (scoped) - use same extraction logic as loading
      const currentUserId = resolveManagerId() ?? userProfile?.email ?? '';

      console.log('📝 About to create property with userId:', currentUserId);
      // Get owner email from userProfile for storing in property document
      const ownerEmail = userProfile?.email || hostUser?.email;
      const propertyId = await propertyService.createProperty(safeProperty, currentUserId, ownerEmail, userRole);

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
        throw new Error('Failed to retrieve created property from database');
      }
    } catch (error) {
      console.error('Error adding property to database:', error);
      // Do NOT fall back to fake local state or IDs. Ensure error is propagated.
      throw error;
    }
  };

  const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
    try {
      // Update in Firebase (exclude id, createdAt, tenant from updates, but include photos/documents if present)
      const { id, createdAt, tenant, ...firebaseUpdates } = updates as any;

      // Clean photos array if present - remove undefined values (Firestore doesn't accept undefined)
      if (firebaseUpdates.photos) {
        firebaseUpdates.photos = firebaseUpdates.photos.map((photo: any) => {
          const cleanPhoto: any = {
            id: photo.id,
            url: photo.url,
            filename: photo.filename,
            isCover: photo.isCover
          };
          // Only include room if it's defined
          if (photo.room) {
            cleanPhoto.room = photo.room;
          }
          return cleanPhoto;
        });
        console.log('Updating property with photos:', firebaseUpdates.photos.length);
      }

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
      console.error('Error updating property in database:', error);
      throw error;
    }
  };

  const selectProperty = (property: Property) => {
    try {
      if (property?.id) {
        sessionStorage.setItem('proptii_selected_property_id', property.id);
      }
    } catch (e) {
      console.warn('Failed to save selected property ID:', e);
    }
    const tenantForProperty = tenants.find(t => t.propertyId === property.id || t.id === (property as any).tenantId);
    const enriched: Property = tenantForProperty
      ? { ...property, tenant: tenantForProperty, status: 'occupied' as any }
      : property;
    setSelectedProperty(enriched);
  };

  // Re-hydrate selectedProperty on refresh or properties load
  React.useEffect(() => {
    if (selectedProperty) return;
    try {
      const savedPropertyId = sessionStorage.getItem('proptii_selected_property_id') || new URLSearchParams(window.location.search).get('propertyId');
      if (savedPropertyId && properties.length > 0) {
        const found = properties.find(p => p.id === savedPropertyId);
        if (found) {
          console.log('🔄 Restoring selectedProperty from storage:', found.id);
          selectProperty(found);
        }
      }
    } catch (e) {
      console.warn('Failed to restore selectedProperty:', e);
    }
  }, [properties, tenants, selectedProperty, currentScreen]);

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

  const addTenant = async (tenant: Omit<Tenant, 'id'>): Promise<string> => {
    const currentUserId = resolveManagerId() ?? userProfile?.email ?? '';
    if (!currentUserId) throw new Error('Not authenticated');

    const tenantToCreate = {
      ...tenant,
      userId: currentUserId,
      status: tenant.status || 'active',
    };

    // POST to backend — throws on failure so success screen is never shown
    const id = await tenantService.createTenant(tenantToCreate, currentUserId);
    const savedTenant = { ...tenantToCreate, id } as Tenant;

    // The properties list reads tenant name and occupancy from this state.
    if (tenant.propertyId) {
      const occupy = (property: Property): Property =>
        property.id === tenant.propertyId
          ? { ...property, status: 'occupied', tenantId: id, tenant: savedTenant }
          : property;

      setProperties(prev => prev.map(occupy));
      setSelectedProperty(prev => (prev ? occupy(prev) : prev));

      propertyService.updateProperty(tenant.propertyId, {
        status: 'occupied',
        tenantId: id,
      }).catch(e => console.warn('Failed to mark property occupied:', e));
    }

    invalidateTenants();

    // Regenerate alerts after new tenant (best-effort)
    alertService.generateAlerts(currentUserId).catch(e =>
      console.warn('Failed to generate alerts after tenant creation:', e)
    );

    return id;
  };

  // addLandlord is handled entirely within AddLandlordWizard via landlordService.createLandlord()
  // The ClientsPage reloads landlords via useLandlords() on every mount.

  const deleteProperty = async (property: Property) => {
    try {
      await propertyService.deleteProperty(property.id);
      setProperties(prev => prev.filter(p => p.id !== property.id));
      if (selectedProperty?.id === property.id) {
        setSelectedProperty(null);
      }
      toast.success('Property successfully deleted!');
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error(`Failed to delete property: ${(error as any)?.message || 'Unknown error'}`);
    }
  };

  const archiveProperty = async (property: Property) => {
    try {
      await propertyService.updateProperty(property.id, { status: 'under-renovation' } as any);
      setProperties(prev =>
        prev.map(p => p.id === property.id ? { ...p, status: 'under-renovation' as any } : p)
      );
      if (selectedProperty?.id === property.id) {
        setSelectedProperty(prev => prev ? { ...prev, status: 'under-renovation' as any } : null);
      }
      console.log('Archived property:', property.id);
    } catch (error) {
      console.error('Failed to archive property:', error);
      alert(`Failed to archive property: ${(error as any)?.message || 'Unknown error'}`);
    }
  };

  const duplicateProperty = async (property: Property) => {
    try {
      const currentUserId = resolveManagerId() ?? userProfile?.email ?? '';
      const { id: _id, createdAt: _createdAt, ...rest } = property;
      const duplicateData = {
        ...rest,
        address: `${property.address} (Copy)`,
        status: 'vacant' as const,
        tenantId: undefined,
      };
      const newId = await propertyService.createProperty(duplicateData as any, currentUserId, userProfile?.email, userRole);
      const created = await propertyService.getProperty(newId);
      if (created) {
        setProperties(prev => [...prev, created]);
      }
      console.log('Duplicated property, new id:', newId);
    } catch (error) {
      console.error('Failed to duplicate property:', error);
      alert(`Failed to duplicate property: ${(error as any)?.message || 'Unknown error'}`);
    }
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

      case 'csv': {
        const csvHeaders = 'Address,Type,Bedrooms,Bathrooms,Rent (£/mo),Status,Amenities,Notes,Created Date\n';
        const csvData = propertiesToExport.map(property => {
          const amenities = property.amenities.join('; ');
          const notes = (property.notes || '').replace(/,/g, ';').replace(/\n/g, ' ').replace(/"/g, '""');
          const createdDate = property.createdAt instanceof Date ? property.createdAt.toLocaleDateString('en-GB') : new Date(property.createdAt).toLocaleDateString('en-GB');
          return [property.address, property.type, property.bedrooms, (property as any).bathrooms ?? '', property.rent, property.status, amenities, notes, createdDate]
            .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(',');
        }).join('\n');
        const csvBlob = new Blob(['\uFEFF' + csvHeaders + csvData], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `properties-export-${timestamp}.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
        break;
      }

      case 'excel': {
        // Tab-separated CSV with .xlsx extension — opens correctly in Excel without needing a library
        const excelHeaders = 'Address\tType\tBedrooms\tBathrooms\tRent (£/mo)\tStatus\tAmenities\tNotes\tCreated Date\r\n';
        const excelData = propertiesToExport.map(property => {
          const amenities = property.amenities.join('; ');
          const notes = (property.notes || '').replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/"/g, '""');
          const createdDate = property.createdAt instanceof Date ? property.createdAt.toLocaleDateString('en-GB') : new Date(property.createdAt).toLocaleDateString('en-GB');
          return [property.address, property.type, property.bedrooms, (property as any).bathrooms ?? '', property.rent, property.status, amenities, notes, createdDate]
            .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join('\t');
        }).join('\r\n');
        const excelBlob = new Blob(['\uFEFF' + excelHeaders + excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const excelUrl = URL.createObjectURL(excelBlob);
        const excelLink = document.createElement('a');
        excelLink.href = excelUrl;
        excelLink.download = `properties-export-${timestamp}.xlsx`;
        document.body.appendChild(excelLink);
        excelLink.click();
        document.body.removeChild(excelLink);
        URL.revokeObjectURL(excelUrl);
        break;
      }

      case 'pdf': {
        // Build an HTML page and open it in a new tab so the browser's built-in Print → Save as PDF works
        const rows = propertiesToExport.map((property, index) => {
          const amenities = property.amenities.join(', ') || '—';
          const notes = property.notes || '—';
          const createdDate = property.createdAt instanceof Date ? property.createdAt.toLocaleDateString('en-GB') : new Date(property.createdAt).toLocaleDateString('en-GB');
          const rent = `£${property.rent.toLocaleString()}/mo`;
          return `<tr>
            <td>${index + 1}</td>
            <td>${property.address}</td>
            <td>${property.type}</td>
            <td>${property.bedrooms}</td>
            <td>${rent}</td>
            <td>${property.status}</td>
            <td>${amenities}</td>
            <td>${notes}</td>
            <td>${createdDate}</td>
          </tr>`;
        }).join('');

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Properties Export — ${timestamp}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #333; }
            h2 { color: #136C9E; margin-bottom: 4px; }
            p { color: #666; margin-top: 0; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #136C9E; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
            td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
            tr:nth-child(even) td { background: #f9fafb; }
            @media print { button { display: none; } }
          </style></head><body>
          <h2>Properties Export</h2>
          <p>Generated: ${new Date().toLocaleString('en-GB')} &nbsp;|&nbsp; Total: ${propertiesToExport.length} propert${propertiesToExport.length === 1 ? 'y' : 'ies'}</p>
          <button onclick="window.print()" style="margin-bottom:12px;padding:6px 14px;background:#DC5F12;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Print / Save as PDF</button>
          <table>
            <thead><tr><th>#</th><th>Address</th><th>Type</th><th>Beds</th><th>Rent</th><th>Status</th><th>Amenities</th><th>Notes</th><th>Created</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></body></html>`;

        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
        } else {
          // Fallback: download as HTML if popup is blocked
          const pdfBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const pdfLink = document.createElement('a');
          pdfLink.href = pdfUrl;
          pdfLink.download = `properties-export-${timestamp}.html`;
          document.body.appendChild(pdfLink);
          pdfLink.click();
          document.body.removeChild(pdfLink);
          URL.revokeObjectURL(pdfUrl);
        }
        break;
      }

      default:
        console.error('Unsupported export format:', format);
    }
  };

  const importProperties = async (importedProperties: Property[]) => {
    const currentUserId = resolveManagerId() ?? userProfile?.email ?? '';
    const created: Property[] = [];
    const failed: string[] = [];

    for (const prop of importedProperties) {
      try {
        const { id: _id, createdAt: _ca, ...rest } = prop;
        const newId = await propertyService.createProperty(rest as any, currentUserId, userProfile?.email, userRole);
        const saved = await propertyService.getProperty(newId);
        if (saved) created.push(saved);
      } catch (err) {
        console.error('Failed to import property:', prop.address, err);
        failed.push(prop.address);
      }
    }

    if (created.length > 0) {
      setProperties(prev => [...prev, ...created]);
    }

    if (failed.length > 0) {
      alert(`${created.length} propert${created.length === 1 ? 'y' : 'ies'} imported. ${failed.length} failed: ${failed.join(', ')}`);
    } else {
      console.log(`✅ Imported ${created.length} properties`);
    }
  };

  const renderMainAppScreen = () => {
    switch (navigationScreen) {
      case 'dashboard':
        return (
          <Dashboard
            properties={properties}
            unassignedDocuments={unassignedDocuments}
            tenants={tenants}
            userProfile={userProfile}
            isAuthenticated={isAuthenticated}
            isPortfolioLoading={isPortfolioLoading}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onViewProperty={(property) => {
              trackEvent('landlord_property_viewed', { property_address: property.address });
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
            onViewInsights={() => handleNavigation('insights')}
            onRefresh={() => setPortfolioRefreshKey((key) => key + 1)}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onViewAllProperties={() => handleNavigation('properties')}
            onViewViewings={() => handleNavigation('viewings')}
            onViewClients={() => handleNavigation('clients')}
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
            onViewDocuments={(documentId) => {
              if (documentId) {
                setOpenDocsDocumentId(documentId);
                setOpenDocsUploadOnMount(false);
              } else {
                setOpenDocsUploadOnMount(true);
                setOpenDocsDocumentId(undefined);
              }
              loadUnassignedDocuments();
              handleNavigation('documents');
            }}
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
            isPortfolioLoading={isPortfolioLoading}
            onViewInsights={() => handleNavigation('insights')}
            onRefresh={() => setPortfolioRefreshKey((key) => key + 1)}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onViewProperty={(property) => {
              trackEvent('landlord_property_viewed', { property_address: property.address });
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
              setClientDetailsTab('overview');
              navigateToScreen('tenant-details');
            }}
            onDeleteProperty={deleteProperty}
            onArchiveProperty={archiveProperty}
            onDuplicateProperty={duplicateProperty}
            onExportProperties={exportProperties}
            onImportProperties={importProperties}
            onBulkImportProperties={() => navigateToScreen('bulk-import-property')}
            onBulkAssignTenants={() => navigateToScreen('bulk-assign')}
            onEnrichProperties={() => {
              // Standalone enrichment — show all properties
              importedPropertyIdsRef.current = properties.map(p => p.id);
              enrichmentSourceRef.current = 'direct';
              navigateToScreen('property-enrichment-queue');
            }}
            userProfile={userProfile}
          />
        );

      case 'documents':
        return (
          <DocumentsPage
            properties={properties}
            unassignedDocuments={unassignedDocuments}
            openUploadOnMount={openDocsUploadOnMount}
            openDocumentId={openDocsDocumentId}
            onUploadModalOpened={() => {
              // Reset both flags after DocumentsPage has consumed them
              setOpenDocsUploadOnMount(false);
              setOpenDocsDocumentId(undefined);
            }}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onViewProperty={(property) => {
              trackEvent('landlord_property_viewed', { property_address: property.address });
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onManageDocuments={(property) => {
              selectProperty(property);
              navigateToScreen('document-management');
            }}
            onAddDocumentToProperty={async (propertyId, doc) => {
              addDocumentToProperty(propertyId, doc);
              try {
                await propertyService.addDocumentToProperty(propertyId, doc);
              } catch (err) {
                console.warn('Could not sync to propertyService:', err);
              }
            }}
            onVaultDocumentAdded={(doc) => {
              setUnassignedDocuments(prev => [doc, ...prev]);
            }}
            onUploadToVault={() => {
              // Now handled in-place by DocumentsPage modal
            }}
            onAssignDocument={async (documentId, propertyId) => {
              try {
                await documentService.assignToProperty(documentId, propertyId);
                const updatedUnassigned = await documentService.getUnassignedDocuments();
                setUnassignedDocuments(updatedUnassigned);
                if (propertyId) {
                  const updatedProp = await propertyService.getProperty(propertyId);
                  if (updatedProp) {
                    setProperties(prev => prev.map(p => p.id === propertyId ? updatedProp : p));
                  }
                }
              } catch (error) {
                console.error('Error assigning document to property:', error);
                alert('Failed to assign document to property. Please try again.');
              }
            }}
            onDeleteDocuments={async (documentIds) => {
              try {
                // Delete from landlord_documents vault collection unconditionally
                for (const id of documentIds) {
                  try {
                    await documentService.deleteDocument(id);
                  } catch (e) {
                    console.warn('Doc deletion from landlord_documents (may be property-only):', id, e);
                  }
                }
                setUnassignedDocuments(prev => prev.filter(u => !documentIds.includes(u.id)));

                // Group documents by property
                const documentsByProperty = new Map<string, string[]>();

                properties.forEach(property => {
                  (property.documents || []).forEach(doc => {
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
                  const updatedDocuments = (property.documents || []).filter(doc => !docIdsToDelete.includes(doc.id));

                  // Update property
                  await propertyService.updateProperty(propertyId, {
                    documents: updatedDocuments.map(doc => ({
                      id: doc.id,
                      name: doc.name,
                      type: doc.type,
                      url: doc.url,
                      issueDate: doc.issueDate instanceof Date ? doc.issueDate.toISOString() : doc.issueDate,
                      expiryDate: doc.expiryDate instanceof Date ? doc.expiryDate.toISOString() : (doc.expiryDate ?? null),
                      status: doc.status
                    })) as any
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

                  await propertyService.updateProperty(propertyId, {
                    documents: updatedDocuments.map(doc => ({
                      id: doc.id,
                      name: doc.name,
                      type: doc.type,
                      url: doc.url,
                      issueDate: doc.issueDate instanceof Date ? doc.issueDate.toISOString() : doc.issueDate,
                      expiryDate: doc.expiryDate instanceof Date ? doc.expiryDate.toISOString() : (doc.expiryDate ?? undefined),
                      status: doc.status,
                      archived: (doc as any).archived || false
                    })) as any
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
            onRefresh={() => setPortfolioRefreshKey((key) => key + 1)}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            userProfile={userProfile}
          />
        );

      case 'viewings':
        return (
          <ViewingsPage
            managerId={userProfile ? resolveManagerId() : null}
            managerName={userProfile?.name}
            managerEmail={userProfile?.email}
            userProfile={userProfile}
            properties={properties}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onRefresh={() => setPortfolioRefreshKey((key) => key + 1)}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onViewInsights={() => handleNavigation('insights')}
          />
        );

      case 'contracts':
        return (
          <ContractsPage
            tenants={tenants}
            userProfile={userProfile}
            properties={properties}
            onViewInsights={() => handleNavigation('insights')}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onBack={() => setNavigationScreen('dashboard')}
          />
        );

      case 'clients':
        return (
          <ClientsPage
            userId={resolveManagerId()}
            propertyIds={properties.map(p => p.id)}
            properties={properties}
            arrearsAlerts={arrearsAlerts}
            userRole={userRole}
            onViewInsights={() => handleNavigation('insights')}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onViewTenant={(tenant, options) => {
              selectTenant(tenant);
              setClientDetailsTab(options?.tab || 'overview');
              navigateToScreen('tenant-details');
            }}
            onViewProperty={(property) => {
              trackEvent('landlord_property_viewed', { property_address: property.address });
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onAddTenant={() => {
              trackEvent('landlord_add_tenant_clicked', { source: 'clients_page' });
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
                const tenantToDelete = selectedTenant?.id === tenantId ? selectedTenant : null;
                const propertyId = tenantToDelete?.propertyId;
                await tenantService.deleteTenant(tenantId);
                if (propertyId) {
                  propertyService.updateProperty(propertyId, { status: 'vacant', tenantId: undefined as any })
                    .catch(e => console.warn('Failed to vacate property:', e));
                }
              } catch (e) {
                console.error('Failed to delete tenant:', e);
              }
              // useTenants in ClientsPage will re-fetch via invalidate() called inside ClientsPage
            }}
            onArchiveTenant={async (tenantId) => {
              try {
                await tenantService.updateTenant(tenantId, { status: 'ended' });
              } catch (err) {
                console.error('Failed to archive tenant:', err);
                alert('Failed to archive tenant. Please try again.');
              }
            }}
            onExportTenants={(format) => {
              const timestamp = new Date().toISOString().split('T')[0];
              const toExport = tenants;

              if (format === 'json') {
                const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `tenants-export-${timestamp}.json`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else if (format === 'csv' || format === 'excel') {
                const sep = format === 'excel' ? '\t' : ',';
                const q = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                const headers = ['Name', 'Email', 'Phone', 'Property', 'Rent (£/mo)', 'Lease Start', 'Lease End', 'Status', 'Payment Status'];
                const rows = toExport.map(t => [
                  t.name, t.email, t.phone, t.propertyAddress,
                  t.rentAmount,
                  t.leaseStart instanceof Date ? t.leaseStart.toLocaleDateString('en-GB') : new Date(t.leaseStart as any).toLocaleDateString('en-GB'),
                  t.leaseEnd instanceof Date ? t.leaseEnd.toLocaleDateString('en-GB') : new Date(t.leaseEnd as any).toLocaleDateString('en-GB'),
                  t.status, t.paymentStatus
                ].map(v => q(v as any)).join(sep));
                const content = '\uFEFF' + [headers.map(h => q(h)).join(sep), ...rows].join('\r\n');
                const ext = format === 'excel' ? 'xlsx' : 'csv';
                const mime = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
                const blob = new Blob([content], { type: `${mime};charset=UTF-8` });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `tenants-export-${timestamp}.${ext}`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else if (format === 'pdf') {
                const rows = toExport.map((t, i) => `<tr>
                  <td>${i + 1}</td><td>${t.name}</td><td>${t.email}</td><td>${t.phone}</td>
                  <td>${t.propertyAddress}</td><td>£${t.rentAmount.toLocaleString()}</td>
                  <td>${t.status}</td><td>${t.paymentStatus}</td>
                </tr>`).join('');
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
                  <title>Tenants Export — ${timestamp}</title>
                  <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
                  h2{color:#136C9E}table{width:100%;border-collapse:collapse;margin-top:12px}
                  th{background:#136C9E;color:white;padding:6px 8px;text-align:left}
                  td{padding:5px 8px;border-bottom:1px solid #e5e7eb}
                  tr:nth-child(even) td{background:#f9fafb}
                  @media print{button{display:none}}</style></head>
                  <body><h2>Tenants Export</h2>
                  <p>Generated: ${new Date().toLocaleString('en-GB')} | Total: ${toExport.length}</p>
                  <button onclick="window.print()" style="margin-bottom:12px;padding:6px 14px;background:#DC5F12;color:white;border:none;border-radius:6px;cursor:pointer">Print / Save as PDF</button>
                  <table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Property</th><th>Rent</th><th>Status</th><th>Payment</th></tr></thead>
                  <tbody>${rows}</tbody></table></body></html>`;
                const win = window.open('', '_blank');
                if (win) { win.document.write(html); win.document.close(); }
              }
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
            userProfile={userProfile}
          />
        );

      case 'messages':
      case 'inbox':
        return (
          <TenantInbox
            userProfile={userProfile}
            onViewInsights={() => handleNavigation('insights')}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onAddTenant={() => {
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('tenant-selection');
            }}
          />
        );

      case 'insights':
        return (
          <PortfolioInsights
            properties={properties}
            userProfile={userProfile}
            isAuthenticated={isAuthenticated}
            onBack={() => setNavigationScreen('dashboard')}
            marketInsights={marketInsights}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onAddTenant={() => {
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('tenant-selection');
            }}
            onViewClients={() => handleNavigation('clients')}
            onViewProperties={() => handleNavigation('properties')}
          />
        );

      case 'settings':
        return (
          <LandlordAgentSettingsPage
            userProfile={userProfile}
            userRole={userRole}
            isAuthenticated={isAuthenticated}
          />
        );

      case 'referencing':
        return (
          <ReferencingPage
            tenants={tenants}
            userProfile={userProfile}
            onViewTenant={(tenant) => {
              selectTenant(tenant);
              setClientDetailsTab('overview');
              navigateToScreen('tenant-details');
            }}
            onOpenMessages={() => handleNavigation('messages')}
            onViewInsights={() => handleNavigation('insights')}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
          />
        );

      default:
        return (
          <Dashboard
            properties={properties}
            unassignedDocuments={unassignedDocuments}
            userProfile={userProfile}
            isAuthenticated={isAuthenticated}
            isPortfolioLoading={isPortfolioLoading}
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
            onViewProperty={(property) => {
              trackEvent('landlord_property_viewed', { property_address: property.address });
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
            onViewInsights={() => {/* navigateToScreen('portfolio-insights') */ }}
            onRefresh={() => setPortfolioRefreshKey((key) => key + 1)}
            onViewSettings={() => handleNavigation('settings')}
            onViewNotifications={() => handleNavigation('messages')}
            onViewAllProperties={() => handleNavigation('properties')}
            onViewViewings={() => handleNavigation('viewings')}
            onViewClients={() => handleNavigation('clients')}
            onViewDocuments={(documentId) => {
              if (documentId) {
                setOpenDocsDocumentId(documentId);
                setOpenDocsUploadOnMount(false);
              } else {
                setOpenDocsUploadOnMount(true);
                setOpenDocsDocumentId(undefined);
              }
              loadUnassignedDocuments();
              handleNavigation('documents');
            }}
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
            onAddProperty={() => {
              trackEvent('landlord_add_property_clicked');
              navigateToScreen('property-setup-step1');
            }}
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
            onBulkImport={!isEditing ? () => navigateToScreen('bulk-import-property') : undefined}
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
            imageFiles={propertySetupData.imageFiles}
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
        // The legacy single-page PropertySetup wizard is no longer navigated to.
        // All "Add Property" flows now use the multi-step wizard starting at
        // 'property-setup-step1'. Redirect here to avoid rendering a dead screen.
        console.warn('[App] Redirecting legacy property-setup screen to property-setup-step1');
        navigateToScreen(selectedProperty ? 'property-details' : 'property-setup-step1');
        return null;

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
      case 'tenant-details':
      case 'landlord-details': {
        if (currentScreen === 'landlord-details' && userRole !== 'agent') {
          navigateToScreen('main-app');
          setNavigationScreen('clients');
          return null;
        }
        return (
          <>
            <MainLayout
              currentScreen={navigationScreen}
              onNavigate={handleNavigation}
              userProfile={userProfile}
              userRole={userRole}
              isAuthenticated={isAuthenticated}
            >
              {renderMainAppScreen()}
            </MainLayout>
            {currentScreen === 'tenant-details' && (
              <TenantDetails
                tenant={selectedTenant}
                initialTab={clientDetailsTab}
                onBack={() => {
                  setClientDetailsTab('overview');
                  navigateToScreen('main-app');
                }}
                onEdit={(tenant) => {
                  setSelectedTenant(tenant);
                  editingTenantRef.current = tenant;
                  navigateToScreen('edit-tenant');
                }}
                onTenantUpdate={(updatedTenant) => {
                  setSelectedTenant(updatedTenant);
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
                        lastPaymentDate: updatedTenant.lastPaymentDate || new Date(),
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
            )}
            {currentScreen === 'landlord-details' && userRole === 'agent' && (
              <LandlordDetails
                landlord={selectedLandlord}
                onBack={() => navigateToScreen('main-app')}
                onEdit={(landlord) => {
                  setSelectedLandlord(landlord);
                }}
              />
            )}
          </>
        );
      }

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
                setClientDetailsTab('overview');
                navigateToScreen('tenant-details');
              }
            }}
            onAddTenant={() => {
              trackEvent('landlord_add_tenant_clicked', { source: 'property_details' });
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('tenant-selection');
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
                await propertyService.updateProperty(propertyId, {
                  status: 'vacant',
                  tenantId: null
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
            availableProperties={properties}
            userId={resolveManagerId() || ''}
            onBack={() => navigateToScreen('property-details')}
            onDocumentAdd={addDocumentToProperty}
            onDocumentDelete={async (propertyId, documentId) => {
              const prop = properties.find(p => p.id === propertyId);
              if (!prop) return;
              const updatedDocs = (prop.documents || []).filter(d => d.id !== documentId);

              // Also delete from landlord_documents if it exists there
              try {
                await documentService.deleteDocument(documentId);
              } catch {}

              await propertyService.updateProperty(propertyId, {
                documents: updatedDocs.map(d => ({
                  id: d.id, name: d.name, type: d.type, url: d.url,
                  issueDate: d.issueDate instanceof Date ? d.issueDate.toISOString() : d.issueDate,
                  expiryDate: d.expiryDate instanceof Date ? d.expiryDate.toISOString() : (d.expiryDate ?? null),
                  status: d.status,
                })) as any,
              });
              setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, documents: updatedDocs } : p));
              if (selectedProperty?.id === propertyId) {
                setSelectedProperty(prev => prev ? { ...prev, documents: updatedDocs } : null);
              }
            }}
            onVaultDocumentDeleted={(docId) => {
              setUnassignedDocuments(prev => prev.filter(d => d.id !== docId));
            }}
          />
        );

      case 'document-management-vault':
        return (
          <DocumentManagement
            property={null}
            availableProperties={properties}
            userId={resolveManagerId() || ''}
            onBack={() => {
              setNavigationScreen('documents');
              navigateToScreen('main-app');
            }}
            onDocumentAdd={addDocumentToProperty}
            onVaultDocumentAdded={(doc) => {
              setUnassignedDocuments(prev => {
                // Only keep unassigned ones (propertyId null)
                if (doc.propertyId) return prev;
                const already = prev.find(d => d.id === doc.id);
                if (already) return prev;
                return [doc, ...prev];
              });
            }}
            onVaultDocumentDeleted={(docId) => {
              setUnassignedDocuments(prev => prev.filter(d => d.id !== docId));
            }}
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
              <button onClick={() => navigateToScreen('main-app')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go Back</button>
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
                  {
                    ...a, status: workflowType === 'reminder' ? 'reminder-sent' :
                      workflowType === 'payment-plan' ? 'payment-plan' : 'legal-action'
                  } : a)
              );
              navigateToScreen('main-app');
            }}
          />
        );



      case 'property-preview':
        console.log('Rendering PropertyPreview component with setup data:', propertySetupData);
        return (
          <PropertyPreview
            property={createPropertyFromSetupData()}
            isEditing={isEditing}
            isPublishing={isPublishing}
            onBack={() => navigateToScreen('images-notes-selection')}
            onEdit={() => navigateToScreen('property-type-selection')}
            onManageDocuments={() => { }}
            onManagePhotos={() => { }}
            updateProperty={() => { }}
            onHome={() => navigateToScreen('main-app')}
            onPropertySetup={() => navigateToScreen('property-setup-step1')}
            onPublishProperty={async () => {
              // Guest user – ask them to sign up before saving to Firebase
              if (!userProfile) {
                window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: { action: 'publish' } }, '*');
                return;
              }
              
              setIsPublishing(true);
              try {
                console.log(isEditing ? '💾 Saving property changes...' : '📤 Publishing property...');
                console.log('Property setup data:', {
                  imageFilesCount: propertySetupData.imageFiles.length,
                  imagesCount: propertySetupData.images.length
                });

                // 1. Upload images to storage via the v2-backend
                let uploadedPhotos: PropertyPhoto[] = [];
                if (propertySetupData.imageFiles.length > 0) {
                  console.log(`Uploading ${propertySetupData.imageFiles.length} image(s)...`);
                  uploadedPhotos = await uploadPropertyImages(propertySetupData.imageFiles);
                  console.log('Uploaded photos:', uploadedPhotos.length);

                  // If we had files to upload but got nothing back, abort before saving
                  // a property with an empty photos array.
                  if (uploadedPhotos.length === 0) {
                    throw new Error(
                      `Image upload failed — none of the ${propertySetupData.imageFiles.length} photo(s) could be uploaded. ` +
                      `Please check your connection and try again.`
                    );
                  }
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

                // 4. Resolve photos:
                //    - blob: URLs → replace with the corresponding uploaded permanent URL
                //    - permanent URLs (on edit) → keep as-is
                let finalPhotos: PropertyPhoto[] = [];
                let uploadIdx = 0;

                for (let i = 0; i < propertySetupData.images.length; i++) {
                  const imgUrl = propertySetupData.images[i];
                  if (!imgUrl) continue;

                  if (!imgUrl.startsWith('blob:')) {
                    // Existing permanent URL (edit mode) — preserve it
                    const existing = (selectedProperty?.photos || []).find(p => p.url === imgUrl);
                    finalPhotos.push({
                      id: existing?.id || `photo-${Date.now()}-${i}`,
                      url: imgUrl,
                      filename: existing?.filename || `property-photo-${i + 1}.jpg`,
                      isCover: finalPhotos.length === 0,
                      room: existing?.room ?? (finalPhotos.length === 0 ? 'Exterior' : undefined)
                    });
                  } else {
                    // Blob URL → swap in the uploaded permanent URL
                    if (uploadIdx < uploadedPhotos.length) {
                      finalPhotos.push({
                        ...uploadedPhotos[uploadIdx],
                        isCover: finalPhotos.length === 0,
                        room: finalPhotos.length === 0 ? 'Exterior' : uploadedPhotos[uploadIdx].room
                      });
                      uploadIdx++;
                    }
                    // If upload count < blob count (partial failure), silently skip —
                    // the hard abort above already prevented a total-zero scenario.
                  }
                }

                // Append any extra uploaded photos (e.g. parallel uploads arrived out of order)
                while (uploadIdx < uploadedPhotos.length) {
                  finalPhotos.push({
                    ...uploadedPhotos[uploadIdx],
                    isCover: finalPhotos.length === 0
                  });
                  uploadIdx++;
                }

                // Last-resort guards
                if (finalPhotos.length === 0 && uploadedPhotos.length > 0) {
                  finalPhotos = uploadedPhotos;
                }
                if (finalPhotos.length === 0 && isEditing && selectedProperty?.photos) {
                  finalPhotos = selectedProperty.photos.filter(p => p.url && !p.url.startsWith('blob:'));
                }

                newProperty.photos = finalPhotos;

                // Resolve documents
                let finalDocuments: PropertyDocument[] = uploadedDocuments;
                if (isEditing && selectedProperty?.documents && selectedProperty.documents.length > 0) {
                  finalDocuments = [...selectedProperty.documents, ...uploadedDocuments];
                }
                newProperty.documents = finalDocuments;

                if (isEditing && editingPropertyId) {
                  // Fetch the original property to preserve status and other important fields
                  const originalProperty = await propertyService.getProperty(editingPropertyId);
                  const preservedStatus = originalProperty?.status || selectedProperty?.status || 'vacant';

                  // Prepare updates object with all changes, including photos and documents
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
                    photos: newProperty.photos,
                    documents: newProperty.documents,
                  };

                  // Filter out undefined values - Firestore doesn't accept undefined
                  const cleanUpdates = Object.fromEntries(
                    Object.entries(updates).filter(([_, value]) => value !== undefined)
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

                  // 4. Create property in Firebase — check for duplicate address first
                  const normAddr = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
                  const addressDuplicate = properties.find(
                    p => normAddr(p.address) === normAddr(newProperty.address)
                  );
                  if (addressDuplicate) {
                    throw new Error(
                      `A property at "${newProperty.address}" already exists in your portfolio. ` +
                      `Use Edit to update it, or change the address if this is a different property.`
                    );
                  }
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

                  // 6. Fetch created property from DB
                  const createdProperty = await propertyService.getProperty(propertyId);
                  if (!createdProperty) {
                    throw new Error('Property was created but could not be verified in the database. Please check your properties list.');
                  }

                  selectProperty(createdProperty);
                  setProperties(prev => {
                    const exists = prev.some(p => p.id === createdProperty!.id);
                    return exists ? prev.map(p => p.id === createdProperty!.id ? createdProperty! : p) : [...prev, createdProperty!];
                  });
                  navigateToScreen('property-details');
                  trackEvent('landlord_property_saved', {
                    is_edit: false,
                    property_id: propertyId
                  });
                }
              } catch (error) {
                console.error('Error publishing property:', error);
                alert(`Failed to publish property: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                setIsPublishing(false);
              }
            }}
            onAddTenant={() => {
              trackEvent('landlord_add_tenant_clicked', { source: 'property_preview' });
              setPreviousScreen('property-preview');
              navigateToScreen('tenant-selection');
            }}
          />
        );

      case 'tenant-selection':
        return (
          <TenantSelection
            existingTenants={tenants}
            properties={properties}
            onManualInput={(email) => {
              prefillEmailRef.current = email;
              editingTenantRef.current = null;
              setSelectedTenant(null);
              navigateToScreen('add-tenant');
            }}
            onInviteEmail={(email) => {
              prefillEmailRef.current = email;
              navigateToScreen('invite-tenant');
            }}
            onBulkImport={() => navigateToScreen('bulk-import-tenant')}
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
        return (
          <AddTenant
            properties={properties}
            existingTenants={tenants}
            preselectedPropertyId={selectedProperty?.id}
            prefillEmail={prefillEmailRef.current}
            userProfile={userProfile}
            onBulkImport={() => navigateToScreen('bulk-import-tenant')}
            onSave={async (tenant) => {
              if (!userProfile) {
                window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: { action: 'add-tenant' } }, '*');
                throw new Error('Authentication required');
              }
              // addTenant POSTs to backend — useTenants in ClientsPage re-fetches on navigate
              await addTenant(tenant);
              prefillEmailRef.current = undefined;
              // Increment refresh key so properties re-fetch from Firestore in the background
              // (tenant list in ClientsPage re-fetches via useTenants on next mount)
              setPortfolioRefreshKey(k => k + 1);
              // If coming from property-preview, stash tenant for preview context
              if (previousScreen === 'property-preview') {
                setPropertySetupData(prev => ({
                  ...prev,
                  pendingTenants: [...(prev.pendingTenants || []), tenant]
                }));
              }
            }}
            onBack={() => {
              prefillEmailRef.current = undefined;
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

      case 'edit-tenant': {
        const tenantToEdit = editingTenantRef.current || selectedTenant;
        if (!tenantToEdit) {
          // No tenant to edit — fall back to clients
          navigateToScreen('main-app');
          setNavigationScreen('clients');
          return null;
        }
        return (
          <EditTenant
            tenant={tenantToEdit}
            properties={properties}
            userProfile={userProfile}
            onSave={async (updates) => {
              const tenantId = tenantToEdit.id;
              await tenantService.updateTenant(tenantId, updates as any);
              // Refresh from backend to get server-canonical data
              const refreshed = await tenantService.getTenant(tenantId);
              const updated = refreshed || { ...tenantToEdit, ...updates };
              setSelectedTenant(updated as Tenant);
              editingTenantRef.current = updated as Tenant;
            }}
            onBack={() => {
              // Return to tenant details so the landlord can review changes
              navigateToScreen('tenant-details');
            }}
          />
        );
      }

      case 'invite-tenant':
        return (
          <InviteTenant
            properties={properties}
            landlordEmail={userProfile?.email}
            landlordId={getCurrentUserId() || undefined}
            prefillEmail={prefillEmailRef.current}
            onTenantCreated={(tenant) => {
              // Pending tenant shows in Clients list immediately without a full reload
              // useTenants in ClientsPage will re-fetch when the tab is next visited
            }}
            onBack={() => {
              prefillEmailRef.current = undefined;
              navigateToScreen('tenant-selection');
            }}
            onSuccess={() => {
              prefillEmailRef.current = undefined;
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
            userId={resolveManagerId() || undefined}
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
            onSaved={(_id) => {
              // Navigate back to clients — ClientsPage's useLandlords hook will
              // re-fetch when mounted, so no extra state management needed here.
              navigateToScreen('main-app');
              setNavigationScreen('clients');
            }}
          />
        );

      case 'bulk-import-tenant':
        return (
          <BulkTenantImport
            properties={properties}
            existingTenants={tenants}
            userProfile={userProfile}
            userId={resolveManagerId() || ''}
            onBack={() => navigateToScreen('add-tenant')}
            onComplete={() => {
              navigateToScreen('main-app');
              setNavigationScreen('clients');
              setPortfolioRefreshKey(k => k + 1);
            }}
          />
        );

      case 'bulk-import-property':
        return (
          <BulkPropertyImport
            existingProperties={properties}
            userProfile={userProfile}
            userId={resolveManagerId() || ''}
            userEmail={userProfile?.email}
            onBack={() => {
              navigateToScreen('main-app');
              setNavigationScreen('properties');
            }}
            onComplete={() => {
              setPortfolioRefreshKey(k => k + 1);
              navigateToScreen('main-app');
              setNavigationScreen('properties');
            }}
            onEnrich={(ids) => {
              importedPropertyIdsRef.current = ids;
              enrichmentSourceRef.current = 'import';
              // Refresh properties so the enrichment queue has fresh data
              setPortfolioRefreshKey(k => k + 1);
              navigateToScreen('property-enrichment-queue');
            }}
          />
        );

      case 'bulk-assign':
        return (
          <BulkAssignTable
            tenants={tenants}
            properties={properties}
            onBack={() => {
              navigateToScreen('main-app');
              setNavigationScreen('properties');
            }}
            onComplete={() => {
              setPortfolioRefreshKey(k => k + 1);
              navigateToScreen('main-app');
              setNavigationScreen('properties');
            }}
          />
        );

      case 'property-enrichment-queue':
        return (
          <PropertyEnrichmentQueue
            importedPropertyIds={importedPropertyIdsRef.current}
            properties={properties}
            onBack={() => {
              if (enrichmentSourceRef.current === 'import') {
                navigateToScreen('bulk-import-property');
              } else {
                navigateToScreen('main-app');
                setNavigationScreen('properties');
              }
            }}
            onAddPhotos={(property) => {
              selectProperty(property);
              navigateToScreen('photo-management');
            }}
            onUploadDocs={(property) => {
              selectProperty(property);
              navigateToScreen('document-management');
            }}
            onEditDetails={(property) => {
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
                  uploadedDocuments: [],
                },
                amenities: property.amenities || [],
                images: (property.photos || []).map(p => p.url),
                imageFiles: [],
                additionalNotes: property.notes || '',
                status: property.status,
              });
              // After editing, come back to the enrichment queue
              setPreviousScreen('property-enrichment-queue');
              navigateToScreen('property-setup-step1');
            }}
            onViewProperty={(property) => {
              selectProperty(property);
              navigateToScreen('property-details');
            }}
            onDone={() => {
              importedPropertyIdsRef.current = [];
              setPortfolioRefreshKey(k => k + 1);
              navigateToScreen('main-app');
              setNavigationScreen('properties');
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

  const authContextValue = {
    user: userProfile,
    isAuthenticated,
    isLoading: isAuthLoading,
    login: () => {},
    logout: () => {},
  };

  return (
    <AuthContext.Provider value={authContextValue as any}>
      <div className="min-h-screen bg-background">
        <div
            className={`transition-all duration-[4ms] ease-out ${isTransitioning
              ? 'opacity-0 transform scale-75'
              : 'opacity-100'
            }`}
        >
          <Suspense fallback={<LazyFallback />}>
            {renderScreen()}
          </Suspense>
        </div>
      </div>
    </AuthContext.Provider>
  );
}

// Main App Component with Routes
//
// IMPORTANT: This component is lazy-loaded into the main Proptii app which uses
// createBrowserRouter (React Router data mode). Data-mode routers assign route.id
// to every route; a plain <Routes> inside a data router does NOT get route.id set.
// Any hook that calls useRouteId() internally (including useNavigate in RR v6.4+)
// throws "Error" with an empty message when route.id is undefined — this is what
// crashed the landlord dashboard with the ErrorBoundary showing "Something went wrong / Error".
export default function App() {
  const inRouter = useInRouterContext();

  const content = (
    <ThemeProvider defaultTheme="light" enableSystem={false} forcedTheme="light" attribute="class" storageKey="proptii-theme">
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  );

  if (inRouter) {
    return content;
  }

  return (
    <MemoryRouter>
      {content}
    </MemoryRouter>
  );
}
