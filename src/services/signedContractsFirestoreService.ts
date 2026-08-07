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
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const logDev = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export interface SignedContractData {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  propertyName: string;
  propertyAddress: string;
  agentName: string;
  agentEmail: string;
  tenantName: string;
  tenantEmail: string;
  signedDate: string;
  documentUrl?: string; // Public URL or transient blob URL for the signed PDF
  documentBase64?: string; // Data URL (base64) fallback if no hosted URL is available
  documentName: string;
  documentSize: number;
  documentType: string;
  status: 'signed' | 'sent' | 'delivered';
  emailSent: boolean;
  emailSentDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SignedContractStats {
  total: number;
  signed: number;
  sent: number;
  delivered: number;
}

class SignedContractsFirestoreService {
  private readonly collectionName = 'signedContracts';

  /**
   * Save a signed contract to Firestore
   */
  async saveSignedContract(
    userId: string,
    contractData: Omit<SignedContractData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; contractId?: string; error?: string }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, signed contract will be saved when connection is restored');
        return { 
          success: false, 
          error: 'Device is offline. Contract will be saved when connection is restored.' 
        };
      }

      const contractId = `signed_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, this.collectionName, contractId);
      
      const signedContractData: SignedContractData = {
        id: contractId,
        userId,
        ...contractData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, signedContractData);
      
      logDev('✅ Signed contract saved to Firestore successfully:', contractId);
      return { success: true, contractId };
    } catch (error: any) {
      console.error('❌ Error saving signed contract to Firestore:', error);
      
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
   * Get all signed contracts for a user
   */
  async getUserSignedContracts(userId: string): Promise<{ success: boolean; contracts?: SignedContractData[]; error?: string }> {
    try {
      logDev('Getting user signed contracts for userId:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const contracts: SignedContractData[] = [];
      
      logDev('Signed contracts query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        logDev('Found signed contract document:', doc.id, doc.data());
        contracts.push(doc.data() as SignedContractData);
      });
      
      logDev('Retrieved signed contracts:', contracts);
      return { success: true, contracts };
    } catch (error) {
      console.error('❌ Error getting user signed contracts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get signed contract by ID
   */
  async getSignedContractById(contractId: string): Promise<{ success: boolean; contract?: SignedContractData; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, contractId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const contract = docSnap.data() as SignedContractData;
        return { success: true, contract };
      } else {
        return { success: false, error: 'Contract not found' };
      }
    } catch (error) {
      console.error('❌ Error getting signed contract by ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update signed contract status
   */
  async updateSignedContractStatus(
    contractId: string, 
    status: 'signed' | 'sent' | 'delivered',
    emailSent: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, contractId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };
      
      if (emailSent) {
        updateData.emailSent = true;
        updateData.emailSentDate = new Date().toISOString();
      }
      
      await updateDoc(docRef, updateData);
      
      logDev('✅ Signed contract status updated successfully:', contractId, status);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating signed contract status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete signed contract
   */
  async deleteSignedContract(contractId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, contractId);
      await deleteDoc(docRef);
      
      logDev('✅ Signed contract deleted successfully:', contractId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting signed contract:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get signed contract statistics for a user
   */
  async getUserSignedContractStats(userId: string): Promise<{ success: boolean; stats?: SignedContractStats; error?: string }> {
    try {
      const contractsResult = await this.getUserSignedContracts(userId);
      
      if (!contractsResult.success || !contractsResult.contracts) {
        return { success: false, error: contractsResult.error };
      }
      
      const contracts = contractsResult.contracts;
      const stats: SignedContractStats = {
        total: contracts.length,
        signed: contracts.filter(c => c.status === 'signed').length,
        sent: contracts.filter(c => c.status === 'sent').length,
        delivered: contracts.filter(c => c.status === 'delivered').length
      };
      
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error getting signed contract stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Set up real-time listener for signed contracts
   */
  onSignedContractsChange(
    userId: string, 
    callback: (contracts: SignedContractData[]) => void
  ): () => void {
    logDev('Setting up real-time listener for signed contracts, userId:', userId);
    let unsubscribe: () => void = () => {};

    const setupListener = (useOrderBy: boolean) => {
      const q = useOrderBy
        ? query(
            collection(db, this.collectionName),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          )
        : query(
            collection(db, this.collectionName),
            where('userId', '==', userId)
          );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const contracts: SignedContractData[] = [];
        querySnapshot.forEach((doc) => {
          contracts.push(doc.data() as SignedContractData);
        });
        
        if (!useOrderBy) {
          // Sort in memory by createdAt descending
          contracts.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
        }
        
        logDev('Real-time update: signed contracts changed:', contracts.length, 'contracts');
        callback(contracts);
      }, (error: any) => {
        if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
          console.warn('⚠️ Signed contracts ordered listener failed, falling back to unordered listener...');
          setupListener(false);
        } else {
          console.error('Error in signed contracts real-time listener:', error);
        }
      });
    };

    setupListener(true);
    return () => unsubscribe();
  }
}

export default new SignedContractsFirestoreService();