# Implementation Plan — Live Stripe Pricing (Stripe as single source of truth)

**Goal:** Stripe is the single source of truth for all plan prices. No hardcoded prices
anywhere in the runtime path. When prices change in Stripe, the app reflects them
automatically within 5 minutes.

**Codebase context:**

- Backend: NestJS v2-backend (`/home/angeli/Desktop/luxcity/proptii-r1.1a/v2-backend/src/`)
- Frontend: React + Vite (`/home/angeli/Desktop/luxcity/proptii-r1.1a/src/`)
- Auth pattern: `FirebaseAuthGuard` on protected routes; `@Req() req.user.uid`
- Stripe init: lazy `private get stripe()` getter already in `BillingService`
- Firestore: lazy `private get db()` getter already in `BillingService`
- Frontend HTTP: `fetchBillingWithApiFallback(path, init)` + `authHeaders()` pattern from `billingService.ts`
- Static plan catalogue: `src/config/plans.ts` — `PLANS` array, `PlanConfig` interface, `getPlansForAudienceTab()`

---

## Task 1 — Backend: rewrite `getPlans()` to return live Stripe prices

**What:** Replace the stub `getPlans()` in `BillingService` with a method that:

1. Calls `stripe.prices.list({ active: true, expand: ['data.product'], limit: 100 })` and reads
   `(price.product as Stripe.Product).metadata?.proptii_plan_id` for planId and
   `price.metadata?.cycle ?? (price.recurring?.interval === 'year' ? 'annual' : 'monthly')` for cycle.
2. Defines a `PLANS_CATALOGUE` constant (top-level const inside the class file, typed as an
   inline array of objects) with **static metadata only** — id, name, segment, features,
   isPopular, isDark, isContactSales, isFree, fitChecksQuota, fitChecksOverageRate,
   fallbackMonthlyPrice, fallbackAnnualPrice. No live prices stored here.
3. Merges Stripe live prices over catalogue static data to produce the full response.
4. Applies a **5-minute in-memory cache**: two module-level variables
   `let _plansCache: PlansResponse[] | null = null` and
   `let _plansCacheTime = 0` at the top of the class body; check
   `Date.now() - _plansCacheTime < 5 * 60 * 1000` before calling Stripe.
5. **Falls back to static prices** (fallbackMonthlyPrice / fallbackAnnualPrice from PLANS_CATALOGUE)
   if `this.stripe` is null or if the Stripe call throws.
6. Returns an array where each element has **exactly** these fields:
   ```
   id, name, segment, monthlyPrice, annualPrice, annualTotal, annualSaving,
   stripePriceIdMonthly, stripePriceIdAnnual, features, isPopular, isDark,
   isContactSales, isFree, fitChecksQuota, fitChecksOverageRate
   ```
   Where:
   - `annualPrice` = `Math.round(annualTotal / 12 * 100) / 100` (per-month equivalent)
   - `annualSaving` = `'save £' + Math.round(monthlyPrice * 12 - annualTotal)`
     (or the static catalogue string for 'independent'/'agent_pro' which use `~£N/mo saving`)
   - For `isFree`/`isContactSales` plans: prices stay 0/null

**PLANS_CATALOGUE fallback prices (monthly / annualTotal):**

- renter_pro: 12 / 99
- buyer_pro: 19 / 159
- starter: 29 / 249
- landlord_pro: 49 / 399
- elite: 99 / 799
- independent: 79 / 750
- agent_pro: 149 / 1430

**Also remove `buildPlansPriceMap()` private method** — it is superseded by the new `getPlans()`.

**Files:**

- `v2-backend/src/services/billing.service.ts`

**Pitfalls:**

- `price.product` is a `string | Stripe.Product | Stripe.DeletedProduct` — always cast with
  `typeof price.product === 'object' && price.product !== null && !('deleted' in price.product)`
  before reading `.metadata`.
