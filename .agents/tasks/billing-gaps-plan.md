# Implementation Plan — Billing Seamless Gaps

Files to change:
- `src/components/billing/PlanCompareModal.tsx`
- `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`
- `v2-backend/src/services/billing.service.ts`

Off-limits (do not touch): `src/config/plans.ts`, `src/services/roleService.ts`, `src/utils/roleIntent.ts`
No new npm packages.

Verification commands:
- Frontend typecheck: `npm run typecheck` (from repo root)
- Backend build: `cd v2-backend && npm run build`
- Full build: `npm run build` (from repo root — builds landlord sub-app, then Vite, then validates)

---

## Current state (confirmed by code read)

| File | Relevant current state |
|------|----------------------|
| `PlanCompareModal.tsx` | Free-user branch calls `markPendingStripeCheckout('pay_now')` then `createCheckoutSession`. `hasActiveSub` only checks `status === 'active'`. No `upgradeSucceeded` state. No cancel CTA. Subtitle already says 'manage your subscription'. Button label already 'Select plan'. |
| `LandlordPlanCompareModal.tsx` | Free-user branch calls `markPendingStripeCheckout('pay_now')` then `createCheckoutSession` then `openInParentApp`. Same missing states. Subtitle says 'upgrade at any time' (needs fixing). Button label already 'Select plan'. |
| `billing.service.ts` | `createPortalSession` throws `BadRequestException('No Stripe customer found')` when `customerId` is absent. `upgradeSubscription` already handles `status === 'trialing'` in its own branch. |
| `DashboardSettings.tsx` | Already uses 'Manage plan' everywhere. No change needed. |
| `LandlordAgentSettingsPage.tsx` | Already uses 'Manage plan' everywhere. No change needed. |
| `pricingRoutes.ts` | Exports `setPricingFlow`, `markPendingStripeCheckout`. Both are available for import. |
| `billingService.ts` (frontend) | Exports `cancelSubscription`, `createBillingPortalSession`, `upgradeSubscription`, `setPendingPlan`, `createCheckoutSession`. All available. |

---

## Items

- [ ] 1. **GAP 1 — Free-user branch: navigate to welcome page instead of direct checkout** (BOTH modals)

  In `handleUpgrade()` in both files, replace the `// No active sub — new checkout` branch.

  **`PlanCompareModal.tsx`** — remove `markPendingStripeCheckout('pay_now')`, `trackEvent(...)`, and the `createCheckoutSession(...)` + redirect block. Replace with:
  ```tsx
  // GAP 1: free users get trial flow, not immediate payment
  try { await setPendingPlan(plan.id, cycle); } catch { /* best-effort — already called above */ }
  setPricingFlow('trial');
  window.location.href = `/signup/welcome?plan=${plan.id}&cycle=${cycle}`;
  return;
  ```
  Also add `setPricingFlow` to the import line for `markPendingStripeCheckout`:
  ```tsx
  import { markPendingStripeCheckout, setPricingFlow } from '../../utils/pricingRoutes';
  ```

  **`LandlordPlanCompareModal.tsx`** — same removal in its `No active sub` branch. Replace with:
  ```tsx
  try { await setPendingPlan(plan.id, cycle); } catch { /* best-effort */ }
  setPricingFlow('trial');
  openInParentApp(`/signup/welcome?plan=${plan.id}&cycle=${cycle}`);
  return;
  ```
  Add `setPricingFlow` to its pricingRoutes import.

  Note: the `setPendingPlan` call in the free-user branch is redundant (it was already called best-effort at the top of `handleUpgrade`) but is kept explicitly per spec. The second call is harmless; just wrap it in the same `try/catch` pattern already present at the top of the function.

  Files: `src/components/billing/PlanCompareModal.tsx`, `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

  Verify: `npm run typecheck` — no errors. Confirm the free-user path no longer imports a checkout URL; the redirect target is `/signup/welcome`.

---

- [ ] 2. **GAP 2 — Show in-modal success state after in-place upgrade** (BOTH modals)

  **State addition** — in both modals, add:
  ```tsx
  const [upgradeSucceeded, setUpgradeSucceeded] = useState<string | null>(null);
  ```

  **Reset on open** — inside the existing `useEffect` that watches `open` (the one calling `setUpgradeError(null)`), also add:
  ```tsx
  setUpgradeSucceeded(null);
  ```

  **In-place upgrade branch change** — in `handleUpgrade()`, in the `hasActiveSub` block, after `if (result.checkoutUrl) { … }`, change the in-place success from:
  ```tsx
  onUpgradeSuccess?.();
  onClose();
  ```
  to:
  ```tsx
  setUpgradeSucceeded(plan.name);
  onUpgradeSuccess?.();
  ```

  **Success screen** — immediately before the `return null` early-exit (`if (!open) return null;`), add:
  ```tsx
  if (upgradeSucceeded) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-10 gap-4"
          style={{ width: '100%', maxWidth: 420, fontFamily: 'Archivo, sans-serif' }}
        >
          <div className="text-5xl">✨</div>
          <h2 className="text-xl font-bold text-center" style={{ color: '#1a2332' }}>
            You&apos;re all set!
          </h2>
          <p className="text-sm text-center" style={{ color: '#374957' }}>
            Your plan has been upgraded to <strong>{upgradeSucceeded}</strong>.
          </p>
          <p className="text-xs text-center" style={{ color: '#9ca3af' }}>
            Your billing has been updated. Changes take effect immediately.
          </p>
          <button
            type="button"
            onClick={() => { onClose(); setUpgradeSucceeded(null); }}
            className="mt-2 px-6 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#136C9E', color: '#ffffff' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }
  ```

  Apply this pattern identically to both modals. In `LandlordPlanCompareModal` there is no `navigate` reference to keep, so the block is pure JSX.

  Files: `src/components/billing/PlanCompareModal.tsx`, `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

  Verify: `npm run typecheck` — no errors.

