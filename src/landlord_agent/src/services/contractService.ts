import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Contract } from '../components/ContractsPage';
import { contractEmailService } from './contractEmailService';

class ContractService {
  private contractsCollection = collection(db, 'contracts');

  /**
   * Create a new contract and send via email
   */
  async createContract(
    contractData: Omit<Contract, 'id' | 'fileUrl' | 'fileName'>,
    file: File,
    ownerUserId: string,
    sendEmail: boolean = true,
    includeAttachment: boolean = false
  ): Promise<string> {
    try {
      // 1. Upload file to Firebase Storage
      const filePath = `contracts/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. Create contract document in Firestore
      const contractDoc = {
        ...contractData,
        fileUrl,
        filePath,
        fileName: file.name,
        userId: ownerUserId, // Scope contract to owner
        createdAt: Timestamp.now(),
        sentDate: Timestamp.now(),
        notificationSent: false,
        reminderCount: 0,
        status: 'sent' as const
      };
      console.log('✅ ContractService: Creating contract with userId:', ownerUserId);

      const docRef = await addDoc(this.contractsCollection, contractDoc);
      const contractId = docRef.id;

      // 3. Send email notification if requested
      if (sendEmail && contractData.tenantEmail) {
        try {
          // Try sending with attachment first, but continue without it if attachment fetch fails
          const emailResult = await contractEmailService.sendContractEmail({
            to: contractData.tenantEmail,
            recipientName: contractData.tenantName,
            contractTitle: contractData.title,
            contractFileUrl: fileUrl,
            fileName: file.name,
            additionalInfo: contractData.additionalInfo,
            expiryDate: contractData.expiryDate
          }, includeAttachment); // includeAttachment = whether to try fetching attachment

          // Update contract with email status
          if (emailResult.success) {
            await updateDoc(docRef, {
              notificationSent: true,
              emailMessageId: emailResult.messageId
            });
          } else {
            console.warn('Contract saved but email failed:', emailResult.error);
            // Still save the contract even if email fails
          }
        } catch (emailError) {
          console.error('Error sending contract email:', emailError);
          // Contract is still saved even if email fails
        }
      }

      return contractId;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  /**
   * Create a contract without uploading to Firebase Storage (for base64 emails)
   */
  async createContractWithBase64(
    contractData: Omit<Contract, 'id' | 'fileUrl' | 'fileName'>,
    fileName: string,
    base64Data: string,
    ownerUserId: string
  ): Promise<string> {
    try {
      // Store the base64 data URL directly
      const fileUrl = base64Data;

      // Create contract document in Firestore
      const contractDoc: any = {
        title: contractData.title,
        propertyAddress: contractData.propertyAddress,
        tenantName: contractData.tenantName,
        tenantEmail: contractData.tenantEmail,
        contractType: contractData.contractType,
        fileUrl,
        fileName: fileName,
        userId: ownerUserId, // Scope contract to owner
        createdAt: Timestamp.now(),
        sentDate: Timestamp.now(),
        notificationSent: true,
        reminderCount: 0,
        status: 'sent' as const
      };
      console.log('✅ ContractService: Creating contract with base64 and userId:', ownerUserId);
      
      // Only include optional fields if they exist
      if (contractData.expiryDate) {
        contractDoc.expiryDate = Timestamp.fromDate(contractData.expiryDate);
      }
      if (contractData.additionalInfo) {
        contractDoc.additionalInfo = contractData.additionalInfo;
      }

      const docRef = await addDoc(this.contractsCollection, contractDoc);
      console.log('Contract saved to Firestore with base64 URL:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating contract with base64:', error);
      throw error;
    }
  }

  /**
   * Get all contracts with optional filters
   */
  async getContracts(
    filters?: {
      userId?: string;
      status?: Contract['status'];
      tenantId?: string;
      propertyId?: string;
    }
  ): Promise<Contract[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // userId filter should be applied first for security
      if (filters?.userId) {
        console.log('🔍 ContractService: Filtering by userId:', filters.userId);
        constraints.push(where('userId', '==', filters.userId));
      } else {
        console.warn('⚠️ ContractService: No userId filter provided - will load all contracts');
      }

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.tenantId) {
        constraints.push(where('tenantId', '==', filters.tenantId));
      }
      if (filters?.propertyId) {
        constraints.push(where('propertyId', '==', filters.propertyId));
      }

      // Only add orderBy if we have filters, otherwise it requires an index
      // If no filters, we'll sort in-memory after fetching
      if (constraints.length > 0) {
        try {
          constraints.push(orderBy('createdAt', 'desc'));
          const q = query(this.contractsCollection, ...constraints);
          const querySnapshot = await getDocs(q);
          const contracts = this.mapContractDocs(querySnapshot.docs);
          console.log(`✅ ContractService: Found ${contracts.length} contracts for userId: ${filters?.userId || 'none'}`);
          return contracts;
        } catch (indexError: any) {
          // If index error, fetch without orderBy and sort in memory
          if (indexError.code === 'failed-precondition' && indexError.message?.includes('index')) {
            console.warn('Firestore index missing. Fetching without orderBy and sorting in memory.');
            const q = query(this.contractsCollection, ...constraints.slice(0, -1)); // Remove orderBy
            const querySnapshot = await getDocs(q);
            const contracts = this.mapContractDocs(querySnapshot.docs);
            // Sort in memory
            return contracts.sort((a, b) => b.sentDate.getTime() - a.sentDate.getTime());
          }
          throw indexError;
        }
      } else {
        // No filters, fetch all and sort in memory (with userId filter if provided)
        let querySnapshot;
        if (filters?.userId) {
          // Still apply userId filter even if no other filters
          const q = query(this.contractsCollection, where('userId', '==', filters.userId));
          querySnapshot = await getDocs(q);
          console.log(`✅ ContractService: Found ${querySnapshot.docs.length} contracts for userId: ${filters.userId} (no other filters)`);
        } else {
          console.warn('⚠️ ContractService: Fetching all contracts (no userId filter)');
          querySnapshot = await getDocs(this.contractsCollection);
        }
        const contracts = this.mapContractDocs(querySnapshot.docs);
        return contracts.sort((a, b) => b.sentDate.getTime() - a.sentDate.getTime());
      }
    } catch (error) {
      console.error('Error getting contracts:', error);
      throw error;
    }
  }

  /**
   * Helper method to map Firestore documents to Contract objects
   */
  private mapContractDocs(docs: any[]): Contract[] {
    return docs.map(doc => {
      const data = doc.data();
      const contract: Contract & { userId?: string } = {
        id: doc.id,
        title: data.title || '',
        propertyAddress: data.propertyAddress || '',
        tenantName: data.tenantName || '',
        tenantEmail: data.tenantEmail || '',
        status: data.status || 'sent',
        contractType: data.contractType || 'other',
        fileUrl: data.fileUrl || '',
        fileName: data.fileName || '',
        sentDate: data.sentDate?.toDate() || new Date(),
        signedDate: data.signedDate?.toDate(),
        expiryDate: data.expiryDate?.toDate(),
        additionalInfo: data.additionalInfo,
      };
      // Preserve userId for verification
      if (data.userId) {
        (contract as any).userId = data.userId;
      }
      return contract;
    });
  }

  /**
   * Get a single contract by ID
   */
  async getContract(contractId: string): Promise<Contract | null> {
    try {
      const docRef = doc(this.contractsCollection, contractId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const contract: Contract & { userId?: string } = {
          id: docSnap.id,
          title: data.title || '',
          propertyAddress: data.propertyAddress || '',
          tenantName: data.tenantName || '',
          tenantEmail: data.tenantEmail || '',
          status: data.status || 'sent',
          contractType: data.contractType || 'other',
          fileUrl: data.fileUrl || '',
          fileName: data.fileName || '',
          sentDate: data.sentDate?.toDate() || new Date(),
          signedDate: data.signedDate?.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          additionalInfo: data.additionalInfo,
          filePath: data.filePath, // Internal use only
        };
        // Preserve userId
        if (data.userId) {
          (contract as any).userId = data.userId;
        }
        return contract;
      }
      return null;
    } catch (error) {
      console.error('Error getting contract:', error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    contractId: string,
    status: Contract['status'],
    signedDate?: Date
  ): Promise<void> {
    try {
      const docRef = doc(this.contractsCollection, contractId);
      const updateData: any = { status };

      if (signedDate) {
        updateData.signedDate = Timestamp.fromDate(signedDate);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }
  }

  /**
   * Mark contract as signed
   */
  async markAsSigned(
    contractId: string,
    signedBy: 'tenant' | 'landlord'
  ): Promise<void> {
    try {
      const docRef = doc(this.contractsCollection, contractId);
      const updateData: any = {
        [`${signedBy}Signature.signed`]: true,
        [`${signedBy}Signature.signedAt`]: Timestamp.now(),
        status: 'signed' as const,
        signedDate: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error marking contract as signed:', error);
      throw error;
    }
  }

  /**
   * Delete a contract
   */
  async deleteContract(contractId: string): Promise<void> {
    try {
      // Get contract to find file path
      const contract = await this.getContract(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Delete file from Storage
      if (contract.filePath) {
        const storageRef = ref(storage, contract.filePath);
        await deleteObject(storageRef);
      }

      // Delete document from Firestore
      const docRef = doc(this.contractsCollection, contractId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(days: number = 7): Promise<Contract[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      
      const q = query(
        this.contractsCollection,
        where('expiryDate', '<=', Timestamp.fromDate(expiryDate)),
        where('status', '==', 'sent'),
        orderBy('expiryDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          propertyAddress: data.propertyAddress || '',
          tenantName: data.tenantName || '',
          tenantEmail: data.tenantEmail || '',
          status: data.status || 'sent',
          contractType: data.contractType || 'other',
          fileUrl: data.fileUrl || '',
          fileName: data.fileName || '',
          sentDate: data.sentDate?.toDate() || new Date(),
          signedDate: data.signedDate?.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          additionalInfo: data.additionalInfo,
        } as Contract;
      });
    } catch (error) {
      console.error('Error getting expiring contracts:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService();
