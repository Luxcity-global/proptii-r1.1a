# Billing seamless gaps — 6-gap closure across two modals and backend

This change closes six identified billing UX gaps across `PlanCompareModal.tsx`, `LandlordPlanCompareModal.tsx`, and the backend `billing.service.ts`. The core work redirects free users into the trial onboarding flow instead of sending them straight to Stripe checkout, adds an in-modal upgrade success screen, makes trialing users eligible for in-place upgrades, auto-creates a Stripe customer when the portal is requested without one, surfaces a cancel-subscription CTA in both modal footers, and fixes a subtitle string in the landlord modal. A follow-up convergence commit updated the settings pages to say "Manage plan" instead of "View plans".

Watch for: GAP 1 in `LandlordPlanCompareModal` uses `openInParentApp` for the trial redirect rather than `window.location.href` — this is correct for the iframe context but means the navigation goes through the parent-app bridge, which must handle that path. All other gaps are confirmed clean.

**Verdict**: APPROVED

---

## High-level view

GAP 1 is correctly split between the two execution contexts: `PlanCompareModal` uses `window.location.href` (main app) and `LandlordPlanCompareModal` uses `openInParentApp` (landlord iframe). Both call `setPricingFlow('trial')` before navigation and skip the old `createCheckoutSession` path entirely.

GAP 2's success screen is a full overlay returned early from both components before the main modal JSX is reached, preventing `onClose()` from firing immediately. The `upgradeSucceeded` state is reset in the `useEffect` that watches `open`, so a second opening of the modal starts clean.

GAP 3 expands `hasActiveSub` to include `status === 'trialing'` in both modals, and both include the trial info banner gated on that status. The trial path routes through the same `upgradeSubscription` call as active subscribers.

GAP 4 in the backend replaces the hard throw with a customer auto-create: `stripe.customers.create` is called with email and metadata, the new `customerId` is persisted to `subscriptions/{userId}` with `merge: true`, and then the portal session proceeds. The top-level Stripe guard is correctly split — one targeted guard inside the `!customerId` branch, another immediately before the `billingPortal.sessions.create` call — matching the defensive structuring described in the plan.

GAP 5 adds a "Cancel subscription" button to both modal footers, visible only when `status === 'active' || status === 'trialing'` and `hasStripeCustomer`. `PlanCompareModal` calls `cancelSubscription()` directly; `LandlordPlanCompareModal` opens the billing portal via `openInParentApp`. The `setCancelling(false)` reset is correctly omitted from the `LandlordPlanCompareModal` success path since `openInParentApp` causes navigation.

GAP 6 subtitle in `LandlordPlanCompareModal` reads "Compare plans and manage your subscription at any time." — confirmed.

---

<details>
<summary>Issues (0)</summary>

No blocking issues found. All 6 gaps are correctly implemented.

</details>

---

<details>
<summary>Details</summary>

## GAP 1 — Free-user trial redirect

Both modals correctly replace the old `markPendingStripeCheckout('pay_now')` + `createCheckoutSession` path. In `PlanCompareModal`, the free-user branch calls `setPricingFlow('trial')` then redirects via `window.location.href = \`/signup/welcome?plan=${plan.id}&cycle=${cycle}\`` with a `return` before any fallthrough. In `LandlordPlanCompareModal`, the same sequence uses `openInParentApp(\`/signup/welcome?plan=${plan.id}&cycle=${cycle}\`)`, which is correct for the iframe context.

`setPricingFlow` is imported from `../../utils/pricingRoutes` in both files. The redundant second `setPendingPlan` call in the free-user branch is wrapped in `try/catch` as specified, matching the pattern at the top of `handleUpgrade`.

## GAP 2 — In-modal upgrade success screen

