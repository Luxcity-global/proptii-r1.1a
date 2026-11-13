import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, Record<string, any>>();
const setClaims = vi.fn();
let firestoreDown = false;

function docRef(collection: string, id: string) {
  const key = `${collection}/${id}`;
  return {
    async get() {
      if (firestoreDown) throw new Error('Could not load the default credentials');
      const value = store.get(key);
      return { exists: Boolean(value), data: () => (value ? { ...value } : undefined) };
    },
    async set(data: Record<string, any>, opts?: { merge?: boolean }) {
      store.set(key, opts?.merge ? { ...(store.get(key) || {}), ...data } : { ...data });
    },
  };
}

const fakeDb = {
  collection: (name: string) => ({
    doc: (id: string) => docRef(name, id),
    where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
  }),
  runTransaction: async (fn: (tx: any) => Promise<any>) =>
    fn({
      get: (ref: any) => ref.get(),
      set: (ref: any, data: any, opts: any) => ref.set(data, opts),
    }),
};

vi.mock('firebase-admin', () => {
  const firestore = Object.assign(() => fakeDb, {
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  });
  return {
    apps: [{}],
    firestore,
    auth: () => ({
      getUser: async () => ({ customClaims: {} }),
      setCustomUserClaims: setClaims,
    }),
  };
});

import { BillingService } from './billing.service';
import {
  freeMonthPlanForRole,
  isEligibleForFreeMonth,
  isTrialExpired,
} from '../utils/free-month-trial';

const DAY = 24 * 60 * 60 * 1000;

describe('free month rules', () => {
  it('maps roles to the free-month plan', () => {
    expect(freeMonthPlanForRole('tenant')).toBe('buyer_pro');
    expect(freeMonthPlanForRole('buyer')).toBe('buyer_pro');
    expect(freeMonthPlanForRole('landlord')).toBe('elite');
    expect(freeMonthPlanForRole('agent')).toBe('agent_pro');
    expect(freeMonthPlanForRole(null)).toBeNull();
    expect(freeMonthPlanForRole('admin')).toBeNull();
    expect(freeMonthPlanForRole('guest')).toBeNull();
  });

  it('only lets users without a trial or paid plan qualify', () => {
    expect(isEligibleForFreeMonth(null)).toBe(true);
    expect(isEligibleForFreeMonth({ planId: 'free', status: 'active' })).toBe(true);
    expect(isEligibleForFreeMonth({ stripeCustomerId: 'cus_1' })).toBe(true);
    expect(isEligibleForFreeMonth({ freeMonthTrial: true, planId: 'explorer' })).toBe(false);
    expect(isEligibleForFreeMonth({ stripeSubscriptionId: 'sub_1', planId: 'free' })).toBe(false);
    expect(isEligibleForFreeMonth({ trialEndsAt: '2026-01-01T00:00:00Z' })).toBe(false);
    expect(isEligibleForFreeMonth({ planId: 'landlord_pro', status: 'canceled' })).toBe(false);
  });

  it('detects expiry for ISO strings and Firestore timestamps', () => {
    const now = Date.now();
    expect(isTrialExpired(new Date(now - DAY).toISOString(), now)).toBe(true);
    expect(isTrialExpired(new Date(now + DAY).toISOString(), now)).toBe(false);
    expect(isTrialExpired({ toDate: () => new Date(now - DAY) }, now)).toBe(true);
    expect(isTrialExpired(null, now)).toBe(false);
  });
});

