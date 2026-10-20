# Billing Hardening Implementation Plan

**Audit source:** `.agents/tasks/billing-security-audit.md`  
**Phases:** P0 (Real Stripe), P1 (Security Hardening), P2 (SubscriptionGuard), P3 (Complimentary Access Hardening)  
**Build command:** `cd v2-backend && npm run build` (NestJS: `nest build`)  
**Test command:** `cd v2-backend && npm test` (nest build + vitest run `src/**/*.spec.ts`)  
**Frontend:** No backend-facing tests; verify with `npm run build` from repo root (Vite)

---

## PHASE P0 — Real Stripe Integration

---

- [ ] **P0-1 · Install Stripe SDK in backend**

  Run `npm install stripe@^16.0.0` inside `v2-backend/`. Confirm `"stripe": "^16.x.x"` appears in `v2-backend/package.json` `dependencies`.

  Files:
  - `v2-backend/package.json` (updated by npm automatically)

  Verify: `cd v2-backend && npm list stripe` — prints `stripe@16.x.x`.

---

- [ ] **P0-2 · Rewrite `billing.service.ts` — `createCheckoutSession` with real Stripe**

  **Current state (lines 120–148):** `createCheckoutSession` generates `cs_mock_${Date.now()}`, writes `{ planId, cycle, status: 'active' }` to Firestore immediately at checkout-creation time, and returns a relative URL — no Stripe SDK involved.

  **What to do:**

  1. Add at the very top of `billing.service.ts` (after existing imports):
     ```typescript
     import Stripe from 'stripe';
     ```

  2. Add a private Stripe client field in the class body, initialised in a getter (lazy init pattern matching the existing `db` getter pattern):
     ```typescript
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
     ```

  3. Rewrite `createCheckoutSession(userId, email, dto)` entirely:
     - Do **NOT** write any Firestore record in this method.
     - If `this.stripe` is null (no `STRIPE_SECRET_KEY`): check `process.env.NODE_ENV === 'production'` — throw `BadRequestException('Stripe is not configured')` in production; in dev return `{ sessionId: 'cs_mock_dev', checkoutUrl: '/billing/confirmed?session_id=cs_mock_dev&plan=' + planId }` with a warning log.
     - In real mode:
       - Derive `planId` from `dto.planId`; validate against `VALID_SELF_SERVICE_PLAN_IDS` (see P1-2 — this array is shared).
       - Call:
         ```typescript
         const session = await this.stripe.checkout.sessions.create({
           mode: 'subscription',
           customer_email: email,
           client_reference_id: userId,
           line_items: [{ price: dto.priceId, quantity: 1 }],
           subscription_data: dto.trialEnabled ? { trial_period_days: 30 } : {},
           metadata: { planId, cycle: dto.cycle || 'monthly', userId },
           success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/confirmed?session_id={CHECKOUT_SESSION_ID}`,
           cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
         });
         ```
       - Return `{ checkoutUrl: session.url!, sessionId: session.id }`.

  4. Add `STRIPE_SECRET_KEY` and `FRONTEND_URL` to `v2-backend/.env.example` under a new `# ─── Stripe ───` section (FRONTEND_URL already exists; add a note that it is also used for Stripe redirect).

  Files:
  - `v2-backend/src/services/billing.service.ts`
  - `v2-backend/.env.example`

  Verify: `cd v2-backend && npm run build` — build passes with no TypeScript errors.

---

