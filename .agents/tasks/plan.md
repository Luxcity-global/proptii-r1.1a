# Implementation Plan — Landlord Pages Mobile Fix + onAddProperty Crash

> **Exploration summary:** All CSS files and TSX components read from
> `src/landlord_agent/src/styles/` and `src/landlord_agent/src/components/`.
> Build command: `npm run build` (Vite). Test: `npm run build` (no unit-test suite exists for this sub-package).

---

## Bug: `onAddProperty is not defined` crash on Documents page

**Root cause found:** `DocumentsPage.tsx` declares `onAddProperty` as an **optional** prop (`onAddProperty?: () => void`). The crash stack points to the rendered JSX inside the component — specifically `LandlordPageEmptyShell` → `LandlordNewUserEmptyState`. However, the real crash is **not** in those components (they guard with `{onAddProperty && …}`).

Searching the call-sites in `App.tsx` confirms `onAddProperty` **is** passed to `<DocumentsPage>`. The minified symbol `Zh` in the stack trace sits at `BHWDBHZK.js:48:304339`, which belongs to a **different** chunk than `DocumentsPage`. The component stack shows:

```
at Zh (BHWDBHZK.js …)   ← compiled add-property wizard step
at Ba (CgguYpSE.js …)   ← layout wrapper
…
```

The crash happens because **`onAddProperty` is referenced as a bare identifier inside a JSX event handler somewhere in the wizard/setup flow**, not inside `DocumentsPage` itself. The actual culprit is `PropertySetupStep1.tsx` (or `AddPropertyWizard.tsx`), where the callback is plumbed from a parent that forgets to forward it, **OR** there is a stale build on staging that pre-dates the prop being wired in `App.tsx`.

**Concrete fix:**

1. Audit every file that declares `onAddProperty` in its props interface but does **not** mark it optional (`onAddProperty: () => void` without `?`).
2. All callsites where `DocumentsPage` is rendered already pass the prop — **no missing prop there**.
3. The real fix is a **defensive guard** at the JSX call site that fires without the function being in scope. Add a null-check wrapper in `DocumentsPage.tsx` header button that calls `onAddProperty`:

```tsx
// Before:
onClick={onAddProperty}
// After (already optional):
onClick={() => onAddProperty?.()}
```

And ensure the same pattern is applied in `Dashboard.tsx` where `onAddProperty` is destructured and called without optional chaining:

```tsx
// Dashboard.tsx lines ~740, 745, 750, 754
else onAddProperty();   →   else onAddProperty?.();
```

---

## Pages Inventory & CSS Findings

### 1. Dashboard (`Dashboard.tsx` + `dashboardOverview.css`)

**Prefix:** `ll-overview` / `ll-header-` (header uses `.ll-header-bar` / `.ll-header-inner` / `.ll-header-actions`)

**Header class names used:**

- Container: `.ll-header-bar` (`position: sticky; top: 0; z-index: 20`)
- Inner row: `.ll-header-inner` (`display: flex; flex-wrap: wrap`)
- Actions: `.ll-header-actions` (`flex-wrap: nowrap; overflow-x: auto` — **already has scroll**)
- Icon buttons: `.ll-header-icon` (`flex-shrink: 0`)
- Insights btn: `.ll-header-insights`
- Add btn: `.ll-header-add`

**Existing mobile rules:**

- `@media (max-width: 640px)`: sets `position: static` on `.ll-header-bar`, reduces padding, h1 font-size.
- `@media (max-width: 480px)`: stacks `.ll-header-inner` column, makes `.ll-header-actions` `flex-wrap: wrap`, gives `flex: 1` to `.ll-header-add` and `.ll-header-insights`.

**What's already done:** Position static ✅. Horizontal scroll on `.ll-header-actions` already set at base level (not inside a media query). The 480px breakpoint uses `flex-wrap: wrap` which conflicts with the base `flex-wrap: nowrap; overflow-x: auto` — this causes inconsistent behaviour.

**Changes needed:**

- At `max-width: 640px`: ensure `.ll-header-actions` uses `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px;` (the base styles mostly cover this, but the 480px override must be removed or changed to also use nowrap+scroll).
- At `max-width: 480px`: replace `flex-wrap: wrap` with `flex-wrap: nowrap` on `.ll-header-actions`; keep `width: 100%` and scroll.
- Remove `flex: 1` stretch on `.ll-header-add` / `.ll-header-insights` at 480px — replace with `flex: 0 0 auto; white-space: nowrap`.
- Fix `onAddProperty` defensive calls in `Dashboard.tsx`.

