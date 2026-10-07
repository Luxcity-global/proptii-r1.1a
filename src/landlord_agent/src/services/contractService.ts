import apiService from '../../../services/api';
import { Contract } from '../components/ContractsPage';
import { contractEmailService } from './contractEmailService';

function apiBody(response: any): any {
  if (response && typeof response === 'object' && response.data !== undefined && response.success !== false) {
    return response.data;
  }
  return response;
}

class ContractService {
  async createContract(
    contractData: Omit<Contract, 'id' | 'fileUrl' | 'fileName'>,
    file: File,
    ownerUserId: string,
    sendEmail: boolean = true,
    includeAttachment: boolean = false
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contractData', JSON.stringify({ ...contractData, ownerUserId, sendEmail, includeAttachment }));
      
      const response = await apiService.post('/contracts/landlord', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const body = apiBody(response);
      const id = body?.id || body?.contractId;
      if (!id) throw new Error('Backend did not return a contract ID');
      return id;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async createContractWithBase64(
    contractData: Omit<Contract, 'id' | 'fileUrl' | 'fileName'> & { landlordEmail?: string },
    fileName: string,
    base64Data: string,
    ownerUserId: string
  ): Promise<string> {
    try {
      const response = await apiService.post('/contracts/landlord/base64', {
        contractData: { ...contractData, ownerUserId },
        fileName,
        base64Data
      });
      const body = apiBody(response);
      const id = body?.id || body?.contractId;
      if (!id) throw new Error('Backend did not return a contract ID');
      return id;
    } catch (error) {
      console.error('Error creating contract with base64:', error);
      throw error;
    }
  }

  async getContracts(
    filters?: {
      userId?: string;
      status?: Contract['status'];
      tenantId?: string;
      propertyId?: string;
      landlordEmail?: string;
      landlordId?: string;
    }
  ): Promise<Contract[]> {
    try {
      const byEmail = filters?.landlordEmail
        ? this.fetchContractList({
            landlordEmail: filters.landlordEmail,
            status: filters.status,
            propertyId: filters.propertyId,
          }).catch(() => [] as Contract[])
        : Promise.resolve([] as Contract[]);
      const byId = (filters?.userId || filters?.landlordId)
        ? this.fetchContractList(filters).catch(() => [] as Contract[])
        : Promise.resolve([] as Contract[]);
      const [emailRows, idRows] = await Promise.all([byEmail, byId]);
      const merged = new Map<string, Contract>();
      for (const contract of [...emailRows, ...idRows]) {
        if (contract?.id) merged.set(contract.id, contract);
      }
      return Array.from(merged.values());
    } catch (error) {
      console.error('Error getting contracts:', error);
      return [];
    }
  }

  private async fetchContractList(
    filters?: {
      userId?: string;
      status?: Contract['status'];
      tenantId?: string;
      propertyId?: string;
      landlordEmail?: string;
      landlordId?: string;
    }
  ): Promise<Contract[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') queryParams.append(key, value.toString());
      });
    }
    const response = await apiService.get(`/contracts/landlord?${queryParams.toString()}`);
    const body = apiBody(response);
    const list = body?.contracts || body?.data || [];
    return (Array.isArray(list) ? list : []).map((c: any) => ({
      ...c,
      sentDate: c.sentDate ? new Date(c.sentDate) : new Date(),
      signedDate: c.signedDate ? new Date(c.signedDate) : undefined,
      expiryDate: c.expiryDate ? new Date(c.expiryDate) : undefined,
    }));
  }

  async getContract(contractId: string): Promise<Contract | null> {
    try {
      const response = await apiService.get(`/contracts/landlord/${contractId}`);
      const body = apiBody(response);
      const contract = body?.contract;
      if (!contract) return null;
      return {
        ...contract,
        sentDate: new Date(contract.sentDate),
        signedDate: contract.signedDate ? new Date(contract.signedDate) : undefined,
        expiryDate: contract.expiryDate ? new Date(contract.expiryDate) : undefined,
      };
    } catch {
      return null;
    }
  }

  async updateContractStatus(
    contractId: string,
    status: Contract['status'],
    signedDate?: Date
  ): Promise<void> {
    await apiService.put(`/contracts/landlord/${contractId}/status`, {
      status,
      signedDate: signedDate ? signedDate.toISOString() : undefined
    });
  }

  async markAsSigned(
    contractId: string,
    signedBy: 'tenant' | 'landlord'
  ): Promise<void> {
    await apiService.put(`/contracts/landlord/${contractId}/sign`, { signedBy });
  }

  async saveLandlordSignature(
    contract: Contract,
    documentUrl: string,
    landlordId: string,
    landlordEmail: string,
  ): Promise<void> {
    const baseName = contract.fileName || contract.title || 'contract';
    const fileName = baseName.toLowerCase().endsWith('.pdf')
      ? baseName.replace(/\.pdf$/i, '_signed.pdf')
      : `${baseName}_signed.pdf`;
    const storedUrl = /^https?:\/\//i.test(documentUrl) || documentUrl.startsWith('data:application/pdf')
      ? documentUrl
      : (contract.fileUrl && contract.fileUrl !== '#' ? contract.fileUrl : '');
    await apiService.post('/contracts', {
      id: contract.id,
      title: contract.title,
      contractName: contract.title,
      propertyAddress: contract.propertyAddress || '',
      tenantName: contract.tenantName || '',
      tenantEmail: contract.tenantEmail || '',
      landlordId,
      landlordEmail,
      agentEmail: landlordEmail,
      contractType: contract.contractType,
      status: contract.status,
      signedBy: 'landlord',
      signedDate: new Date().toISOString(),
      sentDate: contract.sentDate instanceof Date ? contract.sentDate.toISOString() : contract.sentDate,
      expiryDate: contract.expiryDate instanceof Date ? contract.expiryDate.toISOString() : contract.expiryDate,
      ...(storedUrl ? { fileUrl: storedUrl, documentUrl: storedUrl } : {}),
      fileName,
    });
  }

  async deleteContract(contractId: string): Promise<void> {
    await apiService.delete(`/contracts/landlord/${contractId}`);
  }

  async getExpiringContracts(days: number = 7): Promise<Contract[]> {
    try {
      const response = await apiService.get(`/contracts/landlord/expiring?days=${days}`);
      const body = apiBody(response);
      const list = body?.contracts || [];
      return (Array.isArray(list) ? list : []).map((c: any) => ({
        ...c,
        sentDate: new Date(c.sentDate),
        signedDate: c.signedDate ? new Date(c.signedDate) : undefined,
        expiryDate: c.expiryDate ? new Date(c.expiryDate) : undefined,
      }));
    } catch {
      return [];
    }
  }
}

export const contractService = new ContractService();
