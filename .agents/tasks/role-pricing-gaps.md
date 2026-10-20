# Role & Pricing Redesign — Gap Analysis Report

**Date:** 2025-07-14  
**Scope:** Post-redesign investigation of signup, role selection, pricing page, ProtectedRoute, and marketing pages.

---

## Executive Summary

The redesign is substantially complete and structurally sound. The seven concrete gaps below need fixing before this can be considered production-ready:

1. **Explorer CTA navigates to `createAccountUrl` which goes to `/signup/create-account` — that page then unconditionally sets `redirectAfterLogin` to `/signup/welcome?plan=explorer` and runs the trial/welcome flow for a free plan.** The welcome page guards against `isFree` for the Stripe call, but the user still lands on a "confirm your trial" screen with no next step for a free plan, then gets stuck.
2. **`RoleSelect` loading guard is inverted — it shows a spinner when the user has an existing role**, preventing them from ever seeing the cards (see §3 below).
3. **`AgentHome` is imported in `App.tsx` but never mounted on a route** — this causes a `TS6133: 'AgentHome' is declared but its value is never read` TypeScript error.
4. **`planSegmentToRoleIntent` maps both `'renter'` and `'buyer'` to `'tenant'`** — correct — but `explorer` plan's `segment[0]` is `'renter'`, so Explorer signups get `roleIntent='tenant'` and skip `/select-role`. This is fine logically (Explorer is a renter/buyer product) but is undocumented and surprising.
5. **Pricing page's role-based tab pre-selection has a missing dependency**: `user?.roles` is not stable across renders — using `user?.roles?.[0]` in the dependency array and reading `user?.roles` in the body is fine, but `user?.roleResolved` being used without `user` itself in the deps array could cause a stale closure. The effect also doesn't guard the case where `user` is null.
6. **`HomeownerHome` and `HomeownerHomeVariantB` CTAs use `useNavigate` but navigate to `/homeowner/dashboard`** — no route for that path exists in App.tsx. The homeowner route is `/homeowner` (which renders `HomeownerHomeVariantB` itself). This creates an infinite loop.
7. **TypeScript build emits 50+ errors** — mostly pre-existing unused-variable noise, but `src/app/listings/success/page.tsx` has a genuine `Cannot find module 'next/link'` error that indicates a stale Next.js file was left in the Vite project. Also `src/App.tsx:33` warns `AgentHome` is imported but never used.

---

## Area 1 — Explorer (free) Plan Signup Path

### Finding: Explorer CTA → welcome page with no exit

**File:** `src/components/pricing/PricingPlanCard.tsx` line 55–58  
```tsx
if (plan.isFree) {
  navigate(createAccountUrl(plan.id));  // → /signup/create-account?plan=explorer
  return;
}
```

**File:** `src/pages/signup/create-account.tsx` line 28  
```tsx
sessionStorage.setItem('redirectAfterLogin', welcomeUrl(planId, cycle));
// always sets redirect to /signup/welcome?plan=explorer&cycle=annual
```

`/signup/welcome` guards the Stripe call correctly (`if (plan?.isFree || plan?.isContactSales) return;` — line 65 of `src/pages/signup/welcome.tsx`), but the page still renders a "confirm your free month" heading and has no clear next step. The user is effectively stuck on a welcome page that shows a Stripe button only for paid plans.

**Correct path for Explorer:** The CTA should navigate to `/signup?plan=explorer` (the main signup page), skip the welcome step entirely after auth, and route directly to `/dashboard`. The `hasExplicitPlan` branch in `src/pages/signup/index.tsx` (line ~106) would fire and call `setPendingPlan('explorer', cycle)` then navigate to `welcomeUrl` — same problem.

**Recommended fix:** In `src/pages/signup/index.tsx`'s auth redirect `useEffect`, add an early-exit for free plans:
```tsx
if (isFromCampaign || hasExplicitPlan) {
  // NEW: free plans skip welcome entirely
  if (plan?.isFree) {
    navigate('/dashboard', { replace: true });
    return;
  }
  // ...existing paid plan welcome flow
}
```
Also update `PricingPlanCard.tsx` to route Explorer to `/signup?plan=explorer` (not `createAccountUrl`) so role intent is set.

