import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { firstIso, toIso } from '../utils/firestore-date';

const PAID_PLAN_IDS = new Set([
  'renter_pro',
  'buyer_pro',
  'starter',
  'landlord_pro',
  'elite',
  'independent',
  'agent_pro',
  'enterprise',
  'premium',
  'pro',
  'professional',
]);

const B2B_ROLES = new Set(['landlord', 'agent']);

function daysFromNow(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}

function normalizePlanId(raw: unknown): string {
  const id = String(raw || 'explorer').toLowerCase().trim();
  if (!id || id === 'free') return 'explorer';
  return id;
}

function planLabel(planId: string, status: string | null): string {
  const labels: Record<string, string> = {
    explorer: 'Explorer (Free)',
    renter_pro: 'Renter Pro',
    buyer_pro: 'Buyer Pro',
    starter: 'Starter',
    landlord_pro: 'Landlord Pro',
    elite: 'Elite',
    independent: 'Independent',
    agent_pro: 'Agent Pro',
    enterprise: 'Enterprise',
  };
  const base = labels[planId] || planId;
  if (status === 'trialing') return `${base} (trial)`;
  return base;
}

function billingLabel(status: string | null, cancelAtPeriodEnd: boolean): string {
  if (status === 'past_due' || status === 'unpaid') return 'Failed payment';
  if (status === 'canceled' || status === 'cancelled' || cancelAtPeriodEnd) return 'Cancelled';
  if (status === 'trialing') return 'Trial';
  if (status === 'active') return 'Current';
  return status ? status : 'None';
}