- [ ] **P0-3 · Rewrite `confirmCheckoutSession` — validate real Stripe session**

  **Current state (lines 152–228):** Accepts any `sessionId` string, ignores it entirely for plan resolution, reads `pendingPlanId` from Firestore, and writes `status: 'active'` unconditionally.

  **What to do:**

  Rewrite `confirmCheckoutSession(userId, sessionId, email?)` as follows:

  1. **Session ID format check:**
     ```typescript
     const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
     if (sessionId?.startsWith('cs_mock_') && isProd) {
       throw new BadRequestException('Mock session IDs are not accepted in production');
     }
     if (!sessionId?.startsWith('cs_')) {
       throw new BadRequestException('Invalid session ID format');
     }
     ```

  2. **Dev mock bypass** (only when `!isProd` and `sessionId.startsWith('cs_mock_dev')`): fall through to existing Firestore-based confirmation logic (kept for local dev only).

  3. **Real Stripe path** (when `this.stripe` is available and `!sessionId.startsWith('cs_mock_')`):
     ```typescript
     const session = await this.stripe.checkout.sessions.retrieve(sessionId);
     ```
     - Assert `session.client_reference_id === userId`:
       ```typescript
       if (session.client_reference_id !== userId) {
         throw new ForbiddenException('Session does not belong to this user');
       }
       ```
     - Assert payment is complete:
       ```typescript
       const isComplete =
         session.payment_status === 'paid' ||
         session.status === 'complete' ||
         (session.mode === 'subscription' && session.payment_status === 'no_payment_required');
       if (!isComplete) {
         throw new BadRequestException('Payment not completed');
       }
       ```
     - **Idempotency check:**
       ```typescript
       const db = this.db;
       if (!db) throw new ServiceUnavailableException('Database unavailable');
       const processedRef = db.collection('processedStripeEvents').doc(sessionId);
       const processed = await processedRef.get();
       if (processed.exists) {
         return processed.data() as any; // already confirmed — return cached result
       }
       ```
     - Derive `planId` from `session.metadata?.planId` (set during checkout creation).
     - Derive `cycle` from `session.metadata?.cycle`.
     - Write subscription record (existing `batch.set` pattern on `subscriptions/{userId}` and `users/{userId}`).
     - Mark session consumed: `await processedRef.set({ confirmedAt: now, userId, planId })`.
     - Return the subscription confirmation payload.

  4. Imports to add at top of file: `ForbiddenException, BadRequestException, ServiceUnavailableException` from `@nestjs/common`.

  Files:
  - `v2-backend/src/services/billing.service.ts`

  Verify: `cd v2-backend && npm run build` — no TS errors. `cd v2-backend && npm test` — existing `billing-insights-dashboard.spec.ts` tests for `confirmCheckout` still pass (they mock the service, so they are unaffected by internal rewrites).

---

- [ ] **P0-4 · Fix `getBillingStatus` DB-unavailable fallbacks**

  **Current state:**
  - Lines 30–48: `if (!db)` branch returns `{ plan: 'pro', status: 'active', hasActiveSubscription: true, ... }` — grants paid access to everyone when Firebase Admin fails.
  - Lines 97–116: `catch` block silently returns `{ plan: 'free', status: 'active', hasActiveSubscription: true, ... }` — downgrades paid users on transient Firestore errors.

  **What to do:**

  1. Replace the `if (!db)` branch (lines 30–48, inside `getBillingStatus`) with:
     ```typescript
     if (!db) {
       this.logger.error('[BillingService] Firebase Admin is not initialised — refusing to serve billing status');
       throw new ServiceUnavailableException('Billing service temporarily unavailable');
     }
     ```

  2. Replace the `catch` block (after the main Firestore try) with:
     ```typescript
     } catch (err: any) {
       this.logger.error(`[BillingService] Firestore read failed for ${userId}: ${err?.message || err}`);
       throw new ServiceUnavailableException('Billing service temporarily unavailable');
     }
     ```

  3. Ensure `ServiceUnavailableException` is imported from `@nestjs/common` (add to existing import list).

  Files:
  - `v2-backend/src/services/billing.service.ts`

  Verify: `cd v2-backend && npm run build` — no TS errors.

---

