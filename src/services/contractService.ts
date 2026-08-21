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

export interface ContractTemplate {
  id: string;
  userId: string;
  name: string;
  uploadDate: string;
  fileData: string; // Base64 encoded file data
  fileSize: number;
  fileType: string;
  imagePreview?: string; // Base64 encoded preview image
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'deleted';
  category: 'contract';
}

export interface ContractStats {
  total: number;
  active: number;
  deleted: number;
  totalSize: number;
}

class ContractService {
  private readonly collectionName = 'contractTemplates';

  /**
   * Save a contract template to Firestore
   */
  async saveContractTemplate(
    userId: string,
    templateData: Omit<ContractTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, contract will be saved when connection is restored');
        return { 
          success: false, 
          error: 'Device is offline. Contract will be saved when connection is restored.' 
        };
      }

      const templateId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, this.collectionName, templateId);
      
      const contractData: ContractTemplate = {
        id: templateId,
        userId,
        ...templateData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, contractData);
      
      console.log('✅ Contract template saved to Firestore successfully');
      return { success: true, templateId };
    } catch (error: any) {
      console.error('❌ Error saving contract template to Firestore:', error);
      
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
   * Get all contract templates for a user
   */
  async getUserContractTemplates(userId: string): Promise<{ success: boolean; templates?: ContractTemplate[]; error?: string }> {
    try {
      console.log('Getting user contract templates for userId:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates: ContractTemplate[] = [];
      
      console.log('Contract templates query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log('Found contract template document:', doc.id, doc.data());
        templates.push(doc.data() as ContractTemplate);
      });
      
      console.log('Retrieved contract templates:', templates);
      return { success: true, templates };
    } catch (error) {
      console.error('❌ Error getting user contract templates:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get deleted contract templates for a user
   */
  async getDeletedContractTemplates(userId: string): Promise<{ success: boolean; templates?: ContractTemplate[]; error?: string }> {
    try {
      console.log('Getting deleted contract templates for userId:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', 'deleted'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates: ContractTemplate[] = [];
      
      console.log('Deleted contract templates query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log('Found deleted contract template document:', doc.id, doc.data());
        templates.push(doc.data() as ContractTemplate);
      });
      
      console.log('Retrieved deleted contract templates:', templates);
      return { success: true, templates };
    } catch (error) {
      console.error('❌ Error getting deleted contract templates:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update contract template status (move to deleted)
   */
  async deleteContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, templateId);
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Contract template moved to deleted status');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting contract template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Restore contract template (move back to active)
   */
  async restoreContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, templateId);
      await updateDoc(docRef, {
        status: 'active',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Contract template restored to active status');
      return { success: true };
    } catch (error) {
      console.error('❌ Error restoring contract template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Permanently delete contract template
   */
  async permanentlyDeleteContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, templateId);
      await deleteDoc(docRef);
      
      console.log('✅ Contract template permanently deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error permanently deleting contract template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get contract statistics for a user
   */
  async getContractStats(userId: string): Promise<{ success: boolean; stats?: ContractStats; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const stats: ContractStats = {
        total: 0,
        active: 0,
        deleted: 0,
        totalSize: 0
      };
      
      querySnapshot.forEach((doc) => {
        const template = doc.data() as ContractTemplate;
        stats.total++;
        stats.totalSize += template.fileSize;
        
        if (template.status === 'active') {
          stats.active++;
        } else if (template.status === 'deleted') {
          stats.deleted++;
        }
      });
      
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error getting contract stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Subscribe to real-time updates for user contract templates
   */
  subscribeToUserContractTemplates(
    userId: string,
    callback: (templates: ContractTemplate[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const templates: ContractTemplate[] = [];
        querySnapshot.forEach((doc) => {
          templates.push(doc.data() as ContractTemplate);
        });
        callback(templates);
      },
      (error) => {
        console.error('❌ Error in contract templates subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Subscribe to real-time updates for deleted contract templates
   */
  subscribeToDeletedContractTemplates(
    userId: string,
    callback: (templates: ContractTemplate[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('status', '==', 'deleted'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const templates: ContractTemplate[] = [];
        querySnapshot.forEach((doc) => {
          templates.push(doc.data() as ContractTemplate);
        });
        callback(templates);
      },
      (error) => {
        console.error('❌ Error in deleted contract templates subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Subscribe to real-time updates for contract stats
   */
  subscribeToContractStats(
    userId: string,
    callback: (stats: ContractStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const stats: ContractStats = {
          total: 0,
          active: 0,
          deleted: 0,
          totalSize: 0
        };
        
        querySnapshot.forEach((doc) => {
          const template = doc.data() as ContractTemplate;
          stats.total++;
          stats.totalSize += template.fileSize;
          
          if (template.status === 'active') {
            stats.active++;
          } else if (template.status === 'deleted') {
            stats.deleted++;
          }
        });
        
        callback(stats);
      },
      (error) => {
        console.error('❌ Error in contract stats subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Get contracts received by tenant email (from landlords)
   * These are stored in the 'contracts' collection (shared between landlord and tenant apps)
   */
  async getReceivedContracts(
    tenantEmail: string,
    statusFilter?: 'sent' | 'unsigned' | 'signed'
  ): Promise<{ success: boolean; contracts?: any[]; error?: string }> {
    try {
      console.log('🔄 Getting contracts received by tenant:', tenantEmail);
      const contracts = await this.queryReceivedContracts(tenantEmail, statusFilter);
      console.log(`✅ Found ${contracts.length} contracts for tenant ${tenantEmail}`);
      return { success: true, contracts };
    } catch (error: any) {
      console.error('❌ Error getting received contracts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private mapReceivedContractDoc(docSnap: { id: string; data: () => any }) {
    const data = docSnap.data();
    const toDate = (value: any) => {
      if (!value) return undefined;
      if (typeof value.toDate === 'function') return value.toDate();
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    return {
      id: docSnap.id,
      title: data.title || '',
      propertyAddress: data.propertyAddress || '',
      tenantName: data.tenantName || '',
      tenantEmail: data.tenantEmail || '',
      landlordEmail: data.landlordEmail || '',
      status: data.status || 'sent',
      contractType: data.contractType || 'other',
      fileUrl: data.fileUrl || '',
      filePath: data.filePath || '',
      fileName: data.fileName || data.title || 'Contract',
      sentDate: toDate(data.sentDate) || toDate(data.createdAt) || new Date(),
      signedDate: toDate(data.signedDate),
      expiryDate: toDate(data.expiryDate),
      additionalInfo: data.additionalInfo,
    };
  }

  private receivedEmailVariants(tenantEmail: string): string[] {
    const trimmed = (tenantEmail || '').trim();
    const lowered = trimmed.toLowerCase();
    return Array.from(new Set([trimmed, lowered].filter(Boolean)));
  }

  private async queryReceivedContracts(
    tenantEmail: string,
    statusFilter?: 'sent' | 'unsigned' | 'signed'
  ): Promise<any[]> {
    const variants = this.receivedEmailVariants(tenantEmail);
    const byId = new Map<string, any>();

    for (const field of ['tenantEmail', 'tenantEmailLower'] as const) {
      for (const value of variants) {
        try {
          const constraints = [where(field, '==', value)];
          if (statusFilter) {
            constraints.push(where('status', '==', statusFilter));
          }
          const snapshot = await getDocs(query(collection(db, 'contracts'), ...constraints));
          snapshot.forEach((docSnap) => {
            byId.set(docSnap.id, this.mapReceivedContractDoc(docSnap));
          });
        } catch (error) {
          console.warn(`Received contracts query failed for ${field}=${value}`, error);
        }
      }
    }

    const contracts = Array.from(byId.values()).filter((contract) => {
      const stored = String(contract.tenantEmail || '').trim().toLowerCase();
      return !stored || variants.some((value) => value.toLowerCase() === stored);
    });

    contracts.sort((a, b) => {
      const aTime = a.sentDate instanceof Date ? a.sentDate.getTime() : 0;
      const bTime = b.sentDate instanceof Date ? b.sentDate.getTime() : 0;
      return bTime - aTime;
    });

    return contracts;
  }

  /**
   * Subscribe to real-time updates for received contracts
   */
  subscribeToReceivedContracts(
    tenantEmail: string,
    callback: (contracts: any[]) => void,
    statusFilter?: 'sent' | 'unsigned' | 'signed',
    onError?: (error: Error) => void
  ): () => void {
    console.log('🔄 Subscribing to contracts for tenant:', tenantEmail);

    const variants = this.receivedEmailVariants(tenantEmail);
    const snapshotDocs = new Map<string, Map<string, any>>();
    const unsubscribers: Array<() => void> = [];

    const emit = () => {
      const merged = new Map<string, any>();
      snapshotDocs.forEach((docs) => {
        docs.forEach((contract, id) => merged.set(id, contract));
      });

      const contracts = Array.from(merged.values())
        .filter((contract) => {
          const stored = String(contract.tenantEmail || '').trim().toLowerCase();
          return !stored || variants.some((value) => value.toLowerCase() === stored);
        })
        .sort((a, b) => {
          const aTime = a.sentDate instanceof Date ? a.sentDate.getTime() : 0;
          const bTime = b.sentDate instanceof Date ? b.sentDate.getTime() : 0;
          return bTime - aTime;
        });

      callback(contracts);
    };

    for (const field of ['tenantEmail', 'tenantEmailLower'] as const) {
      for (const value of variants) {
        const listenerKey = `${field}:${value}`;
        const constraints = [where(field, '==', value)];
        if (statusFilter) {
          constraints.push(where('status', '==', statusFilter));
        }

        unsubscribers.push(
          onSnapshot(
            query(collection(db, 'contracts'), ...constraints),
            (querySnapshot) => {
              const docsForListener = new Map<string, any>();
              querySnapshot.docs.forEach((docSnap) => {
                docsForListener.set(docSnap.id, this.mapReceivedContractDoc(docSnap));
              });
              snapshotDocs.set(listenerKey, docsForListener);
              emit();
            },
            (error) => {
              console.error('❌ Error in received contracts subscription:', error);
              if (onError) {
                onError(error);
              }
            }
          )
        );
      }
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }
}

export const contractService = new ContractService();
export default contractService;
