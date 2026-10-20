# Billing Seamless Audit
**Date:** 2025-07-09  
**Scope:** Full billing management flow — renter, landlord, agent dashboards  
**Mode:** Read-only investigation

---

## Executive Summary

The billing stack is largely functional: Stripe price IDs are all populated on staging, checkout flows route to real Stripe sessions, upgrade/cancel/portal paths are wired up, and webhooks handle lifecycle events. However, **six user-facing gaps** make the experience feel rough rather than seamless:

1. **FREE-user checkout skips the trial flow** — both modals call `createCheckoutSession(..., false)` (trialEnabled=false) for users without an active subscription, bypassing the `/signup/welcome` trial path and the 30-day trial Stripe offers.
2. **No in-place upgrade success feedback** — after a silent in-place upgrade the modal just closes with no toast, banner, or confirmation; the user has no idea if it worked.
3. **"Trialing" users are silently upgraded in-place** — `upgradeSubscription` on the backend treats `status='trialing'` the same as `status='active'`, performing an immediate Stripe subscription item swap. There is no grace-period extension, no "you're on trial, upgrading now will start billing" warning shown to the user.
4. **`createPortalSession` will fail for any user who signed up via OAuth but whose Stripe customer record is missing from Firestore** — returns `400 No Stripe customer found`. This breaks "Cancel plan", "Payment details", and "Manage billing" all at once.
5. **The `starter` plan annual price ID looks visually identical in env config** (`price_1USeE211liWU5SJST2EmftIF` monthly vs `price_1USeE211liWU5SJSkur4lCGd` annual) — confirmed distinct; no bug here, but easy to typo.
6. **Modal header copy inconsistency** — `PlanCompareModal` (renter side) says "Compare plans and manage your subscription at any time." `LandlordPlanCompareModal` (landlord/agent side) says "Compare plans and upgrade at any time." — the renter copy is better; landlord copy should match.

---

## Gap 1 — FREE-user checkout bypasses trial (HIGH impact)

### Evidence

**`src/components/billing/PlanCompareModal.tsx` → `handleUpgrade()`:**
```ts
// line ~295: branch when user has NO active subscription
const { checkoutUrl } = await createCheckoutSession(plan.id, cycle, false); // trialEnabled=false
```

**`src/landlord_agent/src/components/LandlordPlanCompareModal.tsx` → `handleUpgrade()`:**
```ts
// same pattern, line ~285
trial_enabled: false,
// ...
const { checkoutUrl } = await createCheckoutSession(plan.id, cycle, false);
```

The "free trial" promise is stated in the modal footer: *"All plans include a 1-month free trial."* But clicking "Select plan" as a free user sends them to a Stripe Checkout session with `trial_period_days` NOT set — they are asked for immediate payment.

The trial path does exist: `src/pages/signup/welcome.tsx` calls `createCheckoutSession(planId, cycle, true)` (trialEnabled=true), which triggers `subscription_data.trial_period_days: 30` in `v2-backend/src/services/billing.service.ts` (line ~`createCheckoutSession`). But neither modal routes through this page.

### Root cause

Both modals check:
```ts
const hasActiveSub = billingStatus?.hasStripeCustomer && billingStatus?.status === 'active';
```
Free users have `hasStripeCustomer=false` so they fall into the "No active sub — new checkout" branch, which hardcodes `trialEnabled: false`.

### Fix (do not implement here)
For free users, set `trialEnabled: true` or navigate to `/signup/welcome?plan=X&cycle=Y` (which sets `setPricingFlow('trial')` and calls checkout with trial). The `pay_now` branch should remain available via the "Rather commit now?" link already in welcome.tsx.

---

## Gap 2 — No success state after in-place upgrade (HIGH impact)

### Evidence

**`PlanCompareModal.tsx` → `handleUpgrade()` in-place branch:**
```ts
// result.checkoutUrl is absent → in-place upgrade succeeded
onUpgradeSuccess?.();
onClose();   // ← modal just closes, no user feedback
return;
```
**`LandlordPlanCompareModal.tsx`:** identical pattern.

`onUpgradeSuccess` in both settings pages calls `refresh()` on the billing hook. There is no toast, banner, or success message. The user sees the modal disappear and then the page silently re-fetches. It is unclear to users whether the upgrade happened.

### Fix (do not implement here)
Add a `upgradeSuccess` boolean state to each modal. After a successful in-place upgrade, instead of immediately closing show a brief success card ("You've been upgraded to X!") with a "Done" button, then call `onUpgradeSuccess()` and close. Alternatively, show a toast notification from the parent settings page.

---

## Gap 3 — Trialing users upgraded without warning (MEDIUM impact)

### Evidence

**`v2-backend/src/services/billing.service.ts` → `upgradeSubscription()`:**
```ts
if (stripeSubscriptionId && (status === 'active' || status === 'trialing')) {
  // immediately swaps the Stripe subscription item
  await this.stripe!.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: 'create_prorations',
  });
  return { upgraded: true };
}
```

