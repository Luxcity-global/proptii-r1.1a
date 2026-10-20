# Role Selection & Pricing System — Investigation Report

**Date:** 2026-06  
**Status:** Findings complete — no code was modified  
**Scope:** Role selection flow, pricing pages, role-to-plan linkage, role switching / view-as, public pricing, onboarding flow, complimentary access

---

## Executive Summary

The app currently has **two separate, non-integrated role selection mechanisms** — `RoleSelect.tsx` (the `/select-role` page, post-auth) and `RoleSelectionPopup` (a modal used on homeowner/agent marketing pages). **Agent is missing from `RoleSelect.tsx`**, which only shows Tenant and Landlord cards. `RoleSelectionPopup` does offer Landlord and Agent, but not Tenant, and is entirely disconnected from the auth-based role assignment system (`roleService.ts`).

The pricing page (`/pricing`) is fully public and unauthenticated — any visitor can see all plans across all three audience tabs (Renters & Buyers, Landlords, Estate Agents). **However**, the pricing page does not inspect the authenticated user's role to pre-select the relevant tab. Once authenticated, the pricing page is not used for plan management — that responsibility falls to the landlord dashboard header and settings modals.

Role switching is implemented in two places: `DashboardSettings.tsx` (tenant dashboard) and `LandlordAgentSettingsPage.tsx` (landlord/agent dashboard). Both navigate to `/select-role`, but `RoleSelect.tsx` immediately redirects users who already have a role — making the "switch to tenant view" path non-functional for role reassignment. A "View as Tenant" link in `LandlordAgentSettingsPage` simply redirects to `/dashboard` via `window.location.href`.

---

## 1. Role Selection

### 1.1 `/select-role` — `RoleSelect.tsx`

**File:** `src/pages/RoleSelect.tsx`  
**Route:** `<Route path="/select-role" element={<RoleSelect />} />` (public, in `App.tsx`)

**What it shows:**
- Only **two** role cards: "Tenant" (find a home) and "Landlord/Agent" (manage assets).
- **Agent is NOT a separate card.** The Landlord card's aria-label says "landlord or agent" and its badge reads "MANAGEMENT · SCALE", but clicking it always saves `role: 'landlord'` — never `'agent'`.

**Guard logic:**
```tsx
React.useEffect(() => {
  if (!isLoading && user?.roleResolved && user.roles && user.roles.length > 0) {
    // Immediately redirects away if role is already set
    navigate(target, { replace: true });
  }
}, [user, isLoading, navigate]);
```
This means any user who already has a role (including a landlord trying to "switch to tenant view" from Settings) is instantly bounced back to their dashboard — the switch path is broken.

**State managed:**
- Calls `setRole(uid, email, role, 'manual_select')` from `roleService.ts`
- Writes `localStorage.setItem('proptii_role_${uid}', role)`
- Then calls `patchUser({ roles: [role], roleResolved: true })` on the auth context

**What `UserRole` is:**  
```typescript
// src/services/roleService.ts
export type UserRole = 'tenant' | 'landlord' | 'agent';
```
All three values exist in the type, but only `'tenant'` and `'landlord'` are reachable via the `/select-role` UI.

### 1.2 `RoleSelectionPopup` Component

**File:** `src/components/RoleSelectionPopup.tsx`

**What it shows:**
- **Landlord** ("I own and manage my own properties")
- **Property Agent** ("I manage properties for multiple clients")
- **No Tenant option.**

**Local UserRole type:**
```typescript
type UserRole = 'landlord' | 'agent'; // local to this file only
```
This is **different** from the canonical `UserRole` in `roleService.ts`.

**Used by:**
- `src/pages/AgentHome.tsx` — renders `<RoleSelectionPopup isOpen={showRolePopup} onRoleSelected={handleRoleSelected} />`
- `src/pages/HomeownerHome.tsx` — same pattern
- `src/pages/HomeownerHomeVariantB.tsx` — same pattern

**Not wired to auth:** The popup does not call `setRole()` from `roleService.ts`. When a user selects a role and clicks "Continue", the `handleContinue` handler either calls the parent's `onContinue` prop or does a `window.location.href` redirect — no role is persisted to localStorage or the backend. This popup is effectively a **navigation widget**, not a role assignment tool.

