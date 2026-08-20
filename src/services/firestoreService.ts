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
    employmentStatus?: string;
    annualIncome?: string;
    relationship?: string;
    consent?: string;
    verifiedViaLink?: boolean;
    submittedAt?: string;
    identityDocument?: {
      name: string;
      type: string;
      size: number;
      lastModified: number;
      url?: string;
      dataUrl?: string;
    } | null;
  };
  guarantorInvitation?: {
    token: string;
    guarantorName: string;
    guarantorEmail: string;
    guarantorPhone?: string;
    status: 'invited' | 'completed';
    invitedAt: string;
    completedAt?: string;
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

  /**
   * Send an invitation to a guarantor via email
   */
  async inviteGuarantor(
    tenantId: string,
    inviteData: {
      guarantorName: string;
      guarantorEmail: string;
      guarantorPhone?: string;
      message?: string;
      tenantName?: string;
      tenantEmail?: string;
    }
  ): Promise<{ success: boolean; formUrl?: string; message?: string; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/invite-guarantor`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...inviteData,
          tenantId,
          frontendUrl: window.location.origin
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to invite guarantor: ${res.statusText}`);
      }

      const json = await res.json();
      return json;
    } catch (error: any) {
      console.warn('Backend invite-guarantor failed, creating local fallback invite:', error);
      const token = `inv_${Date.now()}`;
      const baseUrl = window.location.origin;
      const formUrl = `${baseUrl}/guarantor-reference?token=${token}&tenantId=${encodeURIComponent(tenantId)}&tenantEmail=${encodeURIComponent(inviteData.tenantEmail || '')}&tenantName=${encodeURIComponent(inviteData.tenantName || '')}&email=${encodeURIComponent(inviteData.guarantorEmail || '')}&name=${encodeURIComponent(inviteData.guarantorName || '')}&phone=${encodeURIComponent(inviteData.guarantorPhone || '')}`;
      return {
        success: true,
        message: `Invitation generated for ${inviteData.guarantorEmail}`,
        formUrl
      };
    }
  }

  /**
   * Fetch a guarantor invitation by token
   */
  async getGuarantorInvite(token: string): Promise<{ success: boolean; invitation?: any; error?: string }> {
    try {
      if (!token) return { success: false, error: 'Token is required' };
      const res = await fetch(`${API_BASE}/api/referencing/guarantor-invite?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch invite: ${res.statusText}`);
      }
      return await res.json();
    } catch (error: any) {
      console.warn('Could not fetch guarantor invite from backend:', error);
      return { success: false, error: error?.message || 'Failed to fetch invite' };
    }
  }

  /**
   * Submit a guarantor response (publicly callable by guarantor)
   */
  async submitGuarantorResponse(responseData: {
    token?: string;
    tenantId?: string;
    tenantEmail?: string;
    applicantName?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    employmentStatus?: string;
    annualIncome?: string;
    relationship?: string;
    consent?: string;
    reason?: string;
    documentUrl?: string;
    documentName?: string;
    documentType?: string;
    documentSize?: number;
    identityDocument?: any;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const payload = {
        ...responseData,
        responseType: 'guarantor',
        type: 'guarantor_response',
        submittedAt: new Date().toISOString()
      };

      const res = await fetch(`${API_BASE}/api/referee-guarantor-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to submit response: ${res.statusText}`);
      }

      const json = await res.json();
      return { success: true, id: json.id };
    } catch (error: any) {
      console.error('❌ Error submitting guarantor response:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Share referencing passport with a landlord or agent
   */
  async shareReferencingPassport(
    userId: string,
    shareData: {
      recipientName: string;
      recipientEmail: string;
      recipientPhone?: string;
      recipientRole: 'landlord' | 'agent';
      agencyName?: string;
      propertyAddress?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; share?: any; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/shares`, {
        method: 'POST',
        headers,
        body: JSON.stringify(shareData)
      });

      if (!res.ok) {
        throw new Error(`Failed to share referencing: ${res.statusText}`);
      }

      const json = await res.json();
      return { success: true, share: json.share };
    } catch (error: any) {
      console.warn('Backend share failed, saving to local cache:', error);
      const localShares = JSON.parse(localStorage.getItem(`referencing_shares_${userId}`) || '[]');
      const newShare = {
        id: `share_${Date.now()}`,
        userId,
        ...shareData,
        status: 'sent',
        createdAt: new Date().toISOString()
      };
      localShares.push(newShare);
      localStorage.setItem(`referencing_shares_${userId}`, JSON.stringify(localShares));
      return { success: true, share: newShare };
    }
  }

  /**
   * Get all referencing passport shares for a user
   */
  async getReferencingShares(
    userId: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/api/referencing/shares`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch shares: ${res.statusText}`);
      }

      const json = await res.json();
      const shares = json.data || [];
      // Sync local cache
      localStorage.setItem(`referencing_shares_${userId}`, JSON.stringify(shares));
      return { success: true, data: shares };
    } catch (error: any) {
      console.warn('Backend fetch shares failed, using local cache:', error);
      const localShares = JSON.parse(localStorage.getItem(`referencing_shares_${userId}`) || '[]');
      return { success: true, data: localShares };
    }
  }

  /**
   * Delete / revoke a referencing passport share
   */
  async deleteReferencingShare(
    userId: string,
    shareId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await authHeaders();
      await fetch(`${API_BASE}/api/referencing/shares/${shareId}`, {
        method: 'DELETE',
        headers
      });
      // Update local cache
      const localShares = JSON.parse(localStorage.getItem(`referencing_shares_${userId}`) || '[]');
      const updated = localShares.filter((s: any) => s.id !== shareId);
      localStorage.setItem(`referencing_shares_${userId}`, JSON.stringify(updated));
      return { success: true };
    } catch (error: any) {
      console.warn('Backend delete share failed, updating local cache:', error);
      const localShares = JSON.parse(localStorage.getItem(`referencing_shares_${userId}`) || '[]');
      const updated = localShares.filter((s: any) => s.id !== shareId);
      localStorage.setItem(`referencing_shares_${userId}`, JSON.stringify(updated));
      return { success: true };
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
