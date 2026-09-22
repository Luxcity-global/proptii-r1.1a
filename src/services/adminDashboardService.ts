import apiService from './api';
import userService from './userService';
import landlordUserService from './landlordUserService';

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  tier: string;
  planId: string;
  signupDate: string | null;
  lastActive: string | null;
  reportsLifetime: number;
  reportsThisMonth: number;
  accountStatus: string;
  billingStatus: string;
  billingRaw: string | null;
  flagged: boolean;
  flags: string[];
  tags: string[];
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  householdType?: string | null;
  professionalAtOnboarding?: boolean;
}

export interface AdminCustomerDetail {
  customer: AdminCustomerRow;
  profile: {
    uid: string;
    email: string;
    name: string;
    phone: string | null;
    role: string | null;
    roleSource: string | null;
    householdType: string | null;
    riskAppetite: string | null;
    commuteTolerance: string | null;
    budget: unknown;
    professionalAtOnboarding: boolean;
  };
  subscription: {
    planId: string;
    tier: string;
    status: string | null;
    billingStatus: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    cycle: string | null;
    pendingPlan: string | null;
    fitChecksUsed: number | null;
    fitChecksQuota: number | null;
  };
  savedProperties: unknown[];
  alerts: unknown[];
  notes: Array<{ id: string; note: string; tag: string | null; authorEmail: string; createdAt: string | null }>;
  timeline: Array<{ at: string | null; type: string; label: string }>;
}

export interface AdminOverview {
  totals: { accounts: number; paid: number; trial: number; flagged: number };
  funnel: {
    anonymous: number;
    registered: number;
    paid: number;
    anonymousToRegisteredPct: number;
    registeredToPaidPct: number;
  };
  trialConversion: { trialStarted: number; converted: number; ratePct: number };
  tierDistribution: Array<{ planId: string; label: string; count: number; pct: number }>;
  accountStatus: Array<{ status: string; count: number }>;
  billingStatus: Array<{ status: string; count: number }>;
  cohorts: Array<{ month: string; signups: number; paid: number; retainedPct: number }>;
}

