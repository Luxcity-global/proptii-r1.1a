# Backend Tasks 1 & 2 — Completed

## Task 1 — Rewrote `getPlans()` in billing.service.ts

### Changes made

1. **Module-level cache** — Added `let _plansCache: any[] | null = null` and `let _plansCacheTime = 0` before the class (module scope so they survive NestJS lazy re-instantiation). Removed the old class-property cache (`_plansCache`, `_plansCacheAt`, `PLANS_CACHE_TTL_MS`).

2. **`PLANS_CATALOGUE` updated** — Added missing `enterprise` entry (`isContactSales: true`, no prices). All existing entries retained with their original metadata.

3. **`buildPlansPriceMap()` removed** — The private helper is gone; `getPlans()` now handles everything.

4. **`getPlans()` rewritten** to:
   - Return the 5-minute cache immediately if warm.
   - Fall back to static catalogue data if `this.stripe` is null.
   - Call `stripe.prices.list({ active: true, expand: ['data.product'], limit: 100 })`.
   - Type-guard each `price.product` (`typeof === 'object' && !('deleted' in ...)`) before reading `.metadata`.
   - Read `planId` from `(product as Stripe.Product).metadata?.proptii_plan_id`.
   - Read `cycle` from `price.metadata?.cycle ?? (interval === 'year' ? 'annual' : 'monthly')`.
   - Convert pence → pounds: `(price.unit_amount ?? 0) / 100`.
   - Build `priceMap` keyed by `planId`.
   - Map `PLANS_CATALOGUE` to response objects with fields: `id, name, segment, monthlyPrice, annualPrice, annualTotal, annualSaving, stripePriceIdMonthly, stripePriceIdAnnual, features, isPopular, isDark, isContactSales, isFree, fitChecksQuota, fitChecksOverageRate`.
   - `annualPrice = Math.round(annualTotal / 12 * 100) / 100`
   - `annualSaving = 'save £' + Math.round(monthlyPrice * 12 - annualTotal)` (null for free/contactSales).
   - Store result in `_plansCache` / `_plansCacheTime`.
   - Catch any Stripe error and fall back to static data.

## Task 2 — Added `upgradeSubscription` + `cancelSubscription`

### billing.service.ts

- `upgradeSubscription(userId, email, planId, cycle)` — Validates plan against `VALID_SELF_SERVICE_PLAN_IDS`, resolves priceId via `getPriceId()`, reads Firestore for existing subscription. If active/trialing: calls `stripe.subscriptions.update()` with `proration_behavior: 'create_prorations'` and updates Firestore. Falls back to `createCheckoutSession` if no active subscription.
- `cancelSubscription(userId)` — Reads `stripeSubscriptionId` from Firestore, calls `stripe.subscriptions.update({ cancel_at_period_end: true })`, updates Firestore.

### billing.controller.ts

- `POST /billing/upgrade` — `@UseGuards(FirebaseAuthGuard)`, calls `upgradeSubscription(uid, email, dto.planId, dto.cycle)`.
- `POST /billing/cancel` — `@UseGuards(FirebaseAuthGuard)`, calls `cancelSubscription(uid)`.

## Verification

`npx tsc --noEmit` — exits 0, no errors.
