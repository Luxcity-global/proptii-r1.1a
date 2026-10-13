# Mobile header overflow fixes across all landlord pages

This change addresses two production defects: a `ReferenceError: onAddProperty is not defined` crash on the Documents page and adjacent flows, and header overflow on all landlord pages when viewed on mobile. The approach applies a consistent `flex-wrap: nowrap; overflow-x: auto` scroll pattern to every page's header-actions container at `≤640px`, makes every sticky header `position: static` at `≤768px` to avoid overlapping the fixed 64px mobile nav bar, and adds `flex: 0 0 auto; white-space: nowrap` to CTA and icon buttons. The `onAddProperty` crash is patched with optional-chaining in `Dashboard.tsx` (4 call sites) and `PropertyDetails.tsx`'s sticky header is converted to `static md:sticky` via Tailwind. Build passes with zero TypeScript and zero Vite errors.

Watch for: `DocumentsPage.tsx` passes `onAddProperty` to `LandlordPageEmptyShell` without optional-chaining at the pass-through point — safe for now because the shell guards downstream with `{onAddProperty && …}`, but a future contract change would silently remove the guard without a TypeScript error. Low severity.

**Verdict**: APPROVED

---

## High-level view

The `onAddProperty` crash is patched at the four else-branch call sites in `Dashboard.tsx` with `?.()`, and `PropertyDetails.tsx`'s header switches from inline `position: sticky` to `static md:sticky` so it matches the CSS-level breakpoint all other pages use.

Every sticky-header CSS file now has a `@media (max-width: 768px)` block setting `position: static`. This was verified directly in each file — including `viewingsPage.css`, which places the static rule in a dedicated "Mobile responsiveness additions" 768px block. Contracts has no sticky base, so no override is needed there.

The horizontal-scroll pattern is consistent across all eight pages that needed it. Messages is intentionally left with `flex: 1` fill behavior since it has only two action buttons — documented as deliberate in the plan.

The `contractsPage.css` bug where the mobile rule silently targeted `.ll-ct-btn-add` (a non-existent class) instead of `.ll-ct-btn-send` has been corrected, making the CTA button rule effective for the first time.

---

<details>
<summary>Issues (0)</summary>

No blocking concerns. The `DocumentsPage.tsx` pass-through note in the summary is informational only.

</details>

<details>
<summary>Details</summary>

### onAddProperty crash fix

All four `onAddProperty()` bare calls in `Dashboard.tsx` (lines 740, 745, 750, 754) are now `onAddProperty?.()`. The call sites are inside `handleDocumentManage`, `handleAssignTenant`, `handleScheduleViewing`, and `handleRecordRent` — all else-branches that fire only when no other navigation handler is available.

`DocumentsPage.tsx` passes `onAddProperty` straight through to `LandlordPageEmptyShell`. No optional-chaining at the pass-through point. The shell guards downstream with `{onAddProperty && …}`, so no crash path exists today. If the shell's contract changes, TypeScript won't flag a missing guard because the prop is typed `optional` at the `DocumentsPage` boundary — the coupling is implicit.

`PropertyDetails.tsx` line 357 reads `className="static md:sticky top-0 z-30 …"`. On screens narrower than the Tailwind `md` breakpoint (768px), the header is `position: static`.

### Horizontal-scroll pattern coverage

All confirmed in source:

| Page        | actions class              | 640px nowrap+scroll | flex: 0 0 auto on CTAs | position: static at 768px |
| ----------- | -------------------------- | ------------------- | ---------------------- | ------------------------- |
| Dashboard   | `.ll-header-actions`       | ✅                  | ✅                     | ✅                        |
| Documents   | `.ll-docs-header-actions`  | ✅                  | ✅                     | ✅                        |
| Viewings    | `.ll-vw-header-actions`    | ✅                  | ✅                     | ✅                        |
| Contracts   | `.ll-ct-header-actions`    | ✅                  | ✅                     | N/A (no sticky base)      |
| Clients     | `.ll-cl-header-actions`    | ✅                  | ✅                     | ✅                        |
| Referencing | `.ll-ref-header-actions`   | ✅                  | ✅                     | ✅                        |
| Analytics   | `.ll-an-header-actions`    | ✅                  | ✅                     | ✅                        |
| Properties  | `.ll-props-header-actions` | ✅ (pre-existing)   | ✅ (pre-existing)      | ✅ (pre-existing)         |

Messages keeps `flex: 1` and `flex-wrap: wrap` — two-button full-width fill, intentional per the plan.

The `contractsPage.css` mobile rule previously targeted `.ll-ct-btn-add`, a class that doesn't exist in the TSX (actual class is `.ll-ct-btn-send`). That typo meant the mobile CTA rule had zero effect since the file was first written. Fix confirmed at lines 911–915 and 999–1003.

</details>

---

<details>
<summary>File map</summary>

| File                             | What changed                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `components/Dashboard.tsx`       | 4× `onAddProperty()` → `onAddProperty?.()`                                                                    |
| `components/PropertyDetails.tsx` | Header `sticky` → `static md:sticky` (Tailwind)                                                               |
| `styles/dashboardOverview.css`   | 768px static block added; 640px nowrap+scroll pattern; CTA/icon `flex: 0 0 auto`                              |
| `styles/documentsPage.css`       | 768px static block added; 640px nowrap+scroll; CTA/icon `flex: 0 0 auto`; duplicate 640px blocks consolidated |
| `styles/viewingsPage.css`        | 768px static block added; 640px nowrap+scroll; CTA/icon `flex: 0 0 auto`; orphaned supplemental block removed |
| `styles/contractsPage.css`       | 640px nowrap+scroll; `.ll-ct-btn-add` typo fixed to `.ll-ct-btn-send`; icon `flex: 0 0 auto`                  |
| `styles/clientsPage.css`         | 768px static block added; stacking rule moved from 480px to 640px; nowrap+scroll; CTA/icon `flex: 0 0 auto`   |
| `styles/referencingPage.css`     | 768px static block added; 640px nowrap+scroll; CTA/icon `flex: 0 0 auto`                                      |
| `styles/analyticsPage.css`       | 768px static block added; 640px nowrap+scroll; CTA/icon `flex: 0 0 auto`                                      |
| `styles/propertiesPage.css`      | Verified only — already had full pattern                                                                      |
| `styles/messagesPage.css`        | Verified only — `flex: 1` fill retained intentionally                                                         |
| `styles/clientDetails.css`       | No change — slide-over drawer, no nav overlap                                                                 |

Full diff: `git diff main -- src/landlord_agent/src/`

</details>
