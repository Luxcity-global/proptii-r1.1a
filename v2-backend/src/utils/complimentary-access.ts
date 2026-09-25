/**
 * Domain-based complimentary (full) access for company staff.
 * Keep in sync with src/utils/complimentaryAccess.ts on the frontend.
 */

const DEFAULT_COMPLIMENTARY_DOMAINS = ['theluxcity.co.uk'];

export function isComplimentaryAccessEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (!lower.includes('@')) return false;

  const domain = lower.split('@')[1];
  const domains = (
    process.env.COMPLIMENTARY_EMAIL_DOMAINS || DEFAULT_COMPLIMENTARY_DOMAINS.join(',')
  )
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(domain && domains.includes(domain));
}

/** Highest paid plan available for each role on the platform. */
export function complimentaryPlanForRole(role?: string | null): string {
  const r = (role || '').toLowerCase();
  if (r === 'agent') return 'enterprise';
  if (r === 'landlord') return 'elite';
  return 'buyer_pro';
}

export function complimentaryBillingPayload(role?: string | null) {
  const planId = complimentaryPlanForRole(role);
  return {
    hasActiveSubscription: true,
    planId,
    // Frontend BillingStatus uses `plan`
    plan: planId,
    status: 'active',
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    fitChecksUsed: 0,
    fitChecksQuota: null,
    pendingPlan: null,
    pendingCycle: null,
    billingCadence: 'annual',
    hasStripeCustomer: false,
  };
}
