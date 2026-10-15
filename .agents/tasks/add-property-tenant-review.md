# Add-property → add-tenant flow without discarding wizard state

The wizard previously navigated directly to the add-tenant screen when the user clicked "Add a Tenant Now", losing all unsaved property data. This change fixes that by auto-saving the property first via a new `savePropertyFromWizard` helper, setting `selectedProperty` to the server-canonical record, then opening the tenant popup. The `previousScreen` sentinel `'add-tenant-from-wizard'` gates back and success navigation across the entire add-tenant sub-flow. `propertySetupData` is cleared on successful tenant save to prevent stale wizard state from leaking into a later run.

**Watch for:** (confirmed) `previousScreen` is intentionally not cleared inside `onSave` — `onBack` uses it to navigate to `property-details` after the success screen. If the user hits "Add Another Tenant" (which resets the form without calling `onBack`) and saves a second tenant, the sentinel is still set and `propertySetupData` is already blank; the second save still wires the correct `propertyId` from `selectedProperty.id`, but this re-entry path is implicit and undocumented. (likely) `SelectExistingTenant` is not wired with `preselectedPropertyId={selectedProperty?.id}` in its `add-tenant-from-wizard` invocation — if the component's internal assignment logic does not pick up `selectedProperty`, the user may land on a `property-details` page for a property not yet linked to the tenant they selected.

**Verdict**: NEEDS_CHANGES

---

## High-level view

`savePropertyFromWizard` runs the full publish pipeline (image upload, document upload, backend POST, server-canonical fetch) and returns the real `Property` before the tenant popup opens. The `wizardData` argument overwrites every relevant field in the legacy `propertySetupData` shape, so non-linear wizard navigation can't contaminate the save.

The `previousScreen = 'add-tenant-from-wizard'` sentinel controls routing across `add-tenant`, `invite-tenant`, and `select-existing-tenant`. All three screens clear the sentinel in their `onBack` and `onSuccess` handlers. The `TenantSelectionPopup` guards against overwriting the sentinel if it's already set. The only unguarded re-entry is the "Add Another Tenant" button, which resets the AddTenant form internally without resetting `previousScreen`.

Save failures in `savePropertyFromWizard` are re-thrown, caught by the wizard's step-5 `onAddTenant` handler, and routed into the wizard's `globalError` banner. `isSavingForTenant` is cleared in `finally`, so no stuck loading state. The user stays on step 5.

`SelectExistingTenant` receives `properties` and `existingTenants` but there is no `preselectedPropertyId` prop passed from `selectedProperty` in the `add-tenant-from-wizard` path. If the component doesn't automatically associate the tenant to the saved property, `onSuccess` will navigate to `property-details` for a property that isn't linked to the chosen tenant.

---

<details>
<summary>Issues (3)</summary>

1. **`SelectExistingTenant` missing `preselectedPropertyId`** — In the `add-tenant-from-wizard` path, `SelectExistingTenant` is not passed `preselectedPropertyId={selectedProperty?.id}`. If its internal assignment logic doesn't pick up `selectedProperty` from local state, the user lands on `property-details` for a property that has no tenant linked. Add the prop, or verify the component auto-assigns to the currently-selected property.

2. **"Add Another Tenant" re-entry with live sentinel** — After a successful tenant save from the wizard path, the AddTenant success screen offers "Add Another Tenant." That button resets the internal form state and calls `setView('step1')` — it does not call `onBack`, so `previousScreen` stays `'add-tenant-from-wizard'`. The second save will correctly use `selectedProperty.id` as the `propertyId`, but this implicit re-entry is undocumented and fragile. If `selectedProperty` is ever cleared between the first and second saves (e.g., by a background state refresh), the second tenant save will throw "Cannot link tenant: the property was not found." Add a comment or an explicit guard.

3. **Partial image-upload silent degradation** — If some but not all images fail to upload, `validPhotos` is a subset of what the user selected and `savePropertyFromWizard` proceeds without warning. The property is saved with fewer photos than intended. The same behavior exists in `onPublish`. Surface a non-blocking warning to the user (e.g., "2 of 4 photos uploaded — you can add the rest from Property Details").

</details>

---

<details>
<summary>Details</summary>

## `savePropertyFromWizard` vs `onPublish` parity

`savePropertyFromWizard` is structurally identical to `onPublish` up to the navigation step. Both sync wizard fields into `syncedSetupData`, run `uploadPropertyImages` / `uploadPropertyDocuments`, build the `Property` object with the same field mapping, run the duplicate-address check, call `addProperty`, and then call `propertyService.getProperty(propertyId)` to get the server-canonical record. The photo-URL reconciliation loop (blob: → permanent URL via `uploadIdx`) is present in both. The only difference is that `savePropertyFromWizard` returns `created` instead of navigating.

The duplication between the two functions is a maintenance risk — a bug fix in one won't automatically apply to the other. Worth extracting a shared `_publishPropertyData(syncedSetupData)` helper if the code is touched again.

## `SelectExistingTenant` wiring gap

At the `select-existing-tenant` case in `renderScreen()`, the component is rendered as:

```tsx
<SelectExistingTenant
  properties={properties}
  existingTenants={tenants}
  userId={resolveManagerId() || undefined}
  onBack={() => navigateToScreen('tenant-selection')}
  onSuccess={() => { ... navigateToScreen('property-details'); }}
/>
```

There is no `preselectedPropertyId` prop. If `SelectExistingTenant` requires the caller to pass the target property ID to perform the association (rather than letting the user pick it from a dropdown), the tenant will not be linked to the just-saved property. This needs a prop addition or confirmation that the component reads `selectedProperty` via a different mechanism.

## Test coverage

`savePropertyFromWizard`, the `previousScreen` sentinel branches, and the "Add Another Tenant" re-entry path are all untested. The sentinel logic has at least six distinct branches across three screens and two popup handlers. Manual smoke-testing is the only verification.

</details>

---

<details>
<summary>File map</summary>

- `src/landlord_agent/src/App.tsx` — `savePropertyFromWizard` helper extracted; `onAddTenant` on the wizard calls it, sets `selectedProperty` and `previousScreen`, opens `TenantSelectionPopup`; `onSave`/`onBack`/`onSuccess` for `add-tenant`, `invite-tenant`, `select-existing-tenant` branch on the sentinel; `isSavingForTenant` state wired to wizard.
- `src/landlord_agent/src/components/AddPropertyWizard.tsx` — `isSavingForTenant` prop drives loading spinner and `disabled` on "Add a Tenant Now"; step-5 `onAddTenant` handler wraps call in try/catch, routes error to global error banner.
- `src/landlord_agent/src/components/AddTenant.tsx` — no changes; `preselectedPropertyId` was already supported and is passed via `selectedProperty?.id`.

Full diff: `git diff main -- src/landlord_agent/src/App.tsx src/landlord_agent/src/components/AddPropertyWizard.tsx`

</details>
