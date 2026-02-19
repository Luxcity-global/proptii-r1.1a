# 0124 Home Screen Rollback (If Needed) — 19 Jan 2026

Runbook for reverting the default landing page from the new home (HomeVariant / home-v2) back to the original home (HomeLegacy) when required.

**Related:** [0123-new-home-screen-design.md](0123-new-home-screen-design.md) (implementation plan and routing summary).

---

## When to use this rollback

- Critical issues on the new home (HomeVariant) that cannot be fixed quickly.
- Business decision to revert to the original landing experience.
- Need to give users the old home while the new design is fixed or re-evaluated.

**No code change needed:** If only some users need the old experience, keep sending them to **`/home-legacy`** or **`/?variant=legacy`**. This runbook is for making the **default** landing (e.g. `/` and `/home`) show the legacy home again.

---

## Current state (before rollback)

| Path | Renders | Notes |
|------|--------|--------|
| `/` | HomeVariant (new home) | Default landing. |
| `/home-v2` | HomeVariant | Alias. |
| `/home` | Redirect to `/` | Same as above. |
| `/home-legacy` | HomeLegacy (original home) | Archived; always available. |
| `/?variant=legacy` | HomeLegacy | Query override. |

**Files involved:** [src/App.tsx](../../../src/App.tsx), [src/pages/HomeVariant.tsx](../../../src/pages/HomeVariant.tsx), [src/pages/HomeLegacy.tsx](../../../src/pages/HomeLegacy.tsx).

---

## Rollback option 1: Quick code change (recommended)

Make `/` and `/home` show the legacy home again with a small change in `App.tsx`.

### Step 1: Change default in `HomeEntry`

**File:** `src/App.tsx`

**Current (new home as default):**

```tsx
/** Default landing is HomeVariant (home-v2). Use ?variant=legacy to show archived home. */
const HomeEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('variant');

  if (variant === 'legacy') {
    return <HomeLegacy />;
  }

  return <HomeVariant />;
};
```

**After rollback (legacy home as default):**

```tsx
/** ROLLBACK: Default landing is HomeLegacy. Use ?variant=v2 to show new home. */
const HomeEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('variant');

  if (variant === 'v2') {
    return <HomeVariant />;
  }

  return <HomeLegacy />;
};
```

So: swap the condition from `variant === 'legacy'` to `variant === 'v2'`, and swap the two return statements (default becomes `HomeLegacy`, and `?variant=v2` shows `HomeVariant`).

### Step 2 (optional): Make `/home-v2` redirect to `/`

If you want `/home-v2` to also show the legacy home (same as `/`), replace the route:

**Current:**

```tsx
<Route path="/home-v2" element={<HomeVariant />} />
```

**After (optional):**

```tsx
<Route path="/home-v2" element={<Navigate to="/" replace />} />
```

Then both `/` and `/home-v2` will show `HomeLegacy` (because `HomeEntry` now defaults to legacy). If you prefer to keep `/home-v2` as the only way to reach the new home during rollback, leave this route as `<Route path="/home-v2" element={<HomeVariant />} />`.

### Step 3: Deploy

- Build and deploy the app as usual.
- Verify: open `/` and `/home` — both should show the original (legacy) home.
- Optional: verify `/?variant=v2` still shows the new home if you did not redirect `/home-v2`.

---

## Rollback option 2: No code change

- **Do nothing** in the repo.
- Send users who need the old experience to:
  - **`/home-legacy`**, or  
  - **`/?variant=legacy`**
- Use this when only a subset of users need the legacy home or when you are about to fix and re-release the new home shortly.

---

## Re-enabling the new home as default (after rollback)

When you want the new home (HomeVariant) to be the default again:

1. In `src/App.tsx`, restore `HomeEntry` so that the **default** is `HomeVariant` and only `?variant=legacy` shows `HomeLegacy` (i.e. revert the logic in Rollback option 1, Step 1).
2. If you had changed `/home-v2` to a redirect, restore `<Route path="/home-v2" element={<HomeVariant />} />`.
3. Deploy.

This matches the state described in [0123-new-home-screen-design.md](0123-new-home-screen-design.md).

---

## Summary

| Action | What to do |
|--------|------------|
| **Rollback default to legacy** | In `App.tsx`, make `HomeEntry` default to `HomeLegacy` and use `?variant=v2` for `HomeVariant`. Optionally redirect `/home-v2` to `/`. Then deploy. |
| **No code rollback** | Direct users to `/home-legacy` or `/?variant=legacy`. |
| **Re-enable new home** | Restore `HomeEntry` to default to `HomeVariant` and (if changed) restore `/home-v2` to render `HomeVariant`. Deploy. |

Document version: 19 Jan 2026.
