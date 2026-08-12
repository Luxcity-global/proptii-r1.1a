import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';
import { ReferencingFormData, ReferencingDocument } from '../../../services/firestoreService';

export interface StoredFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl: string;
}

export interface ReferencingFormData {
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    identityProof?: StoredFile;
  };
  employment: {
    employmentStatus: string;
    companyDetails: string;
    jobPosition: string;
    referenceFullName: string;
    referenceEmail: string;
    proofDocument?: StoredFile;
  };
  residential: {
    currentAddress: string;
    durationAtCurrentAddress: string;
    previousAddress: string;
    proofDocument?: StoredFile;
  };
  financial: {
    monthlyIncome: string;
    proofOfIncomeType: string;
    proofOfIncomeDocument?: StoredFile;
  };
  guarantor: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    identityDocument?: StoredFile;
  };
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
  lastSaved: any;
  createdAt: any;
  updatedAt: any;
  isSubmitted: boolean;
  submittedAt?: any;
}

import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';

class ReferencingService {
  private API_URL = getResolvedApiBaseUrl().replace(/\/api$/, '');

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await getAccessTokenForApiRequest();
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    } catch (error) {
      console.warn('[referencingService] Failed to get access token', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * Get referencing status for a tenant by their email
   * Returns 'complete' if submitted form found, 'in-progress' if partial form found, 'not-started' otherwise
   */
  async getReferencingStatusByEmail(
    email: string
  ): Promise<{ 
    status: 'not-started' | 'in-progress' | 'complete';
    data?: ReferencingDocument;
    error?: string;
  }> {
    try {
      console.log(`🔍 [landlord_agent] Checking referencing status for email: ${email}`);
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.API_URL}/api/referencing/status/${encodeURIComponent(email)}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          return { status: 'not-started', error: 'Permission denied' };
        }
        throw new Error(`Failed to get referencing status: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error getting referencing status:', error);
      return {
        status: 'not-started',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all referencing forms for multiple tenants
   * Useful for batch loading in the clients page
   */
  async getReferencingStatusForTenants(
    emails: string[]
  ): Promise<Map<string, 'not-started' | 'in-progress' | 'complete'>> {
    const statusMap = new Map<string, 'not-started' | 'in-progress' | 'complete'>();
    
    // Process emails in smaller batches to avoid overwhelming Firestore
    const BATCH_SIZE = 5; // Process 5 tenants at a time
    const batches: string[][] = [];
    
    // Split emails into batches
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      batches.push(emails.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`[referencingService] Processing ${emails.length} emails in ${batches.length} batches`);
    
    // Process each batch sequentially
    for (const batch of batches) {
      const promises = batch.map(async (email) => {
        const result = await this.getReferencingStatusByEmail(email);
        statusMap.set(email, result.status);
      });
      
      await Promise.all(promises);
      
      // Small delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`[referencingService] Completed processing ${statusMap.size} tenant statuses`);
    
    return statusMap;
  }

  /**
   * Get referee and guarantor responses for a tenant (directly from Firestore)
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
      console.log(`🔍 [landlord_agent] Fetching API for referee/guarantor responses for: ${tenantEmail}`);
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.API_URL}/api/referencing/responses/${encodeURIComponent(tenantEmail)}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          return { success: false, refereeResponses: [], guarantorResponses: [], error: 'Permission denied' };
        }
        throw new Error(`Failed to get responses: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        refereeResponses: result?.data?.refereeResponses || [],
        guarantorResponses: result?.data?.guarantorResponses || [],
      };
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error getting referee/guarantor responses from API:', error);
      
      return { 
        success: false, 
        refereeResponses: [],
        guarantorResponses: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a referee or guarantor response
   */
  async deleteResponse(responseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ [landlord_agent] Deleting response: ${responseId}`);
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.API_URL}/api/referencing/responses/${encodeURIComponent(responseId)}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          return { success: false, error: 'Permission denied' };
        }
        throw new Error(`Failed to delete response: ${response.statusText}`);
      }

      console.log(`✅ [landlord_agent] Successfully deleted response: ${responseId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error deleting response:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const referencingService = new ReferencingService();

