/**
 * Backend plan catalogue — mirrors src/config/plans.ts on the frontend.
 * Prices and features are hardcoded here; Stripe price IDs come from env vars.
 *
 * Used by:
 *  - GET /api/billing/plans  (return catalogue to frontend)
 *  - Webhook handlers         (map Stripe price ID → plan ID + cadence)
 *  - BillingService           (quota values per plan)
 */

import type { PlanId, BillingCadence } from '../../../models/user.model';

export interface PlanFeature {
  label: string;
  included: boolean;
  note?: string;
}

export interface BackendPlanConfig {
  id: PlanId;
  name: string;
  segment: string[];
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualTotal: number | null;
  annualSaving: string | null;
  features: PlanFeature[];
  isPopular: boolean;
  isDark: boolean;
  isContactSales: boolean;
  isFree: boolean;
  fitChecksQuota: number | null;
  fitChecksOverageRate: number | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
}

const STATIC_PLANS: Omit<BackendPlanConfig, 'stripePriceIdMonthly' | 'stripePriceIdAnnual'>[] = [
  {
    id: 'free',
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
    features: [
      { label: 'Property search', included: true },
      { label: 'Save up to 5 properties', included: true },
      { label: 'Basic viewing requests', included: true },
      { label: 'AI fit score', included: false },
      { label: 'Unlimited saved properties', included: false },
    ],
  },
  {
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
    features: [
      { label: 'Everything in Explorer', included: true },
      { label: 'Unlimited saved properties', included: true },
      { label: 'AI fit score & match report', included: true },
      { label: 'Priority viewing slots', included: true },
      { label: 'Referencing toolkit', included: true },
    ],
  },
  {
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
    features: [
      { label: 'Everything in Renter Pro', included: true },
      { label: 'Mortgage readiness score', included: true },
      { label: 'Solicitor recommendations', included: true },
      { label: 'Buyer journey timeline', included: true },
    ],
  },
  {
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
    features: [
      { label: 'Up to 2 properties', included: true },
      { label: 'Tenant referencing (basic)', included: true },
      { label: 'Digital contracts', included: true },
      { label: 'Compliance reminders', included: false },
    ],
  },
  {
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
    features: [
      { label: 'Everything in Starter', included: true },
      { label: 'Up to 10 properties', included: true },
      { label: 'Advanced tenant referencing', included: true },
      { label: 'Compliance reminders', included: true },
      { label: 'Financial dashboard', included: true },
    ],
  },
  {
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
    features: [
      { label: 'Everything in Landlord Pro', included: true },
      { label: 'Unlimited properties', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'API access', included: true },
    ],
  },
  {
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
    features: [
      { label: 'Up to 50 listings', included: true },
      { label: '20 fit checks / month', included: true, note: '£4 per check above quota' },
      { label: 'Tenant referencing', included: true },
      { label: 'Bulk operations', included: false },
    ],
  },
  {
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
    features: [
      { label: 'Unlimited listings', included: true },
      { label: '100 fit checks / month', included: true, note: '£3 per check above quota' },
      { label: 'Bulk operations', included: true },
      { label: 'Team seats (up to 5)', included: true },
      { label: 'Analytics dashboard', included: true },
    ],
  },
  {
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
    features: [
      { label: 'Everything in Agent Pro', included: true },
      { label: 'Unlimited team seats', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'SLA guarantee', included: true },
    ],
  },
];

/** Returns the full plan catalogue with Stripe price IDs injected from env vars. */
export function getPlans(): BackendPlanConfig[] {
  return STATIC_PLANS.map((p) => ({
    ...p,
    stripePriceIdMonthly: getPriceIdForPlan(p.id, 'monthly'),
    stripePriceIdAnnual: getPriceIdForPlan(p.id, 'annual'),
  }));
}

/** Returns the plan config for a given plan ID. */
export function getPlanConfig(id: PlanId): BackendPlanConfig | undefined {
  return getPlans().find((p) => p.id === id);
}

function getPriceIdForPlan(id: PlanId, cadence: BillingCadence): string | null {
  const key = cadence === 'monthly'
    ? `STRIPE_PRICE_${id.toUpperCase()}_MONTHLY`
    : `STRIPE_PRICE_${id.toUpperCase()}_ANNUAL`;
  return process.env[key] ?? null;
}

/**
 * Builds a lookup map from Stripe price ID → { planId, cadence }.
 * Used by webhook handlers to identify which plan a price ID belongs to.
 */
export function buildPriceIdMap(): Map<string, { planId: PlanId; cadence: BillingCadence }> {
  const map = new Map<string, { planId: PlanId; cadence: BillingCadence }>();

  const entries: Array<[string | undefined, PlanId, BillingCadence]> = [
    [process.env.STRIPE_PRICE_RENTER_PRO_MONTHLY, 'renter_pro', 'monthly'],
    [process.env.STRIPE_PRICE_RENTER_PRO_ANNUAL, 'renter_pro', 'annual'],
    [process.env.STRIPE_PRICE_BUYER_PRO_MONTHLY, 'buyer_pro', 'monthly'],
    [process.env.STRIPE_PRICE_BUYER_PRO_ANNUAL, 'buyer_pro', 'annual'],
    [process.env.STRIPE_PRICE_STARTER_MONTHLY, 'starter', 'monthly'],
    [process.env.STRIPE_PRICE_STARTER_ANNUAL, 'starter', 'annual'],
    [process.env.STRIPE_PRICE_LANDLORD_PRO_MONTHLY, 'landlord_pro', 'monthly'],
    [process.env.STRIPE_PRICE_LANDLORD_PRO_ANNUAL, 'landlord_pro', 'annual'],
    [process.env.STRIPE_PRICE_ELITE_MONTHLY, 'elite', 'monthly'],
    [process.env.STRIPE_PRICE_ELITE_ANNUAL, 'elite', 'annual'],
    [process.env.STRIPE_PRICE_INDEPENDENT_MONTHLY, 'independent', 'monthly'],
    [process.env.STRIPE_PRICE_INDEPENDENT_ANNUAL, 'independent', 'annual'],
    [process.env.STRIPE_PRICE_AGENT_PRO_MONTHLY, 'agent_pro', 'monthly'],
    [process.env.STRIPE_PRICE_AGENT_PRO_ANNUAL, 'agent_pro', 'annual'],
  ];

  for (const [priceId, planId, cadence] of entries) {
    if (priceId) map.set(priceId, { planId, cadence });
  }

  return map;
}
