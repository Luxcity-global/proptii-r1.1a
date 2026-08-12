import apiService from '../../../services/api';
import type { Tenant } from '../App';
import { paymentScheduleService } from './paymentScheduleService';

class TenantService {
  async createTenant(tenantData: Omit<Tenant, 'id'>, ownerUserId: string): Promise<string> {
    try {
      console.log('✅ TenantService: Creating tenant with userId:', ownerUserId);
      const data = await apiService.post('/tenants', tenantData);
      
      try {
        const createdTenant: Tenant = {
          ...tenantData,
          id: data.id
        } as Tenant;
        
        console.log('📅 [tenantService] Generating payment schedule for tenant:', data.id);
        await paymentScheduleService.generateScheduleForTenant(createdTenant, {
          historyPeriods: 6,
          futurePeriods: 12,
          managerId: ownerUserId
        });
        console.log('✅ [tenantService] Payment schedule generated successfully');
      } catch (scheduleError) {
        console.error('⚠️ [tenantService] Error generating payment schedule:', scheduleError);
      }
      
      return data.id;
    } catch (error) {
      console.error('❌ [tenantService] ERROR creating tenant:', error);
      throw error;
    }
  }

  async getTenants(ownerUserId?: string, ownedPropertyIds?: Set<string>): Promise<Tenant[]> {
    try {
      const propIdsParam = ownedPropertyIds && ownedPropertyIds.size > 0 
        ? `?ownedPropertyIds=${Array.from(ownedPropertyIds).join(',')}` 
        : '';
        
      const response = await apiService.get(`/tenants${propIdsParam}`);
      const list = response.tenants || [];
      return list.map((t: any) => this.mapTenant(t));
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }

  async getTenant(id: string): Promise<Tenant | null> {
    try {
      const response = await apiService.get(`/tenants/${id}`);
      return this.mapTenant(response.tenant);
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
