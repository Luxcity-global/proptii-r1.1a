# Proptii Admin Dashboard — Product Specification

## 1. Purpose

An internal tool for the Proptii team to see, at a glance and in depth, who has signed up, what tier they're on, and what they're doing with the product. This is distinct from the investor/exec dashboard (aggregate KPIs) — this is the operational, per-account view that supports support, growth, and abuse-monitoring decisions day to day.

**URL:** `/ProptiiAdmin` (also accepts `/proptiiadmin`)

**Primary users:** Founder/ops (all access), Customer support (account-level access, notes only — no billing edit), future: partnerships lead (B2B API accounts only).

Staff access is allowlisted: `@proptii.com` / `@proptii.co`, plus `ADMIN_EMAILS` / `VITE_ADMIN_EMAILS`. Access to the dashboard is written to `admin_access_log`.

## 2. Source data this depends on

Aligned to the **live** product model (`src/config/plans.ts` + Firestore), not the earlier draft tier names:

- **Account record** (`users`) — registered user; role (`tenant` / `landlord` / `agent`); optional buyer-profile fields (household type, risk appetite, commute tolerance, budget) when present
- **Subscription/tier** (`subscriptions`) — Explorer (free), Renter Pro, Buyer Pro, Starter, Landlord Pro, Elite, Independent, Agent Pro, Enterprise
- **Usage proxies** — fit checks used (agent plans), saved properties, alerts, viewings, referencing activity. Full per-address report history is not yet persisted as its own collection
- **Trial state** — `status: trialing`, `trialEndsAt`, reports/fit-checks used
- **Usage events** — reconstructed timeline from signup, billing confirm, saves, and alerts (logins / PDF exports are not stored as a dedicated event log yet)

## 3. Core screens

### 3.1 Customer List (default view) — shipped (MVP)

Searchable, filterable, sortable table.

| Column | Notes |
|---|---|
| Name / Email | From `users` |
| Tier | Live plan name; trial suffix when `status = trialing` |
| Signup date | `createdAt` / `roleAssignedAt` |
| Last active | Best available of profile update, billing update, saves, alerts |
| Reports run (lifetime / this month) | `fitChecksUsed` plus usage proxies; this-month is 0 until report runs are stored |
| Account status | Anonymous session / Registered / Trial / Paid / Churned |
| Billing status | Current / Trial / Failed payment / Cancelled / None |

Filters: tier, activity recency (7d / 30d / dormant), trial expiring in ≤3 days, flagged accounts.
Bulk actions: export to CSV. Outreach tags are added on the customer detail note form.

### 3.2 Customer Detail — shipped (MVP)

Opens from any row. Sections:

- **Profile** — role, buyer profile fields when present, professional-at-onboarding flag
- **Subscription** — current tier, trial/renewal dates, pending plan, fit-check quota. **No in-tool billing edits** (observational only)
- **Report history** — deferred until reports are persisted; saved properties are listed as a usage proxy
- **Usage timeline** — chronological event log from available collections
- **Flags** — rule-based notes (e.g. 3+ reports on Explorer, high save volume on free, trial ≤3 days, failed payment)
- **Actions** — add internal note / outreach tag. Tier/trial overrides and ticket links are V3

### 3.3 Tier & Cohort Overview — shipped (V2)

- Distribution of accounts across live tiers (count + %)
- Anonymous → registered → paid conversion funnel
- Trial vs paid snapshot (true trial→paid conversion needs historical trial records)
- Cohort retention by signup month (now-paid / signups)

### 3.4 Abuse / Ops Alerts — shipped (V2, rule-based)

Surfaces flagged consumer-tier accounts: high free-tier volume, trials about to lapse, failed payments. Same-device/IP correlation is deferred until those signals are stored.

### 3.5 B2B / API accounts — shipped (V2)

Separate table for landlord/agent roles and B2B plans (Starter through Enterprise). Fit-check usage stands in for API call volume until a dedicated API meter exists.

## 4. Functional requirements

- Full-text search across name, email, and flag text (address history when report persistence lands)
- Staff-email gate now; finer founder / support / read-only roles in V3
- Access log of dashboard reads and note writes (`admin_access_log`)
- CSV export from customer, alert, and partner tables
- **Must not** write to report-generation, pricing, or existing user/subscription documents

## 5. Non-functional requirements

- GDPR: personal data is restricted to named staff emails; access is logged
- Isolated surface: no product-nav entry; existing tenant/landlord/homeowner flows unchanged
- Notes live in `admin_account_notes` (admin SDK only) — not on customer records

## 6. Phasing

- **MVP (this build):** `/ProptiiAdmin` app inside the current frontend; Customer List + Detail; CSV export; staff gate
- **V2 (this build, read-only):** automated flags, cohort/funnel, B2B table
- **V3:** founder-only tier/trial overrides with audit log; support vs read-only roles; persisted report history and device/IP abuse

## 7. Open questions

- Does support need write access to tier/trial, or should all overrides route through founder/ops only? **Current decision: founder/ops only; dashboard does not edit billing.**
- Same device/IP abuse detection remains blocked on capturing those signals.
- B2B lives in the same tool, on a separate tab, because partner volume is still small.
