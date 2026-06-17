# Pricing, Onboarding & User Flows

**Status:** Product rules (codified from leadership review, June 2026)  
**Purpose:** Define how pricing appears and how users move through signup for the **demand side** (tenants, renters, buyers) and the **supply side** (landlords, estate agents).  
**Scope:** Documentation only — this file does not change application behaviour.

---

## 1. Summary

Proptii serves two distinct audiences with different pricing logic:

| Side | Who | Primary model | Why |
|------|-----|---------------|-----|
| **Demand** | Tenants, renters, buyers | **Free to search; pay when you need more** | Users arrive when they have a housing need. Core discovery must stay free to maximise platform volume. |
| **Supply** | Landlords, estate agents | **1-month free trial, then paid** | These users rely on Proptii day-to-day. A full free month lets them experience the complete product before committing. |

The **pricing page** (`/pricing`) is the shared entry point. Users choose *who they are* (renter/buyer, landlord, or agent), pick a plan, and enter the appropriate onboarding flow.

---

## 2. Entry point: the pricing page

### 2.1 Role selection

The pricing page presents three audience tabs:

1. **Renters & buyers** — demand-side plans  
2. **Landlords** — supply-side landlord plans  
3. **Estate agents** — supply-side agent plans  

URL deep-linking is supported via `?segment=renters`, `?segment=landlords`, or `?segment=agents`.

### 2.2 What happens after plan selection

| User action | Next step |
|-------------|-----------|
| **Explorer (free)** — “Get started free” | Create account → consumer dashboard → tenant/buyer onboarding options |
| **Paid plan** — “Start free trial” | Signup modal → account creation → trial welcome → dashboard (consumer or landlord, depending on plan) |
| **Paid plan** — “Pay now & skip the trial” | Signup → Stripe checkout (immediate payment) → billing confirmed → dashboard |
| **Enterprise** — “Contact us” | Sales enquiry (mailto) |

This ensures we never miss the opportunity to capture intent: every path from pricing leads into signup and onboarding, not a dead end.

---

## 3. Demand side — tenants, renters & buyers

### 3.1 Product philosophy

Demand-side users typically **come when they need Proptii** — searching for a home, applying for a tenancy, or progressing a purchase. They are not using the platform every day in the same way a landlord or agent does.

Therefore:

- **Core property search stays free forever** (Explorer plan).
- Paid tiers (Renter Pro, Buyer Pro) unlock tools for an *active* move — referencing, contracts, AI fit scoring, unlimited saves, and buyer-specific journey features.
- A **1-month free trial on paid plans** is available as a promotional offer, but it is **not the primary conversion lever** for demand-side users. The main hook is “start free, upgrade when it makes sense.”

### 3.2 Plans shown on pricing (Renters & buyers tab)

| Plan | Price (from) | Audience | Summary |
|------|--------------|----------|---------|
| **Explorer** | Free | Renters & buyers | Property search, save up to 5 properties, basic viewing requests |
| **Renter Pro** | £12/mo (£10/mo annual) | Renters | Unlimited saves, AI fit score, priority viewings, referencing toolkit, contracts, 5 GB storage |
| **Buyer Pro** | £19/mo (£16/mo annual) | Buyers | Everything in Renter Pro plus mortgage readiness, solicitor recommendations, survey tracker, buyer timeline, 20 GB storage, priority support |

Annual billing shows the equivalent monthly rate with a stated annual saving.

### 3.3 How pricing appears to demand-side users

**Before signup**

- Explorer is positioned as the default: no card required, immediate access to search.
- Paid cards show monthly/annual pricing, feature lists, and optional “First month free · cancel anytime” when the early-access promo is active.
- Users can skip the trial and pay immediately if they prefer.

**After signup (Explorer / free)**

- User lands on the **consumer dashboard**.
- **Tenant onboarding options** guide next steps: search properties, start referencing, or explore contracts — depending on whether they are renting or buying.
- No subscription badge or trial countdown unless they later upgrade to a paid plan.

**After signup (Renter Pro / Buyer Pro — trial path)**

- User sees a welcome screen: full access begins today; reminder around day 27; decision at day 30.
- Dashboard shows plan status (e.g. “Free trial”) and trial end date in settings.
- At trial end: add payment method to continue on the chosen plan, or downgrade to Explorer (free).

**After signup (Renter Pro / Buyer Pro — pay now path)**

- Stripe checkout collects payment immediately.
- User arrives on billing confirmed with an active paid subscription.

### 3.4 Feature gating (demand side)

| Feature area | Explorer (free) | Renter Pro / Buyer Pro |
|--------------|-----------------|------------------------|
| Property search | ✓ | ✓ |
| Save properties | Up to 5 | Unlimited |
| AI fit score | ✗ | ✓ |
| Referencing toolkit | ✗ | ✓ |
| Digital contracts | ✗ | ✓ |
| Buyer-specific tools | ✗ | ✓ (Buyer Pro) |

Gating is enforced in the UI (upgrade prompts) and at the API layer for protected endpoints.

### 3.5 Demand-side user journey (diagram)

