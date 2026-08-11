import { ApiResponse } from './api';
import apiService from './api';

export interface DashboardSummary {
  savedSearches: {
    count: number;
    recentSearches: Array<{ id: string; query: string; date: string }>;
  };
  viewings: {
    upcoming: number;
    past: number;
    total: number;
    nextViewing?: { property: string; date: string; time: string };
  };
  referencing: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
    completedSteps: number;
    totalSteps: number;
    identity: boolean,
    employment: boolean,
    residential: boolean,
    financial: boolean,
    guarantor: boolean,
    agentDetails: boolean,
  };
  contracts: {
    pending: number;
    signed: number;
    total: number;
    requested: number;
    urgent?: Array<{ id: string; name: string; dueDate: string }>;
  };
  files: {
    count: number;
    recentlyAdded: Array<{ 
      id: string; 
      name: string; 
      type: string; 
      date: string;
      url: string;
      size: number;
    }>;
  };
}

export interface SavedProperty {
  id: string;
  price: number;
  address: string;
  city: string;
  postcode: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  imageUrl: string;
  savedAt: string;
}

export interface PropertyViewing {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyImageUrl: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'PENDING' | 'CONFIRMED' | 'DECLINED';
  notes?: string;
  agentName?: string;
  agentContact?: string;
}

export interface ReferencingApplication {
  id: string;
  propertyId: string;
  propertyAddress: string;
  startedAt: string;
  lastUpdatedAt: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'rejected' | string;
  progress: number;
  completedSteps: number;
  totalSteps: number;
}

export interface Contract {
  id: string;
  propertyId: string;
  propertyAddress: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'completed' | 'expired' | string;
  createdAt: string;
  expiresAt: string;
  signedAt?: string;
  documentUrl?: string;
  parties: Array<{
    name: string;
    email: string;
    status: 'pending' | 'signed' | 'rejected';
  }>;
}

export interface UserFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: 'identity' | 'employment' | 'residential' | 'financial' | 'contract' | 'other' | string;
  url: string;
}
// Use environment variable to determine if we're using mock data
const USE_MOCK_DATA = false; // Set to false to force real API

// Dashboard Service Interface
export interface DashboardServiceInterface {
  getDashboardSummary(): Promise<ApiResponse<DashboardSummary>>;
  getSavedProperties(): Promise<ApiResponse<SavedProperty[]>>;
  getViewings(): Promise<ApiResponse<PropertyViewing[]>>;
  getReferencingApplications(): Promise<ApiResponse<ReferencingApplication[]>>;
  getContracts(): Promise<ApiResponse<Contract[]>>;
  getUserFiles(): Promise<ApiResponse<UserFile[]>>;
}

class RealDashboardService implements DashboardServiceInterface {
  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    return apiService.get<DashboardSummary>('/tenant-dashboard/summary');
  }

  async getSavedProperties(): Promise<ApiResponse<SavedProperty[]>> {
    return apiService.get<SavedProperty[]>('/users/me/saved-properties');
  }

  async getViewings(): Promise<ApiResponse<PropertyViewing[]>> {
    return apiService.get<PropertyViewing[]>('/viewing-requests');
  }

  async getReferencingApplications(): Promise<ApiResponse<ReferencingApplication[]>> {
    return apiService.get<ReferencingApplication[]>('/referencing/forms/all');
  }

  async getContracts(): Promise<ApiResponse<Contract[]>> {
    return apiService.get<Contract[]>('/contracts');
  }

  async getUserFiles(): Promise<ApiResponse<UserFile[]>> {
    return apiService.get<UserFile[]>('/referencing/files/all');
  }
}

export const dashboardService = new RealDashboardService();

// Export type interfaces
export type {
  DashboardSummary,
  SavedProperty,
  PropertyViewing,
  ReferencingApplication,
  Contract,
  UserFile
}; 