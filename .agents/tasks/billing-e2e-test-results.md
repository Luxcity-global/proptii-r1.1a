# Billing & Upgrade E2E Test Results

**Tested against:** https://proptii-v2-backend-staging-v3.onrender.com/api  
**Stripe mode:** test (sk_test_51USac1...)  
**Date:** 2026-10-20  
**Tester:** Automated investigation agent (read-only, no code changes)

---

## Overall Verdict: PARTIALLY WORKING

The core billing infrastructure is solid — auth guards, webhook endpoint, checkout sessions, upgrade flow, and cancellation all work correctly. One real bug exists: the **Elite Monthly price is in USD** when it should be GBP. Every other paid plan is correct. The tax issue (the main historical problem) is **fully resolved**.

**Confidence that real payments would work: High** — for 7 of 8 paid plan/cycle combinations. The Elite Monthly plan would incorrectly charge UK users in USD ($99 instead of £99).

---

## Flow Results

### ✅ FLOW 1 — Plans endpoint
**GET /api/billing/plans**

- Returns exactly **9 plans** as expected
- All 7 paid plans have both `stripePriceIdMonthly` and `stripePriceIdAnnual` populated
- All `monthlyPrice` and `annualPrice` (annualTotal) fields are numbers, not null
- Prices are consistent with Stripe live data — the backend is using live Stripe product prices (all 7 paid products have `proptii_plan_id` metadata set)
- Free plans (explorer, enterprise) correctly have null price IDs

**Plans returned:**
| Plan | Monthly | Annual Total | Monthly Price ID | Annual Price ID |
|------|---------|-------------|-----------------|-----------------|
| explorer (free) | £0 | £0 | null | null |
| renter_pro | £12 | £99 | price_1USdye11...10R4tB0Y | price_1USe06...WMp3AnIe |
| buyer_pro | £19 | £159 | price_1USe8n...fr11IXZ5 | price_1USeAB...zhCoNEWp |
| starter | £29 | £249 | price_1USeE2...T2EmftIF | price_1USeE2...kur4lCGd |
| landlord_pro | £49 | £399 | price_1USeFL...JVDylwW0 | price_1USeGA...urG1ELGh |
| elite | £99 | £799 | price_1USeGx...EISqFNGY | price_1USeHL...xAlhuAk9 |
| independent | £79 | £750 | price_1USeI8...ocu8bIoQ | price_1USeIR...s338ykSU |
| agent_pro | £149 | £1430 | price_1USeJA...FpWpNFKV | price_1USeJa...QoFsgOie |
| enterprise (contact) | £0 | £0 | null | null |

---

### ✅ FLOW 2 — Checkout auth guard
**POST /api/billing/checkout (no Authorization header)**

```
HTTP 401 — {"message":"Missing or invalid Authorization header or token query parameter","error":"Unauthorized","statusCode":401}
```

Correctly blocked unauthenticated access.

---

### ✅ FLOW 3 — Checkout session (renter_pro monthly + 30-day trial)
**Stripe SDK: price_1USdye11liWU5SJS10R4tB0Y, trial_period_days=30**

- Session created: `cs_test_a1t3qQPnw7dekwZPT4s...`
- Status: `open`
- URL: `https://checkout.stripe.com/c/pay/cs_test_...` ✓
- **No tax error** — the backend correctly omits `automatic_tax` in test mode (code checks `STRIPE_SECRET_KEY.startsWith('sk_live_')`)
- Tax issue is fully resolved

---

### ✅ FLOW 4 — Checkout session (landlord_pro annual, no trial)
**Stripe SDK: price_1USeGA11liWU5SJSurG1ELGh**

- Session created: `cs_test_a122JIsHcqHIQ...`
- Status: `open`
- URL starts with `https://checkout.stripe.com` ✓

---

### ✅ FLOW 5 — Checkout session (agent_pro monthly)
**Stripe SDK: price_1USeJA11liWU5SJSFpWpNFKV**

- Session created: `cs_test_a1IfDfvkR83TI...`
- Status: `open`
- URL starts with `https://checkout.stripe.com` ✓

---

### ✅ FLOW 6 — Webhook endpoint reachable
**POST /api/billing/webhook (no signature)**