**`PlanCompareModal.tsx` check:**
```ts
const hasActiveSub =
  billingStatus?.hasStripeCustomer && billingStatus?.status === 'active';
```
Only `status === 'active'` triggers the in-place path. A trialing user (`status='trialing'`) in the frontend has `hasActiveSub=false`, so they go through checkout instead. This mismatches the backend which handles 'trialing' as upgradeable.

**Result:** A user on a 30-day trial clicking "Select plan" on a higher tier gets sent to a NEW checkout session (via `createCheckoutSession(plan.id, cycle, false)`) rather than being upgraded in-place. Stripe will create a second subscription. The trial won't transfer.

### Fix (do not implement here)
Frontend: expand `hasActiveSub` to `status === 'active' || status === 'trialing'` so trialing users also go through the in-place `upgradeSubscription()` path. Show a brief "Upgrading will preserve your remaining trial days" message before confirming.

---

## Gap 4 — Portal session breaks for users without stripeCustomerId (HIGH impact)

### Evidence

**`v2-backend/src/services/billing.service.ts` → `createPortalSession()`:**
```ts
const subSnap = await db.collection('subscriptions').doc(userId).get();
const customerId = subSnap.data()?.stripeCustomerId;
if (!customerId) {
  throw new BadRequestException('No Stripe customer found for this user');
}
```

This kills the Stripe portal for:
- Users who started a free trial but abandoned before Stripe confirmed (Firestore has no `stripeCustomerId`)
- Users whose subscription confirmation webhook fired but Firestore write failed
- Users who were added via admin/complimentary access

This breaks the following UI paths simultaneously (all call `openPortal()`):
- **"Cancel plan"** (Plan section, settings page)
- **"Payment details"** (Billing section)
- **"Invoice history"** (Billing section)
- **"Manage billing → Open portal"** (Billing section)

The error is surfaced as a string below the button (`portalError` state in both settings components), which is correct, but the button group above it all becomes dead.

### Fix (do not implement here)
In the portal path, if `stripeCustomerId` is missing: create a Stripe customer first via `stripe.customers.create({ email, metadata: { userId } })`, persist the `stripeCustomerId` to Firestore, then proceed to create the portal session. This allows a soft fallback. Alternatively, surface a clearer user message: "No billing account found — please complete a checkout first."

---

## Gap 5 — No "Cancel plan" CTA inside the plan modal itself (LOW impact)

### Evidence

Neither `PlanCompareModal.tsx` nor `LandlordPlanCompareModal.tsx` contains a cancel/manage billing link inside the modal body. The only cancel path is the "Cancel plan" row in settings, which opens the Stripe portal.

The footer only shows:
```tsx
<p>All plans include a 1-month free trial. <a href="/pricing">Full pricing page →</a></p>
```
(`LandlordPlanCompareModal` uses `openInParentApp` instead of a direct href.)

Users who open the plan modal expecting to cancel have no option visible. They must close the modal and find the "Cancel plan" row.

### Fix (do not implement here)
Add a small "Cancel subscription" text-link in the modal footer, visible only when `billingStatus?.status === 'active' || === 'trialing'`. It should call `openPortal()` (or in the landlord modal, `openInParentApp(portalUrl)`).

---

## Gap 6 — Modal header copy inconsistency (LOW impact)

### Evidence

**`PlanCompareModal.tsx` subtitle (renter side):**
```tsx
<p className="text-xs">Compare plans and manage your subscription at any time.</p>
```

**`LandlordPlanCompareModal.tsx` subtitle (landlord/agent side):**
```tsx
<p className="text-xs">Compare plans and upgrade at any time.</p>
```

Both modal h2 headers say: `"Get more out of Proptii as you grow"` — neither says "Upgrade" or "Manage plan".

The user request specified: *"make it manage plan instead of upgrade"*. The renter modal subtitle already does this. The landlord/agent modal still says "upgrade".

### Fix (do not implement here)
In `LandlordPlanCompareModal.tsx`, change the subtitle to: `"Compare plans and manage your subscription at any time."` to match the renter modal.

---

## DashboardSettings.tsx — Billing Section Answers

| Question | Answer |
|---|---|
| "Manage plan" button opens PlanCompareModal? | ✅ Yes — `setShowPlansModal(true)` on both free and paid rows (line ~282–310) |
| "Manage billing" row opens Stripe portal? | ✅ Yes — `openPortal()` → `createBillingPortalSession()` → `window.location.href = portalUrl` |
| Cancel plan flow visible? | ✅ Yes — "Cancel plan" row visible when `hasStripeCustomer && !isFreePlan`, opens portal |
| FREE user "Manage plan" button opens plan modal? | ✅ Yes — isFreePlan branch has its own "Manage plan" button |
| billingStatus passed to modal? | ✅ `billingStatus={{ hasStripeCustomer, status }}` |
| onUpgradeSuccess passed? | ✅ `onUpgradeSuccess={refresh}` |
| Portal URL is real Stripe URL? | ✅ Backend calls `stripe.billingPortal.sessions.create()` — returns `https://billing.stripe.com/...` |
| Modal opens with trial-enabled plans? | ❌ No — trialEnabled hardcoded to false (Gap 1) |

---

## LandlordAgentSettingsPage.tsx — Billing Section Answers

