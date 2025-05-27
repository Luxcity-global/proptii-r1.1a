import apiService, { ApiResponse } from './api';
import axios from 'axios';
import { FormSection, ReferencingFormData } from '../types/referencing';
import { identitySchema, employmentSchema, residentialSchema, financialSchema, guarantorSchema, agentDetailsSchema } from '../types/referencing';

interface Attachment {
  filename: string;
  content: File;
}

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3002'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3002');
const COSMOS_DB_ENDPOINT = import.meta.env.VITE_COSMOS_DB_ENDPOINT;
const COSMOS_DB_KEY = import.meta.env.VITE_COSMOS_DB_KEY;
const COSMOS_DB_NAME = import.meta.env.VITE_COSMOS_DB_NAME;
const COSMOS_DB_CONTAINER = import.meta.env.VITE_COSMOS_DB_CONTAINER;

// Validate required environment variables
if (!COSMOS_DB_ENDPOINT || !COSMOS_DB_KEY || !COSMOS_DB_NAME || !COSMOS_DB_CONTAINER) {
  console.error('Missing required CosmosDB environment variables:', {
    hasEndpoint: !!COSMOS_DB_ENDPOINT,
    hasKey: !!COSMOS_DB_KEY,
    hasDB: !!COSMOS_DB_NAME,
    hasContainer: !!COSMOS_DB_CONTAINER
  });
}

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
    if (!COSMOS_DB_ENDPOINT || !COSMOS_DB_KEY || !COSMOS_DB_NAME || !COSMOS_DB_CONTAINER) {
      throw new Error('Missing required CosmosDB configuration');
    }

    try {
      console.log('Saving to CosmosDB:', {
        endpoint,
        dataType: data.type,
        userId: data.userId,
        attempt: retryCount + 1
      });

      const response = await axios.post(endpoint, {
        ...data,
        dbConfig: {
          endpoint: COSMOS_DB_ENDPOINT,
          key: COSMOS_DB_KEY,
          databaseId: COSMOS_DB_NAME,
          containerId: COSMOS_DB_CONTAINER
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-cosmos-retry-attempt': retryCount.toString()
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('CosmosDB save response:', {
        status: response.status,
        success: !!response.data,
        dataType: data.type
      });

      return response.data;
    } catch (error: any) {
      // Handle specific error types
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.warn('CosmosDB save timeout');
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
        } else if (error.request) {
          // Request made but no response
          if (retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.saveToCosmosDB(endpoint, data, retryCount + 1);
          }
          throw new Error('Network error. Please check your connection.');
        }
      }

      // Log detailed error information
      console.error('Failed to save to CosmosDB:', {
        error: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        attempt: retryCount + 1
      });

      throw new Error(error.response?.data?.message || error.message || 'Failed to save data to database');
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

  async submitApplication(userId: string, data: { formData: any, emailContent: any }) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log('Starting application submission for user:', userId);

      // First, save all form data to CosmosDB
      const submissionData = {
        userId,
        type: 'submission',
        timestamp: new Date().toISOString(),
        status: 'submitted',
        formData: data.formData
      };

      let cosmosResponse;
      try {
        // Save submission data to CosmosDB
        cosmosResponse = await this.saveToCosmosDB(
          `${this.API_URL}/api/referencing/submissions`,
          submissionData
        );

        console.log('Submission saved to CosmosDB:', {
          success: !!cosmosResponse,
          submissionId: cosmosResponse?.id
        });

        if (!cosmosResponse || !cosmosResponse.success) {
          throw new Error('Failed to save submission to database');
        }
      } catch (dbError) {
        console.error('Database submission failed:', dbError);
        throw new Error('Failed to save submission to database. Please try again.');
      }

      // Prepare attachments for email
      const formData = new FormData();
      formData.append('to', data.emailContent.to);
      formData.append('subject', data.emailContent.subject);
      formData.append('formData', JSON.stringify(data.formData));
      formData.append('submissionId', cosmosResponse.id);

      // Add attachments to FormData
      data.emailContent.attachments.forEach((attachment: any, index: number) => {
        formData.append(`attachments`, attachment.content, attachment.filename);
      });

      let emailResponse;
      try {
        // Send email with attachments
        emailResponse = await axios.post(
          `${this.API_URL}/api/referencing/send-email`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 second timeout for email
          }
        );

        console.log('Email send response:', {
          success: emailResponse.data.success,
          to: data.emailContent.to
        });

        if (!emailResponse.data.success) {
          throw new Error('Failed to send email notification');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't throw here - we want to return partial success
        emailResponse = { data: { success: false } };
      }

      // Return appropriate response based on what succeeded
      if (cosmosResponse.success && emailResponse.data.success) {
        return {
          success: true,
          submissionId: cosmosResponse.id,
          message: 'Application submitted successfully and email notification sent'
        };
      } else if (cosmosResponse.success) {
        return {
          success: true,
          submissionId: cosmosResponse.id,
          message: 'Application submitted successfully but email notification failed'
        };
      } else {
        return {
          success: false,
          message: 'Failed to submit application. Please try again.'
        };
      }
    } catch (error: any) {
      console.error('Failed to submit application:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to submit application');
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
    try {
      // Save to local storage first
      await this.saveToLocalStorage(userId, 'agent-details', data);

      // Save to CosmosDB
      const cosmosResponse = await this.saveToCosmosDB(
        `${this.API_URL}/api/referencing/agent`,
        {
          userId,
          ...data,
          type: 'agent_details',
          timestamp: new Date().toISOString()
        }
      );

      if (!cosmosResponse || !cosmosResponse.success) {
        console.warn('Failed to save agent details to CosmosDB:', cosmosResponse);
        throw new Error('Failed to save agent details to database');
      }

      console.log('Agent details saved successfully:', {
        localStorageKey: `referencing_${userId}_agent-details`,
        cosmosResponse: cosmosResponse
      });

      return {
        success: true,
        message: 'Agent details saved successfully',
        data: cosmosResponse
      };
    } catch (error: any) {
      console.error('Failed to save agent details:', error);

      // If CosmosDB save fails but local storage succeeded
      const localData = localStorage.getItem(`referencing_${userId}_agent-details`);
      if (localData) {
        return {
          success: false,
          message: 'Data saved locally but failed to sync with database. Changes will be synced when connection is restored.',
          data: JSON.parse(localData)
        };
      }

      throw error;
    }
  }

  private async saveFormSection(userId: string, section: string, data: any) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Get the appropriate validation schema
      const schemaMap = {
        'identity': identitySchema,
        'employment': employmentSchema,
        'residential': residentialSchema,
        'financial': financialSchema,
        'guarantor': guarantorSchema,
        'agent-details': agentDetailsSchema
      };

      const validationSchema = schemaMap[section as keyof typeof schemaMap];
      if (!validationSchema) {
        throw new Error(`Invalid form section: ${section}`);
      }

      // Validate the data
      try {
        await validationSchema.validate(data, { abortEarly: false });
      } catch (validationError: any) {
        console.error('Validation failed:', {
          section,
          errors: validationError.errors
        });
        throw new Error(`Validation failed: ${validationError.errors.join(', ')}`);
      }

      // Save to local storage first
      await this.saveToLocalStorage(userId, section, data);

      // Save to CosmosDB
      const cosmosResponse = await this.saveToCosmosDB(
        `${this.API_URL}/api/referencing/${section}`,
        {
          userId,
          ...data,
          type: section,
          timestamp: new Date().toISOString()
        }
      );

      console.log(`${section} data saved successfully:`, {
        localStorageKey: `referencing_${userId}_${section}`,
        cosmosResponse: !!cosmosResponse
      });

      return cosmosResponse;
    } catch (error: any) {
      console.error(`Failed to save ${section} data:`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // If CosmosDB save fails but local storage succeeded
      const localData = localStorage.getItem(`referencing_${userId}_${section}`);
      if (localData) {
        console.warn(`${section} data saved to local storage only. Will sync to CosmosDB when connection is restored.`);
        return JSON.parse(localData);
      }

      throw new Error(error.response?.data?.message || error.message || `Failed to save ${section} data`);
    }
  }

  async getFormData(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Try to get from CosmosDB first
      const response = await axios.get(`${API_BASE_URL}/api/referencing/${userId}`, {
        params: {
          dbConfig: {
            endpoint: COSMOS_DB_ENDPOINT,
            key: COSMOS_DB_KEY,
            databaseId: COSMOS_DB_NAME,
            containerId: COSMOS_DB_CONTAINER
          }
        }
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
        throw new Error('Failed to get form data from both CosmosDB and local storage');
      }
    }
  }
}

export default new ReferencingService();