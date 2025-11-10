import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
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

interface RentPaymentPeriodFirestore {
  tenantId: string;
  managerId?: string;
  amountDue: number;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  dueDate: Timestamp;
  status: RentPaymentStatus;
  paidAt?: Timestamp | null;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface GenerateScheduleOptions {
  historyPeriods?: number;
  futurePeriods?: number;
  managerId?: string;
}

class PaymentScheduleService {
  private readonly collectionRef = collection(db, 'rentPaymentPeriods');

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

  private toFirestore(input: Omit<RentPaymentPeriod, 'id'>): RentPaymentPeriodFirestore {
    return {
      tenantId: input.tenantId,
      managerId: input.managerId,
      amountDue: input.amountDue,
      periodStart: Timestamp.fromDate(this.startOfDay(input.periodStart)),
      periodEnd: Timestamp.fromDate(this.startOfDay(input.periodEnd)),
      dueDate: Timestamp.fromDate(this.startOfDay(input.dueDate)),
      status: input.status,
      paidAt: input.paidAt ? Timestamp.fromDate(input.paidAt) : undefined,
      notes: input.notes,
      createdAt: input.createdAt ? Timestamp.fromDate(input.createdAt) : undefined,
      updatedAt: input.updatedAt ? Timestamp.fromDate(input.updatedAt) : undefined,
    };
  }

  private fromFirestore(id: string, data: RentPaymentPeriodFirestore): RentPaymentPeriod {
    return {
      id,
      tenantId: data.tenantId,
      managerId: data.managerId,
      amountDue: data.amountDue ?? 0,
      periodStart: data.periodStart?.toDate() ?? new Date(),
      periodEnd: data.periodEnd?.toDate() ?? new Date(),
      dueDate: data.dueDate?.toDate() ?? new Date(),
      status: data.status ?? 'pending',
      paidAt: data.paidAt ? data.paidAt.toDate() : undefined,
      notes: data.notes,
      createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
    };
  }

  private resolveTargetStarts(tenant: Tenant, options?: GenerateScheduleOptions): Date[] {
    const historyCount = options?.historyPeriods ?? 6;
    const futureCount = options?.futurePeriods ?? 12;
    const intervalDays = this.getIntervalDays(tenant);
    const firstPayment = tenant.firstPaymentDate ? this.startOfDay(tenant.firstPaymentDate) : this.startOfDay(new Date());
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
      console.warn('paymentScheduleService.generateScheduleForTenant called without tenant id');
      return [];
    }

    const intervalDays = this.getIntervalDays(tenant);
    if (!intervalDays || intervalDays <= 0) {
      console.warn('paymentScheduleService: invalid intervalDays for tenant', tenant.id, intervalDays);
      return [];
    }

    const managerId = options?.managerId;
    const existingSnapshot = await getDocs(query(this.collectionRef, where('tenantId', '==', tenant.id)));
    const existingMap = new Map(existingSnapshot.docs.map((docSnap) => [docSnap.id, docSnap]));

    const starts = this.resolveTargetStarts(tenant, options);
    const writes: Promise<void>[] = [];
    const now = new Date();

    starts.forEach((periodStart) => {
      const inclusiveStart = this.startOfDay(periodStart);
      const periodId = this.buildPeriodId(tenant.id, inclusiveStart);
      const docRef = doc(this.collectionRef, periodId);
      const existing = existingMap.get(periodId);
      const endExclusive = this.addDays(inclusiveStart, intervalDays);
      const periodEnd = new Date(endExclusive.getTime() - 1);

      const existingData = existing?.data() as RentPaymentPeriodFirestore | undefined;
      const status = this.determineStatus(existingData?.status, periodEnd);

      const payload: RentPaymentPeriodFirestore = {
        tenantId: tenant.id,
        managerId: managerId || (existingData?.managerId ?? undefined),
        amountDue: tenant.rentAmount ?? existingData?.amountDue ?? 0,
        periodStart: Timestamp.fromDate(inclusiveStart),
        periodEnd: Timestamp.fromDate(periodEnd),
        dueDate: Timestamp.fromDate(inclusiveStart),
        status,
        paidAt: existingData?.paidAt ?? undefined,
        notes: existingData?.notes,
        updatedAt: serverTimestamp(),
      };

      if (!existingData?.createdAt) {
        payload.createdAt = serverTimestamp();
      } else if (existingData.createdAt) {
        payload.createdAt = existingData.createdAt;
      }

      writes.push(setDoc(docRef, payload, { merge: true }).then(() => {
        // After write, update overdue status if necessary
        if (status !== 'paid' && periodEnd < now) {
          return updateDoc(docRef, {
            status: 'overdue',
            updatedAt: serverTimestamp(),
          });
        }
        return Promise.resolve();
      }));
    });

    await Promise.all(writes);
    return this.getTenantPeriods(tenant.id);
  }

  async getTenantPeriods(tenantId: string): Promise<RentPaymentPeriod[]> {
    const snapshot = await getDocs(
      query(this.collectionRef, where('tenantId', '==', tenantId), orderBy('periodStart', 'asc'))
    );
    return snapshot.docs.map((docSnap) => this.fromFirestore(docSnap.id, docSnap.data() as RentPaymentPeriodFirestore));
  }

  subscribeToTenantPeriods(
    tenantId: string,
    callback: (periods: RentPaymentPeriod[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(this.collectionRef, where('tenantId', '==', tenantId), orderBy('periodStart', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const periods = snapshot.docs.map((docSnap) =>
          this.fromFirestore(docSnap.id, docSnap.data() as RentPaymentPeriodFirestore)
        );
        callback(periods);
      },
      (error) => {
        console.error('paymentScheduleService.subscribeToTenantPeriods error', error);
        if (onError) onError(error);
      }
    );
  }

  async markPeriodStatus(
    periodId: string,
    status: RentPaymentStatus,
    options?: { paidAt?: Date | null; notes?: string }
  ): Promise<void> {
    const docRef = doc(this.collectionRef, periodId);
    const update: any = {
      status,
      notes: options?.notes,
      updatedAt: serverTimestamp(),
    };

    if (status === 'paid') {
      update.paidAt = Timestamp.fromDate(options?.paidAt ?? new Date());
    } else if (options?.paidAt === null) {
      update.paidAt = null;
    }

    await updateDoc(docRef, update);
  }

  async markPeriodPaid(periodId: string, paidAt?: Date): Promise<void> {
    await this.markPeriodStatus(periodId, 'paid', { paidAt: paidAt ?? new Date() });
  }

  async refreshOverdueStatuses(tenantId: string): Promise<number> {
    const snapshot = await getDocs(query(this.collectionRef, where('tenantId', '==', tenantId)));
    const now = new Date();
    let updated = 0;

    await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as RentPaymentPeriodFirestore;
        const periodEnd = data.periodEnd?.toDate?.() ?? null;
        if (!periodEnd) return;
        if (data.status === 'paid') return;
        if (periodEnd < now && data.status !== 'overdue') {
          updated += 1;
          await updateDoc(doc(this.collectionRef, docSnap.id), {
            status: 'overdue',
            updatedAt: serverTimestamp(),
          });
        }
      })
    );

    return updated;
  }
}

export const paymentScheduleService = new PaymentScheduleService();
export default paymentScheduleService;

