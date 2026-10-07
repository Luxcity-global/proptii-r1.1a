import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';
import { auth } from '../../../config/firebaseConfig';
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';

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

function emailOf(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function sectionStarted(section: unknown): boolean {
  if (!section || typeof section !== 'object') return false;
  return Object.values(section as Record<string, unknown>).some((value) => {
    if (value == null || value === '' || value === false) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value as object).length > 0;
    return true;
  });
}

function statusFromRecord(record: any): 'not-started' | 'in-progress' | 'complete' {
  if (!record || typeof record !== 'object') return 'not-started';
  const raw = String(record.status || '').trim().toLowerCase();
  if (record.isSubmitted === true || raw === 'submitted' || raw === 'complete') return 'complete';
  const form = record.formData && typeof record.formData === 'object' ? record.formData : record;
  const started = ['identity', 'employment', 'residential', 'financial', 'guarantor']
    .some((key) => sectionStarted(form[key]));
  const steps = record.stepStatus && typeof record.stepStatus === 'object'
    ? Object.keys(record.stepStatus).length > 0
    : false;
  if (started || steps || raw === 'draft' || raw === 'in-progress' || raw === 'partial') return 'in-progress';
  return 'not-started';
}

function mapLandlordReferencingStatus(
  status?: string,
  data?: { isSubmitted?: boolean; formData?: Record<string, unknown> },
  submissionId?: string | null,
): 'not-started' | 'in-progress' | 'complete' {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'complete' || raw === 'submitted' || data?.isSubmitted) return 'complete';
  const hasForm = Boolean(data?.formData && Object.keys(data.formData).length > 0);
  if (!raw || raw === 'none' || raw === 'not-started' || raw === 'not_started') {
    return hasForm || submissionId ? 'in-progress' : 'not-started';
  }
  return 'in-progress';
}

class ReferencingService {
  private API_URL = getResolvedApiBaseUrl().replace(/\/api$/, '');
  private passportLookup: Promise<Map<string, { status: 'in-progress' | 'complete'; data?: ReferencingDocument }>> | null = null;

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

  private rememberPassport(
    found: Map<string, { status: 'in-progress' | 'complete'; data?: ReferencingDocument }>,
    emails: string[],
    record: any,
  ) {
    const status = statusFromRecord(record);
    if (status === 'not-started') return;
    const form = record?.formData && typeof record.formData === 'object' ? record.formData : record;
    const data = {
      ...(record || {}),
      formData: form,
      isSubmitted: status === 'complete',
    } as ReferencingDocument;
    for (const email of emails) {
      const key = emailOf(email);
      if (!key) continue;
      const current = found.get(key);
      if (!current || (current.status !== 'complete' && status === 'complete')) {
        found.set(key, { status, data });
      }
    }
  }

  /** The status endpoint only matches a top-level email. Started passports live on the account id. */
  private async passportsByEmail() {
    if (!this.passportLookup) {
      this.passportLookup = this.collectPassports().finally(() => {
        setTimeout(() => {
          this.passportLookup = null;
        }, 4000);
      });
    }
    return this.passportLookup;
  }

  private async collectPassports() {
    const found = new Map<string, { status: 'in-progress' | 'complete'; data?: ReferencingDocument }>();
    const headers = await this.getAuthHeaders();
    const uid = auth.currentUser?.uid || '';
    const accountEmail = emailOf(auth.currentUser?.email);
    const ids = [uid ? `general_${uid}` : '', uid].filter(Boolean);

    for (const id of ids) {
      try {
        const response = await fetch(`${this.API_URL}/api/referencing/forms/${encodeURIComponent(id)}`, { headers });
        if (!response.ok) continue;
        const json = await response.json();
        const record = json?.data;
        const identityEmail = emailOf(record?.formData?.identity?.email || record?.identity?.email || record?.email);
        this.rememberPassport(found, [identityEmail, accountEmail, emailOf(record?.email)], record);
      } catch {
        /* this form id is optional */
      }
    }

    try {
      const response = await fetch(`${this.API_URL}/api/referencing/received`, { headers });
      if (response.ok) {
        const json = await response.json();
        const shares = Array.isArray(json?.data) ? json.data : [];
        for (const share of shares) {
          const record = share?.formData ? { ...share, formData: share.formData, status: share.passportStatus || share.status } : null;
          this.rememberPassport(
            found,
            [share?.tenantEmail, share?.formData?.identity?.email],
            record || { status: share?.passportStatus },
          );
          const ownerId = typeof share?.userId === 'string' ? share.userId : '';
          if (!ownerId || ids.includes(ownerId) || ids.includes(`general_${ownerId}`)) continue;
          for (const id of [ownerId, `general_${ownerId}`]) {
            try {
              const formResponse = await fetch(`${this.API_URL}/api/referencing/forms/${encodeURIComponent(id)}`, { headers });
              if (!formResponse.ok) continue;
              const formJson = await formResponse.json();
              this.rememberPassport(found, [share?.tenantEmail, formJson?.data?.formData?.identity?.email], formJson?.data);
            } catch {
              /* share form is optional */
            }
          }
        }
      }
    } catch {
      /* received list is optional */
    }

    return found;
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
      const status = mapLandlordReferencingStatus(result?.status, result?.data, result?.submissionId);
      const formData = result?.data?.formData;
      if (status !== 'not-started') {
        return {
          status,
          data: result?.data
            ? { ...result.data, formData, isSubmitted: status === 'complete' }
            : undefined,
        };
      }

      const saved = (await this.passportsByEmail()).get(emailOf(email));
      if (saved) return { status: saved.status, data: saved.data };
      return { status: 'not-started' };
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error getting referencing status:', error);
      try {
        const saved = (await this.passportsByEmail()).get(emailOf(email));
        if (saved) return { status: saved.status, data: saved.data };
      } catch {
        /* the saved passport is optional */
      }
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
        statusMap.set(email.trim().toLowerCase(), result.status);
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
      const responses = Array.isArray(result?.responses) ? result.responses : [];
      const isGuarantor = (row: any) => `${row?.responseType || ''} ${row?.type || ''}`.toLowerCase().includes('guarantor');
      return {
        success: true,
        refereeResponses: result?.data?.refereeResponses || responses.filter((row: any) => !isGuarantor(row)),
        guarantorResponses: result?.data?.guarantorResponses || responses.filter((row: any) => isGuarantor(row)),
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

