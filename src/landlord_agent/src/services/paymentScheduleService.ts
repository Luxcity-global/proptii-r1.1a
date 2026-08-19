import apiService from '../../../services/api';
import type { Tenant } from '../App';

export type RentPaymentStatus = 'pending' | 'paid' | 'overdue';

export interface RentPaymentPeriod {
  id: string;
  tenantId: string;
  managerId?: string;
  amountDue: number;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: RentPaymentStatus;
  paidAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GenerateScheduleOptions {
  historyPeriods?: number;
  futurePeriods?: number;
  managerId?: string;
}

class PaymentScheduleService {
  private getIntervalDays(tenant: Tenant): number {
    if (tenant.paymentIntervalDays && tenant.paymentIntervalDays > 0) {
      return tenant.paymentIntervalDays;
    }

    switch (tenant.paymentFrequency) {
      case 'yearly':
        return 365;
      case 'fixed-time':
        return tenant.paymentIntervalDays && tenant.paymentIntervalDays > 0
          ? tenant.paymentIntervalDays
          : 31;
      case 'monthly':
      default:
        return 31;
    }
  }

  private startOfDay(input: Date): Date {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private buildPeriodId(tenantId: string, periodStart: Date): string {
    const iso = this.startOfDay(periodStart).toISOString().split('T')[0];
    return `${tenantId}_${iso}`;
  }

  private resolveTargetStarts(tenant: Tenant, options?: GenerateScheduleOptions): Date[] {
    const historyCount = options?.historyPeriods ?? 6;
    const futureCount = options?.futurePeriods ?? 12;
    const intervalDays = this.getIntervalDays(tenant);
    const firstPayment = tenant.firstPaymentDate ? this.startOfDay(new Date(tenant.firstPaymentDate)) : this.startOfDay(new Date());
    const now = new Date();

    let currentStart = firstPayment;
    let safety = 0;
    while (this.addDays(currentStart, intervalDays) <= now && safety < 1000) {
      const nextStart = this.addDays(currentStart, intervalDays);
      if (nextStart <= now || safety === 0) {
        currentStart = nextStart;
      }
      safety += 1;
    }

    if (currentStart < firstPayment) {
      currentStart = firstPayment;
    }

    const starts: Date[] = [];
    let earliestStart = currentStart;
    for (let i = 0; i < historyCount; i += 1) {
      const previous = this.addDays(earliestStart, -intervalDays);
      if (previous < firstPayment) {
        break;
      }
      earliestStart = previous;
    }

    starts.push(earliestStart);
    const totalNeeded = historyCount + futureCount + 1;
    while (starts.length < totalNeeded) {
      const last = starts[starts.length - 1];
      const next = this.addDays(last, intervalDays);
      starts.push(next);
    }

    return starts;
  }

  private determineStatus(existingStatus: RentPaymentStatus | undefined, periodEnd: Date): RentPaymentStatus {
    if (existingStatus === 'paid') {
      return 'paid';
    }
    const now = new Date();
    return periodEnd < now ? 'overdue' : 'pending';
  }

  async generateScheduleForTenant(tenant: Tenant, options?: GenerateScheduleOptions): Promise<RentPaymentPeriod[]> {
    if (!tenant || !tenant.id) {
      return [];
    }

    const intervalDays = this.getIntervalDays(tenant);
    if (!intervalDays || intervalDays <= 0) {
      return [];
    }

    const managerId = options?.managerId;
    const existingPeriods = await this.getTenantPeriods(tenant.id);
    const existingMap = new Map(existingPeriods.map(p => [p.id, p]));

    const starts = this.resolveTargetStarts(tenant, options);
    const writes: any[] = [];
    const now = new Date();

    starts.forEach((periodStart) => {
      const inclusiveStart = this.startOfDay(periodStart);
      const periodId = this.buildPeriodId(tenant.id, inclusiveStart);
      const existing = existingMap.get(periodId);
      const endExclusive = this.addDays(inclusiveStart, intervalDays);
      const periodEnd = new Date(endExclusive.getTime() - 1);

      let status = this.determineStatus(existing?.status, periodEnd);
      // after-write fix check
      if (status !== 'paid' && periodEnd < now) {
         status = 'overdue';
      }

      const payload: any = {
        tenantId: tenant.id,
        amountDue: tenant.rentAmount ?? existing?.amountDue ?? 0,
        periodStart: inclusiveStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        dueDate: inclusiveStart.toISOString(),
        status,
      };
      
      if (managerId || existing?.managerId) {
        payload.managerId = managerId || existing?.managerId;
      }
      
      if (existing?.notes) {
        payload.notes = existing.notes;
      }
      
      if (existing?.paidAt) {
        payload.paidAt = new Date(existing.paidAt).toISOString();
      } else if (existing && Object.prototype.hasOwnProperty.call(existing, 'paidAt') && existing.paidAt === null) {
        payload.paidAt = null;
      }

      if (!existing?.createdAt) {
        payload.createdAt = new Date().toISOString();
      }

      writes.push({ id: periodId, data: payload });
    });

    await apiService.post('/payments/bulk', { writes });
    return this.getTenantPeriods(tenant.id);
  }

  async getTenantPeriods(tenantId: string): Promise<RentPaymentPeriod[]> {
    try {
      const response = await apiService.get(`/payments/tenant/${tenantId}`);
      return (response.periods || []).map((p: any) => ({
        ...p,
        periodStart: new Date(p.periodStart),
        periodEnd: new Date(p.periodEnd),
        dueDate: new Date(p.dueDate),
        paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
        createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('getTenantPeriods error:', error);
      return [];
    }
  }

  subscribeToTenantPeriods(
    tenantId: string,
    callback: (periods: RentPaymentPeriod[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isActive = true;

    const fetchPeriods = async () => {
      if (!isActive) return;
      try {
        const periods = await this.getTenantPeriods(tenantId);
        if (isActive) callback(periods);
      } catch (err: any) {
        if (onError) onError(err);
      }
    };

    fetchPeriods();
    return () => {
      isActive = false;
    };
  }

  async markPeriodStatus(
    periodId: string,
    status: RentPaymentStatus,
    options?: { paidAt?: Date | null; notes?: string }
  ): Promise<void> {
    await apiService.put(`/payments/${periodId}/status`, {
      status,
      options: {
        ...options,
        paidAt: options?.paidAt ? options.paidAt.toISOString() : (options?.paidAt === null ? null : undefined)
      }
    });
  }

  async markPeriodPaid(periodId: string, paidAt?: Date): Promise<void> {
    await this.markPeriodStatus(periodId, 'paid', { paidAt: paidAt ?? new Date() });
  }

  async unmarkPeriodPaid(periodId: string): Promise<void> {
    // For now we assume unmark means we set to pending. True logic would fetch and check end date.
    await this.markPeriodStatus(periodId, 'pending', { paidAt: null });
  }

  async refreshOverdueStatuses(tenantId: string): Promise<number> {
    const periods = await this.getTenantPeriods(tenantId);
    const now = new Date();
    const writes = [];
    
    for (const p of periods) {
      if (p.status !== 'paid' && p.periodEnd < now && p.status !== 'overdue') {
        writes.push({ id: p.id, data: { status: 'overdue' } });
      }
    }
    
    if (writes.length > 0) {
      await apiService.post('/payments/bulk', { writes });
    }
    return writes.length;
  }
}

export const paymentScheduleService = new PaymentScheduleService();
export default paymentScheduleService;