- The Stripe API returns amounts in **pence** (GBP), so divide `price.unit_amount` by 100.
- `price.unit_amount` can be `null` for metered prices; guard with `?? 0`.
- Cache variables must be **module-level** (declared before the class) to survive multiple calls;
  putting them inside the class body as regular properties also works but makes them reset on
  service reload — module-level is safer for NestJS singleton services.
- Keep `VALID_SELF_SERVICE_PLAN_IDS` unchanged; it is used by `createCheckoutSession` and
  `setPendingPlan`.

**Verify:** Start the backend (`cd v2-backend && npm run start:dev`) and call
`curl http://localhost:3002/api/billing/plans` — response must be a JSON array with at least 7
objects each having numeric `monthlyPrice` and `annualPrice` fields (not null).

---

## Task 2 — Backend: add `upgradeSubscription` and `cancelSubscription` methods + endpoints

**What (service):**

Add two new methods to `BillingService`:

```typescript
async upgradeSubscription(userId: string, planId: string, cycle: 'monthly' | 'annual')
  : Promise<{ upgraded: true } | { checkoutUrl: string }>
```

- Validate `planId` against `VALID_SELF_SERVICE_PLAN_IDS`; throw `BadRequestException` if invalid.
- Call `this.getPriceId(planId, cycle)`; throw `BadRequestException` if null (not configured).
- Query Firestore: `this.db!.collection('subscriptions').doc(userId).get()`.
  Read `data.stripeSubscriptionId` and `data.status`.
- If `stripeSubscriptionId` exists AND `data.status` is `'active'` or `'trialing'`:
  1. Retrieve the subscription: `this.stripe!.subscriptions.retrieve(subId)`.
  2. Get the current subscription item ID: `sub.items.data[0].id`.
  3. Call `this.stripe!.subscriptions.update(subId, { items: [{ id: itemId, price: priceId }], proration_behavior: 'create_prorations' })`.
  4. Update Firestore `subscriptions/${userId}` with `{ planId, cycle, updatedAt }` using `merge: true`.
  5. Return `{ upgraded: true }`.
- Otherwise: delegate to `this.createCheckoutSession(userId, email, { planId, cycle })` — but
  `upgradeSubscription` does not have `email`. **Solution:** accept `email` as a third parameter
  OR look it up from Firestore `users/${userId}.email`. Recommended: add `email` as a required
  parameter so the controller passes it from `req.user.email`.
  Signature becomes:
  ```typescript
  async upgradeSubscription(userId: string, email: string, planId: string, cycle: 'monthly' | 'annual')
  ```

```typescript
async cancelSubscription(userId: string): Promise<{ success: true; cancelAtPeriodEnd: true }>
```

- Read `stripeSubscriptionId` from Firestore `subscriptions/${userId}`.
- If not found or Stripe not configured: throw `BadRequestException('No active subscription found')`.
- Call `this.stripe!.subscriptions.update(subId, { cancel_at_period_end: true })`.
- Update Firestore `subscriptions/${userId}` with `{ cancelAtPeriodEnd: true, updatedAt }`.
- Return `{ success: true, cancelAtPeriodEnd: true }`.

**What (controller):** Add two new endpoints to `BillingController`:

```typescript
@Post('upgrade')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('bearer')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Upgrade/change subscription plan without new checkout' })
async upgradeSubscription(@Req() req: any, @Body() dto: any) {
  return await this.billingService.upgradeSubscription(
    req.user.uid, req.user.email || '', dto.planId, dto.cycle,
  );
}

@Post('cancel')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('bearer')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Cancel subscription at period end' })
async cancelSubscription(@Req() req: any) {
  return await this.billingService.cancelSubscription(req.user.uid);
}
```

**Files:**

- `v2-backend/src/services/billing.service.ts`
- `v2-backend/src/controllers/billing.controller.ts`

**Pitfalls:**

- `subscriptions.update` with `items` array using `{ id, price }` replaces the item's price.
  Do **not** pass `delete_items` or other fields; only pass the item entry.
- `proration_behavior: 'create_prorations'` creates a proration invoice automatically — this
  is the recommended behavior for mid-cycle upgrades.
- If Stripe throws (e.g. subscription is canceled already), catch and rethrow as `BadRequestException`
  with a human-readable message.
