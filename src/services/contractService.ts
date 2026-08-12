import { storage } from '../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import apiService from './api';

export interface ContractTemplate {
  id: string;
  userId: string;
  name: string;
  uploadDate: string;
  fileData: string;
  fileUrl?: string;
  fileSize: number;
  fileType: string;
  imagePreview?: string;
  createdAt: any;
  updatedAt: any;
  status: 'active' | 'deleted';
  category: 'contract';
}

export interface ContractStats {
  total: number;
  active: number;
  deleted: number;
  totalSize: number;
}

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

class ContractService {
  async saveContractTemplate(
    userId: string,
    templateData: Omit<ContractTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      if (!navigator.onLine) {
        return { success: false, error: 'Device is offline.' };
      }

      let fileUrl = '';
      let fileDataPlaceholder = templateData.fileData;

      if (templateData.fileData && !templateData.fileData.startsWith('stored_')) {
        try {
          const templateId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const storageRef = ref(storage, `contractTemplates/${userId}/${templateId}.pdf`);
          const blob = base64ToBlob(templateData.fileData, templateData.fileType);
          await uploadBytes(storageRef, blob);
          fileUrl = await getDownloadURL(storageRef);
          fileDataPlaceholder = 'stored_in_firebase_storage';
        } catch (storageError) {
          console.error('❌ Failed to upload contract to Firebase Storage:', storageError);
        }
      }

      const response = await apiService.post<{templateId: string}>('/contracts/templates', {
        ...templateData,
        fileData: fileDataPlaceholder,
        ...(fileUrl ? { fileUrl } : {})
      });
      return { success: true, templateId: response.data?.templateId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserContractTemplates(userId: string): Promise<{ success: boolean; templates?: ContractTemplate[]; error?: string }> {
    try {
      const res = await apiService.get<{templates: ContractTemplate[]}>('/contracts/templates?status=active');
      return { success: true, templates: res.data?.templates || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDeletedContractTemplates(userId: string): Promise<{ success: boolean; templates?: ContractTemplate[]; error?: string }> {
    try {
      const res = await apiService.get<{templates: ContractTemplate[]}>('/contracts/templates?status=deleted');
      return { success: true, templates: res.data?.templates || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.put(`/contracts/templates/${templateId}/status`, { status: 'deleted' });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async restoreContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.put(`/contracts/templates/${templateId}/status`, { status: 'active' });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async permanentlyDeleteContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/contracts/templates/${templateId}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getContractStats(userId: string): Promise<{ success: boolean; stats?: ContractStats; error?: string }> {
    try {
      const res = await apiService.get<{stats: ContractStats}>('/contracts/stats/templates');
      return { success: true, stats: res.data?.stats };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  subscribeToUserContractTemplates(
    userId: string,
    callback: (templates: ContractTemplate[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchTemplates = async () => {
      const res = await this.getUserContractTemplates(userId);
      if (active && res.success && res.templates) callback(res.templates);
      else if (res.error && onError && active) onError(new Error(res.error));
    };
    fetchTemplates();
    const interval = setInterval(fetchTemplates, 10000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToDeletedContractTemplates(
    userId: string,
    callback: (templates: ContractTemplate[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchTemplates = async () => {
      const res = await this.getDeletedContractTemplates(userId);
      if (active && res.success && res.templates) callback(res.templates);
      else if (res.error && onError && active) onError(new Error(res.error));
    };
    fetchTemplates();
    const interval = setInterval(fetchTemplates, 10000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToContractStats(
    userId: string,
    callback: (stats: ContractStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchStats = async () => {
      const res = await this.getContractStats(userId);
      if (active && res.success && res.stats) callback(res.stats);
      else if (res.error && onError && active) onError(new Error(res.error));
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => { active = false; clearInterval(interval); };
  }

  async getReceivedContracts(
    tenantEmail: string,
    statusFilter?: 'sent' | 'unsigned' | 'signed'
  ): Promise<{ success: boolean; contracts?: any[]; error?: string }> {
    try {
      const response = await apiService.get('/contracts');
      let contracts = response.data || [];
      if (statusFilter) contracts = contracts.filter((c: any) => c.status === statusFilter);
      return { success: true, contracts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  subscribeToReceivedContracts(
    tenantEmail: string,
    callback: (contracts: any[]) => void,
    statusFilter?: 'sent' | 'unsigned' | 'signed',
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchContracts = async () => {
      try {
        const res = await this.getReceivedContracts(tenantEmail, statusFilter);
        if (active && res.success && res.contracts) callback(res.contracts);
        else if (res.error && onError && active) onError(new Error(res.error));
      } catch (err: any) {
        if (active && onError) onError(err);
      }
    };
    fetchContracts();
    const interval = setInterval(fetchContracts, 10000);
    return () => { active = false; clearInterval(interval); };
  }
}

export const contractService = new ContractService();
export default contractService;
