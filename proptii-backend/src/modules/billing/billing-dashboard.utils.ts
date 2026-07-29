import type {
  BillingCadence,
  DashboardBillingState,
  PlanId,
  SubscriptionStatus,
  UserDocument,
} from '../../models/user.model';
import type { BillingStatusDto } from './dto/checkout.dto';

export type BillingDashboard = 'consumer' | 'landlord';

const LANDLORD_PLAN_IDS: PlanId[] = [
  'starter',
  'landlord_pro',
  'elite',
  'independent',
  'agent_pro',
  'enterprise',
];

export function dashboardForPlanId(
  planId: string | null | undefined,
): BillingDashboard {
  if (planId && LANDLORD_PLAN_IDS.includes(planId as PlanId)) {
    return 'landlord';
  }
  return 'consumer';
}

export function billingFieldKey(
  dashboard: BillingDashboard,
): 'billing_consumer' | 'billing_landlord' {
  return dashboard === 'landlord' ? 'billing_landlord' : 'billing_consumer';
}

export function emptyDashboardBilling(): DashboardBillingState {
  return {
    plan: 'free',
    subscription_status: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    billing_cadence: null,
    trial_ends_at: null,
    current_period_end: null,
    cancel_at_period_end: false,
    fit_checks_used: null,
    fit_checks_quota: null,
    pending_plan: null,
    pending_cycle: null,
    payment_failed_at: null,
    trial_ending_soon: false,
  };
}

function legacyToDashboardState(doc: UserDocument): DashboardBillingState {
  return {
    plan: doc.plan ?? 'free',
    subscription_status: doc.subscription_status ?? null,
    stripe_subscription_id: doc.stripe_subscription_id ?? null,
    stripe_price_id: doc.stripe_price_id ?? null,
    billing_cadence: doc.billing_cadence ?? null,
    trial_ends_at: doc.trial_ends_at ?? null,
    current_period_end: doc.current_period_end ?? null,
    cancel_at_period_end: doc.cancel_at_period_end ?? false,
    fit_checks_used: doc.fit_checks_used ?? null,
    fit_checks_quota: doc.fit_checks_quota ?? null,
    pending_plan: doc.pending_plan ?? null,
    pending_cycle: doc.pending_cycle ?? null,
    payment_failed_at: doc.payment_failed_at ?? null,
    trial_ending_soon: doc.trial_ending_soon ?? false,
  };
}

/** Read billing for one dashboard, with legacy single-plan fallback. */
export function getDashboardBilling(
  doc: UserDocument | null,
  dashboard: BillingDashboard,
): DashboardBillingState {
  const key = billingFieldKey(dashboard);
  const stored = doc?.[key];
  if (stored && (stored.plan || stored.stripe_subscription_id)) {
    return { ...emptyDashboardBilling(), ...stored };
  }

  if (doc?.plan && doc.plan !== 'free' && dashboardForPlanId(doc.plan) === dashboard) {
    return legacyToDashboardState(doc);
  }

  return emptyDashboardBilling();
}

/** If legacy flat billing exists, copy into the matching dashboard bucket once. */
export function buildLegacyMigrationPatch(
  doc: UserDocument,
): Partial<UserDocument> | null {
  if (!doc.plan || doc.plan === 'free') return null;

  const dashboard = dashboardForPlanId(doc.plan);
  const key = billingFieldKey(dashboard);
  const existing = doc[key];
  if (existing?.stripe_subscription_id || existing?.plan) return null;

  return { [key]: legacyToDashboardState(doc) };
}

export function dashboardForSubscriptionId(
  doc: UserDocument,
  subscriptionId: string,
): BillingDashboard | null {
  if (doc.billing_consumer?.stripe_subscription_id === subscriptionId) {
    return 'consumer';
  }
  if (doc.billing_landlord?.stripe_subscription_id === subscriptionId) {
    return 'landlord';
  }
  if (doc.stripe_subscription_id === subscriptionId) {
    return dashboardForPlanId(doc.plan);
  }
  return null;
}

export function toBillingStatusDto(
  doc: UserDocument | null,
  dashboard: BillingDashboard,
): BillingStatusDto {
  const state = getDashboardBilling(doc, dashboard);
  return {
    dashboard,
    plan: state.plan ?? 'free',
    status: state.subscription_status ?? null,
    trialEndsAt: state.trial_ends_at ?? null,
    currentPeriodEnd: state.current_period_end ?? null,
    cancelAtPeriodEnd: state.cancel_at_period_end ?? false,
    fitChecksUsed: state.fit_checks_used ?? null,
    fitChecksQuota: state.fit_checks_quota ?? null,
    pendingPlan: state.pending_plan ?? null,
    pendingCycle: state.pending_cycle ?? null,
    billingCadence: state.billing_cadence ?? null,
    hasStripeCustomer: Boolean(doc?.stripe_customer_id),
  };
}

export function mergeDashboardBillingUpdate(
  doc: UserDocument | null,
  dashboard: BillingDashboard,
  fields: Partial<DashboardBillingState>,
): Partial<UserDocument> {
  const key = billingFieldKey(dashboard);
  const current = getDashboardBilling(doc, dashboard);
  return {
    [key]: {
      ...current,
      ...fields,
    },
  };
}

export function parseBillingDashboard(
  value: string | null | undefined,
): BillingDashboard {
  return value === 'landlord' ? 'landlord' : 'consumer';
}

export function pendingPlanForDashboard(
  doc: UserDocument | null,
  dashboard: BillingDashboard,
): { planId: string; cycle: BillingCadence | null } {
  const state = getDashboardBilling(doc, dashboard);
  if (state.pending_plan) {
    return {
      planId: state.pending_plan,
      cycle: state.pending_cycle ?? null,
    };
  }
  if (
    doc?.pending_plan &&
    dashboardForPlanId(doc.pending_plan) === dashboard
  ) {
    return {
      planId: doc.pending_plan,
      cycle: doc.pending_cycle ?? null,
    };
  }
  return { planId: '', cycle: null };
}