```
Landing / marketing
        │
        ▼
   /pricing  ──►  Tab: "Renters & buyers"
        │
        ├──► Explorer ──► Create account ──► Dashboard ──► Tenant onboarding
        │
        └──► Renter Pro / Buyer Pro
                    │
                    ├──► Start free trial ──► Signup ──► Welcome ──► Dashboard (trialing)
                    │                                              │
                    │                                              └──► Day 30: pay or downgrade to Explorer
                    │
                    └──► Pay now ──► Stripe checkout ──► Dashboard (active)
```

---

## 4. Supply side — landlords & estate agents

### 4.1 Product philosophy

Landlords and agents **do their job on Proptii every day** — managing properties, tenants, viewings, referencing, and contracts. For them, a time-limited trial with **full product access** is the right offer:

- **Give them everything the plan includes for one month.**
- **Do not** throttle with artificial consumption caps during the trial (e.g. “only 2 properties” or “5 fit checks”).
- After 30 days, access is **closed down** unless they subscribe — unlike demand-side users who retain free search on Explorer.

This trial is vital for supply-side conversion because daily workflow dependency makes the product sticky once they have onboarded properties and tenants.

### 4.2 Plans shown on pricing

**Landlords tab**

| Plan | Price (from) | Summary |
|------|--------------|---------|
| **Starter** | £29/mo (£24/mo annual) | Up to 2 properties, basic referencing, digital contracts, viewing management |
| **Landlord Pro** | £49/mo (£40/mo annual) | More properties, compliance, maintenance, financial dashboard (most popular) |
| **Elite** | £99/mo (£80/mo annual) | Unlimited properties, dedicated account manager, API access |

**Estate agents tab**

| Plan | Price (from) | Summary |
|------|--------------|---------|
| **Independent** | £79/mo (£64/mo annual) | Up to 50 listings, 20 fit checks/month |
| **Agent Pro** | £149/mo (£120/mo annual) | Unlimited listings, 100 fit checks/month, team seats, analytics (recommended) |
| **Enterprise** | Custom | Volume pricing, custom integrations, SLA — contact sales |

> **Note on agent fit-check quotas:** Monthly fit-check limits apply to **paid subscriptions** as part of the plan allowance (with per-check overage above quota). They are **not** used to restrict the free trial — during the trial, the user gets the full plan feature set.

### 4.3 How pricing appears to supply-side users

**Before signup**

- All paid landlord/agent cards show pricing, full feature lists, and “First month free · cancel anytime.”
- Copy emphasises operational value: applications, viewings, referencing, contracts in one place.
- Optional “Pay now & skip the trial” for users ready to commit immediately.

**Trial rules (supply side — canonical)**

| Rule | Detail |
|------|--------|
| **Duration** | 30 calendar days from trial start |
| **Access level** | **Full plan features** — same as a paying subscriber on the selected tier |
| **Payment method** | Not required at signup for the trial path (Path A) |
| **Reminders** | Email ~3 days before trial ends; in-app banner when `trial_ending_soon` |
| **End of trial** | User must add payment and continue, or lose paid features / access to supply-side tools |
| **Cancellation during trial** | User can cancel before day 30 and pay nothing |

**After signup (trial path)**

1. User selects plan on `/pricing` (landlord or agent tab).  
2. Signup modal → account creation.  
3. Welcome screen confirms trial start; Stripe subscription created with 30-day trial (when promo flag is active).  
4. User enters **landlord/agent dashboard** (`/landlord`).  
5. **Landlord onboarding options** prompt: add a property, add a tenant, or send contracts.  
6. Plan badge in header/settings shows trial status and end date.

**After signup (pay now path)**

- Immediate Stripe checkout with payment.
- Full access from day one with an active (non-trial) subscription.

**After trial expires without payment**

- Paid features are gated (upgrade wall, API rejection for protected actions).
- User is prompted to subscribe or contact support; data is retained according to retention policy.

### 4.4 Supply-side user journey (diagram)

```
Landing / marketing / viral loop (e.g. viewing request from tenant)
        │
        ▼
   /pricing  ──►  Tab: "Landlords" or "Estate agents"
        │
        └──► Choose paid plan (Starter / Landlord Pro / Elite / Independent / Agent Pro)
                    │
                    ├──► Start free trial (Path A)
                    │         │
                    │         ▼
                    │    Signup ──► Welcome ("Your free month has started")
                    │         │
                    │         ▼
                    │    Landlord dashboard ──► Landlord onboarding (add property / tenant / contracts)
                    │         │
                    │         ├──► Days 1–30: FULL plan access
                    │         │
                    │         └──► Day 30: pay to continue OR lose paid access
                    │
                    └──► Pay now (Path B) ──► Stripe checkout ──► Dashboard (active)
```

---

## 5. Shared mechanics

### 5.1 Billing cycles

Users choose **monthly** or **annual** billing on the pricing page. Annual plans show an equivalent monthly rate and a stated saving.

### 5.2 Two checkout paths