### Finding: Explorer roleIntent is 'tenant' — correct but undocumented

`planSegmentToRoleIntent('renter')` → `'tenant'`. Explorer's `segment[0]` is `'renter'`, so Explorer signups get `roleIntent='tenant'` and skip `/select-role`. This is the right behavior but there is no code comment explaining the choice. Add one.

---

## Area 2 — planSegmentToRoleIntent Coverage

**File:** `src/pages/signup/index.tsx` lines 22–28

| Segment | Return value | Correct? |
|---------|-------------|---------|
| `'agent'` | `'agent'` | ✅ |
| `'landlord'` | `'landlord'` | ✅ |
| `'renter'` | `'tenant'` | ✅ |
| `'buyer'` | `'tenant'` | ✅ |
| anything else | `null` → falls back to `'tenant'` with console.warn | ✅ safe |

**Explorer plan (planId = 'explorer', segment = ['renter','buyer']):** `segment[0]` is `'renter'` → returns `'tenant'`. Correct.

**Direct `/signup` with no `?plan=` param:** `planId` defaults to `'starter'` (line 52). `getPlanById('starter')` is defined (landlord segment), so roleIntent gets set to `'landlord'`. A user who navigates directly to `/signup` without selecting a plan gets a landlord intent, which will skip `/select-role` and land them in `/landlord`. This is wrong — they should hit `/select-role`.

**Recommended fix:** When no `?plan=` param is present in the URL, do not set or should explicitly clear role intent. Change the default from `'starter'` to `null` (or check `searchParams.get('plan')` presence), and only call `setRoleIntent` when there was an explicit plan selection.

---

## Area 3 — /select-role Page — Loading Guard Bug

**File:** `src/pages/RoleSelect.tsx` line 58

```tsx
if (isLoading || (user && !user.roleResolved) || hasExistingRole) {
  return <spinner />;
}
```

`hasExistingRole` is defined on line 34:
```tsx
const hasExistingRole = Boolean(user?.roles && user.roles.length > 0);
```

A user who **already has a role** (`hasExistingRole = true`) will see a spinner instead of being redirected. The redirect logic lives in a `useEffect` (lines 24–28):
```tsx
React.useEffect(() => {
  if (!isLoading && user?.roleResolved && user.roles && user.roles.length > 0) {
    navigate(target, { replace: true });
  }
}, [user, isLoading, navigate]);
```

The effect runs, but the component returns a spinner *before* React even gets to commit the effect on the next render cycle. In practice, this causes a visible spinner flash before the redirect. The logic is also confusing: if `hasExistingRole` is the guard for the redirect effect, the spinner condition should not include it — the spinner is appropriate for `isLoading` or when `roleResolved` hasn't fired yet, not when there's an existing role.

**Recommended fix:** Remove `|| hasExistingRole` from the spinner guard. The effect already handles users with existing roles.

### Agent card completeness

The Agent card is fully implemented with inline styles matching the depth of Tenant and Landlord cards. It uses `S.agentCard` / `S.agentCardHover`, `S.agentBadge`, `S.agentCta` — all defined in the `S` style object. The icon placeholder (briefcase SVG) is clean and purposeful.

### Three-column responsive layout

The layout uses `flexWrap: 'wrap'` on `S.cardsRow` and `minWidth: 260` on `S.roleCard`. Cards will stack on narrow viewports. This works but is flex-based, not grid-based — on a 768px viewport, two cards may appear side-by-side while the third wraps to a new row, creating an asymmetric layout. A CSS Grid would be cleaner, but this is cosmetic.

### JSDoc comment

The JSDoc at the top of `RoleSelect.tsx` is updated to mention three role panels. No TS issues visible in the file itself.

---

