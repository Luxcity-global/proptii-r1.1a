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

class ReferencingService {
  private readonly API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3002'
    : (process.env.REACT_APP_API_URL || 'http://localhost:3002');

  /**
   * Create a new referencing application
   */
  async createApplication(propertyId: string): Promise<ApiResponse<{ applicationId: string }>> {
    try {
      const response = await apiService.post<{ applicationId: string }>('/referencing/applications', { propertyId });
      return response;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<ApiResponse<ReferencingFormData>> {
    try {
      const response = await apiService.get<ReferencingFormData>(`/referencing/applications/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  }

  /**
   * Get application status
   */
  async getApplicationStatus(applicationId: string): Promise<ApiResponse<ApplicationStatus>> {
    try {
      const response = await apiService.get<ApplicationStatus>(`/referencing/applications/${applicationId}/status`);
      return response;
    } catch (error) {
      console.error('Error fetching application status:', error);
      throw error;
    }
  }

  /**
   * Save section data
   */
  async saveSectionData(
    applicationId: string,
    section: FormSection,
    data: any
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.put(`/referencing/applications/${applicationId}/sections/${section}`, data);
      return response;
    } catch (error) {
      console.error(`Error saving ${section} data:`, error);
      throw error;
    }
  }

  /**
   * Submit application for review
   */
  async submitApplicationForReview(applicationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.post(`/referencing/applications/${applicationId}/submit`);
      return response;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  /**
   * Upload document
   */
  async uploadDocument(
    applicationId: string,
    section: FormSection,
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<DocumentMetadata>> {
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
  }

  /**
   * Get documents for an application
   */
  async getDocuments(
    applicationId: string,
    section?: FormSection
  ): Promise<ApiResponse<DocumentMetadata[]>> {
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
  }

  /**
   * Delete document
   */
  async deleteDocument(
    applicationId: string,
    documentId: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.delete(`/referencing/applications/${applicationId}/documents/${documentId}`);
      return response;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Save application draft
   */
  async saveDraft(
    applicationId: string,
    draftName: string,
    formData: ReferencingFormData
  ): Promise<ApiResponse<{ draftId: string }>> {
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
  }

  /**
   * Get application drafts
   */
  async getDrafts(
    applicationId: string
  ): Promise<ApiResponse<{ id: string; name: string; createdAt: string }[]>> {
    try {
      const response = await apiService.get<{ id: string; name: string; createdAt: string }[]>(
        `/referencing/applications/${applicationId}/drafts`
      );
      return response;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw error;
    }
  }

  /**
   * Load draft
   */
  async loadDraft(
    applicationId: string,
    draftId: string
  ): Promise<ApiResponse<ReferencingFormData>> {
    try {
      const response = await apiService.get<ReferencingFormData>(
        `/referencing/applications/${applicationId}/drafts/${draftId}`
      );
      return response;
    } catch (error) {
      console.error('Error loading draft:', error);
      throw error;
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(
    applicationId: string,
    draftId: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.delete(
        `/referencing/applications/${applicationId}/drafts/${draftId}`
      );
      return response;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  async saveIdentityData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${this.API_URL}/api/referencing/${userId}/identity`, data, {
      const response = await axios.post(`${API_BASE_URL}/api/referencing/identity`, {
        userId,
        ...data
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save identity data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save identity data');
    }
  }

  async saveEmploymentData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${this.API_URL}/api/referencing/${userId}/employment`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save employment data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save employment data');
    }
  }

  async saveResidentialData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${this.API_URL}/api/referencing/${userId}/residential`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save residential data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save residential data');
    }
  }

  async saveFinancialData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${this.API_URL}/api/referencing/${userId}/financial`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save financial data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save financial data');
    }
  }

  async saveGuarantorData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(`${this.API_URL}/api/referencing/${userId}/guarantor`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to save guarantor data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save guarantor data');
    }
  }

  async saveAgentDetailsData(userId: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.post(
        `${this.API_URL}/api/referencing/${userId}/agent`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Sending agent details data:', { userId, ...data });
      const response = await axios.post(`${API_BASE_URL}/api/referencing/agent-details`, {
        userId,
        ...data
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Agent details save response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to save agent details:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save agent details');
    }
  }

  async getFormData(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await axios.get(`${this.API_URL}/api/referencing/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get form data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get form data');
    }
  }

  async submitApplication(userId: string, data: { formData: any, emailContent: any }) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      // First, submit the application data
      const response = await axios.post(`${this.API_URL}/api/referencing/${userId}/submit`, data.formData, {
      console.log('Submitting application for user:', userId);
      const response = await axios.post(`${API_BASE_URL}/api/referencing/${userId}/submit`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Prepare attachments from uploaded documents
      const attachments = [];

      // Identity proof
      if (data.formData.identity.identityProof) {
        attachments.push({
          filename: `identity_proof_${data.formData.identity.firstName}_${data.formData.identity.lastName}.pdf`,
          content: data.formData.identity.identityProof
        });
      }

      // Employment proof
      if (data.formData.employment.proofDocument) {
        attachments.push({
          filename: `employment_proof_${data.formData.identity.firstName}_${data.formData.identity.lastName}.pdf`,
          content: data.formData.employment.proofDocument
        });
      }

      // Residential proof
      if (data.formData.residential.proofDocument) {
        attachments.push({
          filename: `residential_proof_${data.formData.identity.firstName}_${data.formData.identity.lastName}.pdf`,
          content: data.formData.residential.proofDocument
        });
      }

      // Financial proof
      if (data.formData.financial.proofOfIncomeDocument) {
        attachments.push({
          filename: `financial_proof_${data.formData.identity.firstName}_${data.formData.identity.lastName}.pdf`,
          content: data.formData.financial.proofOfIncomeDocument
        });
      }

      // Then, send the email to the agent with attachments
      const emailResponse = await axios.post(`${this.API_URL}/api/referencing/send-email`, {
        ...data.emailContent,
        attachments
      }, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!emailResponse.data.success) {
        throw new Error('Failed to send email to agent/landlord');
      }

      console.log('Application submission response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to submit application');
    }
  }
}

export default new ReferencingService();