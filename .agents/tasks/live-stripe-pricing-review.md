# Live Stripe pricing implementation — final re-review

All blocking issues from prior passes are resolved. The backend derives price IDs
exclusively from `STRIPE_PRICE_*` env vars, webhook handlers resolve users through
`subscription_data.metadata`, and the billing portal calls Stripe directly. Both upgrade
modals (`PlanCompareModal` and `LandlordPlanCompareModal`) now call `usePlans()` with
a local `filterByAudience` helper — the previous blocking concern about static prices in
the settings modals is gone. Prices shown to logged-in users at the upgrade decision
point now come from the same live Stripe data as the public pricing page.

**Watch for:** Nothing blocking remains. The only residual risk is the 5-minute in-memory
plan cache shared between the frontend hook and the backend service — if a price is
updated in Stripe, users may see the old value for up to 5 minutes. This is a deliberate
trade-off and acceptable in production.

**Verdict**: APPROVED

---

## High-level view

The end-to-end price flow is now fully live: the backend `GET /billing/plans` endpoint
fetches active prices from Stripe, merges them over the static catalogue, and caches the
result for 5 minutes. The frontend `usePlans` hook hits that endpoint and merges the live
data over the local `PLANS` fallback with the same 5-minute module-level cache. Both the
public `PricingPlanGrid` and the in-app upgrade modals consume `usePlans`, so all price
surfaces are consistent.

The checkout path is server-authoritative: `createCheckoutSession` resolves the Stripe
price ID from `STRIPE_PRICE_<PLAN>_<CYCLE>` env vars on the backend and rejects any
client-supplied price ID. The plan ID is validated against an explicit allowlist before
the Stripe API is called. The webhook handles `checkout.session.completed`,
`invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`,
and `customer.subscription.deleted`, all resolving the user via `sub.metadata.userId`
which is set on every checkout session's `subscription_data.metadata`.

The `upgradeSubscription` path (for users with an existing active Stripe subscription)
modifies the subscription item in place with `proration_behavior: 'create_prorations'`,
then updates Firestore. If no active subscription exists it falls back to a new checkout
session. `cancelSubscription` sets `cancel_at_period_end: true` without immediate
termination.

---

<details>
<summary>Issues (0)</summary>

No blocking or actionable concerns remain.

</details>

---

<details>
<summary>Details</summary>

### Previous finding resolved: live prices in upgrade modals

`PlanCompareModal` now imports `usePlans` and computes the visible plan list as:

```typescript
const { plans: allPlans } = usePlans();
// inside render:
const plans = filterByAudience(allPlans, audience);
```

`LandlordPlanCompareModal` applies the identical pattern. The `getPlansForAudienceTab`
import is absent from both files (confirmed). Prices displayed in the settings-modal
upgrade flow are now sourced from the same live Stripe data as the public pricing page.

### Price ID resolution and plan substitution prevention

`getPriceId` performs a single `process.env` lookup using a key constructed from
`planId` and `cycle`. Client requests supply only `planId` and `cycle`; the resulting
Stripe price ID is never client-controlled. The allowlist check
(`VALID_SELF_SERVICE_PLAN_IDS`) runs before `getPriceId`, so an arbitrary plan ID passed
by a client will be rejected before any Stripe API call is made — confirmed.

### Webhook idempotency

`handleWebhook` checks `processedStripeEvents/{eventId}` before dispatching and writes
the record after dispatch. `confirmCheckoutSession` applies the same
`processedStripeEvents/{sessionId}` guard with an early return on the cached result.
The `checkout.session.completed` webhook and the `confirm-checkout` poll therefore
cannot race to double-grant a subscription — confirmed.

</details>

---

<details>
<summary>File map</summary>

| File                                                             | What changed                                                                                                                                                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v2-backend/src/services/billing.service.ts`                     | Full Stripe pricing implementation: `getPriceId` from env vars, plan allowlist, `getPlans` with live Stripe fetch + cache, `upgradeSubscription`, `cancelSubscription`, webhook dispatch for 5 event types |
| `v2-backend/src/controllers/billing.controller.ts`               | `POST /billing/upgrade`, `POST /billing/cancel`, `POST /billing/downgrade` endpoints added                                                                                                                 |
| `src/hooks/usePlans.ts`                                          | Fetches `/billing/plans`, merges live prices over static `PLANS`, 5-minute module-level cache                                                                                                              |
| `src/hooks/usePlan.ts`                                           | Composes over `usePlans` to look up a single plan by ID                                                                                                                                                    |
| `src/services/billingService.ts`                                 | `upgradeSubscription`, `cancelSubscription`, `downgradeToFreePlan` frontend service functions added                                                                                                        |
| `src/components/pricing/PricingPlanGrid.tsx`                     | Uses `usePlans` + local `filterByAudience`                                                                                                                                                                 |
| `src/components/billing/PlanCompareModal.tsx`                    | Uses `usePlans` + local `filterByAudience`; `handleUpgrade` branches on `hasActiveSub` for in-place upgrade vs. new checkout                                                                               |
| `src/landlord_agent/src/components/LandlordPlanCompareModal.tsx` | Same `usePlans` pattern; uses `openInParentApp` for cross-frame navigation                                                                                                                                 |

</details>