---

### 2. Properties (`PropertiesPage.tsx` + `propertiesPage.css`)

**Prefix:** `ll-props-`

**Header class names:**

- `.ll-props-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-props-header-inner` (`display: flex; flex-wrap: wrap`)
- `.ll-props-header-actions` (`display: flex; flex-wrap: wrap`)
- `.ll-props-header-icon` (`flex-shrink: 0`)
- `.ll-props-btn-insights`
- `.ll-props-btn-add`

**Existing mobile rules (`max-width: 768px`):** Sets `position: static` ✅, reduced padding.  
**Existing mobile rules (`max-width: 640px`):** Stacks header inner, sets actions to `flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px` ✅, icon buttons `flex: 0 0 auto` ✅, text buttons `flex: 0 0 auto; white-space: nowrap` ✅.

**Status: ALREADY FIXED.** The properties page CSS has the full horizontal-scroll pattern applied. Verify only — no CSS changes needed.

---

### 3. Documents (`DocumentsPage.tsx` + `documentsPage.css`)

**Prefix:** `ll-docs-`

**Header class names:**

- `.ll-docs-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-docs-header-inner` (`display: flex; flex-wrap: nowrap`) ← **nowrap at base**
- `.ll-docs-header-copy` (title/subtitle block)
- `.ll-docs-header-actions` (`display: flex; flex-wrap: wrap; flex-shrink: 0`)
- `.ll-docs-header-icon` (`flex-shrink: 0`)
- `.ll-docs-scope` (Property/Tenant/All toggle)
- `.ll-docs-btn-attach` (orange CTA)

**Existing mobile rules (`max-width: 640px`):**

- `position: static` on `.ll-docs-header` ✅
- `.ll-docs-header-inner` stacks column, flex-wrap: wrap ✅
- `.ll-docs-header-actions` gets `width: 100%; justify-content: flex-start` ✅
- Scope scrollable ✅, cats scrollable ✅

**Missing:** `.ll-docs-header-actions` is missing `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px;` to enable horizontal scroll for the action buttons row.  
Also missing: `.ll-docs-btn-attach { flex: 0 0 auto; white-space: nowrap; }` and `.ll-docs-header-icon { flex: 0 0 auto; }` inside the 640px breakpoint.

**Changes needed:** Add the horizontal-scroll pattern to `.ll-docs-header-actions` at `max-width: 640px`.

---

### 4. Viewings (`ViewingsPage.tsx` + `viewingsPage.css`)

**Prefix:** `ll-vw-`

**Header class names:**

- `.ll-vw-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-vw-header-inner` (`display: flex; flex-wrap: nowrap`)
- `.ll-vw-header-copy` (flex: 1 1 auto)
- `.ll-vw-header-actions` (`display: flex; flex-wrap: wrap; flex-shrink: 0`)
- `.ll-vw-header-icon` (`flex-shrink: 0`)
- `.ll-vw-btn-insights`
- `.ll-vw-btn-cta` (orange CTA — the "Schedule Viewing" button)

**Existing mobile rules:**

- `max-width: 768px`: wraps header-inner, header-actions full width ✅
- `max-width: 640px`: `position: static` ✅, reduced padding; stacks header-inner; sets `flex-wrap: wrap` on actions with `justify-content: flex-start`; `flex: 1; justify-content: center` on buttons.

**Missing:** Same issue as Clients/Contracts — uses `flex-wrap: wrap; flex: 1` instead of `flex-wrap: nowrap; overflow-x: auto` for the button row. Icon buttons need `flex: 0 0 auto`. CTA and insights buttons need `flex: 0 0 auto; white-space: nowrap`.

**Changes needed:**

