import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import landlordUserService from './landlordUserService';
import { SignedContractData } from './signedContractsFirestoreService';

/**
 * Contract data structure expected by landlord dashboard ContractsPage
 */
export interface LandlordContract {
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  landlordEmail?: string;
  landlordId?: string;
  status: 'sent' | 'unsigned' | 'signed';
  sentDate: Date | Timestamp;
  signedDate?: Date | Timestamp;
  expiryDate?: Date | Timestamp;
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other';
  fileUrl: string;
  fileName: string;
  fileBase64?: string; // Store base64 for offline access
  additionalInfo?: string;
  createdAt?: Timestamp;
  notificationSent?: boolean;
  reminderCount?: number;
}

/**
 * Service to sync signed contracts from tenant app to landlord dashboard
 */
class ContractSyncService {
  private readonly landlordContractsCollection = 'contracts';
  private readonly signedContractsCollection = 'signedContracts';

  /**
   * Check if recipient emails include any landlord/agent users
   */
  async checkRecipientsForLandlords(recipientEmails: string[]): Promise<{
    hasLandlords: boolean;
    landlords: Array<{ email: string; name: string; role: string }>;
  }> {
    try {
      console.log('🔍 Checking recipients for landlord/agent accounts:', recipientEmails);
      
      const landlords: Array<{ email: string; name: string; role: string }> = [];
      
      for (const email of recipientEmails) {
        const result = await landlordUserService.isLandlordOrAgent(email);
        if (result.isLandlord && result.user) {
          landlords.push({
            email: result.user.email,
            name: result.user.name,
            role: result.user.role
          });
        }
      }
      
      if (landlords.length > 0) {
        console.log('✅ Found landlord/agent recipients:', landlords.length);
        return {
          hasLandlords: true,
          landlords
        };
      } else {
        console.log('ℹ️ No landlord/agent recipients found');
        return {
          hasLandlords: false,
          landlords: []
        };
      }
    } catch (error) {
      console.error('❌ Error checking recipients for landlords:', error);
      return {
        hasLandlords: false,
        landlords: []
      };
    }
  }

  /**
   * Sync a signed contract to the landlord dashboard
   */
  async syncSignedContractToLandlordDashboard(
    signedContractData: SignedContractData,
    landlordEmail: string
  ): Promise<{
    success: boolean;
    contractId?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Syncing signed contract to landlord dashboard...');
      console.log('🔄 Contract:', signedContractData.templateName);
      console.log('🔄 Landlord email:', landlordEmail);
      
      // Verify landlord user exists
      const landlordResult = await landlordUserService.isLandlordOrAgent(landlordEmail);
      if (!landlordResult.isLandlord || !landlordResult.user) {
        console.error('❌ Landlord user not found:', landlordEmail);
        return {
          success: false,
          error: 'Landlord user not found'
        };
      }
      
      const landlordUser = landlordResult.user;
      
      // Map signed contract data to landlord contract format
      const landlordContract: Omit<LandlordContract, 'id'> = {
        title: signedContractData.templateName,
        propertyAddress: signedContractData.propertyAddress || 'N/A',
        tenantName: signedContractData.tenantName,
        tenantEmail: signedContractData.tenantEmail,
        landlordEmail: landlordUser.email,
        landlordId: landlordUser.id,
        status: 'signed', // Contract is already signed
        sentDate: Timestamp.now(),
        signedDate: Timestamp.fromDate(new Date(signedContractData.signedDate)),
        contractType: 'tenancy-agreement', // Default type, can be customized
        fileUrl: signedContractData.documentUrl || '#',
        fileName: signedContractData.documentName,
        fileBase64: signedContractData.documentBase64, // Store for offline access
        additionalInfo: `Signed contract sent from tenant app. Agent: ${signedContractData.agentName}`,
        createdAt: serverTimestamp() as Timestamp,
        notificationSent: true, // Email already sent
        reminderCount: 0
      };
      
      // Add expiry date if available (14 days from now as default)
      if (!landlordContract.expiryDate) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365); // 1 year default
        landlordContract.expiryDate = Timestamp.fromDate(expiryDate);
      }
      
      // Save to landlord contracts collection
      const docRef = await addDoc(
        collection(db, this.landlordContractsCollection), 
        landlordContract
      );
      
      console.log('✅ Signed contract synced to landlord dashboard:', docRef.id);
      
      return {
        success: true,
        contractId: docRef.id
      };
    } catch (error) {
      console.error('❌ Error syncing contract to landlord dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync multiple signed contracts to multiple landlord recipients
   */
  async syncToMultipleLandlords(
    signedContractData: SignedContractData,
    landlordEmails: string[]
  ): Promise<{
    success: boolean;
    syncedCount: number;
    results: Array<{ email: string; success: boolean; contractId?: string; error?: string }>;
  }> {
    try {
      console.log('🔄 Syncing signed contract to multiple landlords:', landlordEmails.length);
      
      const results: Array<{ email: string; success: boolean; contractId?: string; error?: string }> = [];
      let syncedCount = 0;
      
      for (const landlordEmail of landlordEmails) {
        const result = await this.syncSignedContractToLandlordDashboard(
          signedContractData,
          landlordEmail
        );
        
        results.push({
          email: landlordEmail,
          success: result.success,
          contractId: result.contractId,
          error: result.error
        });
        
        if (result.success) {
          syncedCount++;
        }
      }
      
      console.log(`✅ Synced to ${syncedCount}/${landlordEmails.length} landlord dashboards`);
      
      return {
        success: syncedCount > 0,
        syncedCount,
        results
      };
    } catch (error) {
      console.error('❌ Error syncing to multiple landlords:', error);
      return {
        success: false,
        syncedCount: 0,
        results: []
      };
    }
  }

  /**
   * Check if a contract exists in landlord dashboard
   */
  async contractExistsInLandlordDashboard(
    tenantEmail: string,
    contractName: string,
    landlordEmail: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.landlordContractsCollection),
        where('tenantEmail', '==', tenantEmail),
        where('title', '==', contractName),
        where('landlordEmail', '==', landlordEmail)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking contract existence:', error);
      return false;
    }
  }
}

export default new ContractSyncService();

