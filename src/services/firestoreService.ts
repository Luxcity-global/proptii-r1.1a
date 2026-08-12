import { getAccessTokenForApiRequest } from './msalAccessToken';

export interface ReferencingFormData {
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    dateOfBirthError?: string;
    isBritish: boolean;
    nationality: string;
    identityProof?: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      dataUrl: string;
    } | null;
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
    proofDocument?: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      dataUrl: string;
    } | null;
  };
  residential: {
    currentAddress: string;
    durationAtCurrentAddress: string;
    previousAddress: string;
    durationAtPreviousAddress: string;
    reasonForLeaving: string;
    alreadyHavePropertyAddress: string;
    propertyAddress: string;
    proofType: string;
    proofDocument?: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      dataUrl: string;
    } | null;
  };
  financial: {
    monthlyIncome: string;
    proofOfIncomeType: string;
    proofOfIncomeDocument?: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      dataUrl: string;
    } | null;
    useOpenBanking: boolean;
    isConnectedToOpenBanking: boolean;
  };
  guarantor: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    identityDocument?: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      dataUrl: string;
    } | null;
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

export interface ReferencingDocument {
  userId: string;
  propertyId: string;
  formData: ReferencingFormData;
  currentStep: number;
  stepStatus: { [key: number]: 'empty' | 'partial' | 'complete' };
  lastSaved?: any;
  createdAt?: any;
  updatedAt?: any;
  isSubmitted: boolean;
}

export interface UserFile {
  id: string;
  userId: string;
  name: string;
  category: string;
  type: string;
  size: number;
  uploadDate: any;
  url: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SupportFormData {
  id: string;
  subject: string;
  heading: string;
  body: string;
  email: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt?: any;
  updatedAt?: any;
}

import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

const API_BASE = getResolvedApiBaseUrl().replace(/\/api$/, '');

async function authHeaders(): Promise<Record<string, string>> {
  let token = null;
  try {
    token = await getAccessTokenForApiRequest();
  } catch (err) {
    console.warn('Could not get actual token, falling back to mock or empty', err);
    token = localStorage.getItem('mock_token');
  }
  
  if (!token) {
    console.warn('No token available for API request');
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

class FirestoreService {
  /**
   * Clean form data by removing undefined values
   */
  private cleanFormData(formData: any): any {
    if (formData === null || formData === undefined) {
      return formData;
    }
    
    if (Array.isArray(formData)) {
      return formData.map(item => this.cleanFormData(item));
    }
    
    if (typeof formData === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanFormData(value);
        }
      }
      return cleaned;
    }
    
    return formData;
  }

  /**
   * Save referencing form data to NestJS backend
   */
  async saveReferencingForm(
    userId: string, 
    propertyId: string, 
    formData: ReferencingFormData,
    currentStep: number,
    stepStatus: { [key: number]: 'empty' | 'partial' | 'complete' }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!navigator.onLine) {
        return { success: false, error: 'Device is offline.' };
      }

      const headers = await authHeaders();
      const payload = {
        formData: this.cleanFormData(formData),
        currentStep,
        stepStatus
      };

      const res = await fetch(`${API_BASE}/api/referencing/forms/${propertyId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to save referencing form: ${res.statusText}`);
      }

      console.log('✅ Referencing form saved successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error saving referencing form:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get referencing form data from NestJS backend
   */
  async getReferencingForm(
    userId: string, 
    propertyId: string
  ): Promise<{ success: boolean; data?: ReferencingDocument; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/forms/${propertyId}`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch form: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data as ReferencingDocument };
      }
      
      return { success: true, data: undefined };
    } catch (error: any) {
      console.error('❌ Error getting referencing form:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete referencing form
   */
  async deleteReferencingForm(userId: string, propertyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/forms/${propertyId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to delete form: ${res.statusText}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error deleting referencing form:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save user file metadata
   */
  async saveUserFile(
    userId: string, 
    fileData: Omit<UserFile, 'id' | 'userId' | 'uploadDate' | 'createdAt' | 'updatedAt'>,
    customId?: string
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/files/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(fileData)
      });

      if (!res.ok) {
        throw new Error(`Failed to save file: ${res.statusText}`);
      }

      const json = await res.json();
      return { success: true, fileId: json.id };
    } catch (error: any) {
      console.error('❌ Error saving user file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user files
   */
  async getUserFiles(userId: string): Promise<{ success: boolean; files?: UserFile[]; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/files/all`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch files: ${res.statusText}`);
      }

      const json = await res.json();
      const files = json.data || [];
      return { success: true, files };
    } catch (error: any) {
      console.error('❌ Error getting user files:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user file
   */
  async deleteUserFile(userId: string, fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/files/${fileId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to delete file: ${res.statusText}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error deleting user file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get referee and guarantor responses for a tenant
   */
  async getRefereeGuarantorResponses(
    tenantEmail: string
  ): Promise<{ 
    success: boolean; 
    refereeResponses?: any[]; 
    guarantorResponses?: any[]; 
    error?: string 
  }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/responses/${encodeURIComponent(tenantEmail)}`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch responses: ${res.statusText}`);
      }

      const json = await res.json();
      return {
        success: true,
        refereeResponses: json.data?.refereeResponses || [],
        guarantorResponses: json.data?.guarantorResponses || []
      };
    } catch (error: any) {
      console.error('❌ Error getting referee/guarantor responses:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Legacy support forms (keeping stubs for compilation if used elsewhere)
  async saveSupportForm(formData: any): Promise<{ success: boolean; formId?: string; error?: string }> {
    return { success: true, formId: 'mock' };
  }
  
  async getAllSupportForms(): Promise<{ success: boolean; forms?: SupportFormData[]; error?: string }> {
    return { success: true, forms: [] };
  }

  async updateSupportFormStatus(formId: string, status: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

export const firestoreService = new FirestoreService();
export default firestoreService;
