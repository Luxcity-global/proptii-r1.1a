import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CosmosClient, Container } from '@azure/cosmos';
import { createStripeClientOptional } from './stripe.client';
import {
  getSubscriptionCurrentPeriodEndIso,
  getSubscriptionTrialEndIso,
} from './stripe-subscription.utils';
import { CheckoutDto, BillingStatusDto } from './dto/checkout.dto';
import { QuotaReportDto, QuotaStatusDto } from './dto/quota-report.dto';
import { getPlans, getPlanConfig, buildPriceIdMap } from './config/plans.config';
import type {
  UserDocument,
  PlanId,
  SubscriptionStatus,
  BillingCadence,
} from '../../models/user.model';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  // Type inferred from constructor — avoids TS2709 namespace-vs-type conflict
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly stripe: any | null;
  private usersContainer: Container | null = null;
  private eventsContainer: Container | null = null;

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient | null,
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? '';
    this.stripe = createStripeClientOptional(stripeKey);
    if (!this.stripe) {
      const hint = stripeKey.startsWith('whsec_')
        ? 'STRIPE_SECRET_KEY is set to the webhook secret (whsec_...). Use sk_test_... or sk_live_... from Stripe Dashboard → Developers → API keys.'
        : stripeKey
          ? 'STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.'
          : 'STRIPE_SECRET_KEY is not set — checkout and webhooks are disabled.';
      this.logger.warn(`Stripe not configured: ${hint}`);
    }
    this.initContainers();
  }

  /** Stripe-dependent routes call this; read-only routes work without Stripe. */
  private requireStripe(): any {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured on this server. Set STRIPE_SECRET_KEY=sk_test_... (or sk_live_...) in environment variables — not the webhook secret (whsec_...).',
      );
    }
    return this.stripe;
  }

  private initContainers(): void {
    if (!this.cosmosClient) {
      this.logger.warn('Cosmos DB not available — billing DB operations will be skipped');
      return;
    }
    try {
      const db = this.cosmosClient.database(
        process.env.COSMOS_DB_DATABASE_NAME ?? 'proptii-db',
      );
      this.usersContainer = db.container('Users');
      this.eventsContainer = db.container('BillingEvents');
    } catch (err) {
      this.logger.error('Failed to init billing Cosmos containers', err);
    }
  }

  // ── Public accessors used by WebhookService ───────────────────────────────

  getStripe() {
    return this.stripe;
  }

  getUsersContainerRef(): Container | null {
    return this.usersContainer;
  }

  getEventsContainerRef(): Container | null {
    return this.eventsContainer;
  }

  // ── Cosmos DB helpers ─────────────────────────────────────────────────────

  async getUserDoc(userId: string): Promise<UserDocument | null> {
    if (!this.usersContainer) return null;
    try {
      const { resource } = await this.usersContainer
        .item(userId, userId)
        .read<UserDocument>();
      return resource ?? null;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
        return null;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`getUserDoc failed for userId=${userId}: ${message}`);
      return null;
    }
  }

  async updateUserDoc(
    userId: string,
    fields: Partial<UserDocument>,
  ): Promise<void> {
    if (!this.usersContainer) {
      this.logger.warn(`updateUserDoc skipped — no Cosmos container (userId=${userId})`);
      return;
    }
    const existing: UserDocument = (await this.getUserDoc(userId)) ?? ({ id: userId } as UserDocument);
    const updated: UserDocument = {
      ...existing,
      ...fields,
      id: userId,
      updatedAt: new Date().toISOString(),
    };
    try {
      await this.usersContainer.items.upsert(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `updateUserDoc failed (checkout/billing continues without DB persist) userId=${userId}: ${message}`,
      );
    }
  }

  async getUserByStripeCustomerId(customerId: string): Promise<UserDocument | null> {
    if (!this.usersContainer) return null;
    try {
      const { resources } = await this.usersContainer.items
        .query<UserDocument>({
          query: 'SELECT * FROM c WHERE c.stripe_customer_id = @cid',
          parameters: [{ name: '@cid', value: customerId }],
        })
        .fetchAll();
      return resources[0] ?? null;
    } catch (err) {
      this.logger.error('getUserByStripeCustomerId failed', err);
      return null;
    }
  }

  // ── S1-02 / S1-03: POST /api/billing/checkout ────────────────────────────

  async createCheckoutSession(
    userId: string,
    userEmail: string,
    dto: CheckoutDto,
  ): Promise<{ checkoutUrl: string }> {
    try {
      const stripe = this.requireStripe();
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      const promoActive = process.env.PROMO_FREE_MONTH_ACTIVE === 'true';
      const trialDays = dto.trialEnabled && promoActive ? 30 : 0;

      const customerId = await this.resolveStripeCustomerId(userId, userEmail, true);
      const userDoc = await this.getUserDoc(userId);
      const pendingPlan = dto.planId ?? userDoc?.pending_plan ?? '';
      const pendingCycle = dto.cycle ?? userDoc?.pending_cycle ?? '';

      const sessionParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: dto.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${frontendUrl}/billing/confirmed?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/pricing`,
        metadata: {
          userId,
          ...(pendingPlan ? { planId: pendingPlan } : {}),
          ...(pendingCycle ? { cycle: pendingCycle } : {}),
        },
        subscription_data: {
          metadata: {
            userId,
            ...(pendingPlan ? { planId: pendingPlan } : {}),
          },
          ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new BadRequestException('Stripe did not return a checkout URL');
      }

      this.logger.log(
        `Checkout session created — userId=${userId} priceId=${dto.priceId} trial=${trialDays}d`,
      );

      return { checkoutUrl: session.url };
    } catch (err: unknown) {
      throw this.mapStripeError(err, 'checkout');
    }
  }

  /**
   * Returns a Stripe customer ID valid for the current API key (test vs live).
   * Cosmos may still store a customer from the other mode after you switch keys.
   */
  private async resolveStripeCustomerId(
    userId: string,
    userEmail: string,
    createIfMissing = true,
  ): Promise<string> {
    const stripe = this.requireStripe();
    let customerId = (await this.getUserDoc(userId))?.stripe_customer_id ?? null;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        return customerId;
      } catch (err: unknown) {
        if (!this.isStripeResourceModeMismatch(err, 'customer')) {
          throw err;
        }
        this.logger.warn(
          `Replacing stale stripe_customer_id ${customerId} for userId=${userId} (test/live switch)`,
        );
        customerId = null;
      }
    }

    if (!customerId && !createIfMissing) {
      throw new NotFoundException(
        'No Stripe customer found for this user. Complete a checkout first.',
      );
    }

    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    await this.updateUserDoc(userId, { stripe_customer_id: customer.id });
    return customer.id;
  }

  private isStripeResourceModeMismatch(err: unknown, resource: string): boolean {
    const message = err instanceof Error ? err.message : String(err);
    if (/similar object exists in (live|test) mode/i.test(message)) {
      return true;
    }
    if (resource === 'customer' && message.includes('No such customer')) {
      return true;
    }
    if (resource === 'price' && message.includes('No such price')) {
      return true;
    }
    return false;
  }

  private mapStripeError(err: unknown, operation: string): never {
    if (err instanceof HttpException) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('STRIPE_SECRET_KEY must be') ||
      message.includes('Invalid API Key') ||
      message.includes('whsec_')
    ) {
      throw new BadRequestException(
        'Stripe secret key is misconfigured. In proptii-backend/.env set STRIPE_SECRET_KEY=sk_test_... (from Stripe Dashboard → Developers → API keys). Do not use the webhook secret (whsec_...).',
      );
    }
    if (this.isStripeResourceModeMismatch(err, 'customer')) {
      throw new BadRequestException(
        'Stripe customer was created in the other mode (test vs live). Retry checkout — a new test customer will be created automatically.',
      );
    }
    if (this.isStripeResourceModeMismatch(err, 'price')) {
      throw new BadRequestException(
        'Stripe price ID is from the other mode (test vs live). Update VITE_STRIPE_PRICE_* and STRIPE_PRICE_* in .env to test-mode price IDs from the Dashboard (Test mode on).',
      );
    }
    if (message.includes('No such price')) {
      throw new BadRequestException(
        'Stripe price ID not found. Check STRIPE_PRICE_* env vars match your Stripe Dashboard (same test/live mode as STRIPE_SECRET_KEY).',
      );
    }
    if (message.includes('Invalid time value')) {
      throw new BadRequestException(
        'Could not read subscription billing dates from Stripe. Restart the backend after updating billing code, then refresh the confirmed page.',
      );
    }
    this.logger.error(`Stripe ${operation} failed`, err instanceof Error ? err.stack : message);
    throw new BadRequestException(
      `Stripe ${operation} failed. Check backend logs or Stripe Dashboard (test vs live mode).`,
    );
  }

  // ── S1-06: POST /api/billing/portal ──────────────────────────────────────

  async createPortalSession(
    userId: string,
    userEmail: string,
  ): Promise<{ portalUrl: string }> {
    try {
      const stripe = this.requireStripe();
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      const customerId = await this.resolveStripeCustomerId(
        userId,
        userEmail,
        false,
      );

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${frontendUrl}/account/billing`,
      });

      return { portalUrl: session.url };
    } catch (err: unknown) {
      if (err instanceof NotFoundException) throw err;
      throw this.mapStripeError(err, 'portal');
    }
  }

  /** S4-01 / S4-04 — Whether user may call paid-feature APIs. */
  async userHasFeatureAccess(userId: string): Promise<boolean> {
    const doc = await this.getUserDoc(userId);
    if (!doc) return true;
    const plan = doc.plan ?? 'free';
    const status = doc.subscription_status ?? null;
    if (plan === 'free') return true;
    if (!status) return false;
    return (
      status === 'active' ||
      status === 'trialing' ||
      status === 'past_due'
    );
  }

  // ── S1-04: GET /api/billing/status ───────────────────────────────────────

  async getBillingStatus(userId: string): Promise<BillingStatusDto> {
    if (!userId?.trim()) {
      throw new BadRequestException('User ID not found in access token (oid/sub missing)');
    }

    const doc = await this.getUserDoc(userId);

    return {
      plan: doc?.plan ?? 'free',
      status: doc?.subscription_status ?? null,
      trialEndsAt: doc?.trial_ends_at ?? null,
      currentPeriodEnd: doc?.current_period_end ?? null,
      cancelAtPeriodEnd: doc?.cancel_at_period_end ?? false,
      fitChecksUsed: doc?.fit_checks_used ?? null,
      fitChecksQuota: doc?.fit_checks_quota ?? null,
      pendingPlan: doc?.pending_plan ?? null,
      pendingCycle: doc?.pending_cycle ?? null,
      billingCadence: doc?.billing_cadence ?? null,
      hasStripeCustomer: Boolean(doc?.stripe_customer_id),
    };
  }

  /**
   * Apply subscription fields from a completed Stripe Checkout (webhook or client confirm).
   */
  async activateFromCheckoutSession(
    userId: string,
    session: {
      customer?: string | { id?: string } | null;
      subscription?: string | { id?: string } | null;
      metadata?: { planId?: string; cycle?: string };
    },
    options?: { priceId?: string },
  ): Promise<void> {
    const stripe = this.requireStripe();
    const subscriptionRef = session.subscription;
    const subscriptionId =
      typeof subscriptionRef === 'string'
        ? subscriptionRef
        : subscriptionRef?.id ?? null;
    if (!subscriptionId) {
      throw new BadRequestException('Checkout session has no subscription yet');
    }

    const customerRef = session.customer;
    const customerId =
      typeof customerRef === 'string'
        ? customerRef
        : customerRef?.id ?? null;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId =
      options?.priceId ?? subscription.items.data[0]?.price.id ?? '';
    const priceMap = buildPriceIdMap();
    const planInfo = priceMap.get(priceId);

    const doc = await this.getUserDoc(userId);
    let planId = planInfo?.planId;
    let cadence = planInfo?.cadence ?? null;

    if (!planId) {
      const metaPlan = session.metadata?.planId ?? doc?.pending_plan;
      if (metaPlan) {
        planId = metaPlan as PlanId;
        cadence =
          (session.metadata?.cycle as BillingCadence) ??
          (doc?.pending_cycle as BillingCadence) ??
          cadence;
      }
    }
    if (!planId) planId = 'free';

    const planCfg = getPlanConfig(planId as PlanId);
    const updates: Partial<UserDocument> = {
      stripe_customer_id: customerId ?? doc?.stripe_customer_id ?? undefined,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan: planId as PlanId,
      subscription_status: subscription.status as SubscriptionStatus,
      billing_cadence: cadence,
      current_period_end: getSubscriptionCurrentPeriodEndIso(subscription),
      trial_ends_at: getSubscriptionTrialEndIso(subscription),
      pending_plan: null,
      pending_cycle: null,
    };

    if (planCfg?.fitChecksQuota != null) {
      updates.fit_checks_quota = planCfg.fitChecksQuota;
      updates.fit_checks_used = 0;
    }

    await this.updateUserDoc(userId, updates);
    this.logger.log(
      `Plan activated — userId=${userId} plan=${planId} status=${subscription.status}`,
    );
  }

  /**
   * Sync Cosmos from Stripe after redirect (local dev when webhooks are not forwarded).
   */
  async confirmCheckoutSession(
    userId: string,
    sessionId: string,
  ): Promise<BillingStatusDto> {
    try {
      const stripe = this.requireStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (session.metadata?.userId !== userId) {
        throw new ForbiddenException(
          'This checkout session does not belong to your account',
        );
      }

      if (session.status !== 'complete') {
        throw new BadRequestException(
          'Payment is still processing. Please wait a moment and refresh.',
        );
      }

      const paymentOk =
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required';
      if (!paymentOk) {
        throw new BadRequestException(
          'Payment is still processing. Please wait a moment and refresh.',
        );
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        sessionId,
        { limit: 1 },
      );
      const priceId = lineItems.data[0]?.price?.id ?? '';

      await this.activateFromCheckoutSession(userId, session, { priceId });
      return this.getBillingStatus(userId);
    } catch (err: unknown) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw this.mapStripeError(err, 'confirm-checkout');
    }
  }

  // ── S3-14: Downgrade to free (Explorer) ────────────────────────────────────

  async downgradeToFree(userId: string): Promise<void> {
    const doc = await this.getUserDoc(userId);

    if (doc?.stripe_subscription_id && this.stripe) {
      try {
        await this.stripe.subscriptions.cancel(doc.stripe_subscription_id);
      } catch (err) {
        this.logger.warn(
          `Stripe cancel failed for ${doc.stripe_subscription_id}`,
          err,
        );
      }
    }

    await this.updateUserDoc(userId, {
      plan: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      pending_plan: null,
      pending_cycle: null,
      trial_ending_soon: false,
    });

    this.logger.log(`User downgraded to free — userId=${userId}`);
  }

  // ── S2-15: Store plan selection before Stripe checkout ─────────────────────

  async setPendingPlan(
    userId: string,
    userEmail: string,
    planId: string,
    cycle: 'monthly' | 'annual',
  ): Promise<void> {
    if (!userId?.trim()) {
      throw new BadRequestException('User ID not found in access token (oid/sub missing)');
    }

    const planConfig = getPlanConfig(planId as PlanId);
    if (!planConfig && planId !== 'explorer') {
      throw new BadRequestException(`Unknown plan: ${planId}`);
    }

    try {
      await this.updateUserDoc(userId, {
        email: userEmail || undefined,
        pending_plan: planId,
        pending_cycle: cycle,
      });
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `setPendingPlan could not persist (checkout can continue via checkout body): ${message}`,
      );
    }
  }

  // ── S1-05: GET /api/billing/plans ────────────────────────────────────────

  getPlans() {
    return getPlans();
  }

  // ── S1-20: POST /api/billing/quota/report ────────────────────────────────

  async reportQuota(userId: string, dto: QuotaReportDto): Promise<QuotaStatusDto> {
    const doc = await this.getUserDoc(userId);

    if (!doc) throw new NotFoundException('User not found');

    const isAgentPlan =
      doc.plan === 'independent' || doc.plan === 'agent_pro';

    if (!isAgentPlan) {
      throw new ForbiddenException(
        'Quota tracking is only available for agent plans (Independent / Agent Pro)',
      );
    }

    const quota = doc.fit_checks_quota ?? 0;
    const currentUsed = doc.fit_checks_used ?? 0;
    const newUsed = currentUsed + dto.checksUsed;

    await this.updateUserDoc(userId, { fit_checks_used: newUsed });

    // S4-07 — Bill only checks in this request that cross the quota (avoid duplicate invoice items)
    if (doc.stripe_customer_id && quota > 0 && newUsed > quota) {
      const planCfg = getPlanConfig(doc.plan as PlanId);
      const overageRate = planCfg?.fitChecksOverageRate ?? 0;
      const previouslyOver = Math.max(0, currentUsed - quota);
      const newlyOver = Math.max(0, newUsed - quota) - previouslyOver;
      const overageCount = Math.min(dto.checksUsed, newlyOver);

      if (overageCount > 0 && overageRate > 0 && this.stripe) {
        const overageAmount = Math.round(overageCount * overageRate * 100);
        await this.stripe.invoiceItems.create({
          customer: doc.stripe_customer_id,
          amount: overageAmount,
          currency: 'gbp',
          description: `Fit check overage — ${overageCount} checks @ £${overageRate} each`,
        });
        this.logger.log(
          `Overage invoice item created — userId=${userId} checks=${overageCount} rate=${overageRate}`,
        );
      }
    }

    const remaining = Math.max(0, quota - newUsed);
    return { used: newUsed, quota, remaining };
  }

  // ── S1-16: 7-day grace period cron ───────────────────────────────────────

  @Cron('0 0 * * *')
  async runGracePeriodCron(): Promise<void> {
    if (!this.usersContainer) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const { resources } = await this.usersContainer.items
        .query<UserDocument>({
          query: `
            SELECT * FROM c
            WHERE c.subscription_status = 'past_due'
            AND c.payment_failed_at != null
            AND c.payment_failed_at < @cutoff
          `,
          parameters: [{ name: '@cutoff', value: sevenDaysAgo }],
        })
        .fetchAll();

      this.logger.log(`Grace period cron: ${resources.length} user(s) to downgrade`);

      for (const user of resources) {
        await this.updateUserDoc(user.id, {
          plan: 'free' as PlanId,
          subscription_status: 'canceled' as SubscriptionStatus,
          stripe_subscription_id: null,
          stripe_price_id: null,
          billing_cadence: null,
          current_period_end: null,
          fit_checks_used: null,
          fit_checks_quota: null,
        });
        this.logger.warn(
          `Grace period expired — downgraded to free: userId=${user.id}`,
        );
      }
    } catch (err) {
      this.logger.error('Grace period cron failed', err);
    }
  }
}