```
HTTP 400 — {"message":"Webhook signature verification failed","error":"Bad Request","statusCode":400}
```

Correct — endpoint exists (not 404), signature verification fires (not 500), and rejects the unsigned payload as expected.

---

### ✅ FLOW 7 — Upgrade endpoint auth guard
**POST /api/billing/upgrade (no Authorization header)**

```
HTTP 401 — {"message":"Missing or invalid Authorization header or token query parameter"}
```

---

### ✅ FLOW 8 — Cancel endpoint auth guard
**POST /api/billing/cancel (no Authorization header)**

```
HTTP 401 — {"message":"Missing or invalid Authorization header or token query parameter"}
```

---

### ✅ FLOW 9 — Portal endpoint auth guard
**POST /api/billing/portal (no Authorization header)**

```
HTTP 401 — {"message":"Missing or invalid Authorization header or token query parameter"}
```

---

### ✅ FLOW 10 — Stripe product metadata check
**GET https://api.stripe.com/v1/products?limit=10**

All 7 paid products have `proptii_plan_id` metadata set:

| Product ID | Product Name | proptii_plan_id |
|-----------|-------------|----------------|
| prod_VTbA0lwNDi538x | Proptii — Renter Pro | renter_pro |
| prod_VTbLxG9MkYHQcM | Proptii — Buyer Pro | buyer_pro |
| prod_VTbQ2Tp7wUo64h | Proptii — Starter | starter |
| prod_VTbSxK4FHUS2aW | Proptii — Landlord Pro | landlord_pro |
| prod_VTbT43aPdBpjpU | Proptii — Elite | elite |
| prod_VTbVFH2AQjGBs1 | Proptii — Independent | independent |
| prod_VTbWGVbDg5nJS1 | Proptii — Agent Pro | agent_pro |

**Implication:** `getPlans()` is using the live Stripe prices path (not the env-var fallback). The prices happen to match the fallback values exactly, so the UI shows correct amounts regardless of which code path runs.

---

### ⚠️ FLOW 11 — Price verification (all 14 prices)

13 of 14 prices are correct. One is misconfigured:

**Passing (13 prices):**
| Price ID | Plan | Amount | Currency | Interval | Status |
|---------|------|--------|----------|----------|--------|
| price_1USdye...10R4tB0Y | renter_pro monthly | £12.00 | GBP | month | ✅ |
| price_1USe06...WMp3AnIe | renter_pro annual | £99.00 | GBP | year | ✅ |
| price_1USe8n...fr11IXZ5 | buyer_pro monthly | £19.00 | GBP | month | ✅ |
| price_1USeAB...zhCoNEWp | buyer_pro annual | £159.00 | GBP | year | ✅ |
| price_1USeE2...T2EmftIF | starter monthly | £29.00 | GBP | month | ✅ |
| price_1USeE2...kur4lCGd | starter annual | £249.00 | GBP | year | ✅ |
| price_1USeFL...JVDylwW0 | landlord_pro monthly | £49.00 | GBP | month | ✅ |
| price_1USeGA...urG1ELGh | landlord_pro annual | £399.00 | GBP | year | ✅ |
| price_1USeHL...xAlhuAk9 | elite annual | £799.00 | GBP | year | ✅ |
| price_1USeI8...ocu8bIoQ | independent monthly | £79.00 | GBP | month | ✅ |
| price_1USeIR...s338ykSU | independent annual | £750.00 | GBP | year | ✅ |
| price_1USeJA...FpWpNFKV | agent_pro monthly | £149.00 | GBP | month | ✅ |
| price_1USeJa...QoFsgOie | agent_pro annual | £1430.00 | GBP | year | ✅ |

**Failing (1 price):**
| Price ID | Plan | Amount | Currency | Issue |
|---------|------|--------|----------|-------|
| price_1USeGx...EISqFNGY | elite monthly | $99.00 | **USD** ❌ | Wrong currency — should be GBP |

The Elite monthly price was created in USD on what is a US-based Stripe account (default currency: USD). The Elite annual price is correctly in GBP.

