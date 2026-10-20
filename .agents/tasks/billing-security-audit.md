# Proptii Billing & Payment System — Red-Hat Security Audit

**Scope:** Proptii r1.1a at `/home/angeli/Desktop/luxcity/proptii-r1.1a`  
**Auditor role:** Internal red-hat researcher  
**Audit type:** Read-only static analysis + adversarial logic review  
**Date:** 2025 (current codebase snapshot)

---

## 1. Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH     | 5 |
| MEDIUM   | 4 |
| LOW      | 3 |
| **Total**| **16** |

The most alarming finding is that the billing backend **does not integrate with Stripe at all** — it is a mock implementation that marks every checkout as `status: active` immediately without verifying any payment. This means any authenticated user can obtain a paid-plan subscription record simply by initiating and "completing" the checkout flow, regardless of whether money changed hands. The second most critical gap is that there is **no webhook handler**, making Stripe's server-side payment events invisible to the backend. Together these two findings mean the current billing system is not production-ready for real revenue collection.

---

## 2. Findings

---

### FINDING 001 — CRITICAL: Backend Does Not Integrate With Stripe; All Checkout Is Mock

**Severity:** CRITICAL  
**File:** `v2-backend/src/services/billing.service.ts` — `createCheckoutSession()`  
**Checklist item:** #2, #13

#### Exploit Path

1. Attacker authenticates as any user (including a real free-tier account).
2. POSTs to `POST /billing/checkout` with body `{ priceId: "price_anything", planId: "agent_pro", cycle: "annual" }`.
3. Backend response:
   ```json
   {
     "sessionId": "cs_mock_1700000000000",
     "checkoutUrl": "/billing/confirmed?session_id=cs_mock_1700000000000&plan=agent_pro"
   }
   ```
4. Backend **also writes** `{ planId: 'agent_pro', cycle: 'annual', status: 'active' }` to Firestore `subscriptions/{userId}` **at checkout creation time**, before any payment.
5. Attacker navigates to `/billing/confirmed?session_id=cs_mock_1700000000000`.
6. Frontend calls `POST /billing/confirm-checkout` with the mock session ID.
7. Backend reads the subscription record it already wrote, confirms it, and returns `status: active` for `agent_pro`.
8. Attacker now has `agent_pro` in their subscription record at no cost.

#### Root Cause

`createCheckoutSession` in `billing.service.ts` (lines 120–145) generates a `cs_mock_${Date.now()}` session ID and returns a relative URL directly to `/billing/confirmed`. No Stripe SDK is imported — `stripe` is not even listed in `v2-backend/package.json`. The subscription record is written **during checkout creation**, not after confirmed payment.

#### Recommended Fix

1. Add the official `stripe` npm package.
2. Implement `stripe.checkout.sessions.create(...)` with a real `success_url` / `cancel_url`.
3. Remove the Firestore write from `createCheckoutSession`; only write entitlements in `confirmCheckoutSession` after verifying the Stripe session.
4. In `confirmCheckoutSession`, call `stripe.checkout.sessions.retrieve(sessionId)` and verify `session.payment_status === 'paid'` before granting entitlement.

---

### FINDING 002 — CRITICAL: No Stripe Webhook Handler Exists

**Severity:** CRITICAL  
**File:** `v2-backend/src/` — entire directory  
**Checklist item:** #3

#### Exploit Path

The absence of a webhook means:
- Payment failures, subscription cancellations, charge-backs, and card declines made in Stripe are **never applied** to user subscription records.
- Once a user is granted `status: active`, it can never be changed to `past_due`, `canceled`, or `unpaid` by any automated Stripe event.
- Attacker scenario: sign up, receive `active` status via the mock flow above, cancel payment method immediately. The subscription record in Firestore remains `active` forever.

#### Root Cause

The grep search for `webhook`, `constructEvent`, and `endpointSecret` across the entire `v2-backend/src/` directory returned **zero results**. No endpoint handles `POST /billing/webhook`. The `stripe` package is not even installed.

#### Recommended Fix

