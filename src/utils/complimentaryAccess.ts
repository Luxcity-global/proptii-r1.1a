/**
 * Domain-based complimentary (full) access for company staff.
 * Applied only at billing-status production so feature gates stay unchanged.
 */

import type { BillingStatus } from '../services/billingService';
import type { PlanId } from '../config/plans';

const DEFAULT_COMPLIMENTARY_DOMAINS = ['theluxcity.co.uk'];
const DEFAULT_COMPLIMENTARY_EMAILS = ['boluoyin.work@gmail.com'];

export function isComplimentaryAccessEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (!lower.includes('@')) return false;

  const emails = [
    ...DEFAULT_COMPLIMENTARY_EMAILS,
    ...String(import.meta.env.VITE_COMPLIMENTARY_EMAILS || '').split(','),
  ].map((s) => s.trim().toLowerCase());
  if (emails.includes(lower)) return true;

  const domain = lower.split('@')[1];
  const domains = String(
    import.meta.env.VITE_COMPLIMENTARY_EMAIL_DOMAINS ||
      DEFAULT_COMPLIMENTARY_DOMAINS.join(','),
  )
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(domain && domains.includes(domain));
}

/** Highest paid plan available for each role on the platform. */
export function complimentaryPlanForRole(
  role?: string | null,
): PlanId {
  const r = (role || '').toLowerCase();
  if (r === 'agent') return 'enterprise';
  if (r === 'landlord') return 'elite';
  // renter / buyer / tenant / unknown consumer → top consumer tier
  return 'buyer_pro';
}

export function complimentaryBillingStatus(
  role?: string | null,
): BillingStatus {
  const plan = complimentaryPlanForRole(role);
  return {
    plan,
    status: 'active',
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    fitChecksUsed: 0,
    // null = unlimited (matches Enterprise catalogue)
    fitChecksQuota: null,
    pendingPlan: null,
    pendingCycle: null,
    billingCadence: 'annual',
    hasStripeCustomer: false,
  };
}
