import apiService, { ApiResponse } from './api';
import axios from 'axios';
import { FormSection, ReferencingFormData } from '../types/referencing';
import { identitySchema, employmentSchema, residentialSchema, financialSchema, guarantorSchema, agentDetailsSchema } from '../types/referencing';
import emailService from './emailService';

interface Attachment {
  filename: string;
  content: File;
}

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:10000/api'
  : 'https://proptii-r1-1a.onrender.com/api';

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
  private readonly API_URL = API_BASE_URL;

  private async saveToCosmosDB(endpoint: string, data: any, retryCount = 0): Promise<any> {
    try {
      console.log('Saving to backend:', {
        endpoint,
        dataType: data.type,
        userId: data.userId,
        attempt: retryCount + 1
      });

      // Remove /api prefix if it exists in the endpoint
      const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
      const response = await axios.post(`${this.API_URL}${cleanEndpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 second timeout for slower production servers
      });

      return response.data;
    } catch (error: any) {
      // Handle specific error types
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.warn('API save timeout');
          if (retryCount < 3) {
            console.log(`Retrying save attempt ${retryCount + 1}/3`);
            return this.saveToCosmosDB(endpoint, data, retryCount + 1);
          }
        }

        if (error.response) {
          // Server responded with error
          const statusCode = error.response.status;
          switch (statusCode) {
            case 429: // Too Many Requests
              if (retryCount < 3) {
                const retryAfter = error.response.headers['retry-after'] || 1000;
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                return this.saveToCosmosDB(endpoint, data, retryCount + 1);
              }
              throw new Error('Rate limit exceeded. Please try again later.');

            case 401:
            case 403:
              throw new Error('Authentication failed. Please check your credentials.');

            case 404:
              throw new Error('The requested resource was not found.');

            case 409:
              throw new Error('Conflict detected. Please refresh and try again.');

            case 413:
              throw new Error('Request too large. Please reduce the data size.');

            default:
              if (statusCode >= 500) {
                if (retryCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                  return this.saveToCosmosDB(endpoint, data, retryCount + 1);
                }
                throw new Error('Server error. Please try again later.');
              }
          }
        }
      }

      console.error('Error saving to backend:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save data');
    }
  }

  private async saveToLocalStorage(userId: string, section: string, data: any) {
    try {
      const key = `referencing_${userId}_${section}`;
      const dataToSave = {
        ...data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error('Error saving to local storage:', error);
      return false;
    }
  }

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

  async getReference(userId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.API_URL}/referencing/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting reference:', error);
      throw error;
    }
  }

  async submitApplication(userId: string, data: any) {
    try {
      // Save all sections first
      const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
      await Promise.all(sections.map(section =>
        this.saveFormSection(userId, section, data.formData[section])
      ));

      // Submit to Cosmos DB
      const formResult = await this.saveToCosmosDB(`/referencing/${userId}/submit`, {
        formData: data.formData,
        userId,
        submittedAt: new Date().toISOString()
      });

      if (!formResult.success) {
        throw new Error(formResult.error || 'Failed to save form data');
      }

      // Send emails
      const emailResults = await emailService.sendMultipleEmails({
        formData: data.formData,
        submissionId: formResult.id
      });

      // Clear local storage on success
      if (formResult.success) {
        this.clearLocalStorage(userId);
      }

      return {
        success: true,
        formSubmission: formResult,
        emailSent: emailResults,
        savedToCosmosDB: true
      };

    } catch (error) {
      console.error('Error in submitApplication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit application',
        savedToCosmosDB: false
      };
    }
  }

  private generateEmailContent(template: string, data: any): string {
    // This is a simple template function - you should replace this with your actual email template system
    switch (template) {
      case 'userSubmission':
        return `
          <h1>Your Referencing Application Has Been Submitted</h1>
          <p>Dear ${data.name},</p>
          <p>Your referencing application has been successfully submitted. We will process your application and contact you shortly.</p>
        `;
      case 'agentNotification':
        return `
          <h1>New Referencing Application Received</h1>
          <p>A new referencing application has been submitted by ${data.applicantName}.</p>
          <p>Please review the attached documents and process the application.</p>
        `;
      case 'refereeRequest':
        return `
          <h1>Reference Request for Rental Application</h1>
          <p>Dear ${data.refereeName},</p>
          <p>${data.applicantName} has listed you as a reference for their rental application.</p>
          <p>Please provide a reference by responding to this email.</p>
        `;
      case 'guarantorRequest':
        return `
          <h1>Guarantor Request for Rental Application</h1>
          <p>Dear ${data.guarantorName},</p>
          <p>${data.applicantName} has listed you as a guarantor for their rental application.</p>
          <p>Please review the attached documents and confirm your agreement to act as a guarantor.</p>
        `;
      default:
        return '';
    }
  }

  private prepareAttachments(formData: any): Attachment[] {
    const attachments: Attachment[] = [];

    // Helper function to add attachment
    const addAttachment = (document: File | null, prefix: string, firstName: string, lastName: string) => {
      if (document && document instanceof File) {
        attachments.push({
          filename: `${prefix}_${firstName}_${lastName}.${document.name.split('.').pop()}`,
          content: document
        });
      }
    };

    // Add all documents
    if (formData.identity) {
      addAttachment(
        formData.identity.identityProof,
        'identity_proof',
        formData.identity.firstName,
        formData.identity.lastName
      );
    }

    if (formData.employment) {
      addAttachment(
        formData.employment.proofDocument,
        'employment_proof',
        formData.identity.firstName,
        formData.identity.lastName
      );
    }

    if (formData.residential) {
      addAttachment(
        formData.residential.proofDocument,
        'residential_proof',
        formData.identity.firstName,
        formData.identity.lastName
      );
    }

    if (formData.financial) {
      addAttachment(
        formData.financial.proofOfIncomeDocument,
        'financial_proof',
        formData.identity.firstName,
        formData.identity.lastName
      );
    }

    if (formData.guarantor) {
      addAttachment(
        formData.guarantor.identityDocument,
        'guarantor_proof',
        formData.identity.firstName,
        formData.identity.lastName
      );
    }

    return attachments;
  }

  private clearLocalStorage(userId: string) {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`referencing_${userId}`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }

  async saveIdentityData(userId: string, data: any) {
    return this.saveFormSection(userId, 'identity', data);
  }

  async saveEmploymentData(userId: string, data: any) {
    return this.saveFormSection(userId, 'employment', data);
  }

  async saveResidentialData(userId: string, data: any) {
    return this.saveFormSection(userId, 'residential', data);
  }

  async saveFinancialData(userId: string, data: any) {
    return this.saveFormSection(userId, 'financial', data);
  }

  async saveGuarantorData(userId: string, data: any) {
    return this.saveFormSection(userId, 'guarantor', data);
  }

  async saveAgentDetailsData(userId: string, data: any) {
    return this.saveFormSection(userId, 'agent', data);
  }

  private async saveFormSection(userId: string, section: string, data: any) {
    try {
      // Save to backend API
      const result = await this.saveToCosmosDB(`/referencing/${section}`, {
        ...data,
        userId
      });

      // Save to local storage as backup
      await this.saveToLocalStorage(userId, section, data);

      return result;
    } catch (error) {
      console.error(`Error saving ${section} data:`, error);
      throw error;
    }
  }

  async getFormData(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Try to get from CosmosDB first
      const response = await axios.get(`${API_BASE_URL}/referencing/${userId}`, {
        timeout: 30000 // 30 second timeout for slower production servers
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get form data:', error);

      // If CosmosDB fails, try to get from local storage
      try {
        const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
        const localData: any = {};

        sections.forEach(section => {
          const data = localStorage.getItem(`referencing_${userId}_${section}`);
          if (data) {
            localData[section] = JSON.parse(data);
          }
        });

        return localData;
      } catch (localError) {
        console.error('Failed to get data from local storage:', localError);
        throw new Error('Failed to get form data from both backend API and local storage');
      }
    }
  }
}

export default new ReferencingService();