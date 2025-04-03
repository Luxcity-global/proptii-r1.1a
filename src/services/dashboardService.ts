import { ApiResponse } from './api';
import {
  DashboardSummary,
  SavedProperty,
  PropertyViewing,
  ReferencingApplication,
  Contract,
  UserFile,
  mockGetDashboardSummary,
  mockGetSavedProperties,
  mockGetViewings,
  mockGetReferencingApplications,
  mockGetContracts,
  mockGetUserFiles
} from '../mocks/dashboardApi';

// Use environment variable to determine if we're using mock data
const USE_MOCK_DATA = true; // In production, this would be process.env.REACT_APP_USE_MOCK_DATA === 'true'

// Dashboard Service Interface
export interface DashboardServiceInterface {
  getDashboardSummary(): Promise<ApiResponse<DashboardSummary>>;
  getSavedProperties(): Promise<ApiResponse<SavedProperty[]>>;
  getViewings(): Promise<ApiResponse<PropertyViewing[]>>;
  getReferencingApplications(): Promise<ApiResponse<ReferencingApplication[]>>;
  getContracts(): Promise<ApiResponse<Contract[]>>;
  getUserFiles(): Promise<ApiResponse<UserFile[]>>;
}

// Implementation using mock data for testing
class MockDashboardService implements DashboardServiceInterface {
  getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    return mockGetDashboardSummary();
  }

  getSavedProperties(): Promise<ApiResponse<SavedProperty[]>> {
    return mockGetSavedProperties();
  }

  getViewings(): Promise<ApiResponse<PropertyViewing[]>> {
    return mockGetViewings();
  }

  getReferencingApplications(): Promise<ApiResponse<ReferencingApplication[]>> {
    return mockGetReferencingApplications();
  }

  getContracts(): Promise<ApiResponse<Contract[]>> {
    return mockGetContracts();
  }

  getUserFiles(): Promise<ApiResponse<UserFile[]>> {
    return mockGetUserFiles();
  }
}

// Real API implementation (to be replaced with actual API calls)
class RealDashboardService implements DashboardServiceInterface {
  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    // TODO: Replace with actual API call
    console.log('Using real API for getDashboardSummary');
    return { success: false, error: 'Real API not implemented yet' };
  }

  async getSavedProperties(): Promise<ApiResponse<SavedProperty[]>> {
    // TODO: Replace with actual API call
    console.log('Using real API for getSavedProperties');
    return { success: false, error: 'Real API not implemented yet' };
  }

  async getViewings(): Promise<ApiResponse<PropertyViewing[]>> {
    // TODO: Replace with actual API call
    console.log('Using real API for getViewings');
    return { success: false, error: 'Real API not implemented yet' };
  }

  async getReferencingApplications(): Promise<ApiResponse<ReferencingApplication[]>> {
    // TODO: Replace with actual API call
    console.log('Using real API for getReferencingApplications');
    return { success: false, error: 'Real API not implemented yet' };
  }

  async getContracts(): Promise<ApiResponse<Contract[]>> {
    // TODO: Replace with actual API call
    console.log('Using real API for getContracts');
    return { success: false, error: 'Real API not implemented yet' };
  }

  async getUserFiles(): Promise<ApiResponse<UserFile[]>> {
    // TODO: Replace with actual API call
    console.log('Using real API for getUserFiles');
    return { success: false, error: 'Real API not implemented yet' };
  }
}

// Factory function to create the appropriate dashboard service based on configuration
export const createDashboardService = (): DashboardServiceInterface => {
  return USE_MOCK_DATA 
    ? new MockDashboardService() 
    : new RealDashboardService();
};

// Export default instance for easy use
export const dashboardService = createDashboardService();

// Export type interfaces
export type {
  DashboardSummary,
  SavedProperty,
  PropertyViewing,
  ReferencingApplication,
  Contract,
  UserFile
}; 