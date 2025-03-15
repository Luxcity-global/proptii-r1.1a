import apiService, { ApiResponse } from './api';
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
export const submitApplication = async (applicationId: string): Promise<ApiResponse<any>> => {
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