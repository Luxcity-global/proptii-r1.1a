/**
 * Canonical plan catalogue — single source of truth for all pricing, features, and Stripe IDs.
 * All plan names, prices, and feature lists must be read from here. Never hardcode in components.
 *
 * Prices are canonical from the prototype JS (PRD v4 §6):
 *  - Renter Pro: £12/mo (NOT £10 — that is the annual-equivalent)
 *  - Buyer Pro:  £19/mo (NOT £16 — that is the annual-equivalent)
 *  - Agent Pro annual saving: ~£30/mo (NOT £10 as in original PRD)
 *
 * Stripe price IDs are read from environment variables (never hardcoded).
 * In development these will be test-mode price IDs.
 */

export type UserSegment = 'renter' | 'buyer' | 'landlord' | 'agent';

export type PlanId =
  | 'explorer'
  | 'renter_pro'
  | 'buyer_pro'
  | 'starter'
  | 'landlord_pro'
  | 'elite'
  | 'independent'
  | 'agent_pro'
  | 'enterprise';

export interface PlanFeature {
  label: string;
  included: boolean;
  note?: string;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  segment: UserSegment[];
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualTotal: number | null;
  annualSaving: string | null;
  features: PlanFeature[];
  isPopular: boolean;
  isDark: boolean;
  isContactSales: boolean;
  isFree: boolean;
  /** Monthly quota for agent plans. Null for non-agent plans. */
  fitChecksQuota: number | null;
  /** Per-check overage rate (GBP) above quota. Null for non-agent plans. */
  fitChecksOverageRate: number | null;
  /** Stripe recurring price ID for monthly billing. Sourced from env vars at runtime. */
  stripePriceIdMonthly: string | null;
  /** Stripe recurring price ID for annual billing. Sourced from env vars at runtime. */
  stripePriceIdAnnual: string | null;
}

// ---------------------------------------------------------------------------
// Renters & Buyers
// ---------------------------------------------------------------------------

const explorerPlan: PlanConfig = {
  id: 'explorer',
  name: 'Explorer',
  segment: ['renter', 'buyer'],
  monthlyPrice: 0,
  annualPrice: null,
  annualTotal: null,
  annualSaving: null,
  isPopular: false,
  isDark: false,
  isContactSales: false,
  isFree: true,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: null,
  stripePriceIdAnnual: null,
  features: [
    { label: 'Property search', included: true },
    { label: 'Save up to 5 properties', included: true },
    { label: 'Basic viewing requests', included: true },
    { label: 'AI fit score', included: false },
    { label: 'Unlimited saved properties', included: false },
    { label: 'Priority viewing slots', included: false },
    { label: 'Referencing toolkit', included: false },
  ],
};

const renterProPlan: PlanConfig = {
  id: 'renter_pro',
  name: 'Renter Pro',
  segment: ['renter'],
  monthlyPrice: 12,
  annualPrice: 10,
  annualTotal: 99,
  annualSaving: 'save £21',
  isPopular: true,
  isDark: false,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_RENTER_PRO_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_RENTER_PRO_ANNUAL ?? null,
  features: [
    { label: 'Everything in Explorer', included: true },
    { label: 'Unlimited saved properties', included: true },
    { label: 'AI fit score & match report', included: true },
    { label: 'Priority viewing slots', included: true },
    { label: 'Referencing toolkit', included: true },
    { label: 'Move-in checklist', included: true },
    { label: 'Document storage (5 GB)', included: true },
  ],
};

const buyerProPlan: PlanConfig = {
  id: 'buyer_pro',
  name: 'Buyer Pro',
  segment: ['buyer'],
  monthlyPrice: 19,
  annualPrice: 16,
  annualTotal: 159,
  annualSaving: 'save £33',
  isPopular: false,
  isDark: false,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_BUYER_PRO_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_BUYER_PRO_ANNUAL ?? null,
  features: [
    { label: 'Everything in Renter Pro', included: true },
    { label: 'Mortgage readiness score', included: true },
    { label: 'Solicitor recommendations', included: true },
    { label: 'Survey & valuation tracker', included: true },
    { label: 'Buyer journey timeline', included: true },
    { label: 'Document storage (20 GB)', included: true },
    { label: 'Priority support', included: true },
  ],
};

// ---------------------------------------------------------------------------
// Landlords
// ---------------------------------------------------------------------------

const starterPlan: PlanConfig = {
  id: 'starter',
  name: 'Starter',
  segment: ['landlord'],
  monthlyPrice: 29,
  annualPrice: 24,
  annualTotal: 249,
  annualSaving: 'save £39',
  isPopular: false,
  isDark: false,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_STARTER_ANNUAL ?? null,
  features: [
    { label: 'Up to 2 properties', included: true },
    { label: 'Tenant referencing (basic)', included: true },
    { label: 'Digital contracts', included: true },
    { label: 'Viewing management', included: true },
    { label: 'Compliance reminders', included: false },
    { label: 'Maintenance tracker', included: false },
    { label: 'Financial dashboard', included: false },
  ],
};

const landlordProPlan: PlanConfig = {
  id: 'landlord_pro',
  name: 'Landlord Pro',
  segment: ['landlord'],
  monthlyPrice: 49,
  annualPrice: 40,
  annualTotal: 399,
  annualSaving: 'save £81',
  isPopular: true,
  isDark: false,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_LANDLORD_PRO_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_LANDLORD_PRO_ANNUAL ?? null,
  features: [
    { label: 'Everything in Starter', included: true },
    { label: 'Up to 10 properties', included: true },
    { label: 'Advanced tenant referencing', included: true },
    { label: 'Compliance reminders', included: true },
    { label: 'Maintenance tracker', included: true },
    { label: 'Financial dashboard', included: true },
    { label: 'Priority support', included: true },
  ],
};

