import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

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
  lastSaved: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isSubmitted: boolean;
}

export interface UserFile {
  id: string;
  userId: string;
  name: string;
  category: string;
  type: string;
  size: number;
  uploadDate: Timestamp;
  url: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SupportFormData {
  id: string;
  subject: string;
  heading: string;
  body: string;
  email: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class FirestoreService {
  private readonly collectionName = 'referencingForms';
  private readonly filesCollectionName = 'userFiles';
  private readonly supportFormsCollectionName = 'supportForms';

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
   * Save referencing form data to Firestore
   */
  async saveReferencingForm(
    userId: string, 
    propertyId: string, 
    formData: ReferencingFormData,
    currentStep: number,
    stepStatus: { [key: number]: 'empty' | 'partial' | 'complete' }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, data will be saved when connection is restored');
        return { 
          success: false, 
          error: 'Device is offline. Data will be saved when connection is restored.' 
        };
      }

      const docId = `${userId}_${propertyId}`;
      const docRef = doc(db, this.collectionName, docId);
      
      // Check if document exists
      const docSnap = await getDoc(docRef);
      
      const documentData: ReferencingDocument = {
        userId,
        propertyId,
        formData: this.cleanFormData(formData), // Clean undefined values
        currentStep,
        stepStatus,
        lastSaved: serverTimestamp() as Timestamp,
        createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        isSubmitted: docSnap.exists() ? docSnap.data().isSubmitted : false
      };

      await setDoc(docRef, documentData, { merge: true });
      
      console.log('✅ Referencing form saved to Firestore successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error saving referencing form to Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable') {
        return { 
          success: false, 
          error: 'Firestore is currently unavailable. Please check your internet connection and try again.' 
        };
      }
      
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied - this is expected if Firestore security rules are not configured yet');
        return { 
          success: false, 
          error: 'Firestore access denied. Please configure Firestore security rules or check your Firebase setup.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get referencing form data from Firestore
   */
  async getReferencingForm(
    userId: string, 
    propertyId: string
  ): Promise<{ success: boolean; data?: ReferencingDocument; error?: string }> {
    try {
      const docId = `${userId}_${propertyId}`;
      console.log(`🔍 Querying Firestore for referencing form: ${this.collectionName}/${docId}`);
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ Found referencing form in Firestore');
        return { 
          success: true, 
          data: docSnap.data() as ReferencingDocument 
        };
      } else {
        console.log('ℹ️ No referencing form found in Firestore for this document ID');
        return { 
          success: true, 
          data: undefined 
        };
      }
    } catch (error: any) {
      console.error('❌ Error getting referencing form from Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied for getReferencingForm');
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

  /**
   * Update referencing form submission status
   */
  async submitReferencingForm(
    userId: string, 
    propertyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docId = `${userId}_${propertyId}`;
      const docRef = doc(db, this.collectionName, docId);
      
      await updateDoc(docRef, {
        isSubmitted: true,
        updatedAt: serverTimestamp(),
        submittedAt: serverTimestamp()
      });
      
      console.log('✅ Referencing form submitted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error submitting referencing form:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all referencing forms for a user
   */
  async getUserReferencingForms(userId: string): Promise<{ success: boolean; data?: ReferencingDocument[]; error?: string }> {
    try {
      console.log('🔍 Querying Firestore for all referencing forms for user:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const forms: ReferencingDocument[] = [];
      
      querySnapshot.forEach((doc) => {
        forms.push(doc.data() as ReferencingDocument);
      });
      
      console.log(`✅ Found ${forms.length} referencing form(s) for user ${userId}`);
      return { success: true, data: forms };
    } catch (error: any) {
      console.error('❌ Error getting user referencing forms:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied for getUserReferencingForms');
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

  /**
   * Delete referencing form
   */
  async deleteReferencingForm(
    userId: string, 
    propertyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docId = `${userId}_${propertyId}`;
      const docRef = doc(db, this.collectionName, docId);
      
      await deleteDoc(docRef);
      
      console.log('✅ Referencing form deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting referencing form:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Save user file to Firestore
   */
  async saveUserFile(
    userId: string,
    file: {
      name: string;
      category: string;
      type: string;
      size: number;
      url: string;
    }
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const fileId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileData: UserFile = {
        id: fileId,
        userId,
        name: file.name,
        category: file.category,
        type: file.type,
        size: file.size,
        uploadDate: serverTimestamp() as Timestamp,
        url: file.url,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const docRef = doc(db, this.filesCollectionName, fileId);
      await setDoc(docRef, fileData);
      
      return { success: true, fileId };
    } catch (error) {
      console.error('❌ Error saving user file to Firestore:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get user files from Firestore
   */
  async getUserFiles(userId: string): Promise<{ success: boolean; files?: UserFile[]; error?: string }> {
    try {
      const q = query(
        collection(db, this.filesCollectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const files: UserFile[] = [];
      
      querySnapshot.forEach((doc) => {
        files.push(doc.data() as UserFile);
      });
      
      // Sort by upload date (newest first)
      files.sort((a, b) => b.uploadDate.toMillis() - a.uploadDate.toMillis());
      
      return { success: true, files };
    } catch (error) {
      console.error('❌ Error getting user files from Firestore:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete user file from Firestore
   */
  async deleteUserFile(userId: string, fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.filesCollectionName, fileId);
      await deleteDoc(docRef);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user file from Firestore:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Save support form submission to Firestore
   */
  async saveSupportForm(
    formData: {
      subject: string;
      heading: string;
      body: string;
      email: string;
    }
  ): Promise<{ success: boolean; formId?: string; error?: string }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, data will be saved when connection is restored');
        return { 
          success: false, 
          error: 'Device is offline. Data will be saved when connection is restored.' 
        };
      }

      const formId = `support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, this.supportFormsCollectionName, formId);
      
      const supportFormData: SupportFormData = {
        id: formId,
        subject: formData.subject,
        heading: formData.heading,
        body: formData.body,
        email: formData.email,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, supportFormData);
      
      console.log('✅ Support form saved to Firestore successfully');
      return { success: true, formId };
    } catch (error: any) {
      console.error('❌ Error saving support form to Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable') {
        return { 
          success: false, 
          error: 'Firestore is currently unavailable. Please check your internet connection and try again.' 
        };
      }
      
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied - this is expected if Firestore security rules are not configured yet');
        return { 
          success: false, 
          error: 'Firestore access denied. Please configure Firestore security rules or check your Firebase setup.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all support form submissions
   */
  async getAllSupportForms(): Promise<{ success: boolean; forms?: SupportFormData[]; error?: string }> {
    try {
      console.log('🔍 Querying Firestore for all support forms');
      const querySnapshot = await getDocs(collection(db, this.supportFormsCollectionName));
      const forms: SupportFormData[] = [];
      
      querySnapshot.forEach((doc) => {
        forms.push(doc.data() as SupportFormData);
      });
      
      // Sort by creation date (newest first)
      forms.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      
      console.log(`✅ Found ${forms.length} support form(s)`);
      return { success: true, forms };
    } catch (error: any) {
      console.error('❌ Error getting support forms from Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied for getAllSupportForms');
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

  /**
   * Update support form status
   */
  async updateSupportFormStatus(
    formId: string,
    status: 'pending' | 'in-progress' | 'resolved'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.supportFormsCollectionName, formId);
      
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Support form status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating support form status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
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
      console.log(`🔍 Querying Firestore for referee/guarantor responses for: ${tenantEmail}`);
      
      // Query for all responses linked to this tenant email
      const q = query(
        collection(db, 'referee_guarantor_responses'),
        where('tenantEmail', '==', tenantEmail)
      );
      
      const querySnapshot = await getDocs(q);
      const refereeResponses: any[] = [];
      const guarantorResponses: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.responseType === 'referee' || data.type === 'referee_response') {
          refereeResponses.push(data);
        } else if (data.responseType === 'guarantor' || data.type === 'guarantor_response') {
          guarantorResponses.push(data);
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
      
      console.log(`✅ Found ${refereeResponses.length} referee and ${guarantorResponses.length} guarantor responses`);
      return { 
        success: true, 
        refereeResponses, 
        guarantorResponses 
      };
    } catch (error: any) {
      console.error('❌ Error getting referee/guarantor responses from Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied for getRefereeGuarantorResponses');
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

export const firestoreService = new FirestoreService();
export default firestoreService;
