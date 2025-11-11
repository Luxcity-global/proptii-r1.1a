import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
    
    // Fetch status for each email
    const promises = emails.map(async (email) => {
      const result = await this.getReferencingStatusByEmail(email);
      statusMap.set(email, result.status);
    });
    
    await Promise.all(promises);
    
    return statusMap;
  }
}

export const referencingService = new ReferencingService();