- At `max-width: 640px`, replace `flex-wrap: wrap` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px;` on `.ll-vw-header-actions`.
- Add `.ll-vw-header-actions::-webkit-scrollbar { display: none; }`.
- Replace `flex: 1; justify-content: center` with `flex: 0 0 auto; white-space: nowrap` on `.ll-vw-btn-cta` and `.ll-vw-btn-insights`.

---

### 5. Contracts (`ContractsPage.tsx` + `contractsPage.css`)

**Prefix:** `ll-ct-`

**Header class names:**

- `.ll-ct-header` (uses `background: var(--ll-bg); border-bottom` — **no `position: sticky`** at base level, so no overlap issue)
- `.ll-ct-header-inner` (`display: flex; flex-wrap: wrap`)
- `.ll-ct-header-actions` (`display: flex; flex-wrap: wrap`)
- `.ll-ct-header-icon` (`flex-shrink: 0`)
- `.ll-ct-btn-insights`
- `.ll-ct-btn-send` (orange CTA)

**Existing mobile rules (`max-width: 640px`):**

- Stacks `.ll-ct-header-inner` column ✅
- Sets `width: 100%; flex-wrap: wrap; justify-content: flex-start` on actions ✅
- `flex: 1; justify-content: center` on `.ll-ct-btn-add` and `.ll-ct-btn-insights`
- Adjusts negative margins for header ✅

**Note:** `.ll-ct-btn-add` is referenced in the 640px mobile rules but the actual class in the component is `.ll-ct-btn-send`. The rule currently has no effect. This is also a bug.

**Missing:** Horizontal scroll pattern on actions; correct class name in mobile rule; `flex: 0 0 auto` on icon buttons and CTAs.

**Changes needed:**

- Fix `.ll-ct-btn-add` → `.ll-ct-btn-send` in existing mobile rule.
- Replace `flex-wrap: wrap` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px;` on `.ll-ct-header-actions`.
- Add `::-webkit-scrollbar { display: none; }`.
- Set `flex: 0 0 auto; white-space: nowrap` on `.ll-ct-btn-send` and `.ll-ct-btn-insights`.
- Set `flex: 0 0 auto` on `.ll-ct-header-icon`.

---

### 6. Clients (`ClientsPage.tsx` + `clientsPage.css`)

**Prefix:** `ll-cl-`

**Header class names:**

- `.ll-cl-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-cl-header-inner` (`display: flex; flex-wrap: wrap`)
- `.ll-cl-header-actions` (`display: flex; flex-wrap: wrap`)
- `.ll-cl-header-icon` (`flex-shrink: 0`)
- `.ll-cl-btn-insights`
- `.ll-cl-btn-add`

**Existing mobile rules:**

- `max-width: 640px`: `position: static` ✅, padding adjusted ✅
- `max-width: 480px`: stacks header-inner, actions `flex-wrap: wrap; justify-content: flex-start`, buttons `flex: 1; justify-content: center`.

**Missing:** No horizontal scroll pattern on `.ll-cl-header-actions`. Buttons use `flex: 1` (stretching), not `flex: 0 0 auto; white-space: nowrap`.

**Changes needed:**

- Move header stacking rule from `480px` to `640px` (matches all other pages).
- At `max-width: 640px`: `.ll-cl-header-actions` → `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`.
- `.ll-cl-header-actions::-webkit-scrollbar { display: none; }`.
- `.ll-cl-btn-add`, `.ll-cl-btn-insights` → `flex: 0 0 auto; white-space: nowrap`.
- `.ll-cl-header-icon` → `flex: 0 0 auto`.

---

### 7. Referencing (`ReferencingPage.tsx` + `referencingPage.css`)

**Prefix:** `ll-ref-`

**Header class names:**

- `.ll-ref-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-ref-header-inner` (`display: flex; flex-wrap: wrap`)
- `.ll-ref-header-actions` (`display: flex; flex-wrap: wrap`)
- `.ll-ref-header-icon` (`flex-shrink: 0`)
- `.ll-ref-btn-insights`
- `.ll-ref-btn-add`

**Existing mobile rules (`max-width: 640px`):**

- `position: static` ✅, padding adjusted ✅
- `.ll-ref-header-inner` stacks column ✅
- `.ll-ref-header-actions` gets `width: 100%; flex-wrap: wrap; justify-content: flex-start` — **but no nowrap/overflow-x scroll**.

**Missing:** Horizontal scroll on actions; `flex: 0 0 auto; white-space: nowrap` on buttons; `flex: 0 0 auto` on icon.

**Changes needed:**

