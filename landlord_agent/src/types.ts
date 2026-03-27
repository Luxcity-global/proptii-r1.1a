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
  propertyId: string;
  propertyAddress: string;
  leaseStart: Date;
  leaseEnd: Date;
  rentAmount: number;
  status: 'active' | 'pending' | 'ended';
  paymentStatus: 'current' | 'overdue' | 'payment-plan';
  lastPaymentDate?: Date;
  overdueAmount?: number;
  defaultRiskScore?: number;
  avatar?: string;
  referencingStatus: 'not-started' | 'in-progress' | 'complete';
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  emergencyContactName?: string; // Flattened for compatibility
  emergencyContactPhone?: string; // Flattened for compatibility
  // Expanded fields for TenantDetails
  moveInDate?: Date;
  depositAmount?: number;
  monthlyRent?: number;
  tenancyType?: 'assured-shorthold' | 'fixed-term' | 'periodic' | 'other';
  employer?: string;
  annualSalary?: number;
  previousAddress?: string;
  notes?: string;
  rentPayments?: RentPayment[];
  maintenanceRequests?: MaintenanceRequest[];
  documents?: TenantDocument[];
  references?: TenantReference[];
}

export interface TenantReference {
  id: string;
  type: 'employment' | 'previous-landlord' | 'personal' | 'financial';
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'pending' | 'received' | 'satisfactory' | 'unsatisfactory';
  dateRequested: Date;
  dateReceived?: Date;
  notes?: string;
}

export interface RentPayment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paymentMethod?: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  dateReported: Date;
  dateCompleted?: Date;
  category: 'plumbing' | 'electrical' | 'heating' | 'structural' | 'other';
}

export interface TenantDocument {
  id: string;
  name: string;
  type: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'id-document' | 'other';
  dateUploaded: Date;
  expiryDate?: Date;
  status: 'valid' | 'expired' | 'pending';
}

export interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'new' | 'premium' | 'suspended';
  portfolio: {
    totalProperties: number;
    totalValue: number;
    monthlyIncome: number;
  };
  properties: string[];
  notes: string;
  avatar?: string;
  lastContact: Date;
  joinDate: Date;
  location: string;
  company?: string;
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
