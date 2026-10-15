# Implementation Plan: Fix Add-Property → Add-Tenant Flow

## Background

Two compounding bugs prevent the flow from working:

1. **Property never saved**: `onAddTenant` (App.tsx line 2630–2634) sets `setPreviousScreen` and opens the `TenantSelectionPopup`, but never calls `onPublish`. The tenant gets no real `propertyId`.

2. **`previousScreen` clobbered then mismatched**: `onAddTenant` sets `setPreviousScreen('property-setup-step1')`, but the `TenantSelectionPopup`'s `onAddNew` handler (App.tsx lines 3587–3591) calls `setPreviousScreen(currentScreen)` — overwriting it with `'property-setup-step1'` again (since `currentScreen` IS the wizard screen). None of the `add-tenant` guards check `=== 'property-setup-step1'`; they all check `=== 'property-preview'`, so every return navigation falls through to `navigateToMainApp('clients')`.

The fix: (a) save the property first in `onAddTenant`, (b) use a new, unique `previousScreen` key `'add-tenant-from-wizard'` that survives the popup overwrite, (c) update all guards to handle it.

---

## Step 1 — Add `'add-tenant-from-wizard'` to the `Screen` union type

**File**: `src/landlord_agent/src/App.tsx`

**What**: Add the new string literal to the `Screen` union so TypeScript accepts it everywhere.

**Exact change** — insert after line 326 (`| 'tenant-selection'`):

```
// Before (lines 325–328):
  | 'property-preview'
  | 'tenant-selection'
  | 'add-tenant'
  | 'edit-tenant'

// After:
  | 'property-preview'
  | 'tenant-selection'
  | 'add-tenant-from-wizard'
  | 'add-tenant'
  | 'edit-tenant'
```

**Verify**: `cd src/landlord_agent && npx tsc --noEmit` — no type errors introduced.

---

## Step 2 — Change the `onAddTenant` prop signature in `AddPropertyWizard` to accept `WizardPropertyData`

**File**: `src/landlord_agent/src/components/AddPropertyWizard.tsx`

**Why**: The `onAddTenant` callback in App.tsx currently takes no arguments. To let App.tsx call `savePropertyFromWizard`, it needs the current wizard form data. The cleanest approach is to pass `WizardPropertyData` from the wizard to the callback.

**Change 1 — interface** (line 79):
```tsx
// Before:
  onAddTenant?: () => void;     // from review step

// After:
  onAddTenant?: (data: WizardPropertyData) => void;  // from review step
```

**Change 2 — button click handler** (line 872 — the `onClick={onAddTenant}` in Step 5):
```tsx
// Before:
  <button type="button" onClick={onAddTenant}

// After:
  <button type="button" onClick={() => onAddTenant?.(form)}
```

**Change 3 — Add loading prop to the interface** (line 76, after `isPublishing?: boolean`):
```tsx
// Before:
  isPublishing?: boolean;
  onPublish: (data: WizardPropertyData) => Promise<void>;

// After:
  isPublishing?: boolean;
  isSavingForTenant?: boolean;   // loading state on "Add a Tenant Now" button
  onPublish: (data: WizardPropertyData) => Promise<void>;
```

**Change 4 — Destructure the new prop** (line 235):
```tsx
// Before:
  onPublish, onBulkImport, onBack, onAddTenant,

// After:
  onPublish, onBulkImport, onBack, onAddTenant, isSavingForTenant = false,
```

**Change 5 — Apply loading state to the button** (lines 871–876, the "Add a Tenant Now" button):
```tsx
// Before:
{!isEditing && onAddTenant && (
  <button type="button" onClick={onAddTenant}
    className="w-full h-[44px] rounded-[14px] border border-dashed border-[#136C9E] text-[13.5px] font-semibold text-[#136C9E] flex items-center justify-center gap-2 hover:bg-[#f0f8fd] transition-all"
    style={{ fontFamily: 'Archivo,sans-serif' }}>
    <Plus size={15} strokeWidth={2.5} /> Add a Tenant Now
  </button>
)}

// After:
{!isEditing && onAddTenant && (
  <button
    type="button"
    onClick={() => onAddTenant?.(form)}
    disabled={isSavingForTenant}
    className="w-full h-[44px] rounded-[14px] border border-dashed border-[#136C9E] text-[13.5px] font-semibold text-[#136C9E] flex items-center justify-center gap-2 hover:bg-[#f0f8fd] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ fontFamily: 'Archivo,sans-serif' }}
  >
    {isSavingForTenant
      ? <><Loader2 size={15} className="animate-spin" /> Saving property…</>
      : <><Plus size={15} strokeWidth={2.5} /> Add a Tenant Now</>
    }
  </button>
)}
```

`Loader2` is already imported in the file (line ~46: `Loader2,`).

**Verify**: `cd src/landlord_agent && npx tsc --noEmit` — no type errors.

---

## Step 3 — Extract `savePropertyFromWizard` helper in `App.tsx`

**File**: `src/landlord_agent/src/App.tsx`

**Where to insert**: Immediately after `addProperty` function definition closes (around line 1444) and before `updateProperty`. Place it as a standalone `async function` inside the component body (or as an `async` arrow function assigned with `const`).

**Exact signature**:
```ts
const savePropertyFromWizard = async (wizardData: WizardPropertyData): Promise<Property> => {
```

**Logic** — this is a direct extraction of the non-editing path in `onPublish` (lines 2640–2804), with two differences:
- It does NOT call `navigateToScreen('property-details')` at the end.
- It does NOT call `setIsPublishing` (caller manages its own loading flag).
- It RETURNS the created `Property` object.

Full implementation to insert:

```ts
const savePropertyFromWizard = async (wizardData: WizardPropertyData): Promise<Property> => {
  if (!userProfile) {
    window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: { action: 'publish' } }, '*');
    throw new Error('Authentication required');
  }

  // Mirror the sync logic from onPublish
  const syncedSetupData = {
    ...propertySetupData,
    propertyType: wizardData.propertyType,
    propertyDetails: {
      address: wizardData.address,
      monthlyRent: wizardData.monthlyRent,
      bedrooms: wizardData.bedrooms,
      bathrooms: wizardData.bathrooms,
      squareFootage: wizardData.squareFootage,
      uploadedDocuments: wizardData.uploadedDocuments,
    },
    amenities: wizardData.amenities,
    images: wizardData.images,
    imageFiles: wizardData.imageFiles,
    additionalNotes: wizardData.additionalNotes,
    status: wizardData.status,
  };

  // 1. Upload images
  let uploadedPhotos: PropertyPhoto[] = [];
  if (syncedSetupData.imageFiles.length > 0) {
    uploadedPhotos = await uploadPropertyImages(syncedSetupData.imageFiles);
    if (uploadedPhotos.length === 0) {
      throw new Error(
        `Image upload failed — none of the ${syncedSetupData.imageFiles.length} photo(s) could be uploaded. ` +
        `Please check your connection and try again.`
      );
    }
  }

  // 2. Upload documents
  let uploadedDocuments: PropertyDocument[] = [];
  if (syncedSetupData.propertyDetails.uploadedDocuments.length > 0) {
    uploadedDocuments = await uploadPropertyDocuments(syncedSetupData.propertyDetails.uploadedDocuments);
  }

  // 3. Build property object
  const bedrooms = parseInt(syncedSetupData.propertyDetails.bedrooms) || 1;
  const bathrooms = parseInt(syncedSetupData.propertyDetails.bathrooms);
  const squareFootage = parseInt(syncedSetupData.propertyDetails.squareFootage);
  const rent = parseInt(syncedSetupData.propertyDetails.monthlyRent) || 0;
  const preservedStatus = syncedSetupData.status || 'vacant';

  const newProperty: Property = {
    id: 'setup-property',
    address: syncedSetupData.propertyDetails.address,
    type: syncedSetupData.propertyType || 'Property',
    bedrooms,
    rent,
    status: preservedStatus,
    amenities: syncedSetupData.amenities,
    notes: syncedSetupData.additionalNotes,
    photos: [],
    documents: [],
    createdAt: new Date(),
    ...(isNaN(bathrooms) ? {} : { bathrooms }),
    ...(isNaN(squareFootage) ? {} : { squareFootage }),
  } as any;

  // 4. Resolve photos (blob: → permanent URL) — same logic as onPublish
  let finalPhotos: PropertyPhoto[] = [];
  let uploadIdx = 0;
  for (let i = 0; i < syncedSetupData.images.length; i++) {
    const imgUrl = syncedSetupData.images[i];
    if (!imgUrl) continue;
    if (!imgUrl.startsWith('blob:')) {
      finalPhotos.push({
        id: `photo-${Date.now()}-${i}`,
        url: imgUrl,
        filename: `property-photo-${i + 1}.jpg`,
        isCover: finalPhotos.length === 0,
        room: finalPhotos.length === 0 ? 'Exterior' : undefined,
      });
    } else if (uploadIdx < uploadedPhotos.length) {
      finalPhotos.push({
        ...uploadedPhotos[uploadIdx],
        isCover: finalPhotos.length === 0,
        room: finalPhotos.length === 0 ? 'Exterior' : uploadedPhotos[uploadIdx].room,
      });
      uploadIdx++;
    }
  }
  while (uploadIdx < uploadedPhotos.length) {
    finalPhotos.push({ ...uploadedPhotos[uploadIdx], isCover: finalPhotos.length === 0 });
    uploadIdx++;
  }
  if (finalPhotos.length === 0 && uploadedPhotos.length > 0) finalPhotos = uploadedPhotos;
  newProperty.photos = finalPhotos;

  // 5. Resolve documents
  newProperty.documents = uploadedDocuments;

  // 6. Duplicate check
  const normAddr = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const dupe = properties.find(p => normAddr(p.address) === normAddr(newProperty.address));
  if (dupe) throw new Error(`A property at "${newProperty.address}" already exists. Use Edit to update it.`);

  // 7. Persist to backend — addProperty internally calls setProperties
  const propertyId = await addProperty(newProperty);

  // 8. Fetch created record to get server-canonical data (id, timestamps, etc.)
  const created = await propertyService.getProperty(propertyId);
  if (!created) throw new Error('Property was saved but could not be verified. Please check your properties list.');

  setProperties(prev =>
    prev.some(p => p.id === created.id)
      ? prev.map(p => p.id === created.id ? created : p)
      : [...prev, created]
  );

  return created;
};
```

**Verify**: `cd src/landlord_agent && npx tsc --noEmit` — no errors.

---

## Step 4 — Add `isSavingForTenant` state and update `onAddTenant` callback in `App.tsx`

**File**: `src/landlord_agent/src/App.tsx`

### 4a — Add state near line 484 (after `isPublishing` state):
```tsx
// After:
  const [isPublishing, setIsPublishing] = useState(false);
// Add:
  const [isSavingForTenant, setIsSavingForTenant] = useState(false);
```

### 4b — Update `onAddTenant` callback (lines 2630–2634):

```tsx
// Before (lines 2630–2634):
            onAddTenant={() => {
              trackEvent('landlord_add_tenant_clicked', { source: 'property_wizard' });
              setPreviousScreen('property-setup-step1');
              setShowTenantPopup(true);
            }}

// After:
            onAddTenant={async (wizardData: WizardPropertyData) => {
              trackEvent('landlord_add_tenant_clicked', { source: 'property_wizard' });
              setIsSavingForTenant(true);
              try {
                const createdProperty = await savePropertyFromWizard(wizardData);
                setSelectedProperty(createdProperty);
                // Use a new unique key so TenantSelectionPopup's onAddNew
                // overwrite (setPreviousScreen(currentScreen)) still resolves
                // to 'add-tenant-from-wizard' at the add-tenant guards.
                // The popup sets setPreviousScreen(currentScreen), and at that
                // point currentScreen will become 'tenant-selection'. We instead
                // set previousScreen AFTER the popup navigates by fixing the
                // TenantSelectionPopup handlers below (Step 5).
                setPreviousScreen('add-tenant-from-wizard');
                setShowTenantPopup(true);
              } catch (err: any) {
                // Stay on wizard Step 5 — error surfaces in wizard's globalError banner
                throw err;
              } finally {
                setIsSavingForTenant(false);
              }
            }}
```

### 4c — Pass `isSavingForTenant` and updated `onAddTenant` prop into `<AddPropertyWizard>` (around line 2598–2600):

```tsx
// Before:
          isPublishing={isPublishing}

// After:
          isPublishing={isPublishing}
          isSavingForTenant={isSavingForTenant}
```

The `onAddTenant` prop is already wired; only its body changes (done in 4b above).

**Verify**: `cd src/landlord_agent && npx tsc --noEmit` — no errors.

---

## Step 5 — Fix `TenantSelectionPopup` handlers so `previousScreen` isn't clobbered

**File**: `src/landlord_agent/src/App.tsx`

**Problem**: The `TenantSelectionPopup` (lines 3577–3594) calls `setPreviousScreen(currentScreen)` in both `onSelectExisting` and `onAddNew`. This overwrites the `'add-tenant-from-wizard'` we set in Step 4. We must preserve the value when the flow originated from the wizard.

**Exact change** (lines 3577–3594):

```tsx
// Before:
          {showTenantPopup && (
            <TenantSelectionPopup
              existingTenants={tenants}
              onClose={() => setShowTenantPopup(false)}
              onSelectExisting={(tenantId) => {
                setShowTenantPopup(false);
                setPreviousScreen(currentScreen);
                navigateToScreen('select-existing-tenant');
              }}
              onAddNew={() => {
                setShowTenantPopup(false);
                setPreviousScreen(currentScreen);
                navigateToScreen('tenant-selection');
              }}
            />
          )}

// After:
          {showTenantPopup && (
            <TenantSelectionPopup
              existingTenants={tenants}
              onClose={() => setShowTenantPopup(false)}
              onSelectExisting={(tenantId) => {
                setShowTenantPopup(false);
                // Preserve 'add-tenant-from-wizard' if set; otherwise record current screen
                if (previousScreen !== 'add-tenant-from-wizard') {
                  setPreviousScreen(currentScreen);
                }
                navigateToScreen('select-existing-tenant');
              }}
              onAddNew={() => {
                setShowTenantPopup(false);
                // Preserve 'add-tenant-from-wizard' if set; otherwise record current screen
                if (previousScreen !== 'add-tenant-from-wizard') {
                  setPreviousScreen(currentScreen);
                }
                navigateToScreen('tenant-selection');
              }}
            />
          )}
```

**Verify**: `cd src/landlord_agent && npx tsc --noEmit` — no errors.

---

## Step 6 — Fix all `previousScreen === 'property-preview'` guards in the tenant flow

**File**: `src/landlord_agent/src/App.tsx`

There are six locations where `previousScreen === 'property-preview'` is checked. All six must also handle `previousScreen === 'add-tenant-from-wizard'`, but the actions differ:

- **Old `'property-preview'` path**: stash tenant in `pendingTenants`, navigate back to `'property-setup-step1'` (property not yet saved).
- **New `'add-tenant-from-wizard'` path**: property is already saved; call `addTenant` directly (no stash needed), then navigate to `'property-details'` and clear `propertySetupData`.

A shared helper boolean makes this readable. Add this at the top of each affected `case` block:

```ts
const fromWizardFlow = previousScreen === 'property-preview' || previousScreen === 'add-tenant-from-wizard';
const fromNewWizard  = previousScreen === 'add-tenant-from-wizard';
```

### 6a — `case 'tenant-selection'` `onBack` (lines 3301–3306):

```tsx
// Before:
            onBack={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else {
                navigateToMainApp('clients');
              }
            }}

// After:
            onBack={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else if (previousScreen === 'add-tenant-from-wizard') {
                setPreviousScreen(null);
                navigateToScreen('property-details');
              } else {
                navigateToMainApp('clients');
              }
            }}
```

### 6b — `case 'add-tenant'` `onSave` (lines 3319–3339):

```tsx
// Before:
            onSave={async (tenant) => {
              if (!userProfile) {
                window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: { action: 'add-tenant' } }, '*');
                throw new Error('Authentication required');
              }
              await addTenant(tenant);
              prefillEmailRef.current = undefined;
              setPortfolioRefreshKey(k => k + 1);
              // If coming from property-preview, stash tenant for preview context
              if (previousScreen === 'property-preview') {
                setPropertySetupData(prev => ({
                  ...prev,
                  pendingTenants: [...(prev.pendingTenants || []), tenant]
                }));
              }
            }}

// After:
            onSave={async (tenant) => {
              if (!userProfile) {
                window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: { action: 'add-tenant' } }, '*');
                throw new Error('Authentication required');
              }
              if (previousScreen === 'add-tenant-from-wizard') {
                // Property is already saved; associate tenant with it directly
                await addTenant({ ...tenant, propertyId: selectedProperty!.id });
              } else {
                await addTenant(tenant);
              }
              prefillEmailRef.current = undefined;
              setPortfolioRefreshKey(k => k + 1);
              // If coming from property-preview, stash tenant for preview context (legacy path)
              if (previousScreen === 'property-preview') {
                setPropertySetupData(prev => ({
                  ...prev,
                  pendingTenants: [...(prev.pendingTenants || []), tenant]
                }));
              }
              // If coming from new wizard flow: navigate to the saved property details
              if (previousScreen === 'add-tenant-from-wizard') {
                setPreviousScreen(null);
                setPropertySetupData({
                  propertyType: null,
                  propertyDetails: { address: '', monthlyRent: '', bedrooms: '', bathrooms: '', squareFootage: '', uploadedDocuments: [] },
                  amenities: [],
                  images: [],
                  imageFiles: [],
                  additionalNotes: '',
                  pendingTenants: [],
                });
                navigateToScreen('property-details');
              }
            }}
```

### 6c — `case 'add-tenant'` `onBack` (lines 3340–3347):

```tsx
// Before:
            onBack={() => {
              prefillEmailRef.current = undefined;
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else {
                navigateToMainApp('clients');
              }
            }}

// After:
            onBack={() => {
              prefillEmailRef.current = undefined;
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else if (previousScreen === 'add-tenant-from-wizard') {
                setPreviousScreen(null);
                navigateToScreen('property-details');
              } else {
                navigateToMainApp('clients');
              }
            }}
```

### 6d — `case 'invite-tenant'` `onSuccess` (lines 3396–3403):

```tsx
// Before:
            onSuccess={() => {
              prefillEmailRef.current = undefined;
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else {
                navigateToMainApp('clients');
              }
            }}

// After:
            onSuccess={() => {
              prefillEmailRef.current = undefined;
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else if (previousScreen === 'add-tenant-from-wizard') {
                setPreviousScreen(null);
                navigateToScreen('property-details');
              } else {
                navigateToMainApp('clients');
              }
            }}
```

### 6e — `case 'select-existing-tenant'` `onSuccess` (lines 3415–3421):

```tsx
// Before:
            onSuccess={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else {
                navigateToMainApp('clients');
              }
            }}

// After:
            onSuccess={() => {
              if (previousScreen === 'property-preview') {
                setPreviousScreen(null);
                navigateToScreen('property-setup-step1');
              } else if (previousScreen === 'add-tenant-from-wizard') {
                setPreviousScreen(null);
                navigateToScreen('property-details');
              } else {
                navigateToMainApp('clients');
              }
            }}
```

**Note on 6b**: The `onSave` handler in `add-tenant` calls `navigateToScreen` *inside* `onSave` itself for the new wizard flow. The `AddTenant` component calls `onSave` and on completion shows a success screen and then calls `onBack`. For the `add-tenant-from-wizard` path we want to bypass that and go straight to property-details. Review whether `AddTenant.tsx` shows an internal success step before `onBack` fires — if it does, the `navigateToScreen('property-details')` inside `onSave` will immediately switch the screen, cutting off the success animation. **Acceptable trade-off** per spec requirement 6: "after `onSave` completes: call `navigateToScreen('property-details')`". If the success animation should still play, move the navigate call to `onBack` using the same `previousScreen` check (6c already handles this as a fallback via `navigateToScreen('property-details')`). The safest approach is: in `onSave` only do the state cleanup (clear `previousScreen` + `propertySetupData`), and let `onBack` (6c) navigate to `property-details`. This keeps the success screen visible until the user presses "View in Dashboard" / "Done".

**Revised 6b `onSave` ending** (replace the `if (previousScreen === 'add-tenant-from-wizard')` block at the bottom of onSave with just state cleanup):

```ts
              // New wizard flow: clear stale wizard state; onBack (below) will
              // navigate to property-details once the user dismisses the success screen
              if (previousScreen === 'add-tenant-from-wizard') {
                setPropertySetupData({
                  propertyType: null,
                  propertyDetails: { address: '', monthlyRent: '', bedrooms: '', bathrooms: '', squareFootage: '', uploadedDocuments: [] },
                  amenities: [],
                  images: [],
                  imageFiles: [],
                  additionalNotes: '',
                  pendingTenants: [],
                });
                // Note: do NOT call setPreviousScreen(null) here — onBack uses it to navigate
              }
```

Then `onBack` (6c) already calls `setPreviousScreen(null); navigateToScreen('property-details')` — which fires when the user presses any "done" button in the AddTenant success screen. This is the correct UX.

**Verify**: `cd src/landlord_agent && npx tsc --noEmit` — no errors.

