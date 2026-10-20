# Billing Flow Audit — Findings Report

_Investigation date: 2026-10-20_

---

## Executive Summary

Three issues found:

| # | Issue | Severity | Fix complexity |
|---|-------|----------|----------------|
| 1 | Stripe checkout fails with "product tax code is missing" | **Blocking** — no user can pay | Low — add one field to `createCheckoutSession` |
| 2 | Tenant sees Landlords and Agents tabs in plan modal | **UX bug** — wrong plans shown | Low — derive `allowedTabs` from `userRole` in `PlanCompareModal` |
| 3 | Staging backend healthy; prices coming from static fallbacks, not live Stripe metadata | **Low** — prices show but without Stripe sync | Medium — add `proptii_plan_id` metadata to Stripe products |

---

## Issue 1 — Stripe Tax Code Error (Blocking)

### Root cause

`createCheckoutSession()` in `v2-backend/src/services/billing.service.ts` (lines ~330–355) creates a Stripe checkout session with no tax configuration:

```typescript
const session = await this.stripe.checkout.sessions.create({
  mode: 'subscription',
  customer_email: email,
  client_reference_id: userId,
  line_items: [{ price: resolvedPriceId, quantity: 1 }],  // ← no tax_code here
  subscription_data: { ... },
  // ← no automatic_tax here
  ...
});
```

This account has **Stripe Managed Payments** enabled by default. When Managed Payments is on, Stripe requires one of:
- A `tax_code` on every product in the line items, OR
- `automatic_tax: { enabled: true }` at the session level (which lets Stripe calculate tax automatically)

Neither is present — hence the error:
> "the product tax code is missing. Set the product's tax_code field to an eligible product tax code."

### Available fixes (two options)

**Option A — Recommended: enable automatic tax on the session (code change, ~2 lines)**

Add `automatic_tax: { enabled: true }` to the session creation call. This is fully supported by stripe@16.12.0 and is the Stripe-recommended approach for subscriptions with Managed Payments.

```typescript
// v2-backend/src/services/billing.service.ts — createCheckoutSession()

const session = await this.stripe.checkout.sessions.create({
  mode: 'subscription',
  customer_email: email,
  client_reference_id: userId,
  automatic_tax: { enabled: true },          // ← ADD THIS LINE
  line_items: [{ price: resolvedPriceId, quantity: 1 }],
  subscription_data: {
    ...(dto.trialEnabled ? { trial_period_days: 30 } : {}),
    metadata: { userId, planId, cycle },
  },
  metadata: { planId, cycle, userId },
  success_url: `...`,
  cancel_url: `...`,
});
```

Note: when `automatic_tax` is enabled, the customer's billing address is collected at checkout and used to calculate applicable taxes. Stripe test-mode cards work fine with this enabled.

**Option B — Disable Managed Payments in the Stripe Dashboard (no code change)**

1. Log in to the Stripe Dashboard.
2. Go to **Settings → Payments → Manage payments** (or search "Tax" in the settings search bar).
3. Disable "Automated tax collection" / Managed Payments.

This is a quick workaround for test mode but is **not recommended for production** because it disables automatic tax compliance. Use Option A.

### Files to modify
- `v2-backend/src/services/billing.service.ts` — `createCheckoutSession()` (~line 337)

---

## Issue 2 — Tenant Sees All Three Audience Tabs

### Root cause

`PlanCompareModal.tsx` defines a hard-coded `TABS` array with all three audience tabs and renders all of them unconditionally:

```typescript
// src/components/billing/PlanCompareModal.tsx — lines ~319–323
const TABS: { id: Audience; label: string }[] = [
  { id: 'renters', label: 'Renters & Buyers' },
  { id: 'landlords', label: 'Landlords' },
  { id: 'agents', label: 'Agents' },
];
```

The modal is called from `DashboardSettings.tsx` **without a `defaultAudience` prop**:

```typescript
// src/components/dashboard/sections/DashboardSettings.tsx — line ~481
<PlanCompareModal
  open={showPlansModal}
  onClose={() => setShowPlansModal(false)}
  currentPlanId={plan as PlanId | null}
  billingStatus={{ hasStripeCustomer, status }}
  onUpgradeSuccess={refresh}
  // ← no defaultAudience, no role filter
/>
```

`inferAudience(currentPlanId)` is the fallback but it only sets the **active** tab, not which tabs are **visible**. A tenant on the free/explorer plan gets `inferAudience('explorer') = 'renters'` — so renters tab is selected, but all three tabs are still rendered. The user can click Landlords or Agents and see (and attempt to subscribe to) those plans.

The same issue exists in `LandlordPlanCompareModal.tsx` — its `TABS` array is identical and also shows all three tabs. A landlord could navigate to the Renters tab and subscribe to a renter plan.

### What `useAuth` provides

`AuthContext.tsx` exposes `userRole: 'tenant' | 'landlord' | 'agent' | null` (line ~321). This is already available to any component that calls `useAuth()`. The information is there — it just isn't being used to filter tabs.

### Call sites

