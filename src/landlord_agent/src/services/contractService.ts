import apiService from '../../../services/api';
import { Contract } from '../components/ContractsPage';
import { contractEmailService } from './contractEmailService';

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
      return response.id;
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
      return response.id;
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
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, value.toString());
        });
      }
      const response = await apiService.get(`/contracts/landlord?${queryParams.toString()}`);
      return (response.contracts || []).map((c: any) => ({
        ...c,
        sentDate: new Date(c.sentDate),
        signedDate: c.signedDate ? new Date(c.signedDate) : undefined,
        expiryDate: c.expiryDate ? new Date(c.expiryDate) : undefined,
      }));
    } catch (error) {
      console.error('Error getting contracts:', error);
      return [];
    }
  }

  async getContract(contractId: string): Promise<Contract | null> {
    try {
      const response = await apiService.get(`/contracts/landlord/${contractId}`);
      if (!response.contract) return null;
      return {
        ...response.contract,
        sentDate: new Date(response.contract.sentDate),
        signedDate: response.contract.signedDate ? new Date(response.contract.signedDate) : undefined,
        expiryDate: response.contract.expiryDate ? new Date(response.contract.expiryDate) : undefined,
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

  async deleteContract(contractId: string): Promise<void> {
    await apiService.delete(`/contracts/landlord/${contractId}`);
  }

  async getExpiringContracts(days: number = 7): Promise<Contract[]> {
    try {
      const response = await apiService.get(`/contracts/landlord/expiring?days=${days}`);
      return (response.contracts || []).map((c: any) => ({
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