---

- [ ] 3. **GAP 3 — Trialing users can upgrade in-place + info banner** (BOTH modals)

  **`hasActiveSub` expansion** — in both modals, change:
  ```tsx
  const hasActiveSub =
    billingStatus?.hasStripeCustomer && billingStatus?.status === 'active';
  ```
  to:
  ```tsx
  const hasActiveSub =
    billingStatus?.hasStripeCustomer &&
    (billingStatus?.status === 'active' || billingStatus?.status === 'trialing');
  ```

  **Trial banner** — inside the modal JSX, after the audience tab `<div>` (the one with `border-b`) and before the plan-columns scrollable `<div>`, add:
  ```tsx
  {billingStatus?.status === 'trialing' && (
    <p
      className="text-xs px-4 py-2 mx-6 mt-3 rounded border"
      style={{
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        borderColor: '#bfdbfe',
      }}
    >
      You are on a free trial. Upgrading now will switch your trial to the new
      plan — no charge until your trial ends.
    </p>
  )}
  ```

  Note: the spec says `bg-blue-50 / text-blue-700 / border-blue-200` which are Tailwind classes — but both modals use inline styles throughout for colours, so inline hex equivalents (`#eff6ff`, `#1d4ed8`, `#bfdbfe`) are used for consistency. The Tailwind class names may also be used if the project's Tailwind config covers them; either approach works.

  Files: `src/components/billing/PlanCompareModal.tsx`, `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

  Verify: `npm run typecheck` — no errors.

---

- [ ] 4. **GAP 4 — Portal auto-creates Stripe customer when missing** (backend only)

  In `billing.service.ts`, locate `createPortalSession(userId, email)`. Replace the early-exit block:
  ```ts
  // BEFORE:
  const customerId = subSnap.data()?.stripeCustomerId;
  if (!customerId) {
    throw new BadRequestException('No Stripe customer found for this user');
  }
  ```
  with auto-create logic that re-uses the resolved `customerId` for the portal call:
  ```ts
  let customerId: string | undefined = subSnap.data()?.stripeCustomerId;
  if (!customerId) {
    if (!this.stripe) {
      throw new BadRequestException(
        'No billing account found. Please subscribe to a plan first.',
      );
    }
    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId, source: 'portal_auto_create' },
    });
    customerId = customer.id;
    await db
      .collection('subscriptions')
      .doc(userId)
      .set(
        {
          stripeCustomerId: customerId,
          userId,
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }
  ```
  The rest of the method (`this.stripe.billingPortal.sessions.create({ customer: customerId, … })`) stays unchanged.

  Note: `this.stripe` is already guarded at the top of the method with `if (!this.stripe) throw new BadRequestException('Stripe is not configured')` — after this change, the top-level guard must be removed (or kept but only checked after the `customerId` resolution), because a user with an existing `customerId` should still be able to open the portal even if Stripe were somehow uninitialised. The cleanest approach: keep the existing top-level Stripe guard **only for the portal session creation** step (the `billingPortal.sessions.create` call) and move the auto-create behind its own `if (!this.stripe)` guard as shown above. In practice, if Stripe is initialised at all, both guards fire together; this is defensive structuring.

  Files: `v2-backend/src/services/billing.service.ts`

  Verify: `cd v2-backend && npm run build` — NestJS compiles without errors.

---

- [ ] 5. **GAP 5 — Cancel subscription link in both plan modals**

  **`PlanCompareModal.tsx`**:

  1. Add `cancelSubscription` to the billingService import:
     ```tsx
     import {
       createCheckoutSession,
       setPendingPlan,
       upgradeSubscription,
       cancelSubscription,
     } from '../../services/billingService';
     ```

  2. Add cancelling state alongside the other state declarations:
     ```tsx
     const [cancelling, setCancelling] = useState(false);
     ```

  3. Add `handleCancel` function, just before the `TABS` constant:
     ```tsx
     const handleCancel = async () => {
       setCancelling(true);
       setUpgradeError(null);
       try {
         await cancelSubscription();
         onUpgradeSuccess?.();
         onClose();
       } catch (err) {
         setUpgradeError(err instanceof Error ? err.message : 'Cancellation failed.');
       } finally {
         setCancelling(false);
       }
     };
     ```

  4. In the footer `<div>` (the one with `px-6 py-4 border-t`), below the existing `<p>` that holds the "All plans include…" text, add:
     ```tsx
     {(billingStatus?.status === 'active' || billingStatus?.status === 'trialing') &&
       billingStatus?.hasStripeCustomer && (
         <p className="text-center mt-2">
           <button
             type="button"
             onClick={handleCancel}
             disabled={cancelling}
             className="text-xs underline"
             style={{
               color: '#6b7280',
               background: 'none',
               border: 'none',
               cursor: 'pointer',
             }}
           >
             {cancelling ? 'Cancelling…' : 'Cancel subscription'}
           </button>
         </p>
       )}
     ```

  **`LandlordPlanCompareModal.tsx`**:

  1. Add `createBillingPortalSession` to the billingService import:
     ```tsx
     import {
       createCheckoutSession,
       setPendingPlan,
       upgradeSubscription,
       createBillingPortalSession,
     } from '../../../services/billingService';
     ```

  2. Add `cancelling` state:
     ```tsx
     const [cancelling, setCancelling] = useState(false);
     ```

  3. Add `handleCancel` using portal redirect instead of direct cancel:
     ```tsx
     const handleCancel = async () => {
       setCancelling(true);
       setUpgradeError(null);
       try {
         const { portalUrl } = await createBillingPortalSession();
         openInParentApp(portalUrl);
       } catch (err) {
         setUpgradeError(err instanceof Error ? err.message : 'Could not open billing portal.');
         setCancelling(false);
       }
     };
     ```
     Note: `setCancelling(false)` is only called in the catch path. On success, `openInParentApp` navigates away so the component will unmount; resetting state is unnecessary.

  4. Same cancel CTA `<p>` block in the footer as above (identical JSX, same conditions).

  Files: `src/components/billing/PlanCompareModal.tsx`, `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

  Verify: `npm run typecheck` — no errors.

---

- [ ] 6. **GAP 6 — Fix LandlordPlanCompareModal subtitle text**

  In `LandlordPlanCompareModal.tsx`, find:
  ```tsx
  Compare plans and upgrade at any time.
  ```
  Change to:
  ```tsx
  Compare plans and manage your subscription at any time.
  ```

  Files: `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx`

  Verify: Visual inspection of the string. `npm run typecheck` — no errors.

---

- [ ] 7. **Final verification — full build passes**

  Run `npm run build` from the repo root. This compiles the landlord sub-app (`src/landlord_agent`), runs Vite for the main app, copies SPA fallbacks, and validates the build output. All steps must exit 0.

  Also run `cd v2-backend && npm run build` to confirm the backend NestJS compile is clean (catches the GAP 4 changes).

  Files: none (verification only)

  Verify: Both build commands exit 0 with no TypeScript errors.

---

## Dependency order

Items 1–3 and 5–6 all touch the same two modal files. They must be applied sequentially (each item leaves the file in a buildable state). Item 4 is independent (backend only) and can be done in any order relative to items 1–6. Item 7 is the final gate.

Recommended sequence: 6 → 1 → 3 → 2 → 5 → 4 → 7
(Start with the smallest text fix, then progress to the state/logic changes, finishing with the backend and final build.)

## Assumptions & notes

- `setPricingFlow` is already in `pricingRoutes.ts` as a named export. The only import change needed is adding it to the existing named import from that file.
- The duplicate `setPendingPlan` call in GAP 1 (once at the top of `handleUpgrade`, once in the free branch) is intentional per the spec. The second call is a no-op in practice since the first already ran, but the `try/catch` wrapper on both prevents any error propagation.
- GAP 4's auto-create writes to the `subscriptions` collection using `merge: true`, which is safe and idempotent.
- The `upgradeSucceeded` success screen (GAP 2) renders as a full overlay replacing the modal — this is achieved by returning the JSX before the main modal JSX is reached, not by conditionally rendering inside the panel, which keeps the success state clearly separated from the plan-compare state.
- In GAP 5 for `LandlordPlanCompareModal`, `setCancelling(false)` is intentionally omitted from the success path because `openInParentApp` causes a top-level navigation; the component won't stay mounted.
