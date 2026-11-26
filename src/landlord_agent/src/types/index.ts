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
  id?: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  logo?: string;
  companyProfile?: CompanyProfile;
  photoURL?: string;
  avatar?: string;
  avatarUrl?: string;
  photo?: string;
  profilePhoto?: string;
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
  type:
    | 'epc'
    | 'gas-cert'
    | 'eicr'
    | 'deposit-protection'
    | 'tenancy-agreement'
    | 'insurance'
    | 'other';
  url: string;
  /** Private storage path for authenticated download (C1) */
  storagePath?: string;
  /** Required for EPC when C1 gate is on */
  epcRating?: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring-soon' | 'expired';
  submittedAt?: Date | string;
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

export interface PropertyAmenityDetail {
  amenityId: string;
  accessType?: 'private' | 'shared' | 'communal';
  additionalCost?: boolean;
  notes?: string;
}

export interface PropertyClassification {
  categoryId: string;
  typeGroupId: string;
  subtypeId: string;
}

export interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms?: number;
  squareFootage?: number;
  rent: number;
  status: 'vacant' | 'occupied' | 'under-renovation' | 'draft' | 'archived';
  /**
   * C2 — whether this listing appears in tenant property search.
   * Orthogonal to occupancy status. New properties default to private.
   */
  listingVisibility?: 'private' | 'public';
  /** Sticky after first publish — keeps visibility toggle when later hidden from search. */
  listingEverPublished?: boolean;
  /** H4 normalised address key */
  addressMatchKey?: string;
  /** H4 — publish held while ownership claim is reviewed */
  claimInReview?: boolean;
  claimCaseId?: string;
  amenities: string[];
  notes: string;
  /** Public listing description shown to renters/buyers */
  description?: string;
  propertyClassification?: PropertyClassification;
  amenityDetails?: PropertyAmenityDetail[];
  additionalFeatures?: string;
  // Optional catalogue detail fields
  receptionRooms?: number | string;
  floorNumber?: string;
  constructionType?: string;
  tenure?: string;
  epcRating?: string;
  propertyUse?: string;
  numberOfFloors?: number | string;
  buildingSpecification?: string;
  permittedUse?: string;
  businessRates?: number | string;
  landArea?: string;
  planningStatus?: string;
  landAccess?: string;
  landUtilities?: string;
  boundaries?: string;
  photos: PropertyPhoto[];
  documents: PropertyDocument[];
  /** Listing-time deposit commitment (not a certificate upload) */
  takesDeposit?: 'yes' | 'no' | null;
  depositAmount?: number | string;
  depositProtectionConfirmed?: boolean;
  depositProtectedBy?: 'landlord' | 'agent' | null;
  isForSale?: boolean;
  tenureType?: string;
  annualGroundRent?: number;
  councilTaxBand?: string;
  annualServiceCharge?: number;
  propertyMode?: 'long-term' | 'shortlet';
  nightlyRate?: number;
  minStay?: number;
  maxStay?: number;
  currentGuest?: any;
  calendarDates?: any[];
  pricingRules?: any[];
  provisioningChecklist?: any[];
  createdAt: Date;
  tenant?: Tenant;
  tenantId?: string;
  userId?: string;
  archived?: boolean;
  isArchived?: boolean;
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
  | 'edit-property'
  | 'portfolio-insights'
  | 'property-insights'
  | 'tenant-details'
  | 'vacancy-prevention'
  | 'arrears-management'
  | 'tenant-inbox'
  | 'property-preview'
  | 'tenant-selection'
  | 'add-tenant-from-wizard'
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

export interface PropertySetupData {
  propertyType: string | null;
  propertyCategory?: 'residential' | 'commercial' | 'land' | null;
  propertyTypeGroup?: string | null;
  propertySubtype?: string | null;
  propertyDetails: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
  };
  description?: string;
  amenities: string[];
  amenityDetails?: PropertyAmenityDetail[];
  additionalFeatures?: string;
  images: string[];
  imageFiles: File[];
  additionalNotes: string;
  status?: 'vacant' | 'occupied' | 'under-renovation' | 'draft';
  pendingTenants?: Omit<Tenant, 'id'>[];
}
