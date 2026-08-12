import apiService from './api';
import landlordUserService from './landlordUserService';
import { SignedContractData } from './signedContractsFirestoreService';

export interface LandlordContract {
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  landlordEmail?: string;
  landlordId?: string;
  status: 'sent' | 'unsigned' | 'signed';
  sentDate: Date;
  signedDate?: Date;
  expiryDate?: Date;
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other';
  fileUrl: string;
  fileName: string;
  fileBase64?: string;
  additionalInfo?: string;
  createdAt?: Date;
  notificationSent?: boolean;
  reminderCount?: number;
}

class ContractSyncService {
  async checkRecipientsForLandlords(recipientEmails: string[]): Promise<{
    hasLandlords: boolean;
    landlords: Array<{ email: string; name: string; role: string }>;
  }> {
    try {
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
      return { hasLandlords: landlords.length > 0, landlords };
    } catch (error) {
      console.error('❌ Error checking recipients for landlords:', error);
      return { hasLandlords: false, landlords: [] };
    }
  }

  async syncSignedContractToLandlordDashboard(
    signedContractData: SignedContractData,
    landlordEmail: string
  ): Promise<{
    success: boolean;
    contractId?: string;
    error?: string;
  }> {
    try {
      const landlordResult = await landlordUserService.isLandlordOrAgent(landlordEmail);
      if (!landlordResult.isLandlord || !landlordResult.user) {
        return { success: false, error: 'Landlord user not found' };
      }
      
      const landlordUser = landlordResult.user;
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 365);
      
      const landlordContract: Omit<LandlordContract, 'id'> = {
        title: signedContractData.templateName,
        propertyAddress: signedContractData.propertyAddress || 'N/A',
        tenantName: signedContractData.tenantName,
        tenantEmail: signedContractData.tenantEmail,
        landlordEmail: landlordUser.email,
        landlordId: landlordUser.id,
        status: 'signed',
        sentDate: new Date(),
        signedDate: new Date(signedContractData.signedDate),
        contractType: 'tenancy-agreement',
        fileUrl: signedContractData.documentUrl || '#',
        fileName: signedContractData.documentName,
        fileBase64: signedContractData.documentBase64,
        additionalInfo: `Signed contract sent from tenant app. Agent: ${signedContractData.agentName}`,
        createdAt: new Date(),
        notificationSent: true,
        reminderCount: 0,
        expiryDate
      };
      
      const response = await apiService.post('/contracts/landlord/sync', landlordContract);
      return { success: true, contractId: response.id };
    } catch (error: any) {
      console.error('❌ Error syncing contract to landlord dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  async syncToMultipleLandlords(
    signedContractData: SignedContractData,
    landlordEmails: string[]
  ): Promise<{
    success: boolean;
    syncedCount: number;
    results: Array<{ email: string; success: boolean; contractId?: string; error?: string }>;
  }> {
    try {
      const results: Array<{ email: string; success: boolean; contractId?: string; error?: string }> = [];
      let syncedCount = 0;
      
      for (const landlordEmail of landlordEmails) {
        const result = await this.syncSignedContractToLandlordDashboard(signedContractData, landlordEmail);
        results.push({
          email: landlordEmail,
          success: result.success,
          contractId: result.contractId,
          error: result.error
        });
        if (result.success) syncedCount++;
      }
      
      return { success: syncedCount > 0, syncedCount, results };
    } catch (error) {
      console.error('❌ Error syncing to multiple landlords:', error);
      return { success: false, syncedCount: 0, results: [] };
    }
  }

  async contractExistsInLandlordDashboard(
    tenantEmail: string,
    contractName: string,
    landlordEmail: string
  ): Promise<boolean> {
    try {
      const response = await apiService.get(`/contracts/landlord/exists?tenantEmail=${tenantEmail}&title=${contractName}&landlordEmail=${landlordEmail}`);
      return response.exists;
    } catch (error) {
      console.error('❌ Error checking contract existence:', error);
      return false;
    }
  }
}

export default new ContractSyncService();