- The `cancelSubscription` method only sets `cancel_at_period_end: true`; it does NOT immediately
  terminate the subscription. The webhook `customer.subscription.updated` will fire and `onSubscriptionUpdated`
  will handle the Firestore sync (it already reads `sub.cancel_at_period_end`).

**Verify:** After `npm run start:dev`, test with curl:

```sh
# Upgrade (requires valid Firebase JWT in Authorization header)
curl -X POST http://localhost:3002/api/billing/upgrade \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"planId":"landlord_pro","cycle":"monthly"}'
# Expect: { "upgraded": true } or { "checkoutUrl": "..." }

curl -X POST http://localhost:3002/api/billing/cancel \
  -H "Authorization: Bearer <token>"
# Expect: { "success": true, "cancelAtPeriodEnd": true }
```

---

## Task 3 — Frontend: create `usePlans` hook

**What:** Create a new hook at `src/hooks/usePlans.ts` that:

1. Fetches `GET /billing/plans` via `fetchBillingWithApiFallback('/billing/plans')`.
2. Merges live API data over the static `PLANS` array from `src/config/plans.ts`:
   for each plan returned by the API, find the matching entry in `PLANS` by `id` and overwrite
   `monthlyPrice`, `annualPrice`, `annualTotal`, `annualSaving`, `stripePriceIdMonthly`,
   `stripePriceIdAnnual` with live values. Static metadata (name, features, isPopular, etc.)
   is always taken from `PLANS`.
3. Uses a **module-level 5-minute cache**:
   ```typescript
   let _cache: PlanConfig[] | null = null;
   let _cacheTime = 0;
   ```
   Check `Date.now() - _cacheTime < 5 * 60 * 1000` at the start of the fetch function.
4. Falls back to static `PLANS` on any fetch error (including network failure).
5. Returns `{ plans: PlanConfig[], loading: boolean, error: string | null }`.

**Exact shape of the returned merged plan:** keep `PlanConfig` from `src/config/plans.ts` — no new
types. The merge just replaces the numeric/string price fields with live values.

**Implementation sketch:**

```typescript
// src/hooks/usePlans.ts
import { useEffect, useState } from "react";
import { PLANS, type PlanConfig } from "../config/plans";
import { fetchBillingWithApiFallback } from "../utils/apiEndpoints";

let _cache: PlanConfig[] | null = null;
let _cacheTime = 0;

async function fetchLivePlans(): Promise<PlanConfig[]> {
  if (_cache && Date.now() - _cacheTime < 5 * 60 * 1000) return _cache;
  try {
    const { response } = await fetchBillingWithApiFallback("/billing/plans");
    if (!response.ok) throw new Error("plans fetch failed");
    const live = (await response.json()) as Array<any>;
    const merged = PLANS.map((p) => {
      const l = live.find((x) => x.id === p.id);
      if (!l) return p;
      return {
        ...p,
        monthlyPrice: l.monthlyPrice ?? p.monthlyPrice,
        annualPrice: l.annualPrice ?? p.annualPrice,
        annualTotal: l.annualTotal ?? p.annualTotal,
        annualSaving: l.annualSaving ?? p.annualSaving,
        stripePriceIdMonthly: l.stripePriceIdMonthly ?? p.stripePriceIdMonthly,
        stripePriceIdAnnual: l.stripePriceIdAnnual ?? p.stripePriceIdAnnual,
      };
    });
    _cache = merged;
    _cacheTime = Date.now();
    return merged;
  } catch {
    return PLANS; // static fallback
  }
}

export function usePlans() {
  const [plans, setPlans] = useState<PlanConfig[]>(PLANS); // start with static
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLivePlans()
      .then((result) => {
        if (!cancelled) {
          setPlans(result);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load plans");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading, error };
}
```

**Files:**

- `src/hooks/usePlans.ts` (create new)

**Pitfalls:**

- The hook must **not** block rendering. It initialises `plans` with static `PLANS`, so cards
  render immediately with static prices while the network call completes.
