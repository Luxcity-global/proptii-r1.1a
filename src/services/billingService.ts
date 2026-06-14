import { fetchBillingWithApiFallback } from '../utils/apiEndpoints';
import { getAccessTokenForApiRequest } from './msalAccessToken';
import {
  getPlanById,
  getStripePriceId,
  type PlanConfig,
  type PlanId,
} from '../config/plans';

export interface BillingStatus {
  plan: string;
  status: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  fitChecksUsed: number | null;
  fitChecksQuota: number | null;
  pendingPlan: string | null;
  pendingCycle: string | null;
  billingCadence: string | null;
  hasStripeCustomer: boolean;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAccessTokenForApiRequest();
  if (!token) {
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function confirmCheckoutSession(
  sessionId: string,
): Promise<BillingStatus> {
  const headers = await authHeaders();
  const { response } = await fetchBillingWithApiFallback(
    '/billing/confirm-checkout',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionId }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body.message) msg = body.message;
    } catch {
      /* use raw */
    }
    throw new Error(msg || 'Could not confirm checkout');
  }
  return response.json();
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  const headers = await authHeaders();
  if (!('Authorization' in headers)) return null;

  const { response } = await fetchBillingWithApiFallback('/billing/status', { headers });
  if (!response.ok) return null;
  return response.json();
}

export async function setPendingPlan(
  planId: PlanId | string,
  cycle: 'monthly' | 'annual',
): Promise<void> {
  const headers = await authHeaders();
  const { response } = await fetchBillingWithApiFallback('/billing/pending-plan', {
    method: 'POST',
    headers,
    body: JSON.stringify({ planId, cycle }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to save plan selection');
  }
}

const CHECKOUT_TIMEOUT_MS = 25_000;

export async function createCheckoutSession(
  priceId: string,
  trialEnabled: boolean,
): Promise<{ checkoutUrl: string }> {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS);

  try {
    const { response, url } = await fetchBillingWithApiFallback('/billing/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ priceId, trialEnabled }),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please sign in again, then retry checkout.');
      }
      if (response.status === 404) {
        throw new Error(
          'Billing API not found. Start the local backend (npm run dev in proptii-backend). Deployed Render does not include billing routes yet.',
        );
      }
      if (response.status === 400) {
        const text = await response.text();
        let msg = text;
        try {
          const body = JSON.parse(text) as { message?: string };
          if (body.message) msg = body.message;
        } catch {
          /* use raw text */
        }
        throw new Error(msg || 'Checkout request rejected');
      }
      const text = await response.text();
      throw new Error(
        text || `Checkout failed (${response.status}). Is the API running at ${url}?`,
      );
    }
    const data = (await response.json()) as { checkoutUrl?: string };
    if (!data.checkoutUrl) {
      throw new Error('Server did not return a checkout URL');
    }
    return { checkoutUrl: data.checkoutUrl };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'Checkout timed out. Restart the backend (npm run dev in proptii-backend) and try again.',
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchBillingPlans(): Promise<unknown> {
  const { response } = await fetchBillingWithApiFallback('/billing/plans');
  if (!response.ok) throw new Error('Failed to load plans');
  return response.json();
}

type BillingPlanFromApi = Pick<
  PlanConfig,
  'id' | 'stripePriceIdMonthly' | 'stripePriceIdAnnual'
> & { id: string };

let plansCache: BillingPlanFromApi[] | null = null;
let plansCacheAt = 0;
const PLANS_CACHE_MS = 5 * 60 * 1000;

function apiPlanIdForFrontend(planId: PlanId): string {
  return planId === 'explorer' ? 'free' : planId;
}

async function loadPlansFromApi(): Promise<BillingPlanFromApi[]> {
  if (plansCache && Date.now() - plansCacheAt < PLANS_CACHE_MS) {
    return plansCache;
  }
  const data = await fetchBillingPlans();
  plansCache = Array.isArray(data) ? (data as BillingPlanFromApi[]) : [];
  plansCacheAt = Date.now();
  return plansCache;
}

/**
 * Resolve Stripe price ID for checkout.
 * Uses VITE_STRIPE_PRICE_* when present (local/dev); otherwise loads from GET /api/billing/plans
 * so Render only needs STRIPE_PRICE_* on the backend.
 */
export async function resolveStripePriceId(
  planId: PlanId,
  cycle: 'monthly' | 'annual',
): Promise<string | null> {
  const plan = getPlanById(planId);
  if (!plan) return null;

  const fromBuildEnv = getStripePriceId(plan, cycle);
  if (fromBuildEnv) return fromBuildEnv;

  try {
    const apiPlans = await loadPlansFromApi();
    const apiPlan = apiPlans.find(
      (p) => p.id === apiPlanIdForFrontend(planId),
    );
    if (!apiPlan) return null;
    return cycle === 'annual'
      ? apiPlan.stripePriceIdAnnual
      : apiPlan.stripePriceIdMonthly;
  } catch {
    return null;
  }
}

export const CHECKOUT_NOT_CONFIGURED_MSG =
  'This plan is not configured for checkout yet. Set STRIPE_PRICE_* on the backend (Render) or VITE_STRIPE_PRICE_* on the frontend build, then redeploy.';

export async function createBillingPortalSession(): Promise<{ portalUrl: string }> {
  const headers = await authHeaders();
  const { response } = await fetchBillingWithApiFallback('/billing/portal', {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Could not open billing portal');
  }
  return response.json();
}

/** S3-14 — Downgrade to Explorer (free) after trial ends. */
export async function downgradeToFreePlan(): Promise<void> {
  const headers = await authHeaders();
  const { response } = await fetchBillingWithApiFallback('/billing/downgrade', {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Downgrade failed');
  }
}
