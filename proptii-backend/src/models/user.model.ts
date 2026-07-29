/**
 * User document model for Azure Cosmos DB — Users container.
 * The document is keyed by the Azure AD B2C object ID (oid claim).
 *
 * Billing fields (14) were added in Sprint 0 (S0-09) to support the Stripe
 * subscription lifecycle. All pre-existing user fields are preserved.
 *
 * Cosmos DB does not enforce a schema; this class acts as the canonical
 * TypeScript shape for type-safety across the NestJS billing module.
 */

// ── Billing enums ────────────────────────────────────────────────────────────

export type UserSegment = 'renter' | 'buyer' | 'landlord' | 'agent';

export type PlanId =
  | 'free'
  | 'renter_pro'
  | 'buyer_pro'
  | 'starter'
  | 'landlord_pro'
  | 'elite'
  | 'independent'
  | 'agent_pro'
  | 'enterprise';

export type BillingCadence = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

/** Billing state scoped to one dashboard (renter/buyer vs landlord/agent). */
export interface DashboardBillingState {
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  plan?: PlanId;
  billing_cadence?: BillingCadence | null;
  subscription_status?: SubscriptionStatus | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  fit_checks_used?: number | null;
  fit_checks_quota?: number | null;
  pending_plan?: string | null;
  pending_cycle?: BillingCadence | null;
  payment_failed_at?: string | null;
  trial_ending_soon?: boolean;
}

// ── User document ────────────────────────────────────────────────────────────

/**
 * Represents a document in the Cosmos DB `Users` container.
 * Partition key: `/id`
 */
export class UserDocument {
  /** Azure AD B2C object ID (oid claim) — used as the document `id` and partition key. */
  id: string;

  /** Azure AD B2C user principal name. */
  userPrincipalName?: string;

  /** Display name from Azure AD. */
  name?: string;

  /** Email address. */
  email?: string;

  /** Phone number. */
  phone?: string;

  /** Given name. */
  givenName?: string;

  /** Surname. */
  surname?: string;

  /** ISO 8601 timestamp when the document was created. */
  createdAt?: string;

  /** ISO 8601 timestamp when the document was last updated. */
  updatedAt?: string;

  // ── Billing fields (14) — Sprint 0 S0-09 ─────────────────────────────────

  /**
   * Stripe customer ID (cus_xxx).
   * Created on first Stripe Checkout Session. Null until then.
   */
  stripe_customer_id?: string | null;

  /**
   * Active Stripe subscription ID (sub_xxx).
   * Written by checkout.session.completed webhook. Cleared on subscription deletion.
   */
  stripe_subscription_id?: string | null;

  /**
   * Active Stripe Price ID — identifies both the plan and billing cadence.
   * Updated by subscription webhooks on upgrade/downgrade/renewal.
   */
  stripe_price_id?: string | null;

  /**
   * User's market segment.
   * Determines which plan catalogue is applicable.
   */
  user_segment?: UserSegment | null;

  /**
   * Current plan ID.
   * Defaults to 'free' for users with no Stripe subscription.
   * Updated by checkout.session.completed and subscription webhooks.
   */
  plan?: PlanId;

  /**
   * Billing cadence for the active subscription.
   * Null for free-plan users with no Stripe record.
   */
  billing_cadence?: BillingCadence | null;

  /**
   * Stripe subscription status.
   * Sourced from Stripe; written/synced by webhook handlers.
   * - trialing: within free trial period
   * - active: paying subscriber
   * - past_due: payment failed; 7-day grace period applies
   * - canceled: subscription ended; access revoked
   * - unpaid: unpaid after retries; treated same as canceled
   */
  subscription_status?: SubscriptionStatus | null;

  /**
   * ISO 8601 timestamp when the free trial ends.
   * Null if no trial was started. Sourced from Stripe `trial_end`.
   * Used by the React Router TrialExpiredGuard (§4.7).
   */
  trial_ends_at?: string | null;

  /**
   * ISO 8601 timestamp when the current billing period ends.
   * Sourced from Stripe `current_period_end`.
   * Updated on renewal, upgrade, and downgrade.
   */
  current_period_end?: string | null;

  /**
   * True if the user has cancelled but retains access until `current_period_end`.
   * Synced from Stripe `cancel_at_period_end`.
   */
  cancel_at_period_end?: boolean;

  /**
   * Number of fit checks used in the current billing month.
   * Applicable to agent plans only (Independent / Agent Pro).
   * Reset to 0 by the invoice.payment_succeeded webhook handler.
   */
  fit_checks_used?: number | null;

  /**
   * Monthly fit check quota for the active agent plan.
   * Independent: 20 — Agent Pro: 100. Null for non-agent plans.
   */
  fit_checks_quota?: number | null;

  /**
   * Stores the plan the user selected on the pricing page before completing sign-up.
   * Written at account creation; cleared after checkout.session.completed fires.
   * Bridges plan selection through the MSAL sign-up popup into Stripe Checkout.
   * Do NOT use localStorage for this value (§4.6).
   */
  pending_plan?: string | null;

  /**
   * Billing cycle chosen on the pricing page ('monthly' | 'annual').
   * Written alongside `pending_plan`; cleared after checkout.session.completed.
   */
  pending_cycle?: BillingCadence | null;

  /**
   * ISO 8601 timestamp when the most recent payment failure occurred.
   * Used to calculate the 7-day grace period for past_due users.
   * Set by invoice.payment_failed webhook; cleared on payment recovery.
   */
  payment_failed_at?: string | null;

  /**
   * Flag set to true by customer.subscription.trial_will_end webhook (fires 3 days before expiry).
   * Used to conditionally render the in-app trial-ending-soon banner.
   */
  trial_ending_soon?: boolean;

  /** Renter/buyer dashboard subscription (isolated from landlord/agent billing). */
  billing_consumer?: DashboardBillingState;

  /** Landlord/agent dashboard subscription (isolated from renter/buyer billing). */
  billing_landlord?: DashboardBillingState;
}