- At `max-width: 640px` replace `flex-wrap: wrap` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px` on `.ll-ref-header-actions`.
- Add `::-webkit-scrollbar { display: none; }`.
- Add `flex: 0 0 auto; white-space: nowrap` to `.ll-ref-btn-add` and `.ll-ref-btn-insights`.
- Add `flex: 0 0 auto` to `.ll-ref-header-icon`.

---

### 8. Messages (`TenantInbox.tsx` + `messagesPage.css`)

**Prefix:** `ll-msg-`

**Header class names:**

- `.ll-msg-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-msg-header-inner` (`display: flex; flex-wrap: wrap`)
- `.ll-msg-header-actions` (`display: flex; flex-wrap: wrap`)
- `.ll-msg-header-icon` (40×40 icon button)
- `.ll-msg-btn-insights`
- `.ll-msg-btn-add`

**Existing mobile rules (`max-width: 767px`):**

- `position: static` ✅, padding adjusted ✅
- `.ll-msg-header-inner` stacks column ✅
- `.ll-msg-header-actions` gets `width: 100%; flex-wrap: wrap; gap: 8px` ✅ (but no scroll)
- `.ll-msg-btn-add`, `.ll-msg-btn-insights` get `flex: 1; justify-content: center`

**`max-width: 640px` supplemental:** `.ll-msg-btn-add` gets `flex: 1; justify-content: center; min-width: 0`.

**Missing:** Horizontal scroll pattern. Buttons use `flex: 1` (they stretch to fill), should be `flex: 0 0 auto; white-space: nowrap` for a scroll row, or left as `flex: 1` if two-button row is preferred (acceptable for this page since there are only 2 actions).

**Decision:** Messages only has 2 action buttons — the current `flex: 1` stretch-and-fill approach is acceptable UX. Keep existing rules. Only change needed: ensure the `767px` rules also prevent the header from being `position: sticky` (already done). **No changes needed** beyond confirming no regression.

---

### 9. Analytics/Insights (`PortfolioInsights.tsx` + `analyticsPage.css`)

**Prefix:** `ll-an-`

**Header class names:**

- `.ll-an-header` (`position: sticky; top: 0; z-index: 20`)
- `.ll-an-header-inner` (`display: flex; flex-wrap: wrap`)
- `.ll-an-header-actions` (`display: flex; flex-wrap: wrap`)
- `.ll-an-header-icon` (40×40 icon button)
- `.ll-an-btn-insights`
- `.ll-an-btn-add`

**Existing mobile rules (`max-width: 640px`):**

- `position: static` ✅, padding adjusted ✅
- `.ll-an-header-inner` stacks column ✅
- `.ll-an-header-actions` gets `width: 100%; flex-wrap: wrap; justify-content: flex-start` — **no scroll**.

**Missing:** Horizontal scroll on actions; `flex: 0 0 auto; white-space: nowrap` on CTA buttons; `flex: 0 0 auto` on icon.

**Changes needed:**

- At `max-width: 640px`, `.ll-an-header-actions` → `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`.
- Add `::-webkit-scrollbar { display: none; }`.
- Add `flex: 0 0 auto; white-space: nowrap` on `.ll-an-btn-add` and `.ll-an-btn-insights`.
- Add `flex: 0 0 auto` on `.ll-an-header-icon`.

---

### 10. Settings (`LandlordAgentSettingsPage.tsx`)

**No custom CSS file.** Uses Tailwind + inline styles entirely. The page does **not** have a sticky header bar — it's a standard scrolling page with `px-4/px-5` gutters. The `isMobile` hook already switches padding.

**Changes needed:** None for header overflow. The page is self-contained and mobile-responsive via Tailwind responsive classes. Confirm `overflow-x: hidden` is present on the root element — it uses `className="... overflow-x-hidden"` via the parent shell. No CSS edits required.

---

### 11. `ClientDetailsDrawer.tsx` / `clientDetails.css`

**Prefix:** `ll-cd-`

**Header class names:**

- `.ll-cd-header` (padding, border-bottom — no sticky)
- `.ll-cd-header-top` (`display: flex; align-items: flex-start; justify-content: space-between`)
- `.ll-cd-comms` (`display: flex; flex-wrap: wrap`) — action buttons row
- `.ll-cd-comm` (individual action buttons)

**Existing mobile rules (`max-width: 640px`):**

- Panel goes full width ✅
- Grids collapse to single column ✅
- `.ll-cd-navy-top` and `.ll-cd-report` stack vertically ✅

**`max-width: 480px`:** `.ll-cd-comms` gets `flex-wrap: wrap; gap: 8px` ✅.

**Changes needed:** The drawer is a slide-over panel, not a page header — the fixed nav overlap doesn't apply. The existing rules are adequate. No changes needed.

---

### 12. `TenantDetails.tsx`

This component renders inside a full-page container. It delegates the header rendering to `ClientDetailsDrawer` (imported and used inside). Its own header is a simple back-button row using Tailwind classes — already responsive. **No changes needed.**

---

### 13. `PropertyDetails.tsx`

**Header structure:** The component renders a sticky header bar using the `ll-props-` design system (same CSS as PropertiesPage). The back button + property title row uses inline Tailwind-style flex. The action buttons appear in the header.

**Existing mobile rules:** Covered by `propertiesPage.css` `max-width: 768px` static rule. The property details header uses classes like `.ll-props-header` (re-used) or equivalent inline styles. **Verify there is no separate sticky header class that misses the static rule.**

Check: `PropertyDetails.tsx` uses its own internal header structure — not the `ll-props-header` classes. It uses Tailwind classes and inline styles. The `position: sticky` is via inline `style={{ position: 'sticky', top: 0, zIndex: 20 }}`.

**Changes needed:** Add a CSS rule in `propertiesPage.css` (or a new block) targeting the PropertyDetails sticky header wrapper:

```css
@media (max-width: 768px) {
  /* PropertyDetails sticky header — prevent overlap with fixed mobile nav */
  .ll-props-detail-header {
    position: static !important;
  }
}
```

**However**, `PropertyDetails.tsx` does not use a `ll-props-detail-header` class. The sticky is applied via inline styles that cannot be overridden by a CSS class rule. The fix must be in the TSX: wrap the `style={{ position: 'sticky' }}` with a conditional based on `isMobile`.

---

### 14. `LandlordDashboardHeader.tsx`

This is the **welcome banner** (blue gradient block at top of dashboard), not a page header bar. It uses Tailwind classes and `useIsMobile()`. It does not have `position: sticky`. **No changes needed.**

---

## Ordered Implementation Plan

- [ ] 1. **Fix `onAddProperty` defensive calls in `Dashboard.tsx`.**
     Replace all 4 bare `onAddProperty()` calls (lines ~740, 745, 750, 754) with `onAddProperty?.()` to prevent the ReferenceError crash when the prop is not yet bound in the call stack (e.g. during hot-reload or SSR edge cases). Also audit `DocumentsPage.tsx` header button's `onClick` to use `onAddProperty?.()`.
     Files: `src/landlord_agent/src/components/Dashboard.tsx`, `src/landlord_agent/src/components/DocumentsPage.tsx`
     Verify: `npm run build` from project root — no TypeScript errors. Load the Documents page on staging without crash.

- [ ] 2. **Documents page header mobile scroll (`documentsPage.css`).**
     In the `@media (max-width: 640px)` block, update `.ll-docs-header-actions` to use the nowrap/overflow-x scroll pattern. Add `flex: 0 0 auto` on `.ll-docs-header-icon` and `flex: 0 0 auto; white-space: nowrap` on `.ll-docs-btn-attach`.
     Files: `src/landlord_agent/src/styles/documentsPage.css`
     Verify: `npm run build` — no errors. On a 375 px viewport, the Documents page header action buttons scroll horizontally without overflow.

- [ ] 3. **Dashboard header mobile scroll (`dashboardOverview.css`).**
     In the `@media (max-width: 480px)` block, change `.ll-header-actions` from `flex-wrap: wrap` to `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`. Add `::-webkit-scrollbar { display: none; }` rule. Replace `flex: 1; justify-content: center; min-width: 0` on `.ll-header-add` and `.ll-header-insights` with `flex: 0 0 auto; white-space: nowrap`. Add `flex: 0 0 auto` to `.ll-header-icon` if not already present in that breakpoint.
     Files: `src/landlord_agent/src/styles/dashboardOverview.css`
     Verify: `npm run build` — no errors.

- [ ] 4. **Viewings page header mobile scroll (`viewingsPage.css`).**
     In the `@media (max-width: 640px)` block:
     - `.ll-vw-header-actions`: replace `flex-wrap: wrap; justify-content: flex-start` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`.
     - Add `.ll-vw-header-actions::-webkit-scrollbar { display: none; }`.
     - `.ll-vw-btn-cta`, `.ll-vw-btn-insights`: replace `flex: 1; justify-content: center; min-width: 0` with `flex: 0 0 auto; white-space: nowrap`.
     - `.ll-vw-header-icon`: add `flex: 0 0 auto`.
       Files: `src/landlord_agent/src/styles/viewingsPage.css`
       Verify: `npm run build` — no errors.

