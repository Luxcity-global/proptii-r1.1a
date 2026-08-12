import apiService from '../../../services/api';
import type { Tenant } from '../App';

export type AlertType = 'lease-expiry' | 'unsigned-contract' | 'rent-arrears';
export type AlertStatus = 'active' | 'resolved' | 'dismissed';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  status: AlertStatus;
  severity: AlertSeverity;
  userId: string;
  
  tenantId?: string;
  contractId?: string;
  propertyId?: string;
  
  title: string;
  description: string;
  
  leaseExpiryDate?: Date;
  daysUntilExpiry?: number;
  contractTitle?: string;
  contractSentDate?: Date;
  overdueAmount?: number;
  daysPastDue?: number;
  lastPaymentDate?: Date;
  paymentFrequency?: 'monthly' | 'yearly' | 'fixed-time';
  
  propertyAddress?: string;
  tenantName?: string;
  
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  dismissedAt?: Date;
}

class AlertService {
  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = await apiService.post('/alerts', alertData);
    return data.id;
  }

  async getAlerts(
    userId: string,
    filters?: {
      type?: AlertType;
      status?: AlertStatus;
      severity?: AlertSeverity;
    }
  ): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (filters?.type) query.append('type', filters.type);
    if (filters?.status) query.append('status', filters.status);
    if (filters?.severity) query.append('severity', filters.severity);

    const alerts = await apiService.get(`/alerts?${query.toString()}`);
    return alerts.map((a: any) => ({
      ...a,
      leaseExpiryDate: a.leaseExpiryDate ? new Date(a.leaseExpiryDate) : undefined,
      contractSentDate: a.contractSentDate ? new Date(a.contractSentDate) : undefined,
      lastPaymentDate: a.lastPaymentDate ? new Date(a.lastPaymentDate) : undefined,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
      resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
      dismissedAt: a.dismissedAt ? new Date(a.dismissedAt) : undefined,
    }));
  }

  async getActiveAlerts(userId: string): Promise<Alert[]> {
    return this.getAlerts(userId, { status: 'active' });
  }

  async getAlert(alertId: string): Promise<Alert | null> {
    try {
      const data = await apiService.get(`/alerts/${alertId}`);
      return {
        ...data,
        leaseExpiryDate: data.leaseExpiryDate ? new Date(data.leaseExpiryDate) : undefined,
        contractSentDate: data.contractSentDate ? new Date(data.contractSentDate) : undefined,
        lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined,
        dismissedAt: data.dismissedAt ? new Date(data.dismissedAt) : undefined,
      };
    } catch {
      return null;
    }
  }

  async updateAlertStatus(alertId: string, status: AlertStatus): Promise<void> {
    await apiService.put(`/alerts/${alertId}/status`, { status });
  }

  async deleteAlert(alertId: string): Promise<void> {
    await apiService.delete(`/alerts/${alertId}`);
  }

  // The below functions check existing alerts on the backend as part of generation.
  // Note: Moving this heavy generation logic to backend is ideal, but for now we'll 
  // adapt it to use the new REST APIs for consistency.
  async generateAlerts(userId: string): Promise<void> {
    // This function originally interacted with Firebase directly.
    // Given the architecture migration, we should trigger a backend job or just skip complex generation client-side,
    // but to preserve functionality we can re-implement it using our new REST APIs if really needed.
    // Currently, it acts as a complex sync mechanism, which might be better refactored as a backend cron job.
    console.log('generateAlerts not implemented in frontend refactor. Please use backend generation.');
  }

  async alertExists(userId: string, type: AlertType, entityId: string): Promise<boolean> {
    const alerts = await this.getAlerts(userId, { type, status: 'active' });
    const fieldMap: Record<AlertType, string> = {
      'lease-expiry': 'tenantId',
      'unsigned-contract': 'contractId',
      'rent-arrears': 'tenantId'
    };
    const field = fieldMap[type] as keyof Alert;
    return alerts.some(a => a[field] === entityId);
  }
}

export const alertService = new AlertService();
