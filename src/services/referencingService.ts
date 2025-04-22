import apiService, { ApiResponse } from './api';
import axios from 'axios';
import { FormSection, ReferencingFormData } from '../types/referencing';

/**
 * Interface for document metadata
 */
export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  section: FormSection;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

/**
 * Interface for application status
 */
export interface ApplicationStatus {
  id: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'approved' | 'rejected';
  submittedAt?: string;
  completedAt?: string;
  propertyId: string;
  tenantId: string;
  sections: {
    [key in FormSection]?: {
      status: 'incomplete' | 'complete' | 'approved' | 'rejected';
      lastUpdated?: string;
      notes?: string;
    };
  };
}

/**
 * Interface for form data
 */
export interface ReferencingFormData {
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    nationality: string;
    identityProof?: File | null;
  };
  employment: {
    employmentStatus: string;
    companyDetails: string;
    lengthOfEmployment: string;
    jobPosition: string;
    referenceFullName: string;
    referenceEmail: string;
    referencePhone: string;
    proofType: string;
    proofDocument?: File | null;
  };
  residential: {
    currentAddress: string;
    durationAtCurrentAddress: string;
    previousAddress: string;
    durationAtPreviousAddress: string;
    reasonForLeaving: string;
    proofType: string;
    proofDocument?: File | null;
  };
  financial: {
    monthlyIncome: string;
    proofOfIncomeType: string;
    proofOfIncomeDocument?: File | null;
    useOpenBanking: boolean;
    isConnectedToOpenBanking: boolean;
  };
  guarantor: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  creditCheck: {};
  agentDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    hasAgreedToCheck: boolean;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002/api';

/**
 * Create a new referencing application
 */
export const createApplication = async (propertyId: string): Promise<ApiResponse<{ applicationId: string }>> => {
  try {
    const response = await apiService.post<{ applicationId: string }>('/referencing/applications', { propertyId });
    return response;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

/**
 * Get application by ID
 */
export const getApplication = async (applicationId: string): Promise<ApiResponse<ReferencingFormData>> => {
  try {
    const response = await apiService.get<ReferencingFormData>(`/referencing/applications/${applicationId}`);
    return response;
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
};

/**
 * Get application status
 */
export const getApplicationStatus = async (applicationId: string): Promise<ApiResponse<ApplicationStatus>> => {
  try {
    const response = await apiService.get<ApplicationStatus>(`/referencing/applications/${applicationId}/status`);
    return response;
  } catch (error) {
    console.error('Error fetching application status:', error);
    throw error;
  }
};

/**
 * Save section data
 */
export const saveSectionData = async (
  applicationId: string,
  section: FormSection,
  data: any
): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.put(`/referencing/applications/${applicationId}/sections/${section}`, data);
    return response;
  } catch (error) {
    console.error(`Error saving ${section} data:`, error);
    throw error;
  }
};

/**
 * Submit application for review
 */
export const submitApplicationForReview = async (applicationId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.post(`/referencing/applications/${applicationId}/submit`);
    return response;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
};

/**
 * Upload document
 */
export const uploadDocument = async (
  applicationId: string,
  section: FormSection,
  file: File,
  documentType: string,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<DocumentMetadata>> => {
  try {
    const response = await apiService.uploadFile<DocumentMetadata>(
      `/referencing/applications/${applicationId}/documents`,
      file,
      { section, documentType },
      onProgress
    );
    return response;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Get documents for an application
 */
export const getDocuments = async (
  applicationId: string,
  section?: FormSection
): Promise<ApiResponse<DocumentMetadata[]>> => {
  try {
    const url = section
      ? `/referencing/applications/${applicationId}/documents?section=${section}`
      : `/referencing/applications/${applicationId}/documents`;
    
    const response = await apiService.get<DocumentMetadata[]>(url);
    return response;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (
  applicationId: string,
  documentId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.delete(`/referencing/applications/${applicationId}/documents/${documentId}`);
    return response;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Save application draft
 */
export const saveDraft = async (
  applicationId: string,
  draftName: string,
  formData: ReferencingFormData
): Promise<ApiResponse<{ draftId: string }>> => {
  try {
    const response = await apiService.post<{ draftId: string }>(
      `/referencing/applications/${applicationId}/drafts`,
      { name: draftName, data: formData }
    );
    return response;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

/**
 * Get application drafts
 */
export const getDrafts = async (
  applicationId: string
): Promise<ApiResponse<{ id: string; name: string; createdAt: string }[]>> => {
  try {
    const response = await apiService.get<{ id: string; name: string; createdAt: string }[]>(
      `/referencing/applications/${applicationId}/drafts`
    );
    return response;
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

/**
 * Load draft
 */
export const loadDraft = async (
  applicationId: string,
  draftId: string
): Promise<ApiResponse<ReferencingFormData>> => {
  try {
    const response = await apiService.get<ReferencingFormData>(
      `/referencing/applications/${applicationId}/drafts/${draftId}`
    );
    return response;
  } catch (error) {
    console.error('Error loading draft:', error);
    throw error;
  }
};

/**
 * Delete draft
 */
export const deleteDraft = async (
  applicationId: string,
  draftId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await apiService.delete(
      `/referencing/applications/${applicationId}/drafts/${draftId}`
    );
    return response;
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

const referencingService = {
  async saveIdentityData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/identity`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save identity data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save identity data');
    }
  },

  async saveEmploymentData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/employment`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save employment data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save employment data');
    }
  },

  async saveResidentialData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/residential`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save residential data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save residential data');
    }
  },

  async saveFinancialData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/financial`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save financial data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save financial data');
    }
  },

  async saveGuarantorData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/guarantor`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save guarantor data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save guarantor data');
    }
  },

  async saveAgentDetailsData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/agent`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save agent details:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save agent details');
    }
  },

  async getFormData(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/referencing/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get form data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get form data');
    }
  },

  async submitApplication(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/submit`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to submit application');
    }
  }
};

export default referencingService;