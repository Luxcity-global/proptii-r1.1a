# Add Property → Add Tenant Flow: Investigation Report

## Summary

When the user clicks "Add a Tenant Now" on Step 5 (Review & Publish) of the
AddPropertyWizard, the property has **not yet been saved**. The button opens a
`TenantSelectionPopup` overlay, and choosing "Add New" navigates the whole app to
`navigateToScreen('tenant-selection')`, which eventually leads to `add-tenant`.
This replaces the wizard in the React component tree — the unsaved property form
data is preserved in `propertySetupData` state in App.tsx, but only in the
**current React session**. If the user completes the tenant flow or clicks back,
App.tsx tries to return to `property-setup-step1`, but the property **has never
been POSTed to the backend**. The tenant is also created with `propertyId` either
empty or `'setup-property'` (a placeholder id), so the association is broken.

---

## 1. Add Property Wizard Steps

File: `src/landlord_agent/src/components/AddPropertyWizard.tsx`

The wizard has 5 linear steps:

| Step | Screen | Content |
|------|--------|---------|
| 1 | Property Type | Select from 6 types (house, flat, studio, shared, commercial, other) |
| 2 | Property Details | Address, monthly rent, bedrooms, bathrooms, sq ft, optional docs |
| 3 | Amenities | Multi-select from 9 amenity toggles |
| 4 | Photos & Notes | Photo drag/drop upload, additional notes textarea |
| 5 | Review & Publish | Summary dossier + "Publish Property" CTA + "Add a Tenant Now" link |

Navigation: `advance(step)` validates the current step and calls `setStep(next)`.
Going back: each step has an explicit "Back" button calling `setStep(previous)`.

---

## 2. Where is the "Add Tenant" Offer?

**Step 5 only** (Review & Publish), and only when:
- `isEditing === false` (not an edit flow), AND
- `onAddTenant` prop is provided

```tsx
// AddPropertyWizard.tsx ~line 582–588
{!isEditing && onAddTenant && (
  <button type="button" onClick={onAddTenant}
    className="w-full h-[44px] rounded-[14px] border border-dashed ...">
    <Plus size={15} /> Add a Tenant Now
  </button>
)}
```

---

## 3. What Happens When the User Clicks "Add Tenant Now"?

**The property is NOT saved first.** The sequence is:

1. `onAddTenant()` callback fires (provided by App.tsx)
2. App.tsx handler (line 2629–2634):
   ```tsx
   onAddTenant={() => {
     trackEvent('landlord_add_tenant_clicked', { source: 'property_wizard' });
     setPreviousScreen('property-setup-step1');
     setShowTenantPopup(true);   // shows a modal overlay
   }}
   ```
3. `TenantSelectionPopup` appears over the wizard with two choices:
   - **Select Existing** → `navigateToScreen('select-existing-tenant')`
   - **Add New** → `navigateToScreen('tenant-selection')`
4. Both `navigateToScreen()` calls **replace the entire view** — AddPropertyWizard
   is unmounted, and the tenant flow screens are mounted instead.
5. The wizard's local `form` state is lost (it lives inside AddPropertyWizard).
   The parent `propertySetupData` in App.tsx is preserved because it's lifted state,
   but the property **has never been posted to the backend**.

---

## 4. State / Props / Callbacks Involved

### Property save path
```
AddPropertyWizard.onPublish(wizardData)
  → App.tsx onPublish handler (line 2635+)
  → uploadPropertyImages() + uploadPropertyDocuments()
  → addProperty(newProperty) → propertyService.createProperty()
  → navigateToScreen('property-details')
```
`onPublish` is only called by the "Publish Property" button in step 5. It is
**never called automatically** before the tenant flow is triggered.

### Tenant add path (from wizard)
```
AddPropertyWizard.onAddTenant()
  → App.tsx: setPreviousScreen('property-setup-step1'); setShowTenantPopup(true)
  → TenantSelectionPopup.onAddNew()
  → App.tsx: navigateToScreen('tenant-selection')
  → TenantSelection.onManualInput(email)
  → App.tsx: navigateToScreen('add-tenant')
  → AddTenant.onSave(tenant)
  → App.tsx: addTenant(tenant) → tenantService.createTenant()
  → if previousScreen === 'property-preview': stash in pendingTenants state
  → navigateToScreen('property-setup-step1')   ← returns to wizard
```

### `pendingTenants` mechanism
App.tsx has `propertySetupData.pendingTenants?: Omit<Tenant, 'id'>[]`. When
`previousScreen === 'property-preview'` (an older screen name — see note below),
the saved tenant is pushed onto this array:
```tsx
// App.tsx ~line 3334–3337
setPropertySetupData(prev => ({
  ...prev,
  pendingTenants: [...(prev.pendingTenants || []), tenant]
}));
```
This stash is consumed at publish time (line 2785–2800) to patch the
tenant's `propertyId` after the property is created.

**Critical bug**: the `previousScreen` check uses `'property-preview'`, but the
"Add a Tenant Now" button sets `setPreviousScreen('property-setup-step1')`, NOT
`'property-preview'`. So the `pendingTenants` stash **is never populated** from
the wizard flow, meaning the tenant gets no `propertyId` reference at all — it
is created orphaned.

---

## 5. How AddTenant.tsx Works

File: `src/landlord_agent/src/components/AddTenant.tsx`