---

## Step 7 — Verify `preselectedPropertyId` is correctly passed to `AddTenant`

**File**: `src/landlord_agent/src/App.tsx`, `case 'add-tenant'` (line ~3312):

```tsx
preselectedPropertyId={selectedProperty?.id}
```

After Step 4, `setSelectedProperty(createdProperty)` is called before the tenant flow starts, so `selectedProperty?.id` will be the newly created property's real ID. **No change needed** — the prop is already wired.

**Verify**: Trace the data flow: `savePropertyFromWizard` returns `created` (line from Step 3) → `setSelectedProperty(createdProperty)` (Step 4b) → `selectedProperty?.id` passed at line ~3312. Confirmed correct.

---

## Step 8 — Build and smoke-test

**What**: Compile the project and confirm no type errors.

**Commands**:
```bash
cd /home/angeli/Desktop/luxcity/proptii-r1.1a/src/landlord_agent
npx tsc --noEmit
npm run build 2>&1 | head -50
```

**Expected**: Zero TypeScript errors. Vite/esbuild build completes without errors.

---

## Summary of all file changes

### `src/landlord_agent/src/components/AddPropertyWizard.tsx`
| Change | Location |
|--------|----------|
| Add `isSavingForTenant?: boolean` prop to interface | Line 76 (after `isPublishing`) |
| Change `onAddTenant?: () => void` to `onAddTenant?: (data: WizardPropertyData) => void` | Line 79 |
| Destructure `isSavingForTenant = false` | Line 235 |
| Button: `onClick={() => onAddTenant?.(form)}`, `disabled={isSavingForTenant}`, spinner | Lines 872–876 |

### `src/landlord_agent/src/App.tsx`
| Change | Location |
|--------|----------|
| Add `\| 'add-tenant-from-wizard'` to `Screen` union | After line 326 |
| Add `const [isSavingForTenant, setIsSavingForTenant] = useState(false)` | After line 484 |
| Add `savePropertyFromWizard` helper function | After `addProperty` closes (~line 1444) |
| Rewrite `onAddTenant` callback to `async`, call `savePropertyFromWizard`, set `selectedProperty`, set `previousScreen('add-tenant-from-wizard')` | Lines 2630–2634 |
| Pass `isSavingForTenant={isSavingForTenant}` to `<AddPropertyWizard>` | Line ~2600 |
| Fix `TenantSelectionPopup.onSelectExisting` to preserve `previousScreen` when already `'add-tenant-from-wizard'` | Lines 3582–3586 |
| Fix `TenantSelectionPopup.onAddNew` same preservation | Lines 3587–3591 |
| `case 'tenant-selection'` `onBack`: add `'add-tenant-from-wizard'` branch → navigate to `'property-details'` | Lines 3301–3306 |
| `case 'add-tenant'` `onSave`: call `addTenant({...tenant, propertyId: selectedProperty!.id})` when `fromNewWizard`, clear `propertySetupData` | Lines 3319–3339 |
| `case 'add-tenant'` `onBack`: add `'add-tenant-from-wizard'` branch → navigate to `'property-details'` | Lines 3340–3347 |
| `case 'invite-tenant'` `onSuccess`: add `'add-tenant-from-wizard'` branch | Lines 3396–3403 |
| `case 'select-existing-tenant'` `onSuccess`: add `'add-tenant-from-wizard'` branch | Lines 3415–3421 |

---

## Error handling note (Step 7 of spec)

The `onAddTenant` callback throws on failure (Step 4b `throw err`). The wizard's `handlePublish`-style pattern doesn't apply here because `onAddTenant` is called directly from the button, not from `handlePublish`. To surface the error inside the wizard, the `AddPropertyWizard` button's `onClick` needs a `try/catch`. 

**Additional change in `AddPropertyWizard.tsx`** — wrap the button click:

```tsx
// Change the button onClick from:
onClick={() => onAddTenant?.(form)}

// To:
onClick={async () => {
  try {
    await onAddTenant?.(form);
  } catch (err: any) {
    setGE(err?.message || 'Failed to save property. Please try again.');
  }
}}
```

This sets the wizard's `globalError` banner (already rendered in the wizard UI) so the user sees the error without leaving Step 5. The `isSavingForTenant` state in App.tsx handles the spinner; the `finally` block in App.tsx already sets it back to `false`.