```
src/components/dashboard/sections/DashboardSettings.tsx          — tenant-side settings
src/landlord_agent/src/components/LandlordAgentSettingsPage.tsx  — landlord/agent settings
```

Only two call sites. The tenant-side uses `PlanCompareModal`; the landlord/agent side uses `LandlordPlanCompareModal`.

### Recommended fix

**Option A (cleaner) — Role-driven tab filtering inside the modal:**

In `PlanCompareModal.tsx`, read `userRole` from `useAuth()` and derive `visibleTabs` from it. This keeps the logic in one place and the caller doesn't need to change:

```typescript
// src/components/billing/PlanCompareModal.tsx

import { useAuth } from '../../contexts/AuthContext';   // add import

const PlanCompareModal: React.FC<Props> = ({ ... }) => {
  const { userRole } = useAuth();

  // Derive which tabs this user may see
  const ALL_TABS: { id: Audience; label: string }[] = [
    { id: 'renters',   label: 'Renters & Buyers' },
    { id: 'landlords', label: 'Landlords' },
    { id: 'agents',    label: 'Agents' },
  ];

  const TABS = (() => {
    if (userRole === 'landlord') return ALL_TABS.filter(t => t.id === 'landlords');
    if (userRole === 'agent')    return ALL_TABS.filter(t => t.id === 'agents');
    // tenant, buyer, or null → renters tab only
    return ALL_TABS.filter(t => t.id === 'renters');
  })();

  // Also ensure the active audience tab is valid after role-filtering
  const [audience, setAudience] = useState<Audience>(
    defaultAudience ?? inferAudience(currentPlanId),
  );

  useEffect(() => {
    if (open) {
      const valid = TABS.find(t => t.id === audience);
      if (!valid) setAudience(TABS[0]?.id ?? 'renters');
      setUpgradeError(null);
    }
  }, [open, currentPlanId, defaultAudience]);
  ...
```

Apply the same pattern to `LandlordPlanCompareModal.tsx`.

**Option B — Pass `allowedAudiences` from the caller:**

Add an `allowedAudiences?: Audience[]` prop and filter `TABS` against it. The callers pass the allowed list based on user role. This is more explicit but requires updating both call sites.

Option A is cleaner because the role is already in context and there's no risk of a caller accidentally omitting the prop.

### Files to modify
- `src/components/billing/PlanCompareModal.tsx`
- `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

---

## Issue 3 — Staging Backend Health Check

### Results

**Health endpoint:**
```
GET https://proptii-v2-backend-staging-v3.onrender.com/api/health
→ {"status":"ok","timestamp":"2026-10-20T16:00:49.797Z","service":"proptii-v2-backend"}
```
Backend is healthy and responding.

**Plans endpoint:**
```
GET https://proptii-v2-backend-staging-v3.onrender.com/api/billing/plans
```

| Plan | Monthly price | Annual price (per month) |
|------|--------------|--------------------------|
| explorer | £0 | £0 |
| renter_pro | £12 | £8.25 |
| buyer_pro | £19 | £13.25 |
| starter | £29 | £20.75 |
| landlord_pro | £49 | £33.25 |
| elite | £99 | £66.58 |
| independent | £79 | £62.50 |
| agent_pro | £149 | £119.17 |
| enterprise | £0 | £0 |

### Analysis

Prices are being served, which is good. However, looking at the `getPlans()` code in `billing.service.ts`, live Stripe prices are only returned if Stripe products have a `metadata.proptii_plan_id` field matching the plan catalogue IDs (e.g., `renter_pro`, `buyer_pro`, etc.). Without that metadata, `priceMap` stays empty and the service falls back to the hardcoded `fallbackMonthlyPrice` / `fallbackAnnualPrice` values in `PLANS_CATALOGUE`.

The prices shown above match the fallback values exactly (e.g. renter_pro fallback = £12/mo, annual = £99 total → £8.25/mo = 99/12). This means **the staging backend is running on fallback prices, not pulling live prices from Stripe**.

To make live Stripe prices reflect in the app, each Stripe product must have `proptii_plan_id` set in its metadata to match the plan catalogue IDs listed above.

---

## Summary of Required Code Changes

### Priority 1 — Fix the Stripe tax error (users currently cannot pay)

**File:** `v2-backend/src/services/billing.service.ts`  
**Change:** Add `automatic_tax: { enabled: true }` to `createCheckoutSession()`

### Priority 2 — Fix tenant seeing wrong tabs

**Files:**
- `src/components/billing/PlanCompareModal.tsx`
- `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

**Change:** Read `userRole` from `useAuth()` and filter the `TABS` array so each role only sees its own plans.

### Priority 3 — Wire live Stripe pricing (optional, prices still display)

**No code change needed.** In the Stripe Dashboard, open each product in the Product Catalogue and add a metadata key `proptii_plan_id` with the value matching the plan ID (`renter_pro`, `buyer_pro`, `starter`, `landlord_pro`, `elite`, `independent`, `agent_pro`). Once set, the backend's `getPlans()` will pick up live prices automatically on the next 5-minute cache refresh.