---

## 2. Pricing Pages

### 2.1 The Public Pricing Page

**File:** `src/pages/pricing/index.tsx`  
**Route:** `<Route path="/pricing" element={<Pricing />} />` — public (no `ProtectedRoute` wrapper)

**What it shows:**
- Three audience tabs (via `PricingAudienceTabs`): "Renters & buyers", "Landlords", "Estate agents"
- Billing toggle: Monthly / Annual
- Plan cards driven by `getPlansForAudienceTab(audience)` from `src/config/plans.ts`
- Feature comparison table (collapsible)
- FAQ section
- Early-access promo banner

**Plans by tab:**
- Renters & buyers: Explorer (free), Renter Pro, Buyer Pro
- Landlords: Starter, Landlord Pro, Elite
- Estate agents: Independent, Agent Pro, Enterprise

**Role-awareness:** None. The pricing page does not read `useAuth()`. The active tab defaults to `'renters'` and can only be changed via `?segment=renters|landlords|agents` query params or user clicks. There is no automatic pre-selection based on the logged-in user's role.

### 2.2 Other Pricing-Related Pages

| Route | File | Auth? | Purpose |
|---|---|---|---|
| `/pricing` | `src/pages/pricing/index.tsx` | None | Full public pricing catalogue |
| `/pricing/plan-selected` | `src/pages/pricing/PlanSelected.tsx` | None | Interstitial after plan click; asks user to sign up |
| `/signup` | `src/pages/signup/index.tsx` | None (redirects if auth) | Account creation entry — takes `?plan=` and `?cycle=` |
| `/signup/create-account` | `src/pages/signup/create-account.tsx` | None | Google/email account creation |
| `/signup/welcome` | `src/pages/signup/welcome.tsx` | `ProtectedRoute` | Trial confirmation + Stripe checkout launch |
| `/signup/pay-now` | `src/pages/billing/pay-now.tsx` | `ProtectedRoute` | Skip-trial direct Stripe checkout |
| `/billing/confirmed` | `src/pages/billing/confirmed.tsx` | `ProtectedRoute` | Post-Stripe success screen |
| `/billing/activate` | `src/pages/billing/activate.tsx` | `ProtectedRoute` | Day-30 trial expiry: pay or downgrade |

**Conclusion:** The **only page showing all plans is `/pricing`**, and it is already public/unauthenticated. There is no second, separate "authenticated pricing page". The landlord dashboard has a `LandlordPlanBadgePopover` and `LandlordPlanCompareModal` that show plan comparisons in-context, but these are widgets, not standalone pricing pages.

---

## 3. Role-to-Plan Linkage

### 3.1 Current state

There is **no automatic linkage** between a user's role and the audience tab shown on `/pricing`. The flow is:

1. User visits `/pricing` (defaults to "Renters & buyers" tab)
2. User manually switches to "Landlords" or "Estate agents" tab (or arrives with `?segment=` query param)
3. User clicks a plan CTA → navigates to `/signup?plan=...&cycle=...`
4. After sign-up, the plan is stored in `sessionStorage` (`pending_plan`) and passed through Stripe checkout
5. Post-Stripe: `getDashboardForPlanId(planId)` maps plan → dashboard (`consumer` vs `landlord`)
6. User lands on `/landlord` or `/dashboard` based on plan, **not on their role**

**The role itself is set separately** — after sign-up, if no role is stored, the user is sent to `/select-role`. Role and plan are tracked independently and there is no enforced consistency (e.g. a landlord plan + tenant role is theoretically possible).

### 3.2 In-dashboard plan surfacing

The landlord dashboard surfaces role-appropriate plan information:
- `LandlordDashboardHeader.tsx`: `const pricingSegment = userRole === 'agent' ? 'agents' : 'landlords'` → deep-links to `/pricing?segment=agents` or `/pricing?segment=landlords`
- `LandlordAgentSettingsPage.tsx`: `pricingSegmentForRole(userRole)` → passes `defaultAudience` to `LandlordPlanCompareModal`