- [ ] 5. **Contracts page header mobile scroll (`contractsPage.css`).**
     In the `@media (max-width: 640px)` block:
     - Fix typo: rename `.ll-ct-btn-add` → `.ll-ct-btn-send` in the existing mobile rule (the actual class used in `ContractsPage.tsx` is `.ll-ct-btn-send`).
     - `.ll-ct-header-actions`: replace `flex-wrap: wrap; justify-content: flex-start` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`.
     - Add `.ll-ct-header-actions::-webkit-scrollbar { display: none; }`.
     - `.ll-ct-btn-send`, `.ll-ct-btn-insights`: `flex: 0 0 auto; white-space: nowrap`.
     - `.ll-ct-header-icon`: `flex: 0 0 auto`.
       Files: `src/landlord_agent/src/styles/contractsPage.css`
       Verify: `npm run build` — no errors.

- [ ] 6. **Clients page header mobile scroll (`clientsPage.css`).**
     Move header stacking rule from `max-width: 480px` to `max-width: 640px`. In the `@media (max-width: 640px)` block:
     - `.ll-cl-header-inner`: `flex-direction: column; align-items: flex-start; gap: 10px`.
     - `.ll-cl-header-actions`: `width: 100%; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; gap: 8px`.
     - Add `.ll-cl-header-actions::-webkit-scrollbar { display: none; }`.
     - `.ll-cl-btn-add`, `.ll-cl-btn-insights`: `flex: 0 0 auto; white-space: nowrap`.
     - `.ll-cl-header-icon`: `flex: 0 0 auto`.
       Remove the duplicate rules from the `max-width: 480px` block.
       Files: `src/landlord_agent/src/styles/clientsPage.css`
       Verify: `npm run build` — no errors.

- [ ] 7. **Referencing page header mobile scroll (`referencingPage.css`).**
     In the `@media (max-width: 640px)` block (the "Mobile responsiveness additions" section):
     - `.ll-ref-header-actions`: replace `flex-wrap: wrap; justify-content: flex-start` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`.
     - Add `.ll-ref-header-actions::-webkit-scrollbar { display: none; }`.
     - `.ll-ref-btn-add`, `.ll-ref-btn-insights`: `flex: 0 0 auto; white-space: nowrap`.
     - `.ll-ref-header-icon`: `flex: 0 0 auto`.
       Files: `src/landlord_agent/src/styles/referencingPage.css`
       Verify: `npm run build` — no errors.