Both modals add `const [upgradeSucceeded, setUpgradeSucceeded] = useState<string | null>(null)`. The in-place success path sets `setUpgradeSucceeded(plan.name)` and calls `onUpgradeSuccess?.()` without calling `onClose()`. The success screen is returned early (before the main modal `return`) when `upgradeSucceeded` is truthy — confirmed in both files. The "Done" button calls `onClose(); setUpgradeSucceeded(null)`. The `useEffect` watching `open` resets `upgradeSucceeded` to `null` alongside `upgradeError` in both modals.

## GAP 3 — Trialing users as active subscribers

`hasActiveSub` in both modals is `billingStatus?.hasStripeCustomer && (billingStatus?.status === 'active' || billingStatus?.status === 'trialing')` — confirmed. The trial info banner `<p>` is placed after the audience-tabs `border-b` div and before the plan-columns scroll container, gated on `billingStatus?.status === 'trialing'`, with inline hex styles matching the plan's colour conventions. Both modals carry identical banner JSX.

## GAP 4 — Backend portal auto-create

`createPortalSession` in `billing.service.ts` declares `let customerId: string | undefined = subSnap.data()?.stripeCustomerId`. The `!customerId` branch calls `this.stripe.customers.create({ email, metadata: { userId, source: 'portal_auto_create' } })`, assigns the result to `customerId`, and persists it with `db.collection('subscriptions').doc(userId).set({ stripeCustomerId, userId, email, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })`. A separate `if (!this.stripe)` guard precedes the `billingPortal.sessions.create` call. This matches the plan's defensive structuring note exactly.

## GAP 5 — Cancel subscription CTA

`PlanCompareModal` imports `cancelSubscription` from `../../services/billingService`. `handleCancel` calls `cancelSubscription()`, then `onUpgradeSuccess?.()` and `onClose()`, with errors caught into `setUpgradeError`. The `cancelling` state is reset in `finally`. The footer button is gated on `(billingStatus?.status === 'active' || billingStatus?.status === 'trialing') && billingStatus?.hasStripeCustomer`.

`LandlordPlanCompareModal` imports `createBillingPortalSession`. Its `handleCancel` calls `createBillingPortalSession()` and redirects via `openInParentApp(portalUrl)`. `setCancelling(false)` is only called in the catch branch — correct, since the parent-app navigation unmounts the component.

## GAP 6 — Subtitle fix

`LandlordPlanCompareModal` subtitle: "Compare plans and manage your subscription at any time." — confirmed in the JSX of the `<p className="text-xs">` element under the header. The old "upgrade at any time" text is gone.

## Off-limits files and package integrity

`src/config/plans.ts`, `src/services/roleService.ts`, and `src/utils/roleIntent.ts` show zero diff against the base. `package.json` and `v2-backend/package.json` are also unchanged — no new dependencies introduced.

## Convergence commit scope

The follow-up commit (`68ef7b7`) touched only `public/landlord/index.html`, `DashboardSettings.tsx`, and `LandlordAgentSettingsPage.tsx` — renaming "View plans" buttons to "Manage plan". It did not alter either modal or the backend service.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `src/components/billing/PlanCompareModal.tsx` | GAP 1–3, 5: trial redirect, success screen, trialing support, cancel CTA |
| `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx` | GAP 1–3, 5–6: same modal-side gaps + subtitle fix |
| `v2-backend/src/services/billing.service.ts` | GAP 4: portal auto-creates Stripe customer when missing |
| `src/components/dashboard/sections/DashboardSettings.tsx` | Convergence: "View plans" → "Manage plan" |
| `src/landlord_agent/src/components/LandlordAgentSettingsPage.tsx` | Convergence: same label rename |
| `public/landlord/index.html` | Convergence: minor HTML tweak |
| `.agents/tasks/task-billing-gaps/features/FEAT-001.json` | Task metadata updated |
| `.agents/tasks/task-billing-gaps/features/FEAT-002.json` | Task metadata updated |

Full diff: `git diff origin/feature/document-vault HEAD`

</details>