This is a **display convenience**, not a gating rule.

---

## 4. Role Switching & View-As Mechanism

### 4.1 "Switch to tenant view" — DashboardSettings (Consumer dashboard)

**File:** `src/components/dashboard/sections/DashboardSettings.tsx` (line ~444)

```tsx
const canSwitchRole = currentRole === 'landlord' || currentRole === 'agent';
// ...
{canSwitchRole && (
  <SettingsRow
    title="Switch to tenant view"
    onClick={() => navigate('/select-role')}
    action={<button onClick={() => navigate('/select-role')}>Switch view</button>}
  />
)}
```

**Problem:** Navigating to `/select-role` immediately bounces the user back to `/landlord` because `RoleSelect.tsx` redirects users who already have a role. This button is **non-functional** for role switching.

### 4.2 "View as Tenant" — LandlordAgentSettingsPage

**File:** `src/landlord_agent/src/components/LandlordAgentSettingsPage.tsx` (line ~474)

```tsx
<SettingsRow
  title="View as Tenant"
  description="Preview the tenant portal and dashboard features without changing your account role."
  onClick={() => { window.location.href = '/dashboard'; }}
  action={<button onClick={() => window.location.href = '/dashboard'}>View as Tenant</button>}
/>
```

This navigates directly to `/dashboard`. Since the user's role is `landlord` or `agent`, `ProtectedRoute` intercepts and shows a **"view as landlord" banner** (the fixed banner in `ProtectedRoute.tsx` lines ~105–145) that reads: *"You're viewing the tenant area as a landlord. Some features may behave differently."* This is a soft warning overlay — it does not change the user's role.

### 4.3 "Switch account role" — LandlordAgentSettingsPage

**File:** `src/landlord_agent/src/components/LandlordAgentSettingsPage.tsx` (line ~497)

```tsx
<SettingsRow
  title="Switch account role"
  onClick={() => openInParentApp('/select-role')}
  action={<button onClick={() => openInParentApp('/select-role')}>Change role</button>}
/>
```

`openInParentApp` navigates `window.top` (or `window.location`) to `/select-role` — same broken redirect problem as above.

### 4.4 "View as" — AudienceToggle

**File:** `src/components/search/AudienceToggle.tsx`

This is a **data filtering widget** used on property report/search components, not an auth role switch. The label "View as" (rendered as the default placeholder when no audience is selected) switches the "lens" (tenant/buyer/landlord/agent perspective on property data), not the actual account role.

### 4.5 ProtectedRoute "Switch-view banner"

**File:** `src/components/common/ProtectedRoute.tsx` (lines ~105–145)

When a landlord/agent navigates to a tenant route (e.g. `/dashboard`), `ProtectedRoute` renders a fixed top banner:
- "👋 You're viewing the **tenant** area as a landlord."
- CTA: "Go to Landlord Dashboard" (href `/landlord`)
- Dismiss button: "Continue browsing" (hides banner, stores `switchDismissed=true`)

This is the primary "view-as" mechanism. It can be dismissed per-session via `useState(false)` — it is not persisted.

---

## 5. Unauthenticated Pricing Page

**Already exists at `/pricing`.**

The public pricing page shows all plans for all three audience segments. It does not require authentication. Any visitor can view, compare, and select a plan. This page uses no `ProtectedRoute` wrapper.

**Gap:** The pricing page never reads the user's auth role to pre-select the correct tab. An authenticated landlord visiting `/pricing` still sees the "Renters & buyers" tab by default.

---

## 6. Onboarding Flow

### 6.1 Full trace: Signup → Role → Plan → Checkout