1. Create a NestJS controller method for `POST /billing/webhook` decorated with a raw-body middleware (critical for `stripe.webhooks.constructEvent` HMAC verification).
2. Verify `STRIPE_WEBHOOK_SECRET` (endpointSecret) against `stripe-signature` header on every incoming request.
3. Handle at minimum: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`.
4. Add `STRIPE_WEBHOOK_SECRET` to `.env.example`.

---

### FINDING 003 — CRITICAL: `confirmCheckoutSession` Does Not Validate the Session ID — Any Authenticated User Can Claim Any Pending Plan

**Severity:** CRITICAL  
**File:** `v2-backend/src/services/billing.service.ts` — `confirmCheckoutSession()`  
**Checklist item:** #2, #8, #13

#### Exploit Path

1. User A initiates a checkout for `landlord_pro`, writing `pendingPlanId: 'landlord_pro'` to their Firestore subscription document.
2. User B (on a different browser/device) is already authenticated.
3. User B POSTs to `POST /billing/confirm-checkout` with `{ "sessionId": "cs_mock_anything" }`.
4. Backend ignores the `sessionId` value entirely — it is stored in `sessionId` field but **never checked against any Stripe record**.
5. Backend reads User B's own subscription doc, finds `pendingPlanId` (if any), and promotes it to active. If User B has none, it falls back to `'renter_pro'`.
6. Alternatively, if User A's checkout has set `pendingPlanId` on User A's doc, User A can call confirm multiple times — each call re-confirms and re-writes the same entitlement.

More critically: the session_id in the mock checkout is `cs_mock_${Date.now()}`. There is no lookup table linking session IDs to userIds or plans. The confirm endpoint resolves the plan entirely from Firestore (`pendingPlanId`), meaning **the session ID parameter is decorative** — the confirmation is based solely on the authenticated user's pending record.

#### Root Cause

Lines 161–228 of `billing.service.ts`: `sessionId` is written to Firestore but never cross-referenced with Stripe to validate that:  
a) the session was paid,  
b) the session belongs to the requesting user,  
c) the session has not already been used.

#### Recommended Fix

After real Stripe integration:
- Call `stripe.checkout.sessions.retrieve(sessionId)`.
- Verify `session.client_reference_id === userId` (set `client_reference_id` when creating the session).
- Verify `session.payment_status === 'paid'`.
- Mark the session as consumed server-side to prevent replay.

---

### FINDING 004 — CRITICAL: Firebase Admin Unavailable Causes `getBillingStatus` to Return `plan: 'pro', status: 'active'` for All Users

**Severity:** CRITICAL  
**File:** `v2-backend/src/services/billing.service.ts` lines 30–48  
**Checklist item:** #7, #15

#### Exploit Path

1. Attacker (or any network condition) causes Firebase Admin to fail initialization — misconfigured `FIREBASE_SERVICE_ACCOUNT_JSON`, cold-start before credentials load, or intentional DoS on Firebase.
2. `getBillingStatus()` enters the `if (!db)` branch.
3. Returns:
   ```json
   {
     "plan": "pro",
     "status": "active",
     "hasActiveSubscription": true,
     ...
   }
   ```
4. Every user — including free-tier and unauthenticated — now appears to have an active paid plan.
5. Frontend `useBillingStatus` hook accepts this response, setting `plan = 'pro'` and `status = 'active'`.
6. `TrialExpiredGuard` sees `status !== 'trialing'` and allows full access.
7. `canAccessSection()` sees an active plan and unlocks all features.

**Note:** The plan returned is literally the string `'pro'` — not a valid `PlanId` in `plans.ts`. This could cause display inconsistencies but still grants full feature access through the `canAccessSection` logic which allows unknown plans through when they are not `'explorer'` or `'free'`.

#### Root Cause

Defensive fallback code at line 30–48 of `billing.service.ts` treats database unavailability as "grant paid access" rather than "deny or return free tier."

#### Recommended Fix

Change the DB-unavailable fallback to return a free-tier response, not an active-pro response:
```typescript
return {
  plan: 'free',
  status: 'active',
  hasActiveSubscription: false,
  ...
};
```
Or better: throw a `ServiceUnavailableException` so the frontend can show a retry rather than silently escalating privileges.

---

### FINDING 005 — HIGH: Complimentary Access Is Controlled Entirely by Client-Side Email Domain Check with an Overridable Env Variable

**Severity:** HIGH  
**Files:** `src/utils/complimentaryAccess.ts`, `src/hooks/useBillingStatus.ts`  
**Checklist item:** #5

#### Exploit Path

**Vector A — VITE env override at build time:**  
The frontend check reads:
```typescript
const domains = String(
  import.meta.env.VITE_COMPLIMENTARY_EMAIL_DOMAINS ||
    DEFAULT_COMPLIMENTARY_DOMAINS.join(',')
).split(',')...
```
This is a Vite build-time variable baked into the JavaScript bundle. Any developer who builds the frontend with `VITE_COMPLIMENTARY_EMAIL_DOMAINS=gmail.com` would grant complimentary `enterprise` access to all Gmail users. In staging/dev environments this is trivially exploitable.

**Vector B — Mock user email collision:**  
The mock test users in `data/mockTestUsers.ts` use `@test.proptii.co` emails, not `@theluxcity.co.uk`. However, `resolveMockTestUser` accepts any string ID — an attacker who calls `loginAsMockUser('any-id', 'agent')` gets a user with email `agent@test.proptii.co`. That email does not match the complimentary domain, so this particular vector is blocked. But if someone adds `test.proptii.co` to `VITE_COMPLIMENTARY_EMAIL_DOMAINS`, all mock test users gain complimentary enterprise access.

**Vector C — Email spoofing (if email is not server-verified):**  
The backend `isComplimentaryAccessEmail` check in `billing.service.ts` line 28 also takes the `email` value from `req.user.email`, which comes from the Firebase decoded token. Firebase tokens do not permit email spoofing for real users, but if `ALLOW_DEV_MOCK_AUTH` is enabled, the mock token handler sets `email: '${mockRole}@test.proptii.co'` — any engineer with backend access who enables dev mock auth can set the email to `staff@theluxcity.co.uk` trivially.

#### Root Cause

The complimentary check skips all Stripe and subscription logic on both frontend and backend, granting the highest paid plan purely on email domain. It has no server-side audit trail, no Stripe customer, and `hasStripeCustomer: false`.

#### Recommended Fix

- Maintain the domain check for internal convenience but cap its scope: issue these users a real zero-cost Stripe subscription so their access is auditable and revocable.
- Guard `VITE_COMPLIMENTARY_EMAIL_DOMAINS` with a production CI check that validates the domain list.
- Log all complimentary access grants in Firestore for auditability.

---

### FINDING 006 — HIGH: URL Parameters `?plan=` and `?cycle=` Can Be Manipulated to Change the Plan Sent to Checkout

**Severity:** HIGH  
**File:** `src/pages/billing/pay-now.tsx` lines 28–29  
**Checklist item:** #11

#### Exploit Path

1. Attacker navigates to `/signup/pay-now?plan=agent_pro&cycle=annual`.
2. `PayNowPage` reads `planId = searchParams.get('plan')` → `'agent_pro'`.
3. Frontend calls `resolveStripePriceId('agent_pro', 'annual')` to get the Stripe price ID from env vars or backend `/billing/plans`.
4. Frontend calls `POST /billing/checkout` with `{ priceId: "...", planId: "agent_pro", cycle: "annual" }`.
5. Backend writes `planId: 'agent_pro'` to Firestore.
6. With the current mock backend, this grants `agent_pro` at no cost.
7. Even with a real Stripe integration, if the `planId` parameter is trusted client-side rather than derived server-side from the `priceId`, a mismatch attack is possible: attacker pays for `renter_pro` price ID (£12/mo) but sends `planId: 'agent_pro'` → gets `agent_pro` entitlement at the price of `renter_pro`.

#### Root Cause

The `planId` sent in the checkout POST body comes from URL query parameters. The backend `createCheckoutSession` trusts the `planId` in `dto` without verifying it against the `priceId` Stripe would charge for.

#### Recommended Fix

Server-side: when a real Stripe checkout session is created, derive `planId` from the `priceId` by looking up the price in the catalogue — never trust the client-supplied `planId`. Store the derived `planId` in the Stripe session's `metadata` field and recover it in the webhook/confirm handler.

---

### FINDING 007 — HIGH: Unauthenticated Access to `/billing/confirmed` When `?session_id=` Is Present

**Severity:** HIGH  
**File:** `src/components/common/ProtectedRoute.tsx` lines 69–75  
**Checklist item:** #13, #15

#### Exploit Path

1. An unauthenticated user navigates to `/billing/confirmed?session_id=anything`.
2. `ProtectedRoute` detects `isStripeSuccessReturn = true` and unconditionally renders children without requiring authentication.
3. `BillingConfirmedPage` calls `confirmCheckoutSession(sessionId)`.
4. Since no auth token exists, `authHeaders()` returns no `Authorization` header.
5. `billingService.ts:fetchBillingWithApiFallback` sends the request without auth.
6. Backend `FirebaseAuthGuard` throws 401 → `confirmCheckoutSession` loop catches it and shows `syncError` message.
7. However: the page renders completely, shows the "You're all set" UI, and fires `trackEvent('billing_checkout_completed', ...)` — without any actual authentication.

The more dangerous scenario: if a future developer adds logic before the API call that checks session storage (e.g., reads `pendingPlan` from sessionStorage), the unauthenticated page could display premium content based on locally stored values.

#### Root Cause

The bypass at `ProtectedRoute.tsx:73` was intended to handle the race condition where Stripe redirects back before Firebase auth re-initializes. However, it bypasses auth entirely rather than deferring until auth completes.

#### Recommended Fix

Replace the bypass with a loading state that waits for `!isLoading` before rendering. If auth still resolves to unauthenticated after loading, redirect to `/login?redirect=/billing/confirmed?session_id=...` with the session_id preserved.

---

### FINDING 008 — HIGH: `mock-token-` in `localStorage` Bypasses Firebase Auth in Production if Backend Is Misconfigured

**Severity:** HIGH  
**Files:** `src/contexts/AuthContext.tsx` lines 86–97, `v2-backend/src/guards/firebase-auth.guard.ts` lines 122–135  
**Checklist item:** #9

#### Exploit Path

**Frontend path (always accessible):**
1. Attacker opens browser DevTools on the production site.
2. Runs: `localStorage.setItem('mock_token', 'mock-token-landlord-test-001')`.
3. Refreshes the page.
4. `AuthContext` sees `mockToken.startsWith('mock-token-')` on line 89 — no `import.meta.env.DEV` guard — and logs in as John Smith, `role: landlord`.
5. `useBillingStatus` checks `import.meta.env.DEV && isMockTestUserId(user?.id)` — the DEV guard prevents the mock billing status, so real billing status is fetched.
6. The user is authenticated client-side as a landlord with a hardcoded test user identity. Billing comes from the API.
7. All frontend route guards (ProtectedRoute, TrialExpiredGuard) now pass for this identity.

**Backend path (requires ALLOW_DEV_MOCK_AUTH to be set or NODE_ENV != production):**
The backend guard at line 125 checks:
```typescript
if (isProd || (!process.env.ALLOW_DEV_MOCK_AUTH && process.env.NODE_ENV !== 'test')) {
  throw new UnauthorizedException('Mock authentication tokens are not allowed...');
}
```
In production (`isProd = true`), mock tokens are rejected. However:
- If `RENDER_EXTERNAL_URL` is **not set** on a Render deployment, `isProd = false` even in production, and mock tokens are accepted if `ALLOW_DEV_MOCK_AUTH` is set or `NODE_ENV === 'test'`.
- This is a misconfiguration risk: if `RENDER_EXTERNAL_URL` is accidentally absent, production accepts mock tokens.

The frontend mock-token login has **no `import.meta.env.DEV` guard**. This means on the production built bundle, anyone can inject a mock identity.

#### Root Cause

`AuthContext.tsx` line 89: the `mock-token-` check in `onAuthStateChanged` is not guarded by `import.meta.env.DEV`, unlike the billing hook which correctly checks it. This is an inconsistency.

#### Recommended Fix

Wrap the mock token branch in `AuthContext` with `import.meta.env.DEV`:
```typescript
if (import.meta.env.DEV && mockToken && mockToken.startsWith('mock-token-')) {
```
This ensures the branch is dead code in production builds.

---

### FINDING 009 — HIGH: `getBillingStatus` Backend Falls Through With `plan: 'free'` on Any Firestore Read Error, Enabling Privilege Flip-Flop

**Severity:** HIGH  
**File:** `v2-backend/src/services/billing.service.ts` lines 97–116  
**Checklist item:** #4, #7

#### Exploit Path

1. A paid subscriber has `planId: 'agent_pro'` in Firestore.
2. Attacker induces a Firestore read error (e.g., throttling the service, or a transient network partition).
3. `getBillingStatus` catches the error and returns `{ plan: 'free', status: 'active', hasActiveSubscription: true }` — silently falling back to free.
4. Frontend shows the user as free-tier; `canAccessSection` blocks premium features.
5. Conversely, if attacker is a free user and targets the DB-unavailable case (Finding 004), they get `plan: 'pro'`.

Both failure directions are wrong: DB errors should not change a user's plan.

#### Root Cause

The catch block at line 100:
```typescript
} catch (err: any) {
  this.logger.warn(...);
  return { plan: 'free', status: 'active', ... };
}
```

#### Recommended Fix

On Firestore read errors, throw a `ServiceUnavailableException(503)` or return a neutral "unknown" status that causes the frontend to retry rather than silently granting or revoking access.

---

### FINDING 010 — MEDIUM: Trial State Is Not Enforced Server-Side; Client Can Clear `trialEndsAt` to Bypass Expiry

**Severity:** MEDIUM  
**Files:** `src/router/TrialExpiredGuard.tsx`, `v2-backend/src/services/billing.service.ts`  
**Checklist item:** #4

#### Exploit Path

1. User has `status: 'trialing'`, `trialEndsAt: '2025-01-01T00:00:00Z'` (expired).
2. `TrialExpiredGuard` on the frontend checks `new Date(trialEndsAt).getTime() < Date.now()` and redirects to `/billing/activate`.
3. However: the guard is pure React and reads from `useBillingStatus` which fetches from the API.
4. If the backend returns `trialEndsAt: null` for any reason (the DB error fallback returns `null`, the DB-unavailable branch returns `null`), the guard evaluates `trialEndsAt != null` as `false` and allows access.
5. Additionally: a user who manipulates `sessionStorage` to fool `hasPostStripeCheckout()` or `getPricingFlow()` can navigate directly to `/dashboard` without the guard redirecting them — the guard only fires through `ProtectedRoute` which checks route-level auth, not feature-level access per action.

#### Root Cause

Trial expiry is checked only on the frontend in `TrialExpiredGuard`. The backend has no mechanism to enforce expired trial → block API calls. The backend error fallback returns `trialEndsAt: null` which disables the guard.

#### Recommended Fix

Add server-side trial enforcement: check `trialEndsAt` in the backend for any sensitive feature API calls. Return `402 Payment Required` if trial is expired and no paid subscription exists.

---

### FINDING 011 — MEDIUM: Role–Plan Mismatch Allows a Tenant to Hold a Landlord Plan

**Severity:** MEDIUM  
**Files:** `v2-backend/src/controllers/auth.controller.ts`, `v2-backend/src/services/billing.service.ts`  
**Checklist item:** #10

#### Exploit Path

1. User signs up as a landlord, subscribes to `landlord_pro`.
2. User navigates to `/select-role` (if role switching is still possible via direct URL) or manipulates the `/auth/role` endpoint.
3. The `updateRole` endpoint (`POST /auth/role`) blocks `tenant → landlord` switches but not `landlord → tenant`.
4. User changes role to `tenant`.
5. Firestore `subscriptions` still contains `planId: 'landlord_pro'`.
6. `getBillingStatus` returns `plan: 'landlord_pro'` with `dashboard: 'landlord'`.
7. A tenant now has a landlord plan — `canAccessSection` would grant access to landlord features if the section rules covered landlord plans.
8. In reverse: a `tenant` with `plan: 'renter_pro'` accessing `landlord_pro` features. The `SECTION_ACCESS` map in `planAccess.ts` includes all plans across all roles in most lists, so cross-role plan access is permitted at the feature gate level.

#### Root Cause

Role and plan are stored and enforced independently. No server-side check ensures the plan matches the role at any feature gate. `canAccessSection` checks plan name but not whether the plan is appropriate for the user's role.

#### Recommended Fix

Validate plan–role compatibility when setting or confirming a plan. Add role validation to `confirmCheckoutSession` and `downgradeToFree`.

---

### FINDING 012 — MEDIUM: `setPendingPlan` Can Be Called by Any Authenticated User to Set Any `planId`

**Severity:** MEDIUM  
**File:** `v2-backend/src/controllers/billing.controller.ts:67–76`, `v2-backend/src/services/billing.service.ts`  
**Checklist item:** #12

#### Exploit Path

1. Authenticated user sends: `POST /billing/pending-plan` with `{ "planId": "enterprise", "cycle": "annual" }`.
2. Backend writes `pendingPlanId: 'enterprise'` to Firestore without validating that `enterprise` is a real plan, that the user's role is `agent`, or that any Stripe configuration exists for this plan.
3. User then calls `POST /billing/confirm-checkout` with any `sessionId`.
4. `confirmCheckoutSession` reads `pendingPlanId: 'enterprise'` from Firestore and writes it as `planId: 'enterprise'` with `status: 'active'`.
5. User now has the `enterprise` plan (normally contact-sales only) at no cost.

#### Root Cause

`setPendingPlan` in the backend does no validation of the `planId` value. It accepts any string.

#### Recommended Fix

Validate `planId` against the allowed plan catalogue in `setPendingPlan`. Also validate that the plan is not `isContactSales: true` (which should never be reachable via the self-service checkout flow).

---

### FINDING 013 — MEDIUM: `downgradeToFree` Silently Succeeds Even If Firestore Write Fails

**Severity:** MEDIUM  
**File:** `v2-backend/src/services/billing.service.ts` lines 273–282  
**Checklist item:** #4

#### Exploit Path

```typescript
async downgradeToFree(userId: string) {
  const col = this.collection;
  if (col) {
    try {
      await col.doc(userId).set({ planId: 'free', ... }, { merge: true });
    } catch {} // swallowed error!
  }
  return { success: true, planId: 'free' };
}
```

1. User clicks "Move to free plan" on `/billing/activate`.
2. Firestore write fails (any transient error).
3. Backend still returns `{ success: true }`.
4. Frontend navigates to `/dashboard?downgraded=true`.
5. Next time `getBillingStatus` is called, Firestore still shows the old paid plan.
6. User believes they downgraded but still has paid access — and is not being billed (since the billing system is mock anyway, but with real Stripe, the subscription cancellation call would also be absent).

#### Root Cause

Empty catch block at line 278 swallows Firestore write errors. The function returns success unconditionally.

#### Recommended Fix

Remove the empty catch. Let the error propagate so the controller returns a 500 and the frontend can display an error instead of a false success.

---

### FINDING 014 — LOW: `GET /billing/plans` Is Unauthenticated

**Severity:** LOW  
**File:** `v2-backend/src/controllers/billing.controller.ts` lines 55–60  
**Checklist item:** #14

#### Exploit Path

`GET /billing/plans` has no `@UseGuards(FirebaseAuthGuard)`. This is by design for the pricing page, but it leaks internal plan pricing that includes Stripe price IDs if those were to be included in the response. Currently the response only includes static pricing data (name, monthly/annual prices, features list) — not actual Stripe price IDs — so the risk is low. However, if Stripe price IDs are ever added to this endpoint's response, unauthenticated users could extract them.

#### Recommended Fix

Ensure the public `/billing/plans` endpoint never exposes Stripe price IDs. Keep them server-to-server only (passed in checkout session creation, not returned to clients).

---

### FINDING 015 — LOW: Firebase Token Accepted via URL Query Parameter (`?token=`)

**Severity:** LOW  
**File:** `v2-backend/src/guards/firebase-auth.guard.ts` lines 111–116  
**Checklist item:** #14

#### Exploit Path

The guard accepts Firebase tokens via `?token=` URL query parameter. This means:
- Tokens appear in server access logs, browser history, referrer headers, and proxy logs.
- If a request with `?token=<firebase_token>` is made to any third-party URL (e.g., a redirect to Stripe), the token may leak in the referrer header.
- Firebase ID tokens expire in 1 hour, so the window is limited, but the exposure is unnecessary.

#### Root Cause

Lines 111–116 in `firebase-auth.guard.ts`:
```typescript
} else if (request.query?.token) {
  token = (request.query.token as string)...
```

This exists to support SSE (EventSource) connections that can't send Authorization headers. The SSE path already has a more secure ticket-based bypass (SSE ticket handling at lines 92–107). The `?token=` query fallback is redundant and adds attack surface.

#### Recommended Fix

Remove the `?token=` query parameter path. Ensure all consumers use either the Authorization header or the SSE ticket mechanism.

---

### FINDING 016 — LOW: `SubscriptionGuard` Referenced in Code Comments Does Not Exist

**Severity:** LOW  
**File:** `src/utils/planAccess.ts` line 6  
**Checklist item:** #7

#### Exploit Path

The comment in `planAccess.ts` reads:
> "never rely solely on frontend gating for data security — the NestJS SubscriptionGuard handles API-layer enforcement."

A search of the entire `v2-backend/src/` directory returns zero results for `SubscriptionGuard`. This guard does not exist. Developers reading this comment would believe API-level plan enforcement exists and might not add it themselves when building new premium features.

#### Root Cause

Dead documentation referring to a guard that was planned but never implemented. There is no server-side enforcement of subscription plans on any feature API endpoint.

#### Recommended Fix

Either implement `SubscriptionGuard` (reads the user's plan from Firestore, validates it meets the required tier for the endpoint) or remove the comment and explicitly document that API-level plan enforcement is a TODO.

---

## 3. Prioritised Remediation Table

| Priority | ID | Finding | Effort | Impact |
|----------|----|---------|--------|--------|
| P0 | 001 | Backend is entirely mock — no real Stripe integration | High | Revenue is impossible without this |
| P0 | 002 | No Stripe webhook handler | High | Cancellations/failures are invisible |
| P0 | 003 | confirm-checkout ignores session_id entirely | Medium | Any user can claim any pending plan |
| P0 | 004 | DB unavailable → grants `plan: 'pro'` to all | Low | Blanket privilege escalation on DB outage |
| P1 | 008 | mock-token localStorage not guarded by DEV flag | Low | Identity spoofing in production browser |
| P1 | 006 | URL params control planId sent to checkout | Medium | Plan substitution attack |
| P1 | 012 | setPendingPlan accepts arbitrary planId | Low | Enterprise plan bypass |
| P1 | 005 | Complimentary access from client-env domain check | Medium | Staff domain leak grants top-tier access |
| P2 | 007 | Unauthenticated access to /billing/confirmed | Low | Cosmetic risk now, higher after real Stripe |
| P2 | 009 | Firestore errors silently downgrade paid users | Low | Customer experience; billing disputes |
| P2 | 010 | Trial expiry frontend-only | Medium | No server-side trial enforcement |
| P2 | 011 | Role–plan mismatch permitted | Medium | Cross-role feature access |
| P3 | 013 | downgradeToFree silently swallows Firestore errors | Low | False success UX |
| P3 | 016 | SubscriptionGuard referenced but non-existent | Low | Developer confusion; missing safety net |
| P4 | 014 | /billing/plans unauthenticated | Low | Info exposure risk if price IDs added |
| P4 | 015 | Firebase token accepted in URL query param | Low | Token logging/leakage risk |

---

## 4. Architectural Vision: Seamless, Hardened Billing Experience

The following describes what a secure, production-grade billing system for Proptii should look like.

### 4.1 Real Stripe Integration

**Checkout creation (backend):**
- Use `stripe.checkout.sessions.create()` with:
  - `client_reference_id: userId` (binds the session to this user server-side)
  - `customer_email: email` (pre-fills Stripe checkout)
  - `metadata: { planId, cycle, userId }` (recoverable in webhook)
  - `success_url`: full URL including `{CHECKOUT_SESSION_ID}` placeholder
  - `cancel_url`: back to the pricing page
- Derive `planId` from `priceId` server-side — never trust client-supplied `planId`.
- Do **not** write any subscription record to Firestore until payment is confirmed.

**Confirmation (after Stripe redirect):**
- Call `stripe.checkout.sessions.retrieve(sessionId)`.
- Assert `session.client_reference_id === req.user.uid`.
- Assert `session.payment_status === 'paid'` (or `trialing` for trial).
- Mark session consumed in a `processedStripeEvents` Firestore collection.
- Only then write the subscription record.

### 4.2 Webhook Handler (Single Source of Truth)

```
POST /billing/webhook (raw body, no auth guard)
├── Verify stripe-signature against STRIPE_WEBHOOK_SECRET
├── Switch on event.type:
│   ├── checkout.session.completed → write initial subscription
│   ├── invoice.payment_succeeded → update currentPeriodEnd, status: active
│   ├── invoice.payment_failed    → status: past_due, trigger email
│   ├── customer.subscription.updated → update plan/cycle/status
│   └── customer.subscription.deleted → status: canceled, revoke entitlement
```

The webhook becomes the **authoritative** writer of subscription state. The confirm-checkout endpoint becomes a polling helper for UX responsiveness, not a gatekeeper.

### 4.3 Server-Side Entitlement Guard

Implement `SubscriptionGuard` as a NestJS guard that:
1. Reads the user's subscription from Firestore (with a short TTL Redis cache).
2. Compares against the required plan metadata on the route.
3. Returns `402 Payment Required` if the subscription is insufficient.
4. Caches the result for 60 seconds to avoid Firestore reads on every request.

Apply it to all premium API routes:
```typescript
@UseGuards(FirebaseAuthGuard, SubscriptionGuard)
@RequiredPlan('renter_pro')
@Get('referencing/apply')
```

### 4.4 Trial Architecture

- Trials are created in Stripe as subscriptions with `trial_period_days: 30`.
- `trialEndsAt` is set from `subscription.trial_end` in the webhook handler.
- `SubscriptionGuard` checks `trialEndsAt` server-side on every premium API call.
- When trial expires, Stripe sends `customer.subscription.updated` with `status: past_due` if no payment method is on file.
- Frontend `TrialExpiredGuard` is a UX nicety; the backend guard is the enforcement layer.

### 4.5 Complimentary Access

- Issue complimentary users a real zero-cost Stripe subscription (price = £0) through a coupon or free price.
- This gives them a proper `stripeCustomerId` and an auditable subscription record.
- Remove the bypass from `getBillingStatus` and the frontend hook — complimentary users go through the same code path.
- Alternatively: create a Firestore `subscriptions/{uid}` document manually with `plan: 'enterprise'`, `status: 'active'`, `isFreeInternal: true` and handle it server-side only, never in client-side env vars.

### 4.6 Checkout Session Integrity

- Set `client_reference_id` to `userId` when creating the Stripe session.
- In `confirmCheckoutSession`, validate `sessionId` is:
  - A real Stripe session ID starting with `cs_` (live or test).
  - Owned by `req.user.uid` (via `client_reference_id`).
  - Not already confirmed (one-time use, tracked in Firestore).
- Enforce on the frontend: accept only `session_id` values that begin with `cs_live_` or `cs_test_` — reject `cs_mock_` in production.

### 4.7 Plan–Role Binding

- When writing a subscription, validate that `planId` is compatible with the user's current role.
- Store `role` alongside the subscription for audit purposes.
- Periodically reconcile: if a user's role and plan are mismatched, trigger a review or auto-downgrade.

### 4.8 Error Handling

- All Firestore read errors in `getBillingStatus` → return `503 Service Unavailable` with a `Retry-After` header.
- Frontend: display a "We're having trouble checking your subscription — please try again in a moment" message rather than silently upgrading or downgrading.
- All Firestore write errors in `downgradeToFree`, `setPendingPlan` → propagate the error, not a false success.

---

*End of Audit Report*