## Area 4 — Pricing Page Tab Pre-selection

**File:** `src/pages/pricing/index.tsx` lines 42–51

```tsx
useEffect(() => {
  if (searchParams.get('segment')) return;
  if (!user?.roleResolved) return;
  const role = user?.roles?.[0];
  if (role === 'landlord') setAudience('landlords');
  else if (role === 'agent') setAudience('agents');
  else if (role === 'tenant') setAudience('renters');
}, [user?.roleResolved, user?.roles, searchParams]);
```

**Issues found:**

1. **`user?.roles` in the dependency array**: `user.roles` is an array reference. It may be the same array object across re-renders (depends on AuthContext), which would prevent the effect from re-running if the roles change. Use `user?.roles?.[0]` or `user?.roles?.join()` in the dep array to capture the actual value.
2. **`user` itself not in deps**: The `user` object is read via optional chaining but not listed. React's exhaustive-deps linter would flag this. If `user` is replaced (new object reference) rather than mutated, the effect would not re-run. This is typically benign but is a lint warning.
3. **`?segment=` guard**: Correctly placed — the first early-return in the `searchParams` effect handles the `?segment=` case, and the role-based effect has its own `searchParams.get('segment')` guard. No override issue.
4. **Infinite re-render risk**: None. `setAudience` only runs when a matching role is found, and the deps are stable primitives (with the caveat in item 1).

---

## Area 5 — ProtectedRoute — Banner Removal

**File:** `src/components/common/ProtectedRoute.tsx`

**Result: Clean.** No references to `switchDismissed`, `canSwitchRole`, `viewAs`, or banner state found. The banner removal is complete.

The hard redirect for landlord/agent accessing tenant routes is still present — and correct — because it's a genuine access control rule (not a switch mechanism):
```tsx
if (actualRole === 'landlord' || actualRole === 'agent') {
  if (isTenantRoute) {
    return <Navigate to="/landlord" replace />;
  }
}
```
This is correct and should stay.

---

## Area 6 — Marketing Pages CTAs

### AgentHome.tsx

**File:** `src/pages/AgentHome.tsx`

- Hero CTA: `onClick={() => navigate('/pricing?segment=agents')}` — correct, uses `useNavigate`. ✅
- "Go to Dashboard" handler: `window.location.href = '/landlord'` — uses hard navigation, not `useNavigate`. This works but is inconsistent; could be `navigate('/landlord')`.
- "Add Property" / "Setup Company": also use `window.location.href` with query strings. Acceptable for imperative navigation.
- **Critical gap:** `AgentHome` is imported in `App.tsx` line 33 but mounted on **no route**. The TypeScript error `TS6133: 'AgentHome' is declared but its value is never read` confirms this. The component exists and renders correctly if navigated to directly, but there is no route definition for it.

### HomeownerHome.tsx / HomeownerHomeVariantB.tsx

- Hero CTA: `handleGetStarted` → `navigate('/homeowner/dashboard')` — **this route does not exist in App.tsx**. The `/homeowner` path mounts `HomeownerHomeVariantB` itself, and there is no `/homeowner/dashboard` route. This causes an infinite redirect back to the same page (or a blank route).
- All secondary action handlers (`handleGoToMaintenance`, `handleGoToDocuments`) also navigate to `/homeowner/dashboard`.
- These pages appear to be feature-preview / placeholder pages for a homeowner product that hasn't been built yet. Until `/homeowner/dashboard` is implemented, all their CTAs are broken.

---

## Area 7 — Remaining Role-Switching References

Grep output (exact command):
```
grep -rn "switchRole|canSwitchRole|switchDismissed|RoleSelectionPopup|viewAs\b" src/ --include="*.tsx" --include="*.ts"
```
**Result: 0 matches** in source TypeScript/TSX files.

One incidental match found in `Footer.tsx`:
```
href="https://www.linkedin.com/company/luxcity-global/?viewAsMember=true"
```
This is an external LinkedIn URL string — not a code reference to the old role-switching mechanism. No action needed.