```
/pricing
   │  User picks a plan, e.g. Landlord Pro (billing=annual)
   ▼
/signup?plan=landlord_pro&cycle=annual
   │  DedicatedSignupPage reads planId/cycle from URL
   │  Removes stale 'proptii_signup_role_intent' from sessionStorage
   │  User clicks "Continue with Google" or "Continue with email"
   ▼
Google OAuth (Firebase)
   │  On success, AuthContext resolves role via resolveRole()
   │  resolveRole checks: localStorage → /auth/me backend → sessionStorage roleIntent → null
   ▼
/signup/welcome?plan=landlord_pro&cycle=annual (ProtectedRoute)
   │  SignupWelcomePage reads planId/cycle
   │  Calls createCheckoutSession(priceId, trialEnabled=true)
   │  Redirects to Stripe
   ▼
Stripe Checkout
   │  Returns to /billing/confirmed?session_id=...
   ▼
/billing/confirmed (ProtectedRoute)
   │  confirmCheckoutSession() called
   │  getDashboardForPlanId('landlord_pro') → 'landlord'
   │  getDashboardHomePath('landlord') → '/landlord'
   ▼
/landlord (dashboard)

--- Role assignment path (no plan selected, new user) ---
After OAuth → resolveRole() returns null → /select-role
   │  User picks Tenant or Landlord (Agent is not a separate card)
   │  setRole() persists to localStorage + /auth/role backend
   ▼
/dashboard (tenant) or /landlord (landlord)
```

### 6.2 Key sessionStorage / localStorage keys

| Key | Storage | Set by | Consumed by |
|-----|---------|--------|-------------|
| `proptii_role_{uid}` | localStorage | `roleService.setRole()` | `roleService.resolveRole()` |
| `proptii_signup_role_intent` | sessionStorage | `setRoleIntent()` in `roleIntent.ts` | `roleService.resolveRole()` (step 3) |
| `pricing_flow` | sessionStorage | `setPricingFlow()` | `signup/welcome.tsx`, `signup/index.tsx` |
| `pending_stripe_checkout` | sessionStorage | `markPendingStripeCheckout()` | `signup/index.tsx`, `welcome.tsx` |
| `post_stripe_checkout` | sessionStorage | `markPostStripeCheckout()` | `welcome.tsx`, `signup/index.tsx` |
| `redirectAfterLogin` | sessionStorage | Login page, ProtectedRoute | Login.tsx, signup/index.tsx |
| `pending_registration_email` | sessionStorage | `signup/index.tsx` | `signup/create-account.tsx` |
| `proptii_account_type` | localStorage | `accountType.persistAccountType()` | `accountType.resolvePostAuthAction()` |
| `landlord_user_role` | localStorage | `accountType.persistUserRole()` | `landlordUserService` |

### 6.3 Broken gap: Role Intent is never set from pricing flow

In `src/pages/signup/index.tsx`, when the user continues via Google or email, the code explicitly **removes** the role intent:
```tsx
sessionStorage.removeItem('proptii_signup_role_intent');
```
This means a user who arrives at `/signup` from a **landlord plan** card on `/pricing` will have no role intent set. After sign-up, `resolveRole()` will return null and they'll be sent to `/select-role` — where they can only pick Tenant or Landlord (no Agent card). The plan they selected tells us their intended role, but this information is not used to pre-populate or skip `/select-role`.

---

## 7. Complimentary Access (`complimentaryAccess.ts`)

**File:** `src/utils/complimentaryAccess.ts`

**What it does:**
Grants staff from configured email domains (default: `theluxcity.co.uk`) a synthetic "active" billing status with the highest tier for their role — no actual Stripe subscription required.

```typescript
export function complimentaryPlanForRole(role?: string | null): PlanId {
  if (r === 'agent')   return 'enterprise';
  if (r === 'landlord') return 'elite';
  return 'buyer_pro';  // tenant/consumer default
}

export function complimentaryBillingStatus(role?: string | null): BillingStatus {
  return {
    plan: complimentaryPlanForRole(role),
    status: 'active',
    trialEndsAt: null,
    // null = unlimited fit checks (Enterprise behaviour)
    fitChecksQuota: null,
    ...
  };
}
```

**Where it is used:**
- `src/pages/signup/welcome.tsx`: Checks `isComplimentaryAccessEmail(user?.email)` — if true, skips Stripe checkout entirely.
- `src/hooks/useBillingStatus.ts` (expected, not read in detail here): Likely injects the complimentary `BillingStatus` in place of an API call.

**VITE env override:**
```
VITE_COMPLIMENTARY_EMAIL_DOMAINS=theluxcity.co.uk
```
Additional domains can be added comma-separated.