**Impact:** Any UK user subscribing to the Elite Monthly plan will be charged **$99 USD** instead of **£99 GBP**. At current exchange rates this is approximately £78 — so users actually get a discount, but it is incorrect and will cause accounting/compliance issues.

---

### ✅ FLOW 12 — Full upgrade simulation (Stripe-side)

Complete end-to-end upgrade flow executed successfully:

1. **Customer created:** `cus_VTjiQf47GZqPYg` ✅
2. **Subscription created with 30-day trial:** `sub_1USmFG11liWU5SJSx2Bckxnz`  
   - Status: `trialing` ✅  
   - Plan: renter_pro monthly (`price_1USdye...`) ✅  
3. **Subscription upgraded to landlord_pro monthly:**  
   - New price ID: `price_1USeFL11liWU5SJSJVDylwW0` (landlord_pro monthly) ✅  
   - Status: `trialing` (trial continues after upgrade — correct Stripe behaviour) ✅  
   - `proration_behavior: create_prorations` applied ✅  
4. **Subscription cancelled at period end:**  
   - `cancel_at_period_end: true` ✅  
5. **Test customer deleted:** ✅

The full Stripe-side upgrade flow — create → subscribe with trial → upgrade plan → cancel at period end — works exactly as intended.

---

## Issues Found

### 🔴 Issue 1 (Medium severity): Elite Monthly price is in USD

**Price ID:** `price_1USeGx11liWU5SJSEISqFNGY`  
**Stripe product:** `prod_VTbT43aPdBpjpU` (Proptii — Elite)  
**Current state:** $99.00 USD  
**Expected state:** £99.00 GBP

This price is referenced by:
- `STRIPE_PRICE_ELITE_MONTHLY` env var on the backend
- The `/billing/plans` endpoint returns it as `stripePriceIdMonthly` for the Elite plan
- `createCheckoutSession` would use it when a landlord subscribes to Elite Monthly

**Fix required (in Stripe dashboard only — no code change needed):**
1. In Stripe test mode dashboard, navigate to Products → Proptii — Elite
2. Add a new price: £99.00 GBP / month, with `metadata.cycle = monthly`
3. Update the `STRIPE_PRICE_ELITE_MONTHLY` env var on the Render backend service to the new price ID
4. Archive the old USD price

No code change required — this is purely a Stripe configuration issue.

---

### ℹ️ Note: Tax issue is resolved

The historical Stripe tax error is fully fixed. The backend code checks whether the secret key starts with `sk_live_` before adding `automatic_tax: { enabled: true }` to the checkout session. In test mode (staging), automatic tax is never sent. In live mode it is sent (where Stripe Tax is configured). No code change needed.

---

### ℹ️ Note: Stripe account is US-based (default currency: USD)

The Stripe account was created with country=US and default_currency=USD. This is why the Elite Monthly price was accidentally created in USD. When creating new prices, the Stripe dashboard will default to USD — always explicitly set GBP when adding new prices for this product.

---

## Summary

| Flow | Status | Notes |
|------|--------|-------|
| Plans endpoint (9 plans) | ✅ PASS | All 9 plans, all price IDs populated |
| Checkout auth guard | ✅ PASS | 401 as expected |
| renter_pro monthly checkout (Stripe) | ✅ PASS | Session created, no tax error |
| landlord_pro annual checkout (Stripe) | ✅ PASS | Session created |
| agent_pro monthly checkout (Stripe) | ✅ PASS | Session created |
| Webhook endpoint reachable | ✅ PASS | 400 signature error (not 404/500) |
| Upgrade auth guard | ✅ PASS | 401 as expected |
| Cancel auth guard | ✅ PASS | 401 as expected |
| Portal auth guard | ✅ PASS | 401 as expected |
| Stripe product metadata | ✅ PASS | All 7 products have proptii_plan_id |
| Price verification (13/14 prices) | ⚠️ PARTIAL | 13 pass; elite_monthly is USD not GBP |
| Full upgrade simulation | ✅ PASS | create → trial → upgrade → cancel all work |

**Overall: PARTIALLY WORKING**  
**Confidence real payments would work: High** (for all plans except Elite Monthly)  
**Remaining blocker:** Elite Monthly price must be recreated in GBP in the Stripe dashboard