function isFallbackStatus(err: { status?: number } | null | undefined) {
  const status = err?.status;
  if (status === 401 || status === 403) return false;
  return true;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

/** Firestore timestamps often arrive as `{ seconds, nanoseconds }` rather than ISO strings. */
export function parseAdminDate(value: unknown): string | null {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof value === 'object') {
    const v = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof v.toDate === 'function') {
      try {
        return parseAdminDate(v.toDate());
      } catch {
        return null;
      }
    }
    const seconds = v.seconds ?? v._seconds;
    const nanos = v.nanoseconds ?? v._nanoseconds;
    if (typeof seconds === 'number') {
      const d = new Date(seconds * 1000 + (typeof nanos === 'number' ? nanos / 1e6 : 0));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  return null;
}

function firstDate(...values: unknown[]): string | null {
  for (const value of values) {
    const iso = parseAdminDate(value);
    if (iso) return iso;
  }
  return null;
}

function mapLegacyUser(u: Record<string, unknown>): AdminCustomerRow {
  const email = String(u.email || '').toLowerCase();
  const name = String(u.name || email.split('@')[0] || 'Unknown');
  const role = (u.role as string) || null;
  const planId = String(u.planId || 'explorer');
  const isB2b = role === 'landlord' || role === 'agent';
  const signupDate = firstDate(u.createdAt, u.roleAssignedAt, u.created_at, u.registeredAt);
  const lastActive = firstDate(
    u.lastActiveAt,
    u.lastLoginAt,
    u.lastSignInAt,
    u.updatedAt,
    signupDate,
  );
  return {
    id: String(u.id || u.uid || ''),
    name,
    email: email || '(no email)',
    role,
    tier: isB2b ? 'Partner' : 'Explorer (Free)',
    planId: isB2b ? 'starter' : 'explorer',
    signupDate,
    lastActive,
    reportsLifetime: 0,
    reportsThisMonth: 0,
    accountStatus: email ? 'Registered' : 'Anonymous session',
    billingStatus: 'None',
    billingRaw: null,
    flagged: false,
    flags: [],
    tags: [],
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

async function fallbackCustomers(): Promise<{ customers: AdminCustomerRow[]; generatedAt: string }> {
  const [usersRes, landlordsRes] = await Promise.all([
    userService.getAllUsers(),
    landlordUserService.getAllLandlordUsers(),
  ]);
  const byId = new Map<string, AdminCustomerRow>();
  for (const u of usersRes.users || []) {
    const row = mapLegacyUser(u as unknown as Record<string, unknown>);
    if (row.id) byId.set(row.id, row);
  }
  for (const u of landlordsRes.users || []) {
    const raw = u as unknown as Record<string, unknown>;
    const id = String(raw.id || raw.uid || '');
    if (!id) continue;
    const existing = byId.get(id);
    if (existing) {
      byId.set(id, { ...existing, role: u.role, tier: 'Partner', planId: 'starter' });
      continue;
    }
    const row = mapLegacyUser({ ...raw, role: u.role });
    byId.set(id, { ...row, role: u.role, tier: 'Partner' });
  }
  return { customers: Array.from(byId.values()), generatedAt: new Date().toISOString() };
}

class AdminDashboardService {
  async me(): Promise<{ ok: boolean }> {
    const res = await apiService.get<{ ok: boolean }>('/admin/me');
    return unwrap(res);
  }

  async listCustomers(): Promise<{ customers: AdminCustomerRow[]; generatedAt: string }> {
    try {
      const res = await apiService.get<{ customers: AdminCustomerRow[]; generatedAt: string }>('/admin/customers');
      return unwrap(res);
    } catch (err: any) {
      if (!isFallbackStatus(err)) throw err;
      return fallbackCustomers();
    }
  }

  async getCustomer(id: string): Promise<AdminCustomerDetail> {
    try {
      const res = await apiService.get<AdminCustomerDetail>(`/admin/customers/${encodeURIComponent(id)}`);
      return unwrap(res);
    } catch (err: any) {
      if (!isFallbackStatus(err)) throw err;
      const { customers } = await fallbackCustomers();
      const customer = customers.find((c) => c.id === id);
      if (!customer) throw err;
      return {
          customer,
          profile: {
            uid: customer.id,
            email: customer.email,
            name: customer.name,
            phone: null,
            role: customer.role,
            roleSource: null,
            householdType: null,
            riskAppetite: null,
            commuteTolerance: null,
            budget: null,
            professionalAtOnboarding: false,
          },
          subscription: {
            planId: customer.planId,
            tier: customer.tier,
            status: customer.billingRaw,
            billingStatus: customer.billingStatus,
            trialEndsAt: customer.trialEndsAt,
            currentPeriodEnd: customer.currentPeriodEnd,
            cancelAtPeriodEnd: customer.cancelAtPeriodEnd,
            cycle: null,
            pendingPlan: null,
            fitChecksUsed: null,
            fitChecksQuota: null,
          },
          savedProperties: [],
          alerts: [],
          notes: [],
          timeline: customer.signupDate
            ? [{ at: customer.signupDate, type: 'signup', label: 'Signed up' }]
            : [],
        };
    }
  }

  async overview(): Promise<AdminOverview> {
    try {
      const res = await apiService.get<AdminOverview>('/admin/overview');
      return unwrap(res);
    } catch (err: any) {
      if (!isFallbackStatus(err)) throw err;
      const { customers } = await fallbackCustomers();
      return this.overviewFromRows(customers);
    }
  }

  async alerts(): Promise<{ alerts: AdminCustomerRow[]; count: number }> {
    try {
      const res = await apiService.get<{ alerts: AdminCustomerRow[]; count: number }>('/admin/alerts');
      return unwrap(res);
    } catch (err: any) {
      if (!isFallbackStatus(err)) throw err;
      const { customers } = await fallbackCustomers();
      const alerts = customers.filter((c) => c.flagged);
      return { alerts, count: alerts.length };
    }
  }

  async partners(): Promise<{ partners: AdminCustomerRow[] }> {
    try {
      const res = await apiService.get<{ partners: AdminCustomerRow[] }>('/admin/partners');
      return unwrap(res);
    } catch (err: any) {
      if (!isFallbackStatus(err)) throw err;
      const { customers } = await fallbackCustomers();
      return {
        partners: customers.filter((c) => c.role === 'landlord' || c.role === 'agent'),
      };
    }
  }

  async addNote(userId: string, note: string, tag?: string): Promise<{ success: boolean }> {
    const res = await apiService.post<{ success: boolean }>(
      `/admin/customers/${encodeURIComponent(userId)}/notes`,
      { note, tag },
    );
    return unwrap(res);
  }

  overviewFromRows(customers: AdminCustomerRow[]): AdminOverview {
    const total = customers.length || 1;
    const byTier: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byBilling: Record<string, number> = {};
    let paid = 0;
    let trial = 0;
    let anonymous = 0;
    let registered = 0;
    for (const c of customers) {
      byTier[c.planId] = (byTier[c.planId] || 0) + 1;
      byStatus[c.accountStatus] = (byStatus[c.accountStatus] || 0) + 1;
      byBilling[c.billingStatus] = (byBilling[c.billingStatus] || 0) + 1;
      if (c.accountStatus === 'Paid') paid += 1;
      if (c.accountStatus === 'Trial') trial += 1;
      if (c.accountStatus === 'Anonymous session') anonymous += 1;
      else registered += 1;
    }
    const cohorts: Record<string, { signups: number; paid: number }> = {};
    for (const c of customers) {
      if (!c.signupDate) continue;
      const d = new Date(c.signupDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[key]) cohorts[key] = { signups: 0, paid: 0 };
      cohorts[key].signups += 1;
      if (c.accountStatus === 'Paid') cohorts[key].paid += 1;
    }
    return {
      totals: {
        accounts: customers.length,
        paid,
        trial,
        flagged: customers.filter((c) => c.flagged).length,
      },
      funnel: {
        anonymous,
        registered,
        paid,
        anonymousToRegisteredPct: customers.length ? Math.round((registered / customers.length) * 100) : 0,
        registeredToPaidPct: registered ? Math.round((paid / registered) * 100) : 0,
      },
      trialConversion: {
        trialStarted: trial,
        converted: paid,
        ratePct: trial + paid ? Math.round((paid / (trial + paid)) * 100) : 0,
      },
      tierDistribution: Object.entries(byTier).map(([planId, count]) => ({
        planId,
        label: planId,
        count,
        pct: Math.round((count / total) * 100),
      })),
      accountStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      billingStatus: Object.entries(byBilling).map(([status, count]) => ({ status, count })),
      cohorts: Object.entries(cohorts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({
          month,
          signups: v.signups,
          paid: v.paid,
          retainedPct: v.signups ? Math.round((v.paid / v.signups) * 100) : 0,
        })),
    };
  }
}

export default new AdminDashboardService();