- `fetchBillingWithApiFallback` is not an authenticated call — `GET /billing/plans` has no
  `FirebaseAuthGuard`. This is correct; no auth header needed.

**Verify:** Import `usePlans` in any component in the browser devtools console. After the network
call completes, `plans[1].monthlyPrice` should equal the price configured in Stripe (not the
hardcoded static value if they differ).

---

## Task 4 — Frontend: update pricing page to consume live plans

**What:** Modify `PricingPlanGrid` (not `PricingPage` itself) to use `usePlans()` so the grid
reflects live prices. `PricingPage` is already clean; the data flows through `PricingPlanGrid`
via `getPlansForAudienceTab(audience)`.

The simplest, lowest-risk approach is to update `PricingPlanGrid` directly:

1. Import `usePlans` from `../../hooks/usePlans`.
2. Call `const { plans } = usePlans();` at the top of the component.
3. Replace `getPlansForAudienceTab(audience)` with a local helper that filters `plans` by audience
   (same logic as `getPlansForAudienceTab` but operating on the live `plans` array instead of
   the module-level `PLANS` constant):
   ```typescript
   function filterByAudience(
     all: PlanConfig[],
     audience: PricingAudience,
   ): PlanConfig[] {
     if (audience === "renters")
       return all.filter(
         (p) => p.segment.includes("renter") || p.segment.includes("buyer"),
       );
     if (audience === "landlords")
       return all.filter((p) => p.segment.includes("landlord"));
     return all.filter((p) => p.segment.includes("agent"));
   }
   const filteredPlans = filterByAudience(plans, audience);
   ```
4. Render `filteredPlans` instead of `plans` from the static import.

`PricingPage` itself needs **no changes** — it already passes `audience` and `billing` to
`PricingPlanGrid` and has no direct import of `PLANS`.

**Files:**

- `src/components/pricing/PricingPlanGrid.tsx`

**Pitfalls:**

- Do not remove the import of `getPlansForAudienceTab` from `plans.ts` — other components
  (`PricingCompareSection`, etc.) may still use it. Only `PricingPlanGrid` switches to live data.
- The `plans` state initialises with static `PLANS` so there is no flash of empty content.

**Verify:** Run `npm run dev` in the frontend root. Open `/pricing` — plan cards must load immediately
with static prices, then display Stripe live prices within a few seconds (observe the React DevTools
state update or network tab showing `/billing/plans` returning 200).

---

## Task 5 — Verify `PricingPlanCard` works with live prices (read-only check)

**What:** Confirm that `PricingPlanCard` reads prices correctly when live data is injected.

`PricingPlanCard` calls `getDisplayPrice(plan, billing)` from `plans.ts`:

```typescript
export function getDisplayPrice(plan, cycle) {
  // returns plan.annualPrice for cycle==='annual', plan.monthlyPrice for 'monthly'
}
```

Both fields are read directly from the `PlanConfig` object prop. Since `usePlans` returns the same
`PlanConfig` shape with live prices merged in, `PricingPlanCard` requires **no changes**.

**Verify:** Visual spot-check in the browser: when the billing toggle is switched between monthly
and annual, prices displayed on cards must match the Stripe product prices, not the old hardcoded
values in `plans.ts`.

