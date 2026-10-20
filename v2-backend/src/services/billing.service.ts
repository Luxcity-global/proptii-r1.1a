import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {
  complimentaryBillingPayload,
  isComplimentaryAccessEmail,
} from '../utils/complimentary-access';

// ─── Module-level plans cache (survives hot-reload within the same process) ───
let _plansCache: any[] | null = null;
let _plansCacheTime = 0;

// ─── Static plan catalogue (metadata only — no live prices) ──────────────────

const PLANS_CATALOGUE = [
  {
    id: 'explorer',
    name: 'Explorer',
    segment: ['renter', 'buyer'],
    features: [
      { label: 'Property search', included: true },
      { label: 'Save up to 5 properties', included: true },
      { label: 'Basic viewing requests', included: true },
      { label: 'AI fit score', included: false },
      { label: 'Unlimited saved properties', included: false },
      { label: 'Priority viewing slots', included: false },
      { label: 'Referencing toolkit', included: false },
    ],
    isPopular: false,
    isDark: false,
    isContactSales: false,
    isFree: true,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: 0 as number | null,
    fallbackAnnualPrice: null as number | null,
  },
  {
    id: 'renter_pro',
    name: 'Renter Pro',
    segment: ['renter'],
    features: [
      { label: 'Everything in Explorer', included: true },
      { label: 'Unlimited saved properties', included: true },
      { label: 'AI fit score & match report', included: true },
      { label: 'Priority viewing slots', included: true },
      { label: 'Referencing toolkit', included: true },
      { label: 'Move-in checklist', included: true },
      { label: 'Document storage (5 GB)', included: true },
    ],
    isPopular: true,
    isDark: false,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: 12 as number | null,
    fallbackAnnualPrice: 99 as number | null,
  },
  {
    id: 'buyer_pro',
    name: 'Buyer Pro',
    segment: ['buyer'],
    features: [
      { label: 'Everything in Renter Pro', included: true },
      { label: 'Mortgage readiness score', included: true },
      { label: 'Solicitor recommendations', included: true },
      { label: 'Survey & valuation tracker', included: true },
      { label: 'Buyer journey timeline', included: true },
      { label: 'Document storage (20 GB)', included: true },
      { label: 'Priority support', included: true },
    ],
    isPopular: false,
    isDark: false,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: 19 as number | null,
    fallbackAnnualPrice: 159 as number | null,
  },
  {
    id: 'starter',
    name: 'Starter',
    segment: ['landlord'],
    features: [
      { label: 'Up to 2 properties', included: true },
      { label: 'Tenant referencing (basic)', included: true },
      { label: 'Digital contracts', included: true },
      { label: 'Viewing management', included: true },
      { label: 'Compliance reminders', included: false },
      { label: 'Maintenance tracker', included: false },
      { label: 'Financial dashboard', included: false },
    ],
    isPopular: false,
    isDark: false,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: 29 as number | null,
    fallbackAnnualPrice: 249 as number | null,
  },
  {
    id: 'landlord_pro',
    name: 'Landlord Pro',
    segment: ['landlord'],
    features: [
      { label: 'Everything in Starter', included: true },
      { label: 'Up to 10 properties', included: true },
      { label: 'Advanced tenant referencing', included: true },
      { label: 'Compliance reminders', included: true },
      { label: 'Maintenance tracker', included: true },
      { label: 'Financial dashboard', included: true },
      { label: 'Priority support', included: true },
    ],
    isPopular: true,
    isDark: false,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: 49 as number | null,
    fallbackAnnualPrice: 399 as number | null,
  },
  {
    id: 'elite',
    name: 'Elite',
    segment: ['landlord'],
    features: [
      { label: 'Everything in Landlord Pro', included: true },
      { label: 'Unlimited properties', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'Custom lease templates', included: true },
      { label: 'Bulk referencing', included: true },
      { label: 'API access', included: true },
      { label: '24/7 priority support', included: true },
    ],
    isPopular: false,
    isDark: true,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: 99 as number | null,
    fallbackAnnualPrice: 799 as number | null,
  },
  {
    id: 'independent',
    name: 'Independent',
    segment: ['agent'],
    features: [
      { label: 'Up to 50 listings', included: true },
      { label: '20 fit checks / month', included: true, note: '£4 per check above quota' },
      { label: 'Tenant referencing', included: true },
      { label: 'Digital contracts', included: true },
      { label: 'Viewing management', included: true },
      { label: 'Bulk operations', included: false },
      { label: 'API access', included: false },
    ],
    isPopular: false,
    isDark: false,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: 20 as number | null,
    fitChecksOverageRate: 4 as number | null,
    fallbackMonthlyPrice: 79 as number | null,
    fallbackAnnualPrice: 750 as number | null,
  },
  {
    id: 'agent_pro',
    name: 'Agent Pro',
    segment: ['agent'],
    features: [
      { label: 'Unlimited listings', included: true },
      { label: '100 fit checks / month', included: true, note: '£3 per check above quota' },
      { label: 'Advanced tenant referencing', included: true },
      { label: 'Bulk operations', included: true },
      { label: 'Team seats (up to 5)', included: true },
      { label: 'Analytics dashboard', included: true },
      { label: 'Priority support', included: true },
    ],
    isPopular: true,
    isDark: false,
    isContactSales: false,
    isFree: false,
    fitChecksQuota: 100 as number | null,
    fitChecksOverageRate: 3 as number | null,
    fallbackMonthlyPrice: 149 as number | null,
    fallbackAnnualPrice: 1430 as number | null,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    segment: ['agent'],
    features: [
      { label: 'Everything in Agent Pro', included: true },
      { label: 'Unlimited team seats', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'SLA support', included: true },
      { label: 'Bespoke pricing', included: true },
    ],
    isPopular: false,
    isDark: false,
    isContactSales: true,
    isFree: false,
    fitChecksQuota: null as number | null,
    fitChecksOverageRate: null as number | null,
    fallbackMonthlyPrice: null as number | null,
    fallbackAnnualPrice: null as number | null,
  },
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  /** Allowlist of plan IDs that users may self-select during checkout.
   *  Prevents attackers from writing arbitrary planId values (e.g. 'enterprise')
   *  into Firestore via setPendingPlan or createCheckoutSession. */
  private static readonly VALID_SELF_SERVICE_PLAN_IDS = new Set([
    'free',
    'explorer',
    'renter_pro',
    'buyer_pro',
    'starter',
    'landlord_pro',
    'elite',
    'independent',
    'agent_pro',
  ]);

  /**
   * Maps planId + cycle → Stripe price ID, read exclusively from server-side
   * STRIPE_PRICE_* environment variables. Price IDs never come from the client.
   *
   * Set these on the Render backend service:
   *   STRIPE_PRICE_RENTER_PRO_MONTHLY, STRIPE_PRICE_RENTER_PRO_ANNUAL
   *   STRIPE_PRICE_BUYER_PRO_MONTHLY,  STRIPE_PRICE_BUYER_PRO_ANNUAL
   *   STRIPE_PRICE_STARTER_MONTHLY,    STRIPE_PRICE_STARTER_ANNUAL
   *   STRIPE_PRICE_LANDLORD_PRO_MONTHLY, STRIPE_PRICE_LANDLORD_PRO_ANNUAL
   *   STRIPE_PRICE_ELITE_MONTHLY,      STRIPE_PRICE_ELITE_ANNUAL
   *   STRIPE_PRICE_INDEPENDENT_MONTHLY, STRIPE_PRICE_INDEPENDENT_ANNUAL
   *   STRIPE_PRICE_AGENT_PRO_MONTHLY,  STRIPE_PRICE_AGENT_PRO_ANNUAL
   */
  private getPriceId(planId: string, cycle: 'monthly' | 'annual'): string | null {
    const key = `STRIPE_PRICE_${planId.toUpperCase()}_${cycle.toUpperCase()}`;
    return process.env[key] || null;
  }


  // ─── Firebase Admin lazy getter ───────────────────────────────────────────

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('subscriptions') : null;
  }

  // ─── Stripe lazy getter ───────────────────────────────────────────────────

  private _stripe: Stripe | null = null;
  private get stripe(): Stripe | null {
    if (this._stripe) return this._stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      this.logger.warn('[BillingService] STRIPE_SECRET_KEY not set — running in mock mode');
      return null;
    }
    this._stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    return this._stripe;
  }

  // ─── getBillingStatus ─────────────────────────────────────────────────────

  async getBillingStatus(userId: string, email?: string, role?: string) {
    if (isComplimentaryAccessEmail(email)) {
      this.logger.log(`[BillingService] Complimentary access granted to ${email}`);
      return complimentaryBillingPayload(role);
    }

    const db = this.db;
    if (!db) {
      this.logger.error('[BillingService] Firebase Admin is not initialised — refusing to serve billing status');
      throw new ServiceUnavailableException('Billing service temporarily unavailable');
    }

    try {
      const col = db.collection('subscriptions');
      let doc = await col.doc(userId).get();
      let data = doc.exists ? doc.data() : null;

      if (!data && email) {
        const mailSnap = await col.where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (!mailSnap.empty) {
          data = mailSnap.docs[0].data();
        }
      }

      // Check users collection as fallback for entitlement
      if (!data) {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const u = userDoc.data();
          if (u?.subscriptionTier || u?.plan || u?.subscriptionStatus) {
            data = {
              planId: u.subscriptionTier || u.plan,
              status: u.subscriptionStatus || 'active',
              cycle: u.billingCadence || 'monthly',
            };
          }
        }
      }

      const planId = data?.planId || data?.plan || 'free';
      const status = data?.status || 'active';
      const isActive = status === 'active' || status === 'trialing';

      return {
        dashboard: (role || '').toLowerCase() === 'landlord' || planId.startsWith('landlord') ? 'landlord' : 'consumer',
        hasActiveSubscription: isActive,
        planId,
        plan: planId,
        status,
        currentPeriodEnd: data?.currentPeriodEnd || null,
        trialEndsAt: data?.trialEndsAt || null,
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
        fitChecksUsed: data?.fitChecksUsed ?? 0,
        fitChecksQuota: data?.fitChecksQuota ?? null,
        pendingPlan: data?.pendingPlanId || null,
        pendingCycle: data?.pendingCycle || null,
        billingCadence: data?.cycle || data?.billingCadence || 'monthly',
        hasStripeCustomer: Boolean(data?.stripeCustomerId || data?.hasStripeCustomer),
      };
    } catch (err: any) {
      this.logger.error(`[BillingService] Firestore read failed for ${userId}: ${err?.message || err}`);
      throw new ServiceUnavailableException('Billing service temporarily unavailable');
    }
  }

  // ─── createCheckoutSession ────────────────────────────────────────────────

  async createCheckoutSession(userId: string, email: string, dto: any) {
    const planId = dto.planId || 'renter_pro';
    const cycle = dto.cycle || 'monthly';
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;

    if (!this.stripe) {
      if (isProd) {
        throw new BadRequestException('Stripe is not configured');
      }
      // Dev mock: return a placeholder URL without writing any Firestore record
      this.logger.warn('[BillingService] Returning mock checkout session (STRIPE_SECRET_KEY not set)');
      return {
        sessionId: 'cs_mock_dev',
        checkoutUrl: '/billing/confirmed?session_id=cs_mock_dev&plan=' + planId,
      };
    }

    // Validate planId against allowlist before calling Stripe
    if (!BillingService.VALID_SELF_SERVICE_PLAN_IDS.has(planId)) {
      throw new BadRequestException(`Invalid plan ID: ${planId}`);
    }

    // Resolve price ID server-side from STRIPE_PRICE_* env vars.
    // The client must NOT supply a priceId — we derive it here to prevent
    // plan substitution attacks (paying for a cheap plan, claiming an expensive one).
    const resolvedPriceId = this.getPriceId(planId, cycle as 'monthly' | 'annual');
    if (!resolvedPriceId) {
      throw new BadRequestException(
        `No Stripe price configured for plan "${planId}" (${cycle}). ` +
        `Set STRIPE_PRICE_${planId.toUpperCase()}_${cycle.toUpperCase()} on the backend.`,
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      // automatic_tax calculates applicable tax based on the customer's billing
      // address collected at checkout. Required when Stripe Managed Payments is
      // enabled on the account (which requires every product to either have a
      // tax_code set OR have automatic_tax enabled at the session level).
      automatic_tax: { enabled: true },
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      subscription_data: {
        ...(dto.trialEnabled ? { trial_period_days: 30 } : {}),
        metadata: { userId, planId, cycle },
      },
      metadata: { planId, cycle, userId },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
    });

    return { checkoutUrl: session.url!, sessionId: session.id };
  }

  // ─── createPortalSession ──────────────────────────────────────────────────

  async createPortalSession(userId: string, email: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const db = this.db;
    if (!db) {
      throw new BadRequestException('Database unavailable');
    }
    const subSnap = await db.collection('subscriptions').doc(userId).get();
    const customerId = subSnap.data()?.stripeCustomerId;
    if (!customerId) {
      throw new BadRequestException('No Stripe customer found for this user');
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/settings`,
    });
    return { portalUrl: session.url };
  }

  // ─── confirmCheckoutSession ───────────────────────────────────────────────

  async confirmCheckoutSession(userId: string, sessionId: string, email?: string) {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;

    // Reject mock session IDs in production
    if (sessionId?.startsWith('cs_mock_') && isProd) {
      throw new BadRequestException('Mock session IDs are not accepted in production');
    }
    // Basic format check
    if (!sessionId?.startsWith('cs_')) {
      throw new BadRequestException('Invalid session ID format');
    }

    const db = this.db;
    if (!db) {
      this.logger.error(`Failed to confirm checkout for ${userId}: Database connection is unavailable.`);
      throw new InternalServerErrorException('Database connection is unavailable. Entitlement records failed to persist.');
    }

    // Dev mock bypass: fall through to Firestore-based confirmation for local dev
    if (!isProd && sessionId.startsWith('cs_mock_dev')) {
      return this._confirmFromFirestore(userId, sessionId, email);
    }

    // Real Stripe path: validate the session with Stripe
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    // Ownership check
    if (session.client_reference_id !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    // Payment completion check
    const isComplete =
      session.payment_status === 'paid' ||
      session.status === 'complete' ||
      (session.mode === 'subscription' && session.payment_status === 'no_payment_required');
    if (!isComplete) {
      throw new BadRequestException('Payment not completed');
    }

    // Idempotency check
    const processedRef = db.collection('processedStripeEvents').doc(sessionId);
    const processed = await processedRef.get();
    if (processed.exists) {
      return processed.data() as any; // already confirmed — return cached result
    }

    const planId = session.metadata?.planId || 'renter_pro';
    const cycle = session.metadata?.cycle || 'monthly';
    const userEmail = email || session.customer_email || '';

    const now = admin.firestore.FieldValue.serverTimestamp();
    const subRef = db.collection('subscriptions').doc(userId);
    const userRef = db.collection('users').doc(userId);
    const batch = db.batch();

    batch.set(subRef, {
      userId,
      email: userEmail,
      planId,
      plan: planId,
      cycle,
      status: 'active',
      confirmedAt: now,
      updatedAt: now,
      sessionId: sessionId,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id || null,
      stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id || null,
    }, { merge: true });

    batch.set(userRef, {
      subscriptionStatus: 'active',
      subscriptionTier: planId,
      plan: planId,
      isSubscribed: true,
      billingCadence: cycle,
      updatedAt: now,
    }, { merge: true });

    await batch.commit();

    // Mark session consumed so repeated calls return the cached result
    const result = {
      dashboard: planId.startsWith('landlord') ? 'landlord' : 'consumer',
      plan: planId,
      planId,
      status: 'active',
      hasActiveSubscription: true,
      currentPeriodEnd: null,
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
      fitChecksUsed: 0,
      fitChecksQuota: null,
      pendingPlan: null,
      pendingCycle: null,
      billingCadence: cycle,
      hasStripeCustomer: true,
      success: true,
      message: 'Subscription confirmed successfully',
    };
    await processedRef.set({ confirmedAt: now, userId, planId, ...result });

    this.logger.log(`[BillingService] Successfully persisted entitlement for ${userId}: plan=${planId}`);
    return result;
  }

  /** Firestore-only confirmation path used in local dev with mock session IDs. */
  private async _confirmFromFirestore(userId: string, sessionId: string, email?: string) {
    const db = this.db!;
    try {
      const subRef = db.collection('subscriptions').doc(userId);
      const userRef = db.collection('users').doc(userId);

      const [subSnap, userSnap] = await Promise.all([subRef.get(), userRef.get()]);

      const subData = subSnap.exists ? subSnap.data() : null;
      const userData = userSnap.exists ? userSnap.data() : null;

      const planId = subData?.pendingPlanId || subData?.planId || userData?.pendingPlan || userData?.plan || 'renter_pro';
      const cycle = subData?.pendingCycle || subData?.cycle || 'monthly';
      const userEmail = email || subData?.email || userData?.email || '';

      const now = admin.firestore.FieldValue.serverTimestamp();
      const batch = db.batch();

      batch.set(subRef, {
        userId,
        email: userEmail,
        planId,
        plan: planId,
        cycle,
        status: 'active',
        confirmedAt: now,
        updatedAt: now,
        sessionId: sessionId || null,
      }, { merge: true });

      batch.set(userRef, {
        subscriptionStatus: 'active',
        subscriptionTier: planId,
        plan: planId,
        isSubscribed: true,
        billingCadence: cycle,
        updatedAt: now,
      }, { merge: true });

      await batch.commit();

      this.logger.log(`[BillingService] Dev mock: persisted entitlement for ${userId}: plan=${planId}`);

      return {
        dashboard: planId.startsWith('landlord') ? 'landlord' : 'consumer',
        plan: planId,
        planId,
        status: 'active',
        hasActiveSubscription: true,
        currentPeriodEnd: null,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        fitChecksUsed: 0,
        fitChecksQuota: null,
        pendingPlan: null,
        pendingCycle: null,
        billingCadence: cycle,
        hasStripeCustomer: true,
        success: true,
        message: 'Subscription confirmed successfully',
      };
    } catch (err: any) {
      this.logger.error(`[BillingService] Entitlement persistence failed for ${userId}: ${err?.message || err}`);
      throw new InternalServerErrorException(`Failed to persist user entitlement records: ${err?.message || err}`);
    }
  }

  // ─── getPlans ─────────────────────────────────────────────────────────────

  async getPlans() {
    // 5-minute in-memory cache to avoid hammering Stripe on every page load
    if (_plansCache && Date.now() - _plansCacheTime < 5 * 60 * 1000) {
      return _plansCache;
    }

    const buildStaticPlans = () =>
      PLANS_CATALOGUE.map((cat) => {
        const monthlyPrice = cat.fallbackMonthlyPrice ?? 0;
        const annualTotal = cat.fallbackAnnualPrice ?? 0;
        const annualPrice = cat.isFree || cat.isContactSales
          ? 0
          : Math.round(annualTotal / 12 * 100) / 100;
        const annualSaving = cat.isFree || cat.isContactSales
          ? null
          : 'save £' + Math.round(monthlyPrice * 12 - annualTotal);
        return {
          id: cat.id,
          name: cat.name,
          segment: cat.segment,
          monthlyPrice,
          annualPrice,
          annualTotal,
          annualSaving,
          stripePriceIdMonthly: cat.isFree || cat.isContactSales ? null : this.getPriceId(cat.id, 'monthly'),
          stripePriceIdAnnual: cat.isFree || cat.isContactSales ? null : this.getPriceId(cat.id, 'annual'),
          features: cat.features,
          isPopular: cat.isPopular,
          isDark: cat.isDark,
          isContactSales: cat.isContactSales,
          isFree: cat.isFree,
          fitChecksQuota: cat.fitChecksQuota,
          fitChecksOverageRate: cat.fitChecksOverageRate,
        };
      });

    if (!this.stripe) {
      const result = buildStaticPlans();
      _plansCache = result;
      _plansCacheTime = Date.now();
      return result;
    }

    try {
      const priceList = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
        limit: 100,
      });

      // Build a map: planId → { monthly?, annual?, monthlyPriceId?, annualPriceId? }
      const priceMap: Record<string, {
        monthly?: number;
        annual?: number;
        monthlyPriceId?: string;
        annualPriceId?: string;
      }> = {};

      for (const price of priceList.data) {
        const product = price.product;
        // Type-guard: must be an expanded product object (not a string or deleted product)
        if (
          typeof product !== 'object' ||
          product === null ||
          'deleted' in product
        ) {
          continue;
        }

        const planId = (product as Stripe.Product).metadata?.proptii_plan_id;
        if (!planId) continue;

        const cycle: 'monthly' | 'annual' =
          (price.metadata?.cycle as 'monthly' | 'annual') ??
          (price.recurring?.interval === 'year' ? 'annual' : 'monthly');

        // Amounts are in pence — divide by 100
        const amount = Math.round((price.unit_amount ?? 0) / 100 * 100) / 100;

        if (!priceMap[planId]) priceMap[planId] = {};
        if (cycle === 'monthly') {
          priceMap[planId].monthly = amount;
          priceMap[planId].monthlyPriceId = price.id;
        } else {
          priceMap[planId].annual = amount;
          priceMap[planId].annualPriceId = price.id;
        }
      }

      const result = PLANS_CATALOGUE.map((cat) => {
        const live = priceMap[cat.id];
        const fallbackMonthly = cat.fallbackMonthlyPrice ?? 0;
        const fallbackAnnual = cat.fallbackAnnualPrice ?? 0;

        const monthlyPrice = cat.isFree || cat.isContactSales
          ? 0
          : (live?.monthly ?? fallbackMonthly);
        const annualTotal = cat.isFree || cat.isContactSales
          ? 0
          : (live?.annual ?? fallbackAnnual);
        const annualPrice = cat.isFree || cat.isContactSales
          ? 0
          : Math.round(annualTotal / 12 * 100) / 100;
        const annualSaving = cat.isFree || cat.isContactSales
          ? null
          : 'save £' + Math.round(monthlyPrice * 12 - annualTotal);

        return {
          id: cat.id,
          name: cat.name,
          segment: cat.segment,
          monthlyPrice,
          annualPrice,
          annualTotal,
          annualSaving,
          stripePriceIdMonthly: live?.monthlyPriceId ?? (cat.isFree || cat.isContactSales ? null : this.getPriceId(cat.id, 'monthly')),
          stripePriceIdAnnual: live?.annualPriceId ?? (cat.isFree || cat.isContactSales ? null : this.getPriceId(cat.id, 'annual')),
          features: cat.features,
          isPopular: cat.isPopular,
          isDark: cat.isDark,
          isContactSales: cat.isContactSales,
          isFree: cat.isFree,
          fitChecksQuota: cat.fitChecksQuota,
          fitChecksOverageRate: cat.fitChecksOverageRate,
        };
      });

      _plansCache = result;
      _plansCacheTime = Date.now();
      return result;
    } catch (err: any) {
      this.logger.error(`[BillingService] getPlans() Stripe call failed: ${err?.message ?? err}. Falling back to static data.`);
      const result = buildStaticPlans();
      _plansCache = result;
      _plansCacheTime = Date.now();
      return result;
    }
  }


  // ─── upgradeSubscription ──────────────────────────────────────────────────

  async upgradeSubscription(
    userId: string,
    email: string,
    planId: string,
    cycle: 'monthly' | 'annual',
  ): Promise<{ upgraded: true } | { checkoutUrl: string }> {
    if (!BillingService.VALID_SELF_SERVICE_PLAN_IDS.has(planId as any)) {
      throw new BadRequestException('Invalid plan');
    }
    const priceId = this.getPriceId(planId, cycle);
    if (!priceId) throw new BadRequestException('Price not configured for this plan/cycle');

    const subSnap = await this.db!.collection('subscriptions').doc(userId).get();
    const subData = subSnap.data();
    const stripeSubscriptionId = subData?.stripeSubscriptionId;
    const status = subData?.status;

    if (stripeSubscriptionId && (status === 'active' || status === 'trialing')) {
      try {
        const sub = await this.stripe!.subscriptions.retrieve(stripeSubscriptionId);
        const itemId = sub.items.data[0]?.id;
        if (!itemId) throw new Error('No subscription item found');
        await this.stripe!.subscriptions.update(stripeSubscriptionId, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: 'create_prorations',
        });
        await this.db!.collection('subscriptions').doc(userId).set(
          { planId, cycle, updatedAt: new Date().toISOString() },
          { merge: true },
        );
        return { upgraded: true };
      } catch (err: any) {
        throw new BadRequestException(err?.message ?? 'Upgrade failed');
      }
    }

    // No active subscription — fall back to checkout
    const result = await this.createCheckoutSession(userId, email, { planId, cycle, trialEnabled: false });
    return { checkoutUrl: result.checkoutUrl };
  }

  // ─── cancelSubscription ───────────────────────────────────────────────────

  async cancelSubscription(userId: string): Promise<{ success: true; cancelAtPeriodEnd: true }> {
    const subSnap = await this.db!.collection('subscriptions').doc(userId).get();
    const subData = subSnap.data();
    const stripeSubscriptionId = subData?.stripeSubscriptionId;

    if (!stripeSubscriptionId || !this.stripe) {
      throw new BadRequestException('No active subscription found');
    }
    try {
      await this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      await this.db!.collection('subscriptions').doc(userId).set(
        { cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() },
        { merge: true },
      );
      return { success: true, cancelAtPeriodEnd: true };
    } catch (err: any) {
      throw new BadRequestException(err?.message ?? 'Cancellation failed');
    }
  }

  // ─── setPendingPlan ───────────────────────────────────────────────────────

  async setPendingPlan(userId: string, email: string, planId: string, cycle: string) {
    // Validate planId against allowlist first
    if (!BillingService.VALID_SELF_SERVICE_PLAN_IDS.has(planId)) {
      throw new BadRequestException(`Invalid plan ID: ${planId}`);
    }

    const col = this.collection;
    if (col) {
      try {
        await col.doc(userId).set({
          userId,
          email,
          pendingPlanId: planId,
          pendingCycle: cycle,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch {}
    }
    return { success: true, planId, cycle };
  }

  // ─── downgradeToFree ──────────────────────────────────────────────────────

  async downgradeToFree(userId: string) {
    const col = this.collection;
    if (!col) {
      throw new ServiceUnavailableException('Database unavailable — cannot downgrade');
    }
    this.logger.log(`[BillingService] Downgrading ${userId} to free`);
    await col.doc(userId).set({
      userId,
      planId: 'free',
      plan: 'free',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true, planId: 'free' };
  }

  // ─── Stripe webhook ───────────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      if (isProd) {
        this.logger.error('[Webhook] STRIPE_WEBHOOK_SECRET not set in production');
        throw new BadRequestException('Webhook secret not configured');
      }
      // Dev: parse without signature verification
      this.logger.warn('[Webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev mode)');
      const event = JSON.parse(rawBody.toString()) as Stripe.Event;
      await this.dispatchWebhookEvent(event);
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe!.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: any) {
      this.logger.error(`[Webhook] Signature verification failed: ${err?.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    if (await this.isEventProcessed(event.id)) {
      this.logger.log(`[Webhook] Skipping already-processed event ${event.id}`);
      return { received: true };
    }

    await this.dispatchWebhookEvent(event);
    await this.markEventProcessed(event.id);
    return { received: true };
  }

  private async dispatchWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        await this.onInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  }

  private async onCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.client_reference_id;
    if (!userId) {
      this.logger.warn('[Webhook] checkout.session.completed: no client_reference_id');
      return;
    }
    const planId = session.metadata?.planId || 'renter_pro';
    const cycle = session.metadata?.cycle || 'monthly';
    await this.grantSubscription(userId, planId, cycle, {
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id,
      stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id,
      status: 'active',
    });
    this.logger.log(`[Webhook] checkout.session.completed → granted ${planId} to ${userId}`);
  }

  private async onInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as any)?.id;
    if (!subId || !this.stripe) return;
    const sub = await this.stripe.subscriptions.retrieve(subId);
    const userId = sub.metadata?.userId;
    if (!userId) return;
    await this.updateSubscriptionStatus(userId, {
      status: 'active',
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    });
    this.logger.log(`[Webhook] invoice.payment_succeeded → renewed ${userId}`);
  }

  private async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as any)?.id;
    if (!subId || !this.stripe) return;
    const sub = await this.stripe.subscriptions.retrieve(subId);
    const userId = sub.metadata?.userId;
    if (!userId) return;
    await this.updateSubscriptionStatus(userId, { status: 'past_due' });
    this.logger.warn(`[Webhook] invoice.payment_failed → marked ${userId} past_due`);
  }

  private async onSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const userId = sub.metadata?.userId;
    if (!userId) return;
    const planId = sub.items.data[0]?.price?.metadata?.planId || sub.metadata?.planId;
    await this.updateSubscriptionStatus(userId, {
      status: sub.status as any,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      ...(planId ? { planId } : {}),
    });
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    const userId = sub.metadata?.userId;
    if (!userId) return;
    await this.updateSubscriptionStatus(userId, { status: 'canceled', planId: 'free' });
    this.logger.log(`[Webhook] customer.subscription.deleted → revoked access for ${userId}`);
  }

  // ─── Webhook helpers ──────────────────────────────────────────────────────

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const db = this.db;
    if (!db) return false;
    const doc = await db.collection('processedStripeEvents').doc(eventId).get();
    return doc.exists;
  }

  private async markEventProcessed(eventId: string): Promise<void> {
    const db = this.db;
    if (!db) return;
    await db.collection('processedStripeEvents').doc(eventId).set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  private async grantSubscription(
    userId: string,
    planId: string,
    cycle: string,
    extra: Record<string, any> = {},
  ): Promise<void> {
    const db = this.db;
    if (!db) {
      this.logger.error('[BillingService] Cannot grant subscription — DB unavailable');
      return;
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.set(db.collection('subscriptions').doc(userId), {
      userId, planId, plan: planId, cycle, status: 'active',
      updatedAt: now, ...extra,
    }, { merge: true });
    batch.set(db.collection('users').doc(userId), {
      subscriptionStatus: 'active', subscriptionTier: planId,
      plan: planId, isSubscribed: true, billingCadence: cycle, updatedAt: now,
    }, { merge: true });
    await batch.commit();
  }

  private async updateSubscriptionStatus(
    userId: string,
    fields: Record<string, any>,
  ): Promise<void> {
    const db = this.db;
    if (!db) return;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.set(db.collection('subscriptions').doc(userId), { ...fields, updatedAt: now }, { merge: true });
    if (fields.status) {
      batch.set(db.collection('users').doc(userId), {
        subscriptionStatus: fields.status,
        ...(fields.planId ? { subscriptionTier: fields.planId, plan: fields.planId } : {}),
        updatedAt: now,
      }, { merge: true });
    }
    await batch.commit();
  }
}
