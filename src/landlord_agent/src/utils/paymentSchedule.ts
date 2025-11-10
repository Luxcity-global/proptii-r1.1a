import { PaymentScheduleEntry, PaymentScheduleStatus, Tenant } from "../App";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_GENERATED_ENTRIES = 36;

const INTERVAL_DAYS: Record<NonNullable<Tenant['paymentFrequency']>, number> = {
  'monthly': 31,
  'yearly': 365,
  'fixed-time': 0,
};

type Frequency = NonNullable<Tenant['paymentFrequency']>;

interface GenerateScheduleParams {
  firstPaymentDate?: Date;
  frequency: Frequency;
  rentAmount: number;
  leaseEnd?: Date;
  now: Date;
}

interface EnsurePaymentScheduleParams {
  existingSchedule?: PaymentScheduleEntry[];
  firstPaymentDate?: Date;
  frequency?: Tenant['paymentFrequency'];
  rentAmount: number;
  leaseEnd?: Date;
  now?: Date;
}

export interface EnsurePaymentScheduleResult {
  schedule: PaymentScheduleEntry[];
  overdueAmount: number;
  lastPaymentDate?: Date;
  paymentStatus: Tenant['paymentStatus'];
  changed: boolean;
}

export function formatPeriodLabel(date: Date, frequency: Tenant['paymentFrequency']): string {
  if (!frequency || frequency === 'fixed-time') {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (frequency === 'yearly') {
    return date.getFullYear().toString();
  }

  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function normaliseDate(value?: Date | string | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function createEntry(params: { dueDate: Date; amount: number; frequency: Frequency; now: Date; previous?: PaymentScheduleEntry; }): PaymentScheduleEntry {
  const { dueDate, amount, frequency, now, previous } = params;
  const periodLabel = formatPeriodLabel(dueDate, frequency);
  const baseStatus: PaymentScheduleStatus = now.getTime() >= dueDate.getTime() ? 'overdue' : 'pending';
  return {
    id: previous?.id || `ps_${dueDate.getTime()}`,
    dueDate,
    amount,
    status: previous?.status && previous.status === 'paid' ? 'paid' : baseStatus,
    periodLabel,
    paidAt: previous?.paidAt ? normaliseDate(previous.paidAt) : undefined,
    paidBy: previous?.paidBy,
    notes: previous?.notes,
    adjusted: previous?.adjusted,
    createdAt: previous?.createdAt ? normaliseDate(previous.createdAt) : now,
    lastUpdated: now,
  };
}

function generateBaseSchedule(params: GenerateScheduleParams): PaymentScheduleEntry[] {
  const { firstPaymentDate, frequency, rentAmount, leaseEnd, now } = params;
  const dueStart = normaliseDate(firstPaymentDate) || now;

  if (frequency === 'fixed-time') {
    return [createEntry({ dueDate: dueStart, amount: rentAmount, frequency, now })];
  }

  const intervalDays = INTERVAL_DAYS[frequency];
  const entries: PaymentScheduleEntry[] = [];
  const limitDate = leaseEnd ? new Date(leaseEnd) : new Date(dueStart.getTime() + intervalDays * DAY_MS * 11);

  let dueCursor = new Date(dueStart);
  let safetyCounter = 0;

  while (dueCursor.getTime() <= limitDate.getTime() && safetyCounter < MAX_GENERATED_ENTRIES) {
    entries.push(createEntry({ dueDate: new Date(dueCursor), amount: rentAmount, frequency, now }));
    dueCursor = new Date(dueCursor.getTime() + intervalDays * DAY_MS);
    safetyCounter += 1;
  }

  if (!entries.length) {
    entries.push(createEntry({ dueDate: new Date(dueStart), amount: rentAmount, frequency, now }));
  }

  return entries;
}

function prepareExistingSchedule(entries: PaymentScheduleEntry[], now: Date, frequency: Frequency, rentAmount: number): { schedule: PaymentScheduleEntry[]; changed: boolean } {
  let changed = false;
  const schedule = entries.map(original => {
    const dueDate = normaliseDate(original.dueDate) || now;
    const paidAt = normaliseDate(original.paidAt);
    const lastUpdated = normaliseDate(original.lastUpdated) || now;
    const createdAt = normaliseDate(original.createdAt) || createdAtFromDueDate(dueDate);

    let status = original.status;
    if (status !== 'paid') {
      status = now.getTime() >= dueDate.getTime() ? 'overdue' : 'pending';
    }

    if (status !== original.status) {
      changed = true;
    }

    return {
      ...original,
      amount: original.amount ?? rentAmount,
      periodLabel: original.periodLabel || formatPeriodLabel(dueDate, frequency),
      dueDate,
      paidAt,
      lastUpdated,
      createdAt,
      status,
    } as PaymentScheduleEntry;
  });

  return { schedule, changed };
}

function createdAtFromDueDate(dueDate: Date): Date {
  const createdAt = new Date(dueDate.getTime());
  if (createdAt.getTime() > Date.now()) {
    createdAt.setTime(Date.now());
  }
  return createdAt;
}

export function ensurePaymentSchedule(params: EnsurePaymentScheduleParams): EnsurePaymentScheduleResult {
  const {
    existingSchedule = [],
    firstPaymentDate,
    frequency = 'monthly',
    rentAmount,
    leaseEnd,
    now = new Date()
  } = params;

  let changed = false;
  let schedule: PaymentScheduleEntry[] = [];

  if (!existingSchedule.length) {
    schedule = generateBaseSchedule({ firstPaymentDate, frequency, rentAmount, leaseEnd, now });
    changed = schedule.length > 0;
  } else {
    const prepared = prepareExistingSchedule(existingSchedule, now, frequency, rentAmount);
    schedule = prepared.schedule;
    changed = prepared.changed;
  }

  schedule.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Extend schedule if lease end is beyond existing entries and frequency repeats
  if (frequency !== 'fixed-time' && schedule.length) {
    const intervalDays = INTERVAL_DAYS[frequency];
    const limitDate = leaseEnd ? new Date(leaseEnd) : new Date(schedule[schedule.length - 1].dueDate.getTime() + intervalDays * DAY_MS * 6);
    let lastDueDate = schedule[schedule.length - 1].dueDate;
    let safetyCounter = 0;

    while (lastDueDate.getTime() < limitDate.getTime() && schedule.length < MAX_GENERATED_ENTRIES && safetyCounter < MAX_GENERATED_ENTRIES) {
      const nextDue = new Date(lastDueDate.getTime() + intervalDays * DAY_MS);
      schedule.push(createEntry({ dueDate: nextDue, amount: rentAmount, frequency, now }));
      lastDueDate = nextDue;
      safetyCounter += 1;
      changed = true;
    }
  }

  let overdueAmount = 0;
  let lastPaymentDate: Date | undefined;

  schedule = schedule.map(entry => {
    const updated: PaymentScheduleEntry = {
      ...entry,
      periodLabel: entry.periodLabel || formatPeriodLabel(entry.dueDate, frequency),
      lastUpdated: now,
    };

    if (updated.status === 'paid' && updated.paidAt) {
      if (!lastPaymentDate || updated.paidAt > lastPaymentDate) {
        lastPaymentDate = updated.paidAt;
      }
    } else if (updated.status !== 'paid') {
      const derivedStatus: PaymentScheduleStatus = now.getTime() >= updated.dueDate.getTime() ? 'overdue' : 'pending';
      if (updated.status !== derivedStatus) {
        updated.status = derivedStatus;
        changed = true;
      }
    }

    if (updated.status === 'overdue') {
      overdueAmount += updated.amount;
    }

    return updated;
  });

  const paymentStatus: Tenant['paymentStatus'] = overdueAmount > 0 ? 'overdue' : 'current';

  return {
    schedule,
    overdueAmount,
    lastPaymentDate,
    paymentStatus,
    changed,
  };
}

export function generateManualEntry(dueDate: Date, amount: number, frequency: Frequency, now: Date = new Date()): PaymentScheduleEntry {
  return createEntry({ dueDate, amount, frequency, now });
}