function accountStatus(opts: {
  email?: string;
  isAnonymous?: boolean;
  planId: string;
  billingStatus: string | null;
  cancelAtPeriodEnd: boolean;
}): string {
  if (opts.isAnonymous || !opts.email) return 'Anonymous session';
  if (opts.billingStatus === 'canceled' || opts.billingStatus === 'cancelled' || opts.cancelAtPeriodEnd) {
    return 'Churned';
  }
  if (opts.billingStatus === 'trialing') return 'Trial';
  if (opts.billingStatus === 'active' && PAID_PLAN_IDS.has(opts.planId)) return 'Paid';
  return 'Registered';
}

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

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private serializeDoc(id: string, data: FirebaseFirestore.DocumentData | undefined) {
    return { id, ...(data || {}) };
  }

  private async safeGetAll(
    collectionName: string,
    selectFields?: string[],
    limit = 5000,
  ): Promise<Array<{ id: string; data: FirebaseFirestore.DocumentData }>> {
    const db = this.db;
    if (!db) return [];
    try {
      let query: FirebaseFirestore.Query = db.collection(collectionName);
      if (selectFields?.length) {
        query = query.select(...selectFields);
      }
      const snap = await query.limit(limit).get();
      return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    } catch (err: any) {
      this.logger.warn(`Failed to read ${collectionName}: ${err?.message || err}`);
      return [];
    }
  }

  private async logAccess(actorEmail: string, action: string, resourceId?: string) {
    const db = this.db;
    if (!db) return;
    try {
      await db.collection('admin_access_log').add({
        actorEmail,
        action,
        resourceId: resourceId || null,
        at: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err: any) {
      this.logger.warn(`admin access log write failed: ${err?.message || err}`);
    }
  }

  private buildRows(
    users: Array<{ id: string; data: FirebaseFirestore.DocumentData }>,
    subsByUser: Map<string, FirebaseFirestore.DocumentData>,
    usageByUser: Map<string, { reports: number; reportsMonth: number; lastAt: string | null; saved: number; alerts: number }>,
    notesByUser: Map<string, Array<{ id: string; note: string; tag?: string; createdAt: string | null; authorEmail: string }>>,
    authByUser: Map<string, { createdAt: string | null; lastSignIn: string | null }>,
  ): AdminCustomerRow[] {
    return users.map(({ id, data }) => {
      const email = String(data.email || '').toLowerCase().trim();
      const name = String(data.name || data.displayName || [data.givenName, data.familyName].filter(Boolean).join(' ') || email.split('@')[0] || 'Unknown');
      const role = (data.role as string) || null;
      const sub = subsByUser.get(id) || (email ? subsByUser.get(email) : undefined) || {};
      const planId = normalizePlanId(sub.planId || sub.plan || data.planId || data.pendingPlan);
      const billingRaw = (sub.status as string) || null;
      const cancelAtPeriodEnd = Boolean(sub.cancelAtPeriodEnd);
      const usage = usageByUser.get(id) || { reports: 0, reportsMonth: 0, lastAt: null, saved: 0, alerts: 0 };
      const reportsLifetime = Number(sub.fitChecksUsed ?? usage.reports ?? 0) || 0;
      const reportsThisMonth = usage.reportsMonth || 0;
      const authMeta = authByUser.get(id) || (email ? authByUser.get(email) : undefined);
      const signupDate = firstIso(
        data.createdAt,
        data.roleAssignedAt,
        data.created_at,
        data.registeredAt,
        authMeta?.createdAt,
      );
      const lastActive = firstIso(
        usage.lastAt,
        data.lastActiveAt,
        data.lastLoginAt,
        data.lastSignInAt,
        data.updatedAt,
        sub.updatedAt,
        authMeta?.lastSignIn,
        signupDate,
      );
      const trialEndsAt = toIso(sub.trialEndsAt);
      const flags: string[] = [];

      if ((planId === 'explorer' || planId === 'free') && reportsLifetime >= 3) {
        flags.push('3+ reports on free tier — possible professional use');
      }
      if ((planId === 'explorer' || planId === 'free') && usage.saved >= 8) {
        flags.push('High save volume on free tier');
      }
      const trialDays = daysFromNow(trialEndsAt);
      if (billingRaw === 'trialing' && trialDays !== null && trialDays <= 3) {
        flags.push(`Trial expiring in ${Math.max(trialDays, 0)} day(s)`);
      }
      if (billingRaw === 'past_due' || billingRaw === 'unpaid') {
        flags.push('Failed payment');
      }

      const notes = notesByUser.get(id) || [];
      const tags = notes.map((n) => n.tag).filter((t): t is string => Boolean(t));

      return {
        id,
        name,
        email: email || '(no email)',
        role,
        tier: planLabel(planId, billingRaw),
        planId,
        signupDate,
        lastActive,
        reportsLifetime,
        reportsThisMonth,
        accountStatus: accountStatus({
          email,
          isAnonymous: Boolean(data.isAnonymous),
          planId,
          billingStatus: billingRaw,
          cancelAtPeriodEnd,
        }),
        billingStatus: billingLabel(billingRaw, cancelAtPeriodEnd),
        billingRaw,
        flagged: flags.length > 0,
        flags,
        tags,
        trialEndsAt,
        currentPeriodEnd: toIso(sub.currentPeriodEnd),
        cancelAtPeriodEnd,
        householdType: (data.householdType as string) || (data.buyerProfile?.householdType as string) || null,
        professionalAtOnboarding: Boolean(data.professionalAtOnboarding || data.buyerProfile?.professional),
      };
    });
  }

  private async loadNotes(): Promise<Map<string, Array<{ id: string; note: string; tag?: string; createdAt: string | null; authorEmail: string }>>> {
    const map = new Map<string, Array<{ id: string; note: string; tag?: string; createdAt: string | null; authorEmail: string }>>();
    const docs = await this.safeGetAll('admin_account_notes', undefined, 2000);
    for (const { id, data } of docs) {
      const uid = String(data.userId || '');
      if (!uid) continue;
      const entry = {
        id,
        note: String(data.note || ''),
        tag: data.tag ? String(data.tag) : undefined,
        createdAt: toIso(data.createdAt),
        authorEmail: String(data.authorEmail || ''),
      };
      const list = map.get(uid) || [];
      list.push(entry);
      map.set(uid, list);
    }
    return map;
  }

  private async loadUsage(): Promise<Map<string, { reports: number; reportsMonth: number; lastAt: string | null; saved: number; alerts: number }>> {
    const map = new Map<string, { reports: number; reportsMonth: number; lastAt: string | null; saved: number; alerts: number }>();
    const bump = (uid: string, patch: Partial<{ reports: number; reportsMonth: number; lastAt: string | null; saved: number; alerts: number }>) => {
      const cur = map.get(uid) || { reports: 0, reportsMonth: 0, lastAt: null, saved: 0, alerts: 0 };
      const lastAt =
        patch.lastAt && (!cur.lastAt || new Date(patch.lastAt).getTime() > new Date(cur.lastAt).getTime())
          ? patch.lastAt
          : cur.lastAt;
      map.set(uid, {
        reports: cur.reports + (patch.reports || 0),
        reportsMonth: cur.reportsMonth + (patch.reportsMonth || 0),
        lastAt,
        saved: cur.saved + (patch.saved || 0),
        alerts: cur.alerts + (patch.alerts || 0),
      });
    };

    const [saved, alerts, viewings, referencing] = await Promise.all([
      this.safeGetAll('saved_properties', ['userId', 'savedAt'], 5000),
      this.safeGetAll('alerts', ['userId', 'createdAt'], 5000),
      this.safeGetAll('viewings', ['tenantId', 'userId', 'createdAt', 'updatedAt'], 5000),
      this.safeGetAll('referencing', ['tenantId', 'userId', 'updatedAt', 'createdAt'], 2000),
    ]);

    for (const { data } of saved) {
      const uid = String(data.userId || '');
      if (!uid) continue;
      const at = toIso(data.savedAt);
      bump(uid, { saved: 1, lastAt: at });
    }
    for (const { data } of alerts) {
      const uid = String(data.userId || '');
      if (!uid) continue;
      bump(uid, { alerts: 1, lastAt: toIso(data.createdAt) });
    }
    for (const { data } of viewings) {
      const uid = String(data.tenantId || data.userId || '');
      if (!uid) continue;
      bump(uid, { lastAt: toIso(data.updatedAt) || toIso(data.createdAt) });
    }
    for (const { data } of referencing) {
      const uid = String(data.tenantId || data.userId || '');
      if (!uid) continue;
      bump(uid, { lastAt: toIso(data.updatedAt) || toIso(data.createdAt) });
    }

    return map;
  }

  private async loadAuthTimes(): Promise<Map<string, { createdAt: string | null; lastSignIn: string | null }>> {
    const map = new Map<string, { createdAt: string | null; lastSignIn: string | null }>();
    if (!admin.apps.length) return map;
    try {
      let nextPageToken: string | undefined;
      do {
        const res = await admin.auth().listUsers(1000, nextPageToken);
        for (const user of res.users) {
          const createdAt = toIso(user.metadata?.creationTime);
          const lastSignIn = toIso(user.metadata?.lastSignInTime);
          const meta = { createdAt, lastSignIn };
          map.set(user.uid, meta);
          if (user.email) map.set(user.email.toLowerCase(), meta);
        }
        nextPageToken = res.pageToken;
      } while (nextPageToken);
    } catch (err: any) {
      this.logger.warn(`Failed to read auth metadata: ${err?.message || err}`);
    }
    return map;
  }

  private async assembleCustomers() {
    const [users, subs, usage, notes, authTimes] = await Promise.all([
      this.safeGetAll('users', undefined, 2000),
      this.safeGetAll('subscriptions', undefined, 2000),
      this.loadUsage(),
      this.loadNotes(),
      this.loadAuthTimes(),
    ]);

    const subsByUser = new Map<string, FirebaseFirestore.DocumentData>();
    for (const { id, data } of subs) {
      subsByUser.set(id, data);
      if (data.userId) subsByUser.set(String(data.userId), data);
      if (data.email) subsByUser.set(String(data.email).toLowerCase(), data);
    }

    const customers = this.buildRows(users, subsByUser, usage, notes, authTimes);
    customers.sort((a, b) => {
      const ta = a.signupDate ? new Date(a.signupDate).getTime() : 0;
      const tb = b.signupDate ? new Date(b.signupDate).getTime() : 0;
      return tb - ta;
    });
    return { customers, generatedAt: new Date().toISOString() };
  }

  async listCustomers(actorEmail: string) {
    await this.logAccess(actorEmail, 'list_customers');
    return this.assembleCustomers();
  }

  async getCustomer(actorEmail: string, userId: string) {
    await this.logAccess(actorEmail, 'view_customer', userId);
    const db = this.db;
    if (!db) {
      throw new NotFoundException('User store unavailable');
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new NotFoundException('Customer not found');
    }

    const { customers } = await this.assembleCustomers();
    const row = customers.find((c) => c.id === userId);
    if (!row) {
      throw new NotFoundException('Customer not found');
    }

    const userData = userDoc.data() || {};
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const sub = subDoc.exists ? subDoc.data() : {};

    let saved: unknown[] = [];
    let alerts: unknown[] = [];
    let notes: unknown[] = [];
    try {
      const [savedSnap, alertSnap, noteSnap] = await Promise.all([
        db.collection('saved_properties').where('userId', '==', userId).limit(50).get(),
        db.collection('alerts').where('userId', '==', userId).limit(50).get(),
        db.collection('admin_account_notes').where('userId', '==', userId).limit(100).get(),
      ]);
      saved = savedSnap.docs.map((d) => this.serializeDoc(d.id, {
        ...d.data(),
        savedAt: toIso(d.data().savedAt),
      }));
      alerts = alertSnap.docs.map((d) => this.serializeDoc(d.id, {
        ...d.data(),
        createdAt: toIso(d.data().createdAt),
      }));
      notes = noteSnap.docs
        .map((d) => ({
          id: d.id,
          note: d.data().note || '',
          tag: d.data().tag || null,
          authorEmail: d.data().authorEmail || '',
          createdAt: toIso(d.data().createdAt),
        }))
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    } catch (err: any) {
      this.logger.warn(`customer detail subqueries failed: ${err?.message || err}`);
    }

    const timeline: Array<{ at: string | null; type: string; label: string }> = [];
    if (row.signupDate) timeline.push({ at: row.signupDate, type: 'signup', label: 'Signed up' });
    if (sub?.confirmedAt) timeline.push({ at: toIso(sub.confirmedAt), type: 'billing', label: `Subscription confirmed (${row.tier})` });
    if (sub?.pendingPlanId) timeline.push({ at: toIso(sub.updatedAt), type: 'billing', label: `Pending plan: ${sub.pendingPlanId}` });
    for (const item of saved as Array<{ savedAt?: string; address?: string; title?: string }>) {
      timeline.push({
        at: item.savedAt || null,
        type: 'save',
        label: `Saved property${item.address || item.title ? `: ${item.address || item.title}` : ''}`,
      });
    }
    for (const item of alerts as Array<{ createdAt?: string; title?: string; type?: string }>) {
      timeline.push({
        at: item.createdAt || null,
        type: 'alert',
        label: `Alert set${item.title ? `: ${item.title}` : item.type ? `: ${item.type}` : ''}`,
      });
    }
    timeline.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));

    return {
      customer: row,
      profile: {
        uid: userId,
        email: userData.email || row.email,
        name: userData.name || row.name,
        phone: userData.phone || null,
        role: userData.role || row.role,
        roleSource: userData.roleSource || null,
        householdType: userData.householdType || userData.buyerProfile?.householdType || null,
        riskAppetite: userData.riskAppetite || userData.buyerProfile?.riskAppetite || null,
        commuteTolerance: userData.commuteTolerance || userData.buyerProfile?.commuteTolerance || null,
        budget: userData.budget || userData.buyerProfile?.budget || null,
        professionalAtOnboarding: Boolean(userData.professionalAtOnboarding || userData.buyerProfile?.professional),
      },
      subscription: {
        planId: row.planId,
        tier: row.tier,
        status: row.billingRaw,
        billingStatus: row.billingStatus,
        trialEndsAt: row.trialEndsAt,
        currentPeriodEnd: row.currentPeriodEnd,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        cycle: sub?.cycle || sub?.billingCadence || null,
        pendingPlan: sub?.pendingPlanId || null,
        fitChecksUsed: sub?.fitChecksUsed ?? null,
        fitChecksQuota: sub?.fitChecksQuota ?? null,
      },
      savedProperties: saved,
      alerts,
      notes,
      timeline: timeline.slice(0, 80),
    };
  }

  async overview(actorEmail: string) {
    await this.logAccess(actorEmail, 'view_overview');
    const { customers } = await this.assembleCustomers();
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
      if (c.accountStatus === 'Registered' || c.accountStatus === 'Paid' || c.accountStatus === 'Trial' || c.accountStatus === 'Churned') {
        registered += 1;
      }
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

    const cohortRows = Object.entries(cohorts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        signups: v.signups,
        paid: v.paid,
        retainedPct: v.signups ? Math.round((v.paid / v.signups) * 100) : 0,
      }));

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
        trialStarted: trial + paid,
        converted: paid,
        ratePct: trial + paid ? Math.round((paid / (trial + paid)) * 100) : 0,
      },
      tierDistribution: Object.entries(byTier).map(([planId, count]) => ({
        planId,
        label: planLabel(planId, null),
        count,
        pct: Math.round((count / total) * 100),
      })),
      accountStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      billingStatus: Object.entries(byBilling).map(([status, count]) => ({ status, count })),
      cohorts: cohortRows,
    };
  }

  async alerts(actorEmail: string) {
    await this.logAccess(actorEmail, 'view_alerts');
    const { customers } = await this.assembleCustomers();
    const items = customers
      .filter((c) => c.flagged)
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        tier: c.tier,
        accountStatus: c.accountStatus,
        reportsLifetime: c.reportsLifetime,
        lastActive: c.lastActive,
        flags: c.flags,
      }));
    return { alerts: items, count: items.length };
  }

  async partners(actorEmail: string) {
    await this.logAccess(actorEmail, 'view_partners');
    const { customers } = await this.assembleCustomers();
    const partners = customers.filter((c) => B2B_ROLES.has(c.role || '') || ['independent', 'agent_pro', 'enterprise', 'landlord_pro', 'elite', 'starter'].includes(c.planId));
    return { partners };
  }

  async addNote(actorEmail: string, userId: string, note: string, tag?: string) {
    const db = this.db;
    if (!db) {
      return { success: false, message: 'Store unavailable' };
    }
    const payload = {
      userId,
      note: note.trim(),
      tag: tag?.trim() || null,
      authorEmail: actorEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection('admin_account_notes').add(payload);
    await this.logAccess(actorEmail, 'add_note', userId);
    return { success: true, id: ref.id };
  }
}