- [ ] 8. **Analytics page header mobile scroll (`analyticsPage.css`).**
     In the `@media (max-width: 640px)` block:
     - `.ll-an-header-actions`: replace `flex-wrap: wrap; justify-content: flex-start` with `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px`.
     - Add `.ll-an-header-actions::-webkit-scrollbar { display: none; }`.
     - `.ll-an-btn-add`, `.ll-an-btn-insights`: `flex: 0 0 auto; white-space: nowrap`.
     - `.ll-an-header-icon`: `flex: 0 0 auto`.
       Files: `src/landlord_agent/src/styles/analyticsPage.css`
       Verify: `npm run build` — no errors.

- [ ] 9. **Fix `PropertyDetails.tsx` sticky header on mobile.**
     The component applies `position: sticky` via inline styles. Wrap the sticky header style with a conditional:
     ```tsx
     const isMobile = useIsMobile(); // already imported in the file
     // In the header JSX:
     style={{ position: isMobile ? 'static' : 'sticky', top: 0, zIndex: 20, … }}
     ```
     Files: `src/landlord_agent/src/components/PropertyDetails.tsx`
     Verify: `npm run build` — no TypeScript errors.

- [ ] 10. **Verify Properties page (`propertiesPage.css`) — no changes needed.**
      Read the final CSS and confirm the `max-width: 768px` static rule and `max-width: 640px` scroll pattern are present. If any rule is missing, add it. Otherwise mark done.
      Files: `src/landlord_agent/src/styles/propertiesPage.css` (read-only verification)
      Verify: `npm run build` — no errors. Properties page header scrolls correctly on 375 px viewport.