One match in `src/components/property/AuthPromptModal.tsx`:
```
Switch seamlessly between Tenant, Buyer, Landlord & Agent
```
This is marketing copy in a prompt modal — it describes the platform's capability, not a runtime role-switch feature. It does not reference removed functionality and does not need to change.

**Conclusion: role-switching code is fully removed.**

---

## Area 8 — TypeScript Build Status

Command: `npx tsc --noEmit --project tsconfig.app.json 2>&1 | head -60`

**Exit code: 0 (build succeeds despite errors)** — the tsconfig likely has `noUnusedLocals: false` or errors are set to warnings.

Key errors in output:

| File | Error | Action needed |
|------|-------|---------------|
| `src/App.tsx:33` | `TS6133: 'AgentHome' is declared but never read` | Mount it on a route or remove the import |
| `src/app/listings/success/page.tsx` | `TS2307: Cannot find module 'next/link'` | Delete this stale Next.js file — it's in a Vite project |
| `src/components/ReferencingModalLegacy.tsx` | Multiple TS6133 (unused vars) + TS18048 (`data` possibly undefined) + TS2322 (type mismatches) | Pre-existing legacy tech debt; out of scope unless this component is used |
| `src/components/HomeownerNavbar.tsx:17` | `TS6133: 'isHomeowner' is declared but never read` | Remove unused prop |
| Various | `TS6133` (unused imports/vars) | Pre-existing; low priority |

The `next/link` error is the only hard structural issue. All `TS6133` errors are unused-variable noise. The `TS18048` and `TS2322` errors in `ReferencingModalLegacy.tsx` are pre-existing and won't affect the new pricing/role flow.

---

## Prioritised Recommendations

### P1 — Must fix before the flow is correct

1. **Explorer free plan post-auth redirect**: Add a `plan?.isFree` early exit in the signup `useEffect` to route Explorer users directly to `/dashboard` instead of the welcome page. (`src/pages/signup/index.tsx`)

2. **Default planId 'starter' when no `?plan=` param**: The signup page defaults `planId` to `'starter'`, which causes landlord role intent to be set for direct `/signup` visitors. Either default to `null` (no plan) and skip `setRoleIntent`, or check `searchParams.get('plan')` before deriving intent. (`src/pages/signup/index.tsx` line 52)

3. **RoleSelect spinner guard**: Remove `|| hasExistingRole` from the spinner condition on line 58 — it's redundant and masks the redirect effect. (`src/pages/RoleSelect.tsx`)

### P2 — Functional correctness gaps

4. **Mount AgentHome on a route** or remove the import from `App.tsx`. The component is ready; it just needs `<Route path="/agent-home" element={<AgentHome />} />`. (`src/App.tsx`)

5. **HomeownerHome CTAs point to a non-existent route**: Either implement `/homeowner/dashboard` or update the navigate calls to point to `/landlord` (since homeowners are landlord-adjacent) or keep them as `navigate('/homeowner')` with a `?start=...` param. (`src/pages/HomeownerHome.tsx`, `src/pages/HomeownerHomeVariantB.tsx`)

6. **Delete stale Next.js files**: `src/app/listings/success/page.tsx` and `src/app/listings/new/page.tsx` import `next/link` which doesn't exist in this Vite project. They should be deleted.

### P3 — Code quality / polish

7. **Pricing page `useEffect` deps**: Replace `user?.roles` with `user?.roles?.[0]` in the dependency array to capture the primitive role string, avoiding an array-reference comparison that may not re-trigger. (`src/pages/pricing/index.tsx`)

8. **Add a code comment to `planSegmentToRoleIntent`** explaining that Explorer (segment 'renter') maps to 'tenant' intentionally and what that means for the /select-role bypass. (`src/pages/signup/index.tsx`)

9. **`window.location.href` in AgentHome handlers**: Replace with `useNavigate` calls for consistency with the rest of the SPA. (`src/pages/AgentHome.tsx`)
