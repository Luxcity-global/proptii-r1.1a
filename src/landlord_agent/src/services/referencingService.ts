import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

class ReferencingService {
  private referencingCollectionName = 'referencingForms';

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
      
      // Query referencing forms where the identity email matches
      const q = query(
        collection(db, this.referencingCollectionName),
        where('formData.identity.email', '==', email),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`ℹ️ [landlord_agent] No referencing data found for email: ${email}`);
        return { status: 'not-started' };
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data() as ReferencingDocument;
      
      console.log(`✅ [landlord_agent] Found referencing data for ${email}:`, {
        isSubmitted: data.isSubmitted,
        currentStep: data.currentStep,
        updatedAt: data.updatedAt?.toDate?.()
      });
      
      // Determine status based on submission state
      if (data.isSubmitted) {
        return {
          status: 'complete',
          data
        };
      } else if (data.currentStep > 0) {
        return {
          status: 'in-progress',
          data
        };
      } else {
        return {
          status: 'not-started',
          data
        };
      }
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error getting referencing status:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ [landlord_agent] Firestore index missing for referencing query');
        return {
          status: 'not-started',
          error: 'Database index required. Please check Firestore console.'
        };
      }
      
      if (error.code === 'permission-denied') {
        console.warn('⚠️ [landlord_agent] Firestore permission denied for referencing query');
        return {
          status: 'not-started',
          error: 'Permission denied. Please configure Firestore security rules.'
        };
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
      console.log(`🔍 [landlord_agent] Querying Firestore for referee/guarantor responses for: ${tenantEmail}`);
      
      // Query for all responses linked to this tenant email
      const q = query(
        collection(db, 'referee_guarantor_responses'),
        where('tenantEmail', '==', tenantEmail)
      );
      
      const querySnapshot = await getDocs(q);
      const refereeResponses: any[] = [];
      const guarantorResponses: any[] = [];
      
      querySnapshot.forEach((document) => {
        const data = document.data();
        // Include document ID for delete operations
        const responseData = { ...data, id: document.id };
        if (data.responseType === 'referee' || data.type === 'referee_response') {
          refereeResponses.push(responseData);
        } else if (data.responseType === 'guarantor' || data.type === 'guarantor_response') {
          guarantorResponses.push(responseData);
        }
      });
      
      // Sort by creation date (newest first)
      const sortByDate = (a: any, b: any) => {
        const aDate = a.createdAt?.toMillis?.() || new Date(a.submittedAt || a.createdAt).getTime();
        const bDate = b.createdAt?.toMillis?.() || new Date(b.submittedAt || b.createdAt).getTime();
        return bDate - aDate;
      };
      
      refereeResponses.sort(sortByDate);
      guarantorResponses.sort(sortByDate);
      
      console.log(`✅ [landlord_agent] Found ${refereeResponses.length} referee and ${guarantorResponses.length} guarantor responses`);
      return { 
        success: true, 
        refereeResponses, 
        guarantorResponses 
      };
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error getting referee/guarantor responses from Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('⚠️ [landlord_agent] Firestore permission denied for getRefereeGuarantorResponses');
        return { 
          success: false, 
          refereeResponses: [],
          guarantorResponses: [],
          error: 'Permission denied. Please configure Firestore security rules.' 
        };
      }
      
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
      
      const docRef = doc(db, 'referee_guarantor_responses', responseId);
      await deleteDoc(docRef);
      
      console.log(`✅ [landlord_agent] Successfully deleted response: ${responseId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ [landlord_agent] Error deleting response:', error);
      
      if (error.code === 'permission-denied') {
        return { 
          success: false, 
          error: 'Permission denied. Please configure Firestore security rules.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const referencingService = new ReferencingService();