- [ ] **P0-5 · Implement Stripe webhook handler**

  **What to do:**

  ### A. `main.ts` — raw body middleware

  In `main.ts`, inside `bootstrap()`, **before** the `app.use(json({ limit: '5mb' }))` and `app.use(urlencoded(...))` lines (currently at the very bottom before `app.listen`), add:

  ```typescript
  // Raw body needed for Stripe webhook signature verification
  // Must be registered BEFORE the json() body parser
  const expressApp2 = app.getHttpAdapter().getInstance();
  expressApp2.use(
    '/api/billing/webhook',
    (require('express') as typeof import('express')).raw({ type: 'application/json' }),
  );
  ```

  Note: The NestJS app is created with `{ bodyParser: false }` (already on line ~131 of `main.ts`), so custom body parsers are safe to add. The insertion point is the line `app.use(json({ limit: '5mb' }))` — add the raw middleware immediately before it. The global prefix is `/api`, so the raw middleware must match `/api/billing/webhook`.

  ### B. `billing.controller.ts` — webhook endpoint

  Add after the existing `downgradeToFree` method, still inside the `BillingController` class:

  ```typescript
  @Post('webhook')
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody: Buffer = req.rawBody ?? req.body;
    return await this.billingService.handleWebhook(rawBody, signature);
  }
  ```

  Add `@Headers` to the import from `@nestjs/common`. This endpoint has **no** `@UseGuards(FirebaseAuthGuard)` — Stripe calls it server-to-server with no Firebase token.

  ### C. `billing.service.ts` — `handleWebhook` and private event handlers

  Add the following public method and private helpers to `BillingService`:

  ```typescript
  // ─── Stripe webhook ──────────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      if (isProd) {
        this.logger.error('[Webhook] STRIPE_WEBHOOK_SECRET not set in production');
        throw new BadRequestException('Webhook secret not configured');
      }
      this.logger.warn('[Webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev mode)');
      // In dev, parse the body directly without verification
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
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      status: 'active',
    });
    this.logger.log(`[Webhook] checkout.session.completed → granted ${planId} to ${userId}`);
  }

  private async onInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
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
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
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

  // ─── Webhook helpers ─────────────────────────────────────────────────────

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
  ```

  ### D. `v2-backend/.env.example` — add webhook secret

  Under the `# ─── Stripe ───` section added in P0-2:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
  ```

  Files:
  - `v2-backend/src/main.ts`
  - `v2-backend/src/controllers/billing.controller.ts`
  - `v2-backend/src/services/billing.service.ts`
  - `v2-backend/.env.example`

  Verify: `cd v2-backend && npm run build` — no TS errors. `cd v2-backend && npm test` — all existing spec files pass.

---

## PHASE P1 — Security Hardening

---

- [ ] **P1-1 · Guard mock token in `AuthContext.tsx` with `import.meta.env.DEV`**

  **Current state (`src/contexts/AuthContext.tsx` lines ~86–97):** Inside the `onAuthStateChanged` callback, the branch checking `mockToken.startsWith('mock-token-')` has **no** `import.meta.env.DEV` guard. This means the mock auth path is active in production builds.

  **What to do:**

  In `src/contexts/AuthContext.tsx`, find the block inside `onAuthStateChanged`:
  ```typescript
  const mockToken = localStorage.getItem('mock_token');
  if (mockToken && mockToken.startsWith('mock-token-')) {
  ```
  Replace the condition with:
  ```typescript
  if (import.meta.env.DEV && mockToken && mockToken.startsWith('mock-token-')) {
  ```

  Files:
  - `src/contexts/AuthContext.tsx`

  Verify: `npm run build` from repo root (Vite build) — exits 0 with no TS errors.

---

- [ ] **P1-2 · Validate `planId` server-side in `setPendingPlan` and `createCheckoutSession`**

  **Current state:** `setPendingPlan` accepts any arbitrary string as `planId` with no allowlist. An attacker can write `enterprise` or any fabricated plan to Firestore and have `confirmCheckoutSession` promote it.

  **What to do:**

  In `billing.service.ts`, add the following constant near the top of the class (after the `logger` declaration):
  ```typescript
  private static readonly VALID_SELF_SERVICE_PLAN_IDS = new Set([
    'free',
    'renter_pro',
    'buyer_pro',
    'starter',
    'landlord_pro',
    'elite',
    'independent',
    'agent_pro',
  ]);
  ```

  In `setPendingPlan(userId, email, planId, cycle)`, add as the very first statement of the method body:
  ```typescript
  if (!BillingService.VALID_SELF_SERVICE_PLAN_IDS.has(planId)) {
    throw new BadRequestException(`Invalid plan ID: ${planId}`);
  }
  ```

  The `createCheckoutSession` rewrite in P0-2 already validates `planId` against this set before calling Stripe. Ensure P0-2 references `BillingService.VALID_SELF_SERVICE_PLAN_IDS` rather than a separate copy.

  Ensure `BadRequestException` is imported from `@nestjs/common` (P0-3 import will already have it).

  Files:
  - `v2-backend/src/services/billing.service.ts`

  Verify: `cd v2-backend && npm run build` — no TS errors.

---

- [ ] **P1-3 · Fix unauthenticated `/billing/confirmed` in `ProtectedRoute.tsx`**

  **Current state (`src/components/common/ProtectedRoute.tsx` lines ~63–68):**
  ```typescript
  const isStripeSuccessReturn =
    location.pathname.startsWith('/billing/confirmed') &&
    location.search.includes('session_id=');

  if (!isAuthenticated && isStripeSuccessReturn) {
    return <>{children}</>;  // renders page with no auth — FINDING 007
  }
  ```

  **What to do:**

  Replace the `if (!isAuthenticated && isStripeSuccessReturn)` block with:
  ```typescript
  if (isStripeSuccessReturn) {
    if (isLoading) {
      // Auth is still resolving — show spinner, do not redirect yet
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }
    if (!isAuthenticated) {
      // Auth resolved as unauthenticated — redirect to login preserving the session_id
      const fullPath = location.pathname + location.search;
      return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} state={{ from: location }} replace />;
    }
    // Authenticated — fall through to normal ProtectedRoute rendering below
  }
  ```

  The `if (isLoading)` check already above this block returns a spinner; move this new block to be the **first** check after the standard `isLoading` spinner (before the existing `if (!isAuthenticated)` redirect). This ensures the `isLoading` spinner from the standard path still covers the non-Stripe case.

  Concretely, the new order inside the component is:
  1. If `isLoading` → spinner (existing)
  2. If `isAuthenticated && user && !user.roleResolved` → spinner (existing)
  3. If `isStripeSuccessReturn && isLoading` → spinner (new — handles Stripe return during auth re-init)
  4. If `isStripeSuccessReturn && !isAuthenticated` → redirect to login with redirect param (new)
  5. If `!isAuthenticated` → existing redirect to login/signup
  6. ... rest of existing logic

  Files:
  - `src/components/common/ProtectedRoute.tsx`

  Verify: `npm run build` from repo root — exits 0 with no TS errors.

---

- [ ] **P1-4 · Remove swallowed errors in `downgradeToFree`**

  **Current state (`billing.service.ts` lines ~273–282):**
  ```typescript
  async downgradeToFree(userId: string) {
    const col = this.collection;
    if (col) {
      try {
        await col.doc(userId).set({ ... }, { merge: true });
      } catch {}  // swallowed — FINDING 013
    }
    return { success: true, planId: 'free' };
  }
  ```

  **What to do:**

  Remove the inner `try/catch` block entirely. Let any Firestore error propagate naturally to the NestJS exception filter, which will return a 500 to the frontend. Keep the outer `if (col)` guard. Also add a log before the write:
  ```typescript
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
  ```

  Files:
  - `v2-backend/src/services/billing.service.ts`

  Verify: `cd v2-backend && npm run build` — no TS errors.

---

## PHASE P2 — SubscriptionGuard

---

- [ ] **P2-1 · Create `SubscriptionGuard` in `v2-backend/src/guards/subscription.guard.ts`**

  **Rationale:** The `planAccess.ts` comment at line 6 says "the NestJS SubscriptionGuard handles API-layer enforcement" — that guard does not exist (FINDING 016). This creates it.

  **Pattern to follow:** `roles.guard.ts` — uses `Reflector` with a custom metadata key, implements `CanActivate`.

  Create the file with these exact exports:
  ```typescript
  import {
    Injectable, CanActivate, ExecutionContext,
    SetMetadata, ForbiddenException, PaymentRequiredException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { BillingService } from '../services/billing.service';

  export const REQUIRED_PLAN_KEY = 'required_plan';
  export const RequiredPlan = (planTier: string) => SetMetadata(REQUIRED_PLAN_KEY, planTier);

  /** Maps plan IDs to numeric tiers (higher = more access). */
  const PLAN_TIERS: Record<string, number> = {
    free: 0,
    explorer: 0,
    starter: 1,
    renter_pro: 2,
    buyer_pro: 2,
    independent: 2,
    landlord_pro: 3,
    elite: 4,
    agent_pro: 3,
    enterprise: 5,
  };

  function planMeetsTier(userPlan: string, requiredPlan: string): boolean {
    const userTier = PLAN_TIERS[userPlan] ?? 0;
    const reqTier = PLAN_TIERS[requiredPlan] ?? 0;
    return userTier >= reqTier;
  }

  @Injectable()
  export class SubscriptionGuard implements CanActivate {
    constructor(
      private readonly reflector: Reflector,
      private readonly billingService: BillingService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const requiredPlan = this.reflector.getAllAndOverride<string>(REQUIRED_PLAN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!requiredPlan) return true; // no plan restriction on this route

      const request = context.switchToHttp().getRequest();
      const { uid, email, role } = request.user ?? {};
      if (!uid) throw new ForbiddenException('User not authenticated');

      const billing = await this.billingService.getBillingStatus(uid, email, role);

      // Check trial expiry server-side
      if (billing.trialEndsAt && new Date(billing.trialEndsAt).getTime() < Date.now()) {
        if (billing.status === 'trialing') {
          throw new ForbiddenException('Trial has expired — please activate your subscription');
        }
      }

      if (billing.status === 'canceled' || billing.status === 'past_due' || billing.status === 'unpaid') {
        throw new ForbiddenException('Subscription is not active');
      }

      if (!planMeetsTier(billing.planId ?? billing.plan ?? 'free', requiredPlan)) {
        throw new ForbiddenException(`This feature requires ${requiredPlan} or above`);
      }

      return true;
    }
  }
  ```

  Note: NestJS does not export `PaymentRequiredException` by default — replace with `ForbiddenException` with a descriptive message (as shown above). The guard uses `billingService.getBillingStatus`, which after P0-4 throws `ServiceUnavailableException` on DB errors — this propagates naturally from the guard as a 503.

  Files:
  - `v2-backend/src/guards/subscription.guard.ts` (new file)

  Verify: `cd v2-backend && npm run build` — no TS errors.

---

- [ ] **P2-2 · Register `SubscriptionGuard` in `app.module.ts`**

  **Current state:** `app.module.ts` `providers` array does not include `SubscriptionGuard` or a second `Reflector` instance.

  **What to do:**

  1. Add import at top of `app.module.ts`:
     ```typescript
     import { Reflector } from '@nestjs/core';
     import { SubscriptionGuard } from './guards/subscription.guard';
     ```

  2. Add to the `providers` array (after `BillingService`):
     ```typescript
     Reflector,
     SubscriptionGuard,
     ```

  Note: `BillingService` is already in `providers` — `SubscriptionGuard` injects it, so declaration order `BillingService` then `SubscriptionGuard` ensures NestJS DI resolves it. `Reflector` is a core NestJS token; registering it explicitly in the module providers makes it injectable into `SubscriptionGuard`.

  Files:
  - `v2-backend/src/app.module.ts`

  Verify: `cd v2-backend && npm run build` — no TS errors. `cd v2-backend && npm test` — all tests pass.

---

- [ ] **P2-3 · Update `planAccess.ts` comment to reference real guard location**

  **Current state (`src/utils/planAccess.ts` line 6):**
  ```
  * the NestJS SubscriptionGuard handles API-layer enforcement.
  ```

  **What to do:**

  Replace that comment block (lines 1–9 of the file):
  ```typescript
  /**
   * Maps dashboard section IDs to the minimum plan required.
   * 'free' = accessible on Explorer. Any other value = requires that plan or above.
   *
   * Rule: never rely solely on frontend gating for data security.
   * Server-side enforcement is in: v2-backend/src/guards/subscription.guard.ts
   * Usage: @UseGuards(FirebaseAuthGuard, SubscriptionGuard) @RequiredPlan('renter_pro')
   * This file drives UI gating only (lock icons, upgrade prompts).
   */
  ```

  Files:
  - `src/utils/planAccess.ts`

  Verify: `npm run build` from repo root — exits 0 with no TS errors.

---

## PHASE P3 — Complimentary Access Hardening

---

- [ ] **P3-1 · Move complimentary domain check server-side; remove frontend env var bypass**

  This phase addresses FINDING 005 — the complimentary-access bypass is controlled by a Vite build-time env var (`VITE_COMPLIMENTARY_EMAIL_DOMAINS`) that could grant enterprise access to any domain if misconfigured.

  ### A. `v2-backend/src/services/billing.service.ts` — use server-side `isComplimentaryEmail`

  The backend already has `v2-backend/src/utils/complimentary-access.ts` with an `isComplimentaryAccessEmail` function that correctly reads `process.env.COMPLIMENTARY_EMAIL_DOMAINS` (no VITE_ prefix). The `getBillingStatus` method already calls `isComplimentaryAccessEmail(email)` at line 28 before the DB path. After P0-4 this is fine — keep it, but ensure the private method reads only `process.env.COMPLIMENTARY_EMAIL_DOMAINS` (already correct in `v2-backend/src/utils/complimentary-access.ts`).

  Add a log line so grants are auditable:
  ```typescript
  if (isComplimentaryAccessEmail(email)) {
    this.logger.log(`[BillingService] Complimentary access granted to ${email}`);
    return complimentaryBillingPayload(role);
  }
  ```

  ### B. `src/hooks/useBillingStatus.ts` — remove `isComplimentaryAccessEmail` frontend bypass

  **Current state (lines ~44–49):**
  ```typescript
  if (isComplimentaryAccessEmail(user?.email)) {
    setData(complimentaryBillingStatus(user?.roles?.[0]));
    setError(null);
    setLoading(false);
    return;
  }
  ```

  Remove this block entirely. The backend will return the complimentary billing status through the normal API call when the email matches the server-side domain list.

  Also remove the imports of `complimentaryBillingStatus` and `isComplimentaryAccessEmail` from the hook (if they become unused after the removal).

  ### C. `src/pages/signup/welcome.tsx` — remove `isComplimentaryAccessEmail` early exit

  **Current state (inside `useEffect`, line ~61):**
  ```typescript
  // Company staff (@theluxcity.co.uk) already have full complimentary access.
  if (isComplimentaryAccessEmail(user?.email)) return;
  ```

  Replace this line with a check on the API-returned billing status:
  ```typescript
  // If the API has already granted an active plan (including complimentary access), skip checkout
  if (status === 'active' || status === 'trialing') return;
  ```

  (The `status === 'trialing' || status === 'active'` check already exists two lines below — consolidate or remove the duplicate. The line at `if (status === 'trialing' || status === 'active') return;` can absorb the complimentary-access case, so simply **delete** the `isComplimentaryAccessEmail` line.)

  Remove the import of `isComplimentaryAccessEmail` from `welcome.tsx` if it becomes unused.

  ### D. Remove `VITE_COMPLIMENTARY_EMAIL_DOMAINS` from all frontend env files

  Check each of the following files and remove any line containing `VITE_COMPLIMENTARY_EMAIL_DOMAINS`:
  - `.env`
  - `.env.development`
  - `.env.example`
  - `.env.local`
  - `.env.prod`
  - `.env.production`

  The audit found only `.env.example` has it (lines 121–122, as comments). Remove those comment lines so future developers do not re-add the variable.

  ### E. `v2-backend/.env.example` — add server-side env var

  Add under the `# ─── Complimentary Access ───` section:
  ```
  # ─── Complimentary Access ─────────────────────────────────────────────────────
  # Comma-separated email domains granted complimentary full access (server-side only).
  # DO NOT use VITE_ prefix — this must never be exposed to the browser bundle.
  COMPLIMENTARY_EMAIL_DOMAINS=theluxcity.co.uk
  ```

  (The variable is already read in `v2-backend/src/utils/complimentary-access.ts`; this just documents it properly.)

  Files:
  - `v2-backend/src/services/billing.service.ts`
  - `src/hooks/useBillingStatus.ts`
  - `src/pages/signup/welcome.tsx`
  - `.env.example` (remove VITE_ comment lines 121–122)
  - `v2-backend/.env.example`

  Verify: `npm run build` from repo root — exits 0. `cd v2-backend && npm run build` — exits 0.

---

## Cross-Cutting Notes for the Implementer

### Import additions required in `billing.service.ts`
The full import line after all phases should include:
```typescript
import {
  Injectable, Logger, InternalServerErrorException,
  BadRequestException, ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import {
  complimentaryBillingPayload,
  isComplimentaryAccessEmail,
} from '../utils/complimentary-access';
```

### `billing.controller.ts` import additions
```typescript
import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req, Headers } from '@nestjs/common';
```

### Build order
Always build backend with `cd v2-backend && npm run build` (uses NestJS compiler which type-checks more strictly than tsc alone). Frontend build is `npm run build` from repo root. The test command `npm test` runs `nest build && vitest run` — so a build failure will also fail tests.

### Stripe types
The `stripe` npm package ships its own type declarations (`@types/stripe` is not needed). TypeScript will resolve `import Stripe from 'stripe'` automatically after `npm install stripe`.

### processedStripeEvents collection
This Firestore collection is used for idempotency in both `confirmCheckoutSession` (P0-3) and the webhook handler (P0-5). Both reference it by the string `'processedStripeEvents'`. No schema migration is needed — documents are created on first use.