---

## 8. Conclusions & Problem Summary

### 8.1 Agent is missing from /select-role cards

`RoleSelect.tsx` renders exactly two cards — Tenant and Landlord. `UserRole` supports `'agent'`, but there is no agent card. The Landlord card always saves `'landlord'`. If an estate agent signs up via the agent pricing tab, they land on `/select-role` and are forced to pick "Landlord" — the closest option — and end up with `role: 'landlord'` instead of `role: 'agent'`. This is a significant product bug.

### 8.2 Role switching is broken in both directions

- `DashboardSettings` "Switch to tenant view" → navigates to `/select-role` → immediately redirected back because user already has a role.
- `LandlordAgentSettingsPage` "Switch account role" → same broken `/select-role` redirect.
- "View as Tenant" works only as a soft preview (the ProtectedRoute banner), not as a role change.

### 8.3 Pricing page does not pre-select tab by role

An authenticated landlord or agent who visits `/pricing` always sees "Renters & buyers" by default. There is no `useAuth()` call in `PricingPage`. They must manually click the correct tab.

### 8.4 Role intent is intentionally cleared during signup

The signup page removes `proptii_signup_role_intent` before triggering OAuth — this was likely deliberate to prevent stale intents from older flows. But it means the plan a user chose (which encodes their role) is never translated into a role intent that would skip `/select-role`.

### 8.5 The two role-selection systems are disconnected

`RoleSelectionPopup` and `RoleSelect.tsx` serve different purposes and neither knows about the other:
- `RoleSelectionPopup`: marketing page modal, navigation-only, no auth role persistence
- `RoleSelect.tsx`: post-auth assignment page, persists role, but missing agent card

---

## 9. Recommendations for the Implementation Plan

Based on the request to:
> "make both the pricing and role selection seamless, add agent to the select-role cards, let the pricing reflect the selected role, the only page with all the pricing should be an unauthenticated pricing page, also remove the role switching mechanism and view as mechanism"

### Recommended changes:

1. **Add an Agent card to `RoleSelect.tsx`** — add a third card (blue/navy) that calls `handleSelect('agent')` and saves `role: 'agent'`. Mirror the layout of the existing two cards. Also update the hover state type to include `'agent'`.

2. **Pre-select the pricing audience tab from the user's role** — in `PricingPage` (`src/pages/pricing/index.tsx`), add `const { user } = useAuth()` and a `useEffect` that maps `user.roles[0]` → the correct audience tab:
   - `tenant` → `'renters'`
   - `landlord` → `'landlords'`
   - `agent` → `'agents'`
   This effect should only apply if no `?segment=` query param is present, and should set state once (not override user's manual tab choice).

3. **Remove role-switching from Settings** — remove the "Switch to tenant view" row in `DashboardSettings.tsx` and both "View as Tenant" + "Switch account role" rows in `LandlordAgentSettingsPage.tsx`. These are dead / confusing UX paths.

4. **Remove the ProtectedRoute "view as landlord" banner** — remove the `switchDismissed` state and banner from `ProtectedRoute.tsx`. Instead, just redirect landlord/agent users away from `/dashboard` to `/landlord` (which is already implemented in the smart redirect block below the banner).

5. **Keep `/pricing` as the only pricing page** — it already meets this requirement. No new public pricing page needs to be created.

6. **Remove `RoleSelectionPopup` usage from marketing pages** — `AgentHome.tsx`, `HomeownerHome.tsx`, `HomeownerHomeVariantB.tsx` all import and use it. Replace the popup calls with a direct `navigate('/select-role')` or `navigate('/signup')` CTA.

7. **Wire plan → role intent at signup** — in `signup/index.tsx`, instead of removing the role intent unconditionally, derive it from the plan's segment and set it before the OAuth flow:
   ```ts
   const plan = getPlanById(planId);
   if (plan?.segment.includes('agent')) setRoleIntent('agent');
   else if (plan?.segment.includes('landlord')) setRoleIntent('landlord');
   else setRoleIntent('tenant');
   ```
   This would let `resolveRole()` skip `/select-role` entirely for plan-driven signups.
