# 0123 New Home Screen Design — Implementation Plan

## Purpose

Archive the current home page so it can be rolled back if needed, and make the home-v2 design (HomeVariant) the default landing experience. This plan keeps the legacy home in the codebase and documents a clear rollback path.

---

## Current State

| Item | Location | Role |
|------|----------|------|
| Current home (original) | `src/pages/Home.tsx` | Rendered at `/` when `?variant=v2` is not present |
| New home (home-v2) | `src/pages/HomeVariant.tsx` | Rendered at `/home-v2` and at `/` when `?variant=v2` |
| Router entry | `src/App.tsx` | `HomeEntry` chooses Home vs HomeVariant via query param; `/home-v2` route renders HomeVariant |

---

## Goals

1. **Archive current home** — Preserve it in the repo under a clear “legacy” identity so it can be restored without digging through history.
2. **Make home-v2 the default** — All users hitting `/` (and optional `/home`) see HomeVariant unless they explicitly request the legacy home.
3. **Enable simple rollback** — One config/routing change (or single revert) to switch back to the original home if needed.

---

## Implementation Plan

### Phase 1: Archive the current home page

| Step | Action | Details |
|------|--------|---------|
| 1.1 | Rename `Home.tsx` to `HomeLegacy.tsx` | Keeps the same component logic; only file and export name change. Update the default export to `HomeLegacy` (or keep `Home` as export name for minimal import changes). |
| 1.2 | Move to an archived path (optional) | Either keep `src/pages/HomeLegacy.tsx` or move to `src/pages/archive/HomeLegacy.tsx` (or `src/pages/landing/HomeLegacy.tsx`) so the “archived” status is obvious. If moved, update any imports. |
| 1.3 | Update imports in `App.tsx` | Replace `import Home from './pages/Home'` with `import HomeLegacy from './pages/HomeLegacy'` (or from the chosen archive path). Use `HomeLegacy` only for the legacy route and rollback path. |
| 1.4 | Add a dedicated legacy route | Add a route (e.g. `/home-legacy`) that renders `HomeLegacy`. This allows: (a) direct access to the old design for QA or comparison, (b) rollback by redirecting `/` to this route if needed. |

**Deliverable:** Current home is archived as `HomeLegacy`, reachable at `/home-legacy`; no change yet to what users see at `/`.

---

### Phase 2: Make home-v2 the default

| Step | Action | Details |
|------|--------|---------|
| 2.1 | Change default at `/` to HomeVariant | In `App.tsx`, change `HomeEntry` so that `/` renders `HomeVariant` by default (e.g. remove the `?variant=v2` check and always render `HomeVariant`, or invert the logic so `variant=legacy` shows `HomeLegacy`). |
| 2.2 | Keep `/home-v2` as alias | Leave `<Route path="/home-v2" element={<HomeVariant />} />` so existing links and bookmarks to `/home-v2` still work. Optionally add a redirect from `/home-v2` to `/` for consistency (or keep both URLs rendering the same content). |
| 2.3 | Optional: redirect `/home` to `/` | If the app uses `/home`, add a redirect to `/` so “home” always means the new default. |
| 2.4 | Update internal “Back to Home” / “Home” links | Ensure Navbar, Footer, and any “Back to Home” / “Go to Home” links point to `/` (or `/home-v2` if you keep that as the canonical URL). No code change if they already use `/`. |

**Deliverable:** `/` and `/home-v2` show HomeVariant; `/home-legacy` shows the archived home.

---

### Phase 3: Rollback strategy and documentation

| Step | Action | Details |
|------|--------|---------|
| 3.1 | Document rollback in this file (or runbook) | See **Rollback** section below. |
| 3.2 | Optional: feature flag for default home | If the app has a feature-flag or env-driven config, add a flag (e.g. `DEFAULT_HOME=V2` vs `DEFAULT_HOME=LEGACY`) and have `HomeEntry` read it. Rollback = flip the flag and redeploy (no code revert). |
| 3.3 | Optional: query-param override | Keep support for `?variant=legacy` to force the legacy home for testing or support, without changing the default. |

**Deliverable:** Clear rollback steps; optional flag or query param for non-code rollback.

---

## Routing Summary (after implementation)

| Path | Component | Notes |
|------|-----------|--------|
| `/` | HomeVariant | Default landing (new design). |
| `/home-v2` | HomeVariant | Alias for backwards compatibility. |
| `/home-legacy` | HomeLegacy | Archived original home; used for rollback and QA. |
| `/?variant=legacy` | (optional) HomeLegacy | Optional override to show legacy without changing routes. |

---

## Rollback

**If the new default must be reverted:**

1. **Quick (code) rollback**  
   - In `App.tsx`: point the `/` route back to `HomeLegacy` (or restore `HomeEntry` to “default = Home, v2 only when `?variant=v2`”).  
   - Deploy.  
   - Optional: redirect `/home-v2` to `/` so both URLs show the legacy home again.

2. **Flag-based rollback (if Phase 3.2 implemented)**  
   - Set `DEFAULT_HOME=LEGACY` (or equivalent).  
   - Redeploy or restart so `HomeEntry` reads the flag and renders `HomeLegacy` at `/`.

3. **No code change**  
   - Keep using `/home-legacy` for users who need the old experience while you fix issues with the new default.

---

## File Change Checklist

- [x] `src/pages/Home.tsx` → renamed to `HomeLegacy.tsx` (archived); original removed.
- [x] `src/App.tsx`: import `HomeLegacy`, add route `/home-legacy`, add `/home` → `/`, default `HomeEntry` to `HomeVariant`.
- [x] (Optional) `src/App.tsx`: support `?variant=legacy` in `HomeEntry` to render `HomeLegacy`.
- [ ] (Optional) Feature flag or env for default home; document in runbook or env template.
- [x] Update this document with “Completed” and date when implementation is done. **Completed:** 2026-02-19. Default landing is HomeVariant at `/`; legacy at `/home-legacy` and `/?variant=legacy`.

---

## References

- Current routing and home entry: `src/App.tsx`
- New home (home-v2): `src/pages/HomeVariant.tsx`
- Original home (archived): `src/pages/HomeLegacy.tsx`
- Landing page fixes context: [01-landingpage-immediate-fixes.md](01-landingpage-immediate-fixes.md), [101-immediate-fixes-progress-report.md](101-immediate-fixes-progress-report.md)