If any discrepancy is found (e.g. `getDisplayPrice` applies rounding or transformation that
breaks with Stripe's pence-to-pounds conversion), fix rounding in the `getPlans()` backend
method (Task 1) so the returned `annualPrice` is already the per-month figure, not the annual total.
No changes to `PricingPlanCard.tsx` should be needed.

**Files:** None (read-only verification step; fix backend rounding in `billing.service.ts` if needed).

---

## Task 6 — Frontend: add `upgradeSubscription` and `cancelSubscription` to `billingService.ts`

**What:** Add two new exported functions following the existing pattern in `src/services/billingService.ts`.

```typescript
/** Upgrade/change subscription for a user who already has an active Stripe subscription.
 *  Returns { upgraded: true } on in-place upgrade, or { checkoutUrl } if a new checkout is needed. */
export async function upgradeSubscription(
  planId: string,
  cycle: "monthly" | "annual",
): Promise<{ upgraded?: boolean; checkoutUrl?: string }> {
  const headers = await authHeaders();
  const { response } = await fetchBillingWithApiFallback("/billing/upgrade", {
    method: "POST",
    headers,
    body: JSON.stringify({ planId, cycle }),
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try {
      const b = JSON.parse(text) as { message?: string };
      if (b.message) msg = b.message;
    } catch {}
    throw new Error(msg || "Upgrade failed");
  }
  return response.json();
}

/** Set a subscription to cancel at the end of the current billing period. */
export async function cancelSubscription(): Promise<{
  success: boolean;
  cancelAtPeriodEnd: boolean;
}> {
  const headers = await authHeaders();
  const { response } = await fetchBillingWithApiFallback("/billing/cancel", {
    method: "POST",
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try {
      const b = JSON.parse(text) as { message?: string };
      if (b.message) msg = b.message;
    } catch {}
    throw new Error(msg || "Cancellation failed");
  }
  return response.json();
}
```

Append these two functions **after** the existing `createBillingPortalSession` function, before the
`downgradeToFreePlan` export, to preserve file readability.

**Files:**

- `src/services/billingService.ts`

**Pitfalls:**

- Both calls require auth headers. If the user is not signed in, `authHeaders()` returns an object
  without `Authorization`; the backend will return 401 and the thrown error surfaces in the UI.
- Do not rename or change any existing functions — other components depend on them.

**Verify:** TypeScript compiler: `tsc --noEmit` (or `npm run build`) — no new type errors.

---

## Task 7 — Wire `upgradeSubscription` into both plan-compare modals

**What:** Modify `handleUpgrade` in both modals so that users with an **active Stripe subscription**
get an in-place upgrade instead of always being redirected to a new Stripe Checkout session.

The change is **identical** for both files:

**Current `handleUpgrade` flow (both modals):**

```
setPendingPlan → createCheckoutSession → redirect to Stripe
```

**New `handleUpgrade` flow:**

```
setPendingPlan →
  if user has active subscription (hasStripeCustomer && status === 'active'):
    upgradeSubscription(plan.id, cycle)
      → if result.checkoutUrl: redirect there
      → if result.upgraded: refresh billing status + show success toast/message
  else:
    createCheckoutSession → redirect to Stripe
```

**For `PlanCompareModal.tsx`:**

1. Import `upgradeSubscription` from `../../services/billingService`.
2. Add `billingStatus` prop (or read it via `useBillingStatus` hook inside the modal):
   - Preferred: accept optional `billingStatus: { hasStripeCustomer: boolean; status: string | null } | null`
     as a prop so the parent controls what is passed — avoids adding a hook call inside the modal.
   - Alternative (self-contained): call `useBillingStatus()` inside the modal. This is fine too
     since `useBillingStatus` is already in the project and reads cached Firestore data.
   - **Decision: use a prop** — it keeps the modal pure and testable, and the callers already have
     billing status available (they pass `currentPlanId` so they clearly have billing context).
3. Add `onUpgradeSuccess?: () => void` prop so the parent can refresh billing after an in-place upgrade.
4. Update `handleUpgrade`:
   ```typescript
   const handleUpgrade = async (plan: PlanConfig) => {
     setUpgrading(plan.id);
     setUpgradeError(null);
     try {
       try {
         await setPendingPlan(plan.id, cycle);
       } catch {
         /* best-effort */
       }

       const hasActiveSub =
         billingStatus?.hasStripeCustomer && billingStatus?.status === "active";

       if (hasActiveSub) {
         const result = await upgradeSubscription(plan.id, cycle);
         if (result.checkoutUrl) {
           markPendingStripeCheckout("pay_now");
           onExternalNavigate
             ? onExternalNavigate(result.checkoutUrl)
             : (window.location.href = result.checkoutUrl);
           return;
         }
         // In-place upgrade succeeded
         onUpgradeSuccess?.();
         onClose();
         return;
       }

       // No active sub — new checkout
       markPendingStripeCheckout("pay_now");
       trackEvent("billing_checkout_started", {
         plan_id: plan.id,
         cycle,
         trial_enabled: false,
         source: "settings_plan_modal",
       });
       const { checkoutUrl } = await createCheckoutSession(
         plan.id,
         cycle,
         false,
       );
       onExternalNavigate
         ? onExternalNavigate(checkoutUrl)
         : (window.location.href = checkoutUrl);
     } catch (err) {
       setUpgradeError(
         err instanceof Error ? err.message : "Could not start checkout.",
       );
       setUpgrading(null);
     }
   };
   ```
5. Update the `Props` interface:
   ```typescript
   interface Props {
     open: boolean;
     onClose: () => void;
     currentPlanId: PlanId | string | null;
     defaultAudience?: Audience;
     onExternalNavigate?: (url: string) => void;
     billingStatus?: {
       hasStripeCustomer: boolean;
       status: string | null;
     } | null; // NEW
     onUpgradeSuccess?: () => void; // NEW
   }
   ```

**For `LandlordPlanCompareModal.tsx`:** apply the exact same changes but:

- Import from `../../../services/billingService` (three levels up instead of two).
- The modal uses `openInParentApp` instead of `window.location.href` / `onExternalNavigate`.
  Update the redirect accordingly:
  ```typescript
  if (result.checkoutUrl) {
    openInParentApp(result.checkoutUrl);
    return;
  }
  ```
- No `onExternalNavigate` prop in this modal; the existing `openInParentApp` call is the redirect path.
- Add same two props (`billingStatus`, `onUpgradeSuccess`) to its `Props` interface.

**Files:**

- `src/components/billing/PlanCompareModal.tsx`
- `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

**Pitfalls:**

- `trackEvent('billing_checkout_started', ...)` should only fire on the Stripe Checkout path,
  not on in-place upgrades. Move the `trackEvent` call inside the `else` branch (new checkout).
- After an in-place upgrade, Firestore is updated by the backend. Call `onUpgradeSuccess?.()` which
  should trigger `refresh()` from `useBillingStatus` in the parent — the parent is responsible for
  wiring this.
- Callers of `PlanCompareModal` and `LandlordPlanCompareModal` must be updated to pass the new
  props when billing status is available. Search for usages of these modals:
  - `grep -r "PlanCompareModal" src/` to find all call sites.
  - Pass `billingStatus={{ hasStripeCustomer: billingData.hasStripeCustomer, status: billingData.status }}`
    and `onUpgradeSuccess={refresh}` at each call site.

**Verify:** `npm run build` — TypeScript compilation must succeed with no errors on the modal files
and their call sites.

---

## Task 8 — Update `usePlan` hook to use live plan data from `usePlans`

**What:** `src/hooks/usePlan.ts` currently calls `getPlanById(planId)` which reads from the static
`PLANS` array. Update it to read from `usePlans()` so the returned plan object carries live prices.

**Problem:** `usePlans()` is a hook (uses `useEffect`/`useState`), and `usePlan` is also a hook.
The returned plan will momentarily be the static version while the network call is in-flight, then
update to the live version. This is acceptable — it is the same progressive-enhancement pattern.

**New implementation:**

```typescript
// src/hooks/usePlan.ts
import { useMemo } from "react";
import { usePlans } from "./usePlans";
import type { PlanConfig, PlanId } from "../config/plans";

/** Returns live plan config for a plan ID (prices from Stripe via usePlans). */
export function usePlan(
  planId: PlanId | string | null | undefined,
): PlanConfig | undefined {
  const { plans } = usePlans();
  return useMemo(() => {
    if (!planId) return undefined;
    return plans.find((p) => p.id === planId);
  }, [planId, plans]);
}
```

**Files:**

- `src/hooks/usePlan.ts`

**Pitfalls:**

- `usePlan` is called in potentially many components. The hook composition (`usePlan` → `usePlans`)
  means every component using `usePlan` will now make or reuse the cached `fetchBillingWithApiFallback`
  call. Because `usePlans` uses a module-level cache, all concurrent callers share one in-flight
  request — this is safe.
- If any existing caller of `usePlan` destructures fields that don't exist in `PlanConfig`, those
  will now be `undefined`. Since we keep the same `PlanConfig` type and only change the data source,
  no existing destructuring breaks.
- Run `grep -r "usePlan(" src/` to find all callers and visually verify none rely on the hook
  returning synchronously from the first render (they all already handle `undefined` return).

**Verify:** `npm run build` — full TypeScript/Vite build must pass with no errors.

---

## Final integration checklist (run after all 8 tasks)

1. **Backend env vars** — confirm these are set on the Render backend service (campaign-messaging workspace):

   ```
   STRIPE_SECRET_KEY=<redacted – set via Render dashboard>
   STRIPE_PUBLISHABLE_KEY=<redacted – set via Render dashboard>
   STRIPE_WEBHOOK_SECRET=whsec_t2EN7g9omBP60T4qisIoFAQNMSzAHxGE
   STRIPE_PRICE_BUYER_PRO_MONTHLY=price_1USe8n11liWU5SJSfr11IXZ5
   STRIPE_PRICE_BUYER_PRO_ANNUAL=price_1USeAB11liWU5SJSzhCoNEWp
   STRIPE_PRICE_STARTER_MONTHLY=price_1USeE211liWU5SJST2EmftIF
   STRIPE_PRICE_STARTER_ANNUAL=price_1USeE211liWU5SJSkur4lCGd
   STRIPE_PRICE_LANDLORD_PRO_MONTHLY=price_1USeFL11liWU5SJSJVDylwW0
   STRIPE_PRICE_LANDLORD_PRO_ANNUAL=price_1USeGA11liWU5SJSurG1ELGh
   STRIPE_PRICE_ELITE_MONTHLY=price_1USeGx11liWU5SJSEISqFNGY
   STRIPE_PRICE_ELITE_ANNUAL=price_1USeHL11liWU5SJSxAlhuAk9
   STRIPE_PRICE_INDEPENDENT_MONTHLY=price_1USeI811liWU5SJSocu8bIoQ
   STRIPE_PRICE_INDEPENDENT_ANNUAL=price_1USeIR11liWU5SJSs338ykSU
   STRIPE_PRICE_AGENT_PRO_MONTHLY=price_1USeJA11liWU5SJSFpWpNFKV
   STRIPE_PRICE_AGENT_PRO_ANNUAL=price_1USeJa11liWU5SJSQoFsgOie
   STRIPE_PRICE_RENTER_PRO_MONTHLY=price_1USdye11liWU5SJS10R4tB0Y
   STRIPE_PRICE_RENTER_PRO_ANNUAL=price_1USe0611liWU5SJSWMp3AnIe
   ```

   **Important:** Each Stripe Price must have its Product's metadata contain `proptii_plan_id`
   set to the corresponding planId (e.g. `renter_pro`) AND each Price must have its own
   `metadata.cycle` set to `monthly` or `annual`. This is what `getPlans()` reads.
   If those metadata values are not set in Stripe, the backend falls back gracefully to env-var
   prices (same as before) and the static fallback prices serve as last resort.

2. **Stripe metadata setup** — on each Price object in the Stripe dashboard, go to
   Products → [Product] → Prices → [Price] → Metadata and add:
   - `cycle`: `monthly` or `annual`
   - On the parent Product → Metadata: `proptii_plan_id`: e.g. `renter_pro`

3. **Smoke test end-to-end:**
   - `GET /billing/plans` → array of plans with live prices from Stripe
   - Open `/pricing` in the browser → cards show Stripe prices
   - Toggle billing cycle → annual prices reflect Stripe's annual price / 12
   - Open Plan Compare Modal as a logged-in user with an active subscription → Upgrade button
     calls `/billing/upgrade` (not `/billing/checkout`) and modal closes on success
   - Downgrade/cancel → `/billing/cancel` returns `{ success: true, cancelAtPeriodEnd: true }`