| Path | `trialEnabled` | Behaviour |
|------|----------------|-----------|
| **A — Free trial** | `true` | 30-day Stripe trial when `PROMO_FREE_MONTH_ACTIVE=true`; no charge until trial ends |
| **B — Pay now** | `false` | Immediate payment via Stripe Checkout |

### 5.3 Dashboards and billing profiles

Proptii maintains **separate billing dashboards** per user where needed:

| Dashboard | Serves | Plans |
|-----------|--------|-------|
| **Consumer** | Renters, buyers | Explorer, Renter Pro, Buyer Pro |
| **Landlord** | Landlords, agents | Starter, Landlord Pro, Elite, Independent, Agent Pro, Enterprise |

A user could theoretically hold both a consumer and a landlord subscription; each is tracked independently.

### 5.4 Early-access promotion (May–July 2026)

When the early-access promo is active:

- Banner on `/pricing`: “Your first month, on us.”
- Applies to **first-time subscribers** on any paid plan.
- Available on both monthly and annual billing.
- Signup deadline communicated in UI (e.g. before 31 July 2026).

### 5.5 Subscription states

| Status | Meaning | Access |
|--------|---------|--------|
| `trialing` | Within free trial period | Full plan features |
| `active` | Paid and current | Full plan features |
| `past_due` | Payment failed, grace period | Full plan features (retry billing) |
| `canceled` / `unpaid` | Subscription ended | Paid features revoked; Explorer search remains for demand-side users |

---

## 6. Onboarding after signup

Onboarding is **role-specific** and begins after the user reaches their dashboard.

### 6.1 Demand side (tenant / buyer)

**Screen:** Tenant onboarding options (or homeowner variant for buyers).

**Choices:**

- Search for properties  
- Start referencing / verification  
- Explore contracts  

User can dismiss and resume later from the dashboard “getting started” area.

### 6.2 Supply side (landlord / agent)

**Screen:** Landlord onboarding options.

**Choices:**

- Add a property (property setup wizard + optional tour)  
- Add a tenant  
- Send contracts  

These deep-link into the landlord app with query parameters (e.g. `?start=property-setup-step1`).

### 6.3 Unauthenticated exploration

Supply-side users can browse the landlord app in guest mode. When they attempt a gated action (publish property, add tenant, etc.), a **sign-up prompt** appears and preserves their return path after authentication.

---

## 7. Key differences at a glance

| Topic | Demand (tenant / renter / buyer) | Supply (landlord / agent) |
|-------|----------------------------------|---------------------------|
| **Free tier** | Yes — Explorer (search forever) | No — all tiers are paid (Enterprise is custom) |
| **Primary conversion hook** | Free search; upgrade when moving | 1-month full trial, then subscribe |
| **Trial access level** | Full paid features if on trial path | **Full paid features — no consumption throttling** |
| **After trial / non-payment** | Downgrade to Explorer; keep search | Lose paid tools; must subscribe to continue |
| **Pricing page tab** | Renters & buyers | Landlords / Estate agents |
| **Dashboard** | Consumer (`/dashboard`) | Landlord app (`/landlord`) |
| **Daily-use dependency** | Low — episodic around a move | High — operational workflow |

---

## 8. Implementation reference (read-only)

The following areas of the codebase implement these rules today. **This document does not modify them** — it codifies the intended behaviour for product and engineering alignment.

| Area | Location |
|------|----------|
| Plan catalogue (prices, features, segments) | `src/config/plans.ts`, `proptii-backend/src/modules/billing/config/plans.config.ts` |
| Pricing page & audience tabs | `src/pages/pricing/index.tsx`, `src/components/pricing/PricingAudienceTabs.tsx` |
| Signup & trial welcome flow | `src/pages/signup/`, `src/utils/pricingRoutes.ts` |
| Stripe checkout & 30-day trial | `proptii-backend/src/modules/billing/billing.service.ts` |
| Trial-end emails & webhooks | `proptii-backend/src/modules/billing/webhook.service.ts` |
| Consumer billing UI | `src/hooks/useBillingStatus.ts`, `src/components/dashboard/` |
| Landlord billing UI | `src/landlord_agent/src/hooks/useLandlordBillingStatus.ts`, `LandlordPlanBadgePopover`, `LandlordAgentSettingsPage` |
| Feature gating (UI) | `src/utils/planAccess.ts` |
| API subscription guard | `proptii-backend/src/guards/subscription.guard.ts` |
| Tenant onboarding | `src/pages/TenantOnboardingOptions.tsx` |
| Landlord onboarding | `src/pages/LandlordOnboardingOptions.tsx` |

---

## 9. Open questions for future iterations

These are **not** blockers for the rules above but may be decided later:

1. Should demand-side paid trials also require a card upfront, or remain cardless like supply-side Path A?  
2. Exact downgrade behaviour for landlords at trial end — read-only access vs hard lock vs data export window.  
3. Whether Explorer users who arrive via a landlord’s viewing invite should see a simplified upgrade path to Renter Pro.  
4. Enterprise agent onboarding — manual provisioning vs self-serve demo environment.

---

*Document owner: Product (Aisha). Last updated: June 2026.*
