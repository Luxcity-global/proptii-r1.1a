import apiService from '../../../services/api';
import type { Tenant } from '../App';
import { paymentScheduleService } from './paymentScheduleService';

class TenantService {
  async createTenant(tenantData: Omit<Tenant, 'id'>, ownerUserId: string): Promise<string> {
    try {
      console.log('✅ TenantService: Creating tenant with userId:', ownerUserId);
      const payload = {
        ...tenantData,
        userId: ownerUserId,
        status: (tenantData as any).status || 'active',
      };
      // apiService.post() returns ApiResponse<BackendPayload> — the actual backend
      // response is nested under .data, so we must unwrap it here.
      const response = await apiService.post('/tenants', payload);
      const data = (response as any).data ?? response; // unwrap ApiResponse envelope
      const tenantId: string = data.id;

      if (!tenantId) {
        console.error('[tenantService] Backend response missing id field:', response);
        throw new Error('Backend did not return a tenant ID');
      }
      
      try {
        const createdTenant: Tenant = {
          ...tenantData,
          id: tenantId
        } as Tenant;
        
        console.log('📅 [tenantService] Generating payment schedule for tenant:', tenantId);
        await paymentScheduleService.generateScheduleForTenant(createdTenant, {
          historyPeriods: 6,
          futurePeriods: 12,
          managerId: ownerUserId
        });
        console.log('✅ [tenantService] Payment schedule generated successfully');
      } catch (scheduleError) {
        console.error('⚠️ [tenantService] Error generating payment schedule:', scheduleError);
      }
      
      return tenantId;
    } catch (error) {
      console.error('❌ [tenantService] ERROR creating tenant:', error);
      throw error;
    }
  }

  async getTenants(ownerUserId?: string, ownedPropertyIds?: Set<string>): Promise<Tenant[]> {
    try {
      // Build query params — pass userId so backend can use it as a fallback
      // alongside the JWT uid for users whose tenants were stored with email as userId
      const params = new URLSearchParams();
      if (ownerUserId) params.append('userId', ownerUserId);
      if (ownedPropertyIds && ownedPropertyIds.size > 0) {
        params.append('ownedPropertyIds', Array.from(ownedPropertyIds).join(','));
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiService.get(`/tenants${queryString}`);
      // Unwrap ApiResponse envelope
      const payload = (response as any).data ?? response;
      const list = payload.tenants || payload || [];
      return list.map((t: any) => this.mapTenant(t));
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }

  async getTenant(id: string): Promise<Tenant | null> {
    try {
      if (!id || id === 'undefined') {
        console.warn('[tenantService] getTenant called with invalid id:', id);
        return null;
      }
      const response = await apiService.get(`/tenants/${id}`);
      // Unwrap ApiResponse envelope
      const payload = (response as any).data ?? response;
      const tenantData = payload.tenant ?? payload;
      if (!tenantData || !tenantData.id) return null;
      return this.mapTenant(tenantData);
    } catch {
      return null;
    }
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
    const existing = await this.getTenant(id);
    await apiService.put(`/tenants/${id}`, updates);
    
    if (existing && (updates.paymentFrequency || updates.firstPaymentDate || updates.rentAmount !== undefined)) {
      try {
        const updatedTenant: Tenant = {
          ...existing,
          ...updates
        } as Tenant;
        
        console.log('📅 [tenantService] Regenerating payment schedule due to payment-related changes');
        await paymentScheduleService.generateScheduleForTenant(updatedTenant, {
          historyPeriods: 6,
          futurePeriods: 12,
          managerId: (existing as any)?.userId
        });
        console.log('✅ [tenantService] Payment schedule regenerated successfully');
      } catch (scheduleError) {
        console.error('⚠️ [tenantService] Error regenerating payment schedule:', scheduleError);
      }
    }
  }

  async deleteTenant(id: string): Promise<void> {
    await apiService.delete(`/tenants/${id}`);
  }

  async bulkCreateTenants(tenants: Omit<Tenant, 'id'>[], ownerUserId: string): Promise<{
    total: number; succeeded: number; failed: number;
    results: { index: number; success: boolean; id?: string; error?: string }[];
  }> {
    try {
      const response = await apiService.post('/tenants/bulk', { tenants: tenants.map(t => ({ ...t, userId: ownerUserId })) });
      const data = (response as any).data ?? response;
      return data;
    } catch (error: any) {
      // Fallback: sequential individual creates if bulk endpoint unavailable
      const results: { index: number; success: boolean; id?: string; error?: string }[] = [];
      let succeeded = 0;
      let failed = 0;
      for (let i = 0; i < tenants.length; i++) {
        try {
          const id = await this.createTenant(tenants[i], ownerUserId);
          results.push({ index: i, success: true, id });
          succeeded++;
        } catch (err: any) {
          results.push({ index: i, success: false, error: err?.message || 'Unknown error' });
          failed++;
        }
        if (i < tenants.length - 1) await new Promise(r => setTimeout(r, 50));
      }
      return { total: tenants.length, succeeded, failed, results };
    }
  }

  private mapTenant(data: any): Tenant {
    const tenant: Tenant & { userId?: string } = {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      propertyAddress: data.propertyAddress || '',
      propertyId: data.propertyId || '',
      rentAmount: data.rentAmount || 0,
      leaseStart: data.leaseStart ? new Date(data.leaseStart) : new Date(),
      leaseEnd: data.leaseEnd ? new Date(data.leaseEnd) : new Date(),
      status: data.status || 'active',
      referencingStatus: data.referencingStatus || 'not-started',
      paymentStatus: data.paymentStatus || 'current',
      paymentFrequency: data.paymentFrequency || 'monthly',
      firstPaymentDate: data.firstPaymentDate ? new Date(data.firstPaymentDate) : undefined,
      avatar: data.avatar,
      emergencyContact: data.emergencyContact,
      defaultRiskScore: data.defaultRiskScore,
      lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : undefined,
      overdueAmount: data.overdueAmount,
    };
    
    if (data.userId) (tenant as any).userId = data.userId;
    if (data.notes) (tenant as any).notes = data.notes;
    if (data.employer) (tenant as any).employer = data.employer;
    if (data.jobTitle) (tenant as any).jobTitle = data.jobTitle;
    if (data.annualIncome) (tenant as any).annualIncome = data.annualIncome;
    if (data.employmentType) (tenant as any).employmentType = data.employmentType;
    return tenant;
  }
}

export const tenantService = new TenantService();