describe('BillingService free month', () => {
  let service: BillingService;

  beforeEach(() => {
    store.clear();
    setClaims.mockClear();
    firestoreDown = false;
    service = new BillingService();
  });

  it('still grants staff full access when Firestore is unreachable', async () => {
    firestoreDown = true;
    const staff = await service.getBillingStatus('s1', 'aisha@theluxcity.co.uk', 'tenant');
    expect(staff.hasActiveSubscription).toBe(true);
    expect(staff.planId).toBe('buyer_pro');
    await expect(service.getBillingStatus('t9', 't9@test.com', 'tenant')).rejects.toThrow(
      'Billing service temporarily unavailable',
    );
  });

  it('starts a 30-day Buyer Pro trial for a new tenant', async () => {
    const res = await service.getBillingStatus('t1', 'T1@test.com', 'tenant');

    expect(res.planId).toBe('buyer_pro');
    expect(res.status).toBe('trialing');
    expect(res.hasActiveSubscription).toBe(true);
    const days = (new Date(res.trialEndsAt).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
    expect(store.get('subscriptions/t1')).toMatchObject({ freeMonthTrial: true, email: 't1@test.com' });
    expect(store.get('users/t1')).toMatchObject({ subscriptionStatus: 'trialing', subscriptionTier: 'buyer_pro' });
    expect(setClaims).toHaveBeenCalledWith('t1', { hasPro: true });
  });

  it('gives landlords Elite and agents Agent Pro', async () => {
    expect((await service.getBillingStatus('l1', 'l@test.com', 'landlord')).planId).toBe('elite');
    expect((await service.getBillingStatus('a1', 'a@test.com', 'agent')).planId).toBe('agent_pro');
  });

  it('gives existing free users their month, but not paying or previously trialled users', async () => {
    store.set('subscriptions/old-free', { planId: 'free', status: 'active' });
    store.set('subscriptions/payer', { planId: 'landlord_pro', status: 'active', stripeSubscriptionId: 'sub_1' });
    store.set('subscriptions/had-trial', { planId: 'free', status: 'active', trialEndsAt: '2026-01-01T00:00:00Z' });

    expect((await service.getBillingStatus('old-free', 'o@test.com', 'tenant')).status).toBe('trialing');
    expect((await service.getBillingStatus('payer', 'p@test.com', 'landlord')).planId).toBe('landlord_pro');
    const hadTrial = await service.getBillingStatus('had-trial', 'h@test.com', 'tenant');
    expect(hadTrial.planId).toBe('free');
    expect(hadTrial.status).toBe('active');
  });

  it('waits until the user has a role', async () => {
    const res = await service.getBillingStatus('new', 'n@test.com', '');
    expect(res.status).toBe('active');
    expect(res.planId).toBe('free');
    expect(store.has('subscriptions/new')).toBe(false);
  });

  it('moves tenants to Explorer when the month ends', async () => {
    store.set('subscriptions/t2', {
      planId: 'buyer_pro',
      status: 'trialing',
      freeMonthTrial: true,
      trialEndsAt: new Date(Date.now() - DAY).toISOString(),
    });

    const res = await service.getBillingStatus('t2', 't2@test.com', 'tenant');
    expect(res.planId).toBe('explorer');
    expect(res.status).toBe('active');
    expect(store.get('subscriptions/t2')).toMatchObject({ planId: 'explorer', freeMonthTrial: true });
    expect(setClaims).toHaveBeenCalledWith('t2', { hasPro: false });

    const again = await service.getBillingStatus('t2', 't2@test.com', 'tenant');
    expect(again.planId).toBe('explorer');
  });

  it('leaves landlords as an expired trial so they are sent to activate', async () => {
    store.set('subscriptions/l2', {
      planId: 'elite',
      status: 'trialing',
      freeMonthTrial: true,
      trialEndsAt: new Date(Date.now() - DAY).toISOString(),
    });

    const res = await service.getBillingStatus('l2', 'l2@test.com', 'landlord');
    expect(res.planId).toBe('elite');
    expect(res.status).toBe('trialing');
    expect(res.hasActiveSubscription).toBe(false);
  });

  it('switches the trial plan if the role changes mid-trial', async () => {
    await service.getBillingStatus('u3', 'u3@test.com', 'tenant');
    const res = await service.getBillingStatus('u3', 'u3@test.com', 'landlord');
    expect(res.planId).toBe('elite');
    expect(res.status).toBe('trialing');
  });
});