const elitePlan: PlanConfig = {
  id: 'elite',
  name: 'Elite',
  segment: ['landlord'],
  monthlyPrice: 99,
  annualPrice: 80,
  annualTotal: 799,
  annualSaving: 'save £161',
  isPopular: false,
  isDark: true,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_ELITE_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_ELITE_ANNUAL ?? null,
  features: [
    { label: 'Everything in Landlord Pro', included: true },
    { label: 'Unlimited properties', included: true },
    { label: 'Dedicated account manager', included: true },
    { label: 'Custom lease templates', included: true },
    { label: 'Bulk referencing', included: true },
    { label: 'API access', included: true },
    { label: '24/7 priority support', included: true },
  ],
};

// ---------------------------------------------------------------------------
// Estate Agents
// ---------------------------------------------------------------------------

const independentPlan: PlanConfig = {
  id: 'independent',
  name: 'Independent',
  segment: ['agent'],
  monthlyPrice: 79,
  annualPrice: 64,
  annualTotal: 750,
  annualSaving: '~£18/mo saving',
  isPopular: false,
  isDark: false,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: 20,
  fitChecksOverageRate: 4,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_INDEPENDENT_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_INDEPENDENT_ANNUAL ?? null,
  features: [
    { label: 'Up to 50 listings', included: true },
    { label: '20 fit checks / month', included: true, note: '£4 per check above quota' },
    { label: 'Tenant referencing', included: true },
    { label: 'Digital contracts', included: true },
    { label: 'Viewing management', included: true },
    { label: 'Bulk operations', included: false },
    { label: 'API access', included: false },
  ],
};

const agentProPlan: PlanConfig = {
  id: 'agent_pro',
  name: 'Agent Pro',
  segment: ['agent'],
  monthlyPrice: 149,
  annualPrice: 120,
  annualTotal: 1430,
  annualSaving: '~£30/mo saving',
  isPopular: true,
  isDark: false,
  isContactSales: false,
  isFree: false,
  fitChecksQuota: 100,
  fitChecksOverageRate: 3,
  stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_AGENT_PRO_MONTHLY ?? null,
  stripePriceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_AGENT_PRO_ANNUAL ?? null,
  features: [
    { label: 'Unlimited listings', included: true },
    { label: '100 fit checks / month', included: true, note: '£3 per check above quota' },
    { label: 'Advanced tenant referencing', included: true },
    { label: 'Bulk operations', included: true },
    { label: 'Team seats (up to 5)', included: true },
    { label: 'Analytics dashboard', included: true },
    { label: 'Priority support', included: true },
  ],
};

const enterprisePlan: PlanConfig = {
  id: 'enterprise',
  name: 'Enterprise',
  segment: ['agent'],
  monthlyPrice: null,
  annualPrice: null,
  annualTotal: null,
  annualSaving: null,
  isPopular: false,
  isDark: true,
  isContactSales: true,
  isFree: false,
  fitChecksQuota: null,
  fitChecksOverageRate: null,
  stripePriceIdMonthly: null,
  stripePriceIdAnnual: null,
  features: [
    { label: 'Everything in Agent Pro', included: true },
    { label: 'Unlimited team seats', included: true },
    { label: 'Custom integrations', included: true },
    { label: 'Dedicated account manager', included: true },
    { label: 'SLA guarantee', included: true },
    { label: 'Custom contract terms', included: true },
    { label: '24/7 white-glove support', included: true },
  ],
};

// ---------------------------------------------------------------------------
// Exported catalogue
// ---------------------------------------------------------------------------

export const PLANS: PlanConfig[] = [
  explorerPlan,
  renterProPlan,
  buyerProPlan,
  starterPlan,
  landlordProPlan,
  elitePlan,
  independentPlan,
  agentProPlan,
  enterprisePlan,
];

/** Returns the plan config for a given plan ID, or undefined if not found. */
export function getPlanById(id: PlanId): PlanConfig | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Returns all plans for a given user segment. */
export function getPlansBySegment(segment: UserSegment): PlanConfig[] {
  return PLANS.filter((p) => p.segment.includes(segment));
}

/** Plans shown on the pricing page for each audience tab. */
export function getPlansForAudienceTab(
  audience: 'renters' | 'landlords' | 'agents',
): PlanConfig[] {
  if (audience === 'renters') {
    return PLANS.filter(
      (p) => p.segment.includes('renter') || p.segment.includes('buyer'),
    );
  }
  if (audience === 'landlords') {
    return getPlansBySegment('landlord');
  }
  return getPlansBySegment('agent');
}

export function getDisplayPrice(
  plan: PlanConfig,
  cycle: 'monthly' | 'annual',
): { amount: number | null; note: string } {
  if (plan.isFree) {
    return { amount: 0, note: '' };
  }
  if (plan.isContactSales) {
    return { amount: null, note: 'Annual contract · volume licence' };
  }
  const amount =
    cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const note =
    cycle === 'annual' && plan.annualSaving && plan.annualTotal
      ? `Billed £${plan.annualTotal}/yr · ${plan.annualSaving}`
      : 'Billed monthly · no commitment';
  return { amount, note };
}

export function getStripePriceId(
  plan: PlanConfig,
  cycle: 'monthly' | 'annual',
): string | null {
  return cycle === 'annual'
    ? plan.stripePriceIdAnnual
    : plan.stripePriceIdMonthly;
}
