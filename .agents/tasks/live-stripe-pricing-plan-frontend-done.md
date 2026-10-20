# Frontend Live Stripe Pricing — Tasks 3–8 Complete

## Changes Made

### Task 3 — Created `src/hooks/usePlans.ts` (new file)
- Fetches `GET /billing/plans` via `fetchBillingWithApiFallback`
- Merges live API prices over static `PLANS` array (overwrites `monthlyPrice`, `annualPrice`, `annualTotal`, `annualSaving`, `stripePriceIdMonthly`, `stripePriceIdAnnual`)
- Module-level 5-minute cache (`_cache` / `_cacheTime`) shared across all hook instances
- Falls back to static `PLANS` on any fetch error
- Returns `{ plans: PlanConfig[], loading: boolean, error: string | null }`

### Task 4 — Updated `src/components/pricing/PricingPlanGrid.tsx`
- Imports and calls `usePlans()` to get live plan data
- Added `filterByAudience()` helper that replicates `getPlansForAudienceTab()` logic but operates on the live `plans` array
- Replaced static `getPlansForAudienceTab(audience)` call with `filterByAudience(plans, audience)`
- Cards render immediately with static prices while network fetch completes (no flash of empty)

### Task 5 — Verified `PricingPlanCard.tsx` (read-only, no changes needed)
- Confirmed `getDisplayPrice(plan, billing)` reads `plan.monthlyPrice` / `plan.annualPrice` directly from the `PlanConfig` prop — compatible with live data from `usePlans`

### Task 6 — Updated `src/services/billingService.ts`
- Added `upgradeSubscription(planId, cycle)` — POSTs to `/billing/upgrade`, returns `{ upgraded?: boolean; checkoutUrl?: string }`
- Added `cancelSubscription()` — POSTs to `/billing/cancel`, returns `{ success: boolean; cancelAtPeriodEnd: boolean }`
- Both functions inserted after `createBillingPortalSession`, before `downgradeToFreePlan`

### Task 7 — Updated both plan-compare modals

**`src/components/billing/PlanCompareModal.tsx`:**
- Added `upgradeSubscription` import from `../../services/billingService`
- Added `billingStatus` and `onUpgradeSuccess` props to `Props` interface
- Rewrote `handleUpgrade`: users with active subscription (`hasStripeCustomer && status === 'active'`) get in-place upgrade via `/billing/upgrade`; falls back to new checkout otherwise
- `trackEvent('billing_checkout_started')` only fires on the new-checkout path

**`src/components/billing/PlanCompareModal.tsx` call site — `DashboardSettings.tsx`:**
- Passed `billingStatus={{ hasStripeCustomer, status }}` and `onUpgradeSuccess={refresh}`

**`src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`:**
- Added `upgradeSubscription` import from `../../../services/billingService`
- Added `billingStatus` and `onUpgradeSuccess` props to `Props` interface
- Rewrote `handleUpgrade`: same in-place upgrade logic; uses `openInParentApp(result.checkoutUrl)` for redirects instead of `window.location.href`
- `trackEvent` only fires on new-checkout path

**`LandlordAgentSettingsPage.tsx` call site:**
- Passed `billingStatus={{ hasStripeCustomer, status }}` and `onUpgradeSuccess={refresh}`

### Task 8 — Rewrote `src/hooks/usePlan.ts`
- Now delegates to `usePlans()` so returned plan object carries live Stripe prices
- Returns plan via `useMemo` keyed on `[planId, plans]`

## TypeScript Verification
All modified files pass `tsc --noEmit` with zero errors. Pre-existing errors in unrelated files (referencing, property, homeowner modules) are unchanged.
