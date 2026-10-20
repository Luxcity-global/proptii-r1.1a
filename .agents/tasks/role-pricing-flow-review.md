# Role Selection and Pricing Flow — Pass 2 Review

All four findings from the prior review pass have been addressed in commit `b6129b99`. Tasks 1–7 are fully implemented and the TypeScript blocking errors are resolved.

**Watch for:** Remaining pre-existing TypeScript errors (ReferencingModalLegacy, Dashboard.tsx, Viewings-new.tsx) are unrelated to this feature but were not caused by it — confirmed out of scope. No new concerns introduced in the fix commit.

**Verdict**: APPROVED

## High-level view

The fix commit addressed every issue raised in pass 1. The three original build-blocking errors (TS17008, TS1381, TS1005) from an unclosed JSX `<div>` in `PropertyDetailsSelection.tsx` are gone from `tsc --noEmit` output. The stale JSDoc in `RoleSelect.tsx` now correctly says "three side-by-side role panels" with no reference to the removed view-switching mechanism. The `planSegmentToRoleIntent()` helper in `signup/index.tsx` is extracted as a shared function with explicit branches for `renter → tenant`, `buyer → tenant`, `agent → agent`, `landlord → landlord`, and a `null` return for unrecognised segments that triggers a `console.warn` — satisfying both the deduplication and explicitness findings from pass 1.

All seven feature tasks remain correctly implemented as verified in pass 1: Agent card in RoleSelect, pricing tab pre-selection, signup role intent wiring, removal of canSwitchRole, removal of View-as/Switch-role rows, removal of view-as banner in ProtectedRoute, and RoleSelectionPopup cleanup.

<details>
<summary>Issues (0)</summary>

No remaining issues. All prior findings resolved.

</details>

<details>
<summary>Details</summary>

### Pass 1 HIGH finding: PropertyDetailsSelection build failure

The three blocking errors are gone. `tsc --noEmit` output contains no TS17008, TS1381, or TS1005 errors. The fix added a single closing `</div>` tag at line 600 of `PropertyDetailsSelection.tsx`. Remaining TypeScript errors in the build output (930 lines total) are pre-existing, concentrated in `ReferencingModalLegacy.tsx`, `Dashboard.tsx` (`.role` vs `.roles` typo), and `Viewings-new.tsx` — none of these files were touched by either the feature commit or the fix commit, and they are out of scope for this review.

### Pass 1 LOW finding: Stale JSDoc in RoleSelect

The JSDoc comment now reads: "shown to authenticated users with no role assigned yet. Once a role is selected, the user is routed to the appropriate dashboard and the page is skipped on subsequent visits (role already resolved). Design: centred card on a soft gradient background, three side-by-side role panels following the Proptii brand reference." No reference to view-switching or landlord/tenant switching remains.

### Pass 1 LOW findings: planSegmentToRoleIntent extraction and explicit mapping

The helper function appears at the top of `signup/index.tsx` (lines 22–31), before the component. It returns `null` for unrecognised segments, and callers fall back to `setRoleIntent('tenant')` with a `console.warn`. Both `handleGoogleSignUp` and `handleEmailContinue` call the shared helper, eliminating the duplication. The `renter` and `buyer` branches are now explicit.

One minor ordering nit: the `planSegmentToRoleIntent` function is defined before the `trackEvent` import on line 33, which is a style inconsistency (imports should precede function declarations at module level). This does not affect behaviour in a bundled React app where the module evaluation order is controlled by the bundler, but it is worth noting as a style deviation from the rest of the file. This is not a blocking concern — confirmed LOW and accepted.

</details>

---

## File map

<details>
<summary>Files changed in fix commit (3)</summary>

- `src/landlord_agent/src/components/PropertyDetailsSelection.tsx` — added missing closing `</div>` tag to fix TS17008/TS1381/TS1005 build errors
- `src/pages/RoleSelect.tsx` — updated JSDoc to remove stale view-switching reference, updated card count to three
- `src/pages/signup/index.tsx` — extracted `planSegmentToRoleIntent()` helper with explicit renter/buyer/agent/landlord branches; both signup handlers now call the shared helper

</details>