| Question | Answer |
|---|---|
| "Manage plan" button opens LandlordPlanCompareModal? | ✅ Yes — both free and paid rows call `setShowPlansModal(true)` |
| Portal integration wired? | ✅ Yes — `openPortal()` uses `openInParentApp(portalUrl)` (correct for iframe context) |
| Cancel plan flow? | ✅ Yes — "Cancel plan" row opens portal via `openInParentApp` |
| fit checks usage shown? | ✅ Yes — `fitChecksUsed / fitChecksQuota` shown when quota != null |
| defaultAudience passed correctly? | ✅ `pricingSegment` derived from `userRole` — agent → 'agents', else → 'landlords' |
| Role tab isolation working? | ✅ Both modals filter TABS based on `user?.roles?.[0]` — landlords see only Landlords tab, agents see only Agents tab |

---

## billing.service.ts (backend) — Key Findings

| Question | Answer |
|---|---|
| `createCheckoutSession` handles `trialEnabled=true`? | ✅ Yes — sets `trial_period_days: 30` on `subscription_data` when `dto.trialEnabled` is true |
| `upgradeSubscription` handles `status='trialing'`? | ⚠️ Technically yes (treats as upgradeable) but frontend never calls it for trialing users (Gap 3) |
| `createPortalSession` works without stripeCustomerId? | ❌ No — throws 400 (Gap 4) |
| Webhook updates Firestore on plan changes? | ✅ Yes — `customer.subscription.updated`, `checkout.session.completed`, `invoice.payment_succeeded/failed`, `customer.subscription.deleted` all handled |
| Price IDs come from server env vars only? | ✅ Yes — `getPriceId()` reads `STRIPE_PRICE_*` env vars; client cannot override |

---

## signup/welcome.tsx — Trial Flow

| Question | Answer |
|---|---|
| Calls `createCheckoutSession` with `trialEnabled=true`? | ✅ Yes — line 86: `createCheckoutSession(planId, cycle, true)` |
| Where does user land after trial starts? | Stripe Checkout → `/billing/confirmed?session_id=...` → confirmation page |
| "Skip trial / pay now" option? | ✅ Yes — "Rather commit now? Pay today and skip the trial →" button at bottom, calls `setPricingFlow('pay_now')` and navigates to `/signup/pay-now` |
| Flow guard (prevents re-triggering)? | ✅ `getPricingFlow() !== 'trial'` early-returns; `checkoutStarted.current` ref prevents double fire |

---

## Staging Smoke Test Results

```
explorer       | monthly: None              | annual: None              ← Free plan, expected
renter_pro     | monthly: price_1USdye11... | annual: price_1USe0611... ✅
buyer_pro      | monthly: price_1USe8n11... | annual: price_1USeAB11... ✅
starter        | monthly: price_1USeE211... | annual: price_1USeE211... ✅ (distinct IDs, similar prefix)
landlord_pro   | monthly: price_1USeFL11... | annual: price_1USeGA11... ✅
elite          | monthly: price_1USeGx11... | annual: price_1USeHL11... ✅
independent    | monthly: price_1USeI811... | annual: price_1USeIR11... ✅
agent_pro      | monthly: price_1USeJA11... | annual: price_1USeJa11... ✅
enterprise     | monthly: None              | annual: None              ← Contact sales, expected
```

**All paid plan price IDs are populated.** No missing IDs for self-service plans. Staging is live and returning real Stripe price IDs from the backend environment variables.

---

## Prioritised Fix List

| Priority | Gap | User Impact |
|---|---|---|
| 🔴 HIGH | Gap 1: Free users bypass trial — pay immediately instead of 30-day trial | Breaks the key conversion mechanic; users hit unexpected payment wall |
| 🔴 HIGH | Gap 4: Portal 400 for users without stripeCustomerId | Blocks cancel, payment update, invoice access for affected users |
| 🟡 MED | Gap 3: Trialing users sent to new checkout instead of in-place upgrade | Creates duplicate subscriptions for trialing users who want to upgrade |
| 🟡 MED | Gap 2: No success feedback after in-place upgrade | Confusing UX — user doesn't know if upgrade worked |
| 🟢 LOW | Gap 5: No cancel CTA inside the plan modal | Minor friction — cancel is reachable via settings but not surfaced in modal |
| 🟢 LOW | Gap 6: Landlord modal subtitle says "upgrade" not "manage" | Copy inconsistency only |

---

## Appendix — Files Audited

| File | Role |
|---|---|
| `src/components/billing/PlanCompareModal.tsx` | Renter/buyer plan management modal |
| `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx` | Landlord/agent plan management modal |
| `src/components/dashboard/sections/DashboardSettings.tsx` | Renter settings page, billing section |
| `src/landlord_agent/src/components/LandlordAgentSettingsPage.tsx` | Landlord/agent settings page |
| `v2-backend/src/services/billing.service.ts` | NestJS billing service (checkout, upgrade, portal, webhooks) |
| `src/pages/signup/welcome.tsx` | Free trial onboarding page |
| `src/services/billingService.ts` | Frontend API client (all billing calls) |
