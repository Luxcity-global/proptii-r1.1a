import apiService from './api';
import sseService from './sseService';

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
  documentUrl?: string; 
  documentBase64?: string; 
  documentName: string;
  documentSize: number;
  documentType: string;
  status: 'signed' | 'sent' | 'delivered';
  emailSent: boolean;
  emailSentDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignedContractStats {
  total: number;
  signed: number;
  sent: number;
  delivered: number;
}

class SignedContractsFirestoreService {
  async saveSignedContract(
    userId: string,
    contractData: Omit<SignedContractData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; contractId?: string; error?: string }> {
    try {
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, signed contract will be saved when connection is restored');
        return { success: false, error: 'Device is offline.' };
      }

      const response = await apiService.post('/contracts', contractData);
      logDev('✅ Signed contract saved successfully:', response.id);
      return { success: true, contractId: response.id };
    } catch (error: any) {
      console.error('❌ Error saving signed contract:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  async getUserSignedContracts(userId: string): Promise<{ success: boolean; contracts?: SignedContractData[]; error?: string }> {
    try {
      const response = await apiService.get(`/contracts`);
      // Backend returns { success, data } — map to contracts
      const contracts = (response.data || response.contracts || []).map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));
      return { success: true, contracts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSignedContractById(contractId: string): Promise<{ success: boolean; contract?: SignedContractData; error?: string }> {
    try {
      const response = await apiService.get(`/contracts/${contractId}`);
      if (!response.contract) return { success: false, error: 'Contract not found' };
      const contract = {
        ...response.contract,
        createdAt: new Date(response.contract.createdAt),
        updatedAt: new Date(response.contract.updatedAt)
      };
      return { success: true, contract };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateSignedContractStatus(
    contractId: string, 
    status: 'signed' | 'sent' | 'delivered',
    emailSent: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = { status };
      if (emailSent) {
        payload.emailSent = true;
        payload.emailSentDate = new Date().toISOString();
      }
      await apiService.put(`/contracts/${contractId}/status`, payload);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteSignedContract(contractId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/contracts/${contractId}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  onSignedContractsChange(
    userId: string, 
    callback: (contracts: SignedContractData[]) => void
  ): () => void {
    let isActive = true;

    const fetchContracts = async () => {
      if (!isActive) return;
      try {
        const { success, contracts } = await this.getUserSignedContracts(userId);
        if (isActive && success && contracts) callback(contracts);
      } catch (err) {
        console.error('Error fetching signed contracts:', err);
      }
    };

    // Initial fetch on subscribe
    fetchContracts();

    // Real-time SSE push listener (no polling timer)
    const unsubscribeSse = sseService.on(
      ['contract_sent', 'contract_synced', 'contract_template_updated'],
      () => {
        fetchContracts();
      }
    );

    return () => {
      isActive = false;
      unsubscribeSse();
    };
  }
}

export default new SignedContractsFirestoreService();