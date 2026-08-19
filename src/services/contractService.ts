import { storage } from '../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import apiService from './api';
import sseService from './sseService';

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

type SubscriberCallback<T> = (data: T) => void;
type SubscriberErrorCallback = (error: Error) => void;

interface ContractSubscription<T = any> {
  id: string;
  fetcher: () => Promise<T>;
  callback: SubscriberCallback<T>;
  onError?: SubscriberErrorCallback;
}

export class ContractPollingCoordinator {
  private subscriptions = new Map<string, ContractSubscription>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sseUnsubscribe: (() => void) | null = null;
  private pollIntervalMs = 30000; // 30s background safety poll

  constructor() {
    this.initSse();
  }

  private initSse(): void {
    if (typeof window !== 'undefined' && !this.sseUnsubscribe) {
      this.sseUnsubscribe = sseService.on(
        ['contract_template_updated', 'contract_sent', 'contract_synced'],
        (event) => {
          console.debug('[ContractPollingCoordinator] Received SSE event:', event.type);
          this.refreshAll();
        }
      );
    }
  }

  subscribe<T>(
    fetcher: () => Promise<T>,
    callback: SubscriberCallback<T>,
    onError?: SubscriberErrorCallback
  ): () => void {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sub: ContractSubscription<T> = { id, fetcher, callback, onError };
    this.subscriptions.set(id, sub);

    // Initial fetch
    fetcher()
      .then(data => callback(data))
      .catch(err => {
        if (onError) onError(err instanceof Error ? err : new Error(err?.message || 'Fetch error'));
      });

    return () => {
      this.subscriptions.delete(id);
    };
  }

  refreshAll(): void {
    this.subscriptions.forEach(sub => {
      sub.fetcher()
        .then(data => {
          try {
            sub.callback(data);
          } catch (e) {
            console.error('Error invoking contract subscriber callback:', e);
          }
        })
        .catch(err => {
          if (sub.onError) sub.onError(err instanceof Error ? err : new Error(err?.message || 'Refresh error'));
        });
    });
  }

  getActiveSubscriberCount(): number {
    return this.subscriptions.size;
  }
}

export const contractPollingCoordinator = new ContractPollingCoordinator();

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
      contractPollingCoordinator.refreshAll();
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
      contractPollingCoordinator.refreshAll();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async restoreContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.put(`/contracts/templates/${templateId}/status`, { status: 'active' });
      contractPollingCoordinator.refreshAll();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async permanentlyDeleteContractTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/contracts/templates/${templateId}`);
      contractPollingCoordinator.refreshAll();
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
    return contractPollingCoordinator.subscribe(
      async () => {
        const res = await this.getUserContractTemplates(userId);
        if (res.success && res.templates) return res.templates;
        throw new Error(res.error || 'Failed to fetch contract templates');
      },
      callback,
      onError
    );
  }

  subscribeToDeletedContractTemplates(
    userId: string,
    callback: (templates: ContractTemplate[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return contractPollingCoordinator.subscribe(
      async () => {
        const res = await this.getDeletedContractTemplates(userId);
        if (res.success && res.templates) return res.templates;
        throw new Error(res.error || 'Failed to fetch deleted templates');
      },
      callback,
      onError
    );
  }

  subscribeToContractStats(
    userId: string,
    callback: (stats: ContractStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    return contractPollingCoordinator.subscribe(
      async () => {
        const res = await this.getContractStats(userId);
        if (res.success && res.stats) return res.stats;
        throw new Error(res.error || 'Failed to fetch contract stats');
      },
      callback,
      onError
    );
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
    return contractPollingCoordinator.subscribe(
      async () => {
        const res = await this.getReceivedContracts(tenantEmail, statusFilter);
        if (res.success && res.contracts) return res.contracts;
        throw new Error(res.error || 'Failed to fetch received contracts');
      },
      callback,
      onError
    );
  }
}

export const contractService = new ContractService();
export default contractService;
