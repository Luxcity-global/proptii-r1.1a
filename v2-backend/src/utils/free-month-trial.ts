/**
 * Card-free "1 month free" trial granted to every user, managed in Firestore
 * (no Stripe subscription). Plans and end-of-trial behaviour differ by audience:
 * consumers drop to Explorer, landlords/agents must activate a subscription.
 */

export const FREE_MONTH_DAYS = 30;

const NON_TRIAL_ROLES = new Set(['admin', 'guest', 'ghost_landlord', 'contract-file']);
const FREE_PLAN_IDS = new Set(['free', 'explorer']);

export type FreeMonthAudience = 'consumer' | 'supply';

/** Plan unlocked during the free month, or null when the role should not get one. */
export function freeMonthPlanForRole(role?: string | null): string | null {
  const r = (role || '').toLowerCase().trim();
  if (!r || NON_TRIAL_ROLES.has(r)) return null;
  if (r === 'agent') return 'agent_pro';
  if (r === 'landlord') return 'elite';
  return 'buyer_pro';
}

export function freeMonthAudience(role?: string | null): FreeMonthAudience {
  const r = (role || '').toLowerCase().trim();
  return r === 'agent' || r === 'landlord' ? 'supply' : 'consumer';
}

/**
 * Users qualify once: no prior free month, no Stripe trial, no Stripe subscription,
 * and not currently on a paid plan.
 */
export function isEligibleForFreeMonth(data: Record<string, any> | null | undefined): boolean {
  if (!data) return true;
  if (data.freeMonthTrial) return false;
  if (data.stripeSubscriptionId) return false;
  if (data.trialEndsAt) return false;
  const planId = data.planId || data.plan;
  if (planId && !FREE_PLAN_IDS.has(planId)) return false;
  return true;
}

export function isTrialExpired(trialEndsAt: unknown, now: number = Date.now()): boolean {
  if (!trialEndsAt) return false;
  const value =
    typeof (trialEndsAt as any)?.toDate === 'function'
      ? (trialEndsAt as any).toDate()
      : new Date(trialEndsAt as any);
  const ms = value instanceof Date ? value.getTime() : NaN;
  return Number.isFinite(ms) && ms < now;
}

export function freeMonthEndDate(start: Date = new Date()): string {
  return new Date(start.getTime() + FREE_MONTH_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