### Props
```ts
interface AddTenantProps {
  properties:              Property[];      // full list to pick from
  existingTenants?:        Tenant[];        // for duplicate-email check
  onSave:                  (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  onBack:                  () => void;
  onBulkImport?:           () => void;
  preselectedPropertyId?:  string;         // pre-fills property dropdown
  prefillEmail?:           string;         // pre-fills email field
  userProfile?:            UserProfile | null;
}
```

### Does it accept a pre-associated propertyId?
**Yes** — `preselectedPropertyId` pre-fills the property dropdown in Step 2.
However, when the wizard triggers the tenant flow, no property ID exists yet
(the property hasn't been saved), so `preselectedPropertyId` is always
`selectedProperty?.id` which will be `null`/`undefined` in this context
(since the user hasn't published yet).

The AddTenant form at Step 2 requires the user to select a property manually.

### Steps
- **Mode select** (single vs bulk CSV)
- **Step 1** – Personal details: name, email, phone
- **Step 2** – Lease and payment: property selection (dropdown), rent, dates
- **Step 3** – Additional: emergency contact, employment, notes (skippable)
- **Summary** – Review dossier
- **Success** – Confirmation with "Add Another" / "View in Dashboard" buttons

---

## 6. Return Navigation After Tenant Added

When AddTenant's `onSave` completes:
```tsx
// App.tsx ~line 3341–3347
if (previousScreen === 'property-preview') {   // ← WRONG key
  setPropertySetupData(prev => ({
    ...prev, pendingTenants: [...(prev.pendingTenants || []), tenant]
  }));
}
// after onSave resolves, onBack / natural completion navigates:
if (previousScreen === 'property-preview') {   // ← still wrong
  setPreviousScreen(null);
  navigateToScreen('property-setup-step1');    // ← correct destination
} else {
  navigateToMainApp('clients');                // ← wrong destination for wizard flow
}
```

Because `previousScreen` was set to `'property-setup-step1'` (not
`'property-preview'`), the `if` branch is never taken and the user is sent to
**the Clients page**, not back to the wizard. The unsaved property is abandoned.

---

## 7. Conclusions and Recommended Fix

### Root cause
Two bugs compound each other:
1. `onAddTenant` sets `setPreviousScreen('property-setup-step1')`, but all the
   "return to wizard" guards check `previousScreen === 'property-preview'`.
2. The property is never saved before entering the tenant flow, so even if the
   navigation were fixed, the tenant's `propertyId` would have no real value.

### Option A – Auto-save the property first (recommended)

**Change `onAddTenant` in App.tsx** to call `handlePublish` (or rather, trigger
the wizard's `onPublish`) **before** opening the tenant flow. The property gets
a real ID, which can then be passed as `preselectedPropertyId` to AddTenant.

Concretely:
1. In the `onAddTenant` callback (App.tsx ~line 2629), invoke the same publish
   logic that `onPublish` uses (factor it into a `savePropertyFromWizard()`
   helper), await it to get a real `propertyId`.
2. Set `setSelectedProperty(created)` so `selectedProperty.id` is valid.
3. Set `setPreviousScreen('property-setup-step1')` AND fix all the guard checks
   to use `'property-setup-step1'` instead of `'property-preview'`.
4. Open the tenant popup (or navigate directly to `tenant-selection`).
5. When the tenant is saved, pass `selectedProperty.id` as `preselectedPropertyId`
   to AddTenant (this already works — it reads `selectedProperty?.id`).
6. After tenant save, navigate to `property-details` (not back to the wizard,
   since the property is now published).

This approach is clean, keeps the flows separate, and gives the tenant a real
property association immediately.

### Option B – Handle tenant as wizard Step 6 (inline)

Add a Step 6 "Assign Tenant (optional)" inside AddPropertyWizard itself.
The step calls `onPublish` first, gets the `propertyId`, then embeds the
AddTenant form fields. This is a larger refactor but the most cohesive UX.
Not recommended unless a full wizard redesign is planned.

### Quick-fix for navigation only (minimum viable)

If a full auto-save isn't feasible immediately, at least fix the `previousScreen`
guard strings to be consistent. Change:
- `setPreviousScreen('property-setup-step1')` in the `onAddTenant` handler, AND
- all `if (previousScreen === 'property-preview')` checks in the `add-tenant`
  case to `if (previousScreen === 'property-setup-step1')`.

This will at least return the user to the wizard after adding the tenant. The
property will still need to be published manually, but nothing is abandoned.

---

## Files and Key Lines

| File | Symbol | Line (approx) |
|------|--------|---------------|
| `src/landlord_agent/src/components/AddPropertyWizard.tsx` | "Add a Tenant Now" button | ~582 |
| `src/landlord_agent/src/components/AddPropertyWizard.tsx` | `onAddTenant` prop definition | ~68 |
| `src/landlord_agent/src/App.tsx` | `onAddTenant` callback in wizard mount | ~2629 |
| `src/landlord_agent/src/App.tsx` | `TenantSelectionPopup` render | ~3577 |
| `src/landlord_agent/src/App.tsx` | `add-tenant` case — `onSave` & return nav | ~3311–3348 |
| `src/landlord_agent/src/App.tsx` | `pendingTenants` stash (wrong condition) | ~3334 |
| `src/landlord_agent/src/components/AddTenant.tsx` | `preselectedPropertyId` prop | ~42 |
| `src/landlord_agent/src/components/AddTenant.tsx` | Property dropdown pre-fill in `blank()` | ~69 |