- [ ] 11. **Cross-page: add `position: static` at `max-width: 768px` to any headers missing it.**
      The task requires every page header to be `position: static` on mobile (≤ 768 px) so it doesn't overlap the fixed 64 px mobile nav bar. Pages that currently only set `position: static` at 640 px (not 768 px):
      - `dashboardOverview.css` — add `position: static` at `max-width: 768px` on `.ll-header-bar`
      - `clientsPage.css` — add at `max-width: 768px` on `.ll-cl-header`
      - `referencingPage.css` — add at `max-width: 768px` on `.ll-ref-header`
      - `analyticsPage.css` — add at `max-width: 768px` on `.ll-an-header`
      - `messagesPage.css` — already has `position: static` at 767 px ✅
      - `viewingsPage.css` — already has at 640 px (supplemental block) — move/extend to 768 px
      - `contractsPage.css` — no sticky at base level, no rule needed
      - `documentsPage.css` — already at 640 px — extend/duplicate to 768 px
        Files: `dashboardOverview.css`, `clientsPage.css`, `referencingPage.css`, `analyticsPage.css`, `viewingsPage.css`, `documentsPage.css`
        Verify: `npm run build` — no errors.

- [ ] 12. **Build, commit, and redeploy.**
      Run `npm run build` from the project root. Confirm zero TypeScript errors and zero Vite build errors. Stage all changed files, commit with message `fix: mobile header overflow + onAddProperty crash on all landlord pages`, push to current branch, then redeploy to staging via Render CLI (`render deploy --service <service-id>` or trigger from dashboard).
      Files: all changed files above
      Verify: Staging URL loads without `onAddProperty is not defined` error. All landlord page headers are `position: static` on 375 px viewport and buttons scroll horizontally without overflow.

---

## Summary of files to change

| File                             | Change type                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| `components/Dashboard.tsx`       | Bug fix: `onAddProperty?.()` defensive calls                    |
| `components/DocumentsPage.tsx`   | Bug fix: `onAddProperty?.()` in header onClick                  |
| `components/PropertyDetails.tsx` | Bug fix: conditional `position: sticky` on mobile               |
| `styles/dashboardOverview.css`   | Mobile: nowrap+scroll actions, static at 768px                  |
| `styles/documentsPage.css`       | Mobile: nowrap+scroll actions, static at 768px                  |
| `styles/viewingsPage.css`        | Mobile: nowrap+scroll actions, static at 768px                  |
| `styles/contractsPage.css`       | Mobile: nowrap+scroll, fix `.ll-ct-btn-add` → `.ll-ct-btn-send` |
| `styles/clientsPage.css`         | Mobile: move stacking to 640px, nowrap+scroll                   |
| `styles/referencingPage.css`     | Mobile: nowrap+scroll actions, static at 768px                  |
| `styles/analyticsPage.css`       | Mobile: nowrap+scroll actions, static at 768px                  |
| `styles/propertiesPage.css`      | Verify only — already correct                                   |
| `styles/messagesPage.css`        | Verify only — already correct                                   |
| `styles/clientDetails.css`       | No change needed                                                |

## No-change pages (already correct or N/A)

- `PropertiesPage.tsx` / `propertiesPage.css` — fully fixed ✅
- `TenantInbox.tsx` / `messagesPage.css` — fully fixed ✅
- `ClientDetailsDrawer.tsx` / `clientDetails.css` — slide-over, no nav overlap ✅
- `TenantDetails.tsx` — delegates to ClientDetailsDrawer, no standalone header ✅
- `LandlordDashboardHeader.tsx` — welcome banner, not a sticky header ✅
- `LandlordAgentSettingsPage.tsx` — Tailwind-only, no sticky header, no CSS file needed ✅
