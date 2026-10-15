# UX Issues Investigation Report

**Codebase:** `/home/angeli/Desktop/luxcity/proptii-r1.1a/src/landlord_agent/src/`  
**Date:** Investigation complete

---

## Summary

| Issue | Root Cause | Effort |
|---|---|---|
| 1. Save as Draft | Wizard has no draft path; `onPublish` does a full backend save; no `draft` status exists anywhere | Medium |
| 2. Upload opens old DocumentManagement screen | `onManageDocuments` in `PropertyDetails` calls `navigateToScreen('document-management')` which renders the full `DocumentManagement` page | Small |
| 3. Clicking a document navigates away | Document rows in `PropertyDetails` have no click handler — the "navigates away" effect comes from the same `onManageDocuments` button call | Small–Medium |
| 4. Hero image / gallery alignment | Hero strip is correctly coded; thumbnail strip uses `overflow-x-auto` but has no `min-width-0` guard on the parent, and the hero height is hardcoded to `340px` with no responsive break | Small |

---

## Issue 1: Add Property — Save as Draft

### Finding

There is **no draft concept anywhere** in the current codebase:

- `Property.status` is typed as `'vacant' | 'occupied' | 'under-renovation'` — `'draft'` is not in the union  
  `App.tsx` line 179: `status: 'vacant' | 'occupied' | 'under-renovation';`

- `PropertiesPage.tsx` already has a **Drafts tab** in the filter UI (line ~365):  
  ```ts
  else if (filterTab === 'drafts') matchesTab = (property.status as string) === 'draft' || !property.address?.trim();
  ```
  It casts to `string` because the type doesn't include `'draft'`. The tab, its empty-state copy, and its filter logic are fully written and waiting — only the data and wizard button are missing.

- `AddPropertyWizard` (`AddPropertyWizard.tsx`) has no "Save as Draft" button. The only exit paths are:
  - `onBack` (cancel, loses all state)
  - `onPublish` (full async save via `savePropertyFromWizard` → `propertyService.createProperty`)
  - `onAddTenant` (saves then navigates to tenant flow)

- `propertyService.createProperty` (`services/propertyService.ts` line 142) POSTs to `/api/native-properties` with the full property body including `status`. Because the status field is passed through `mapToApi`, adding `status: 'draft'` to the payload should work at the API level with no service-layer changes needed — the mapping is a passthrough.

- `addProperty` in `App.tsx` (line 1414) calls `propertyService.createProperty` with whatever status is in the wizard data.

### Minimal Fix

1. **`App.tsx`** — extend the `Property['status']` union: add `'draft'` to the type at line ~179.

2. **`AddPropertyWizard.tsx`** — add an `onSaveDraft?: (data: WizardPropertyData) => Promise<void>` prop to `AddPropertyWizardProps`. Render a "Save as Draft" secondary button in the navbar (next to the cancel ✕) and in the Step 5 Review panel, alongside "Publish". On click, call `onSaveDraft` with `{ ...form, status: 'draft' }`.

3. **`App.tsx`** — wire `onSaveDraft` in the `case 'property-setup-step1'` `<AddPropertyWizard>` render block (around line 2727). The handler should call the same `savePropertyFromWizard` path but pass `status: 'draft'`, then navigate back to `'main-app'` (properties screen) without clearing wizard state (or show a toast).

4. No change needed to `PropertiesPage.tsx` — the Drafts tab already filters on `status === 'draft'` and has its own empty-state copy.

---

## Issue 2: Documents — "Upload Document" Triggers Old Full-Page Flow

### Finding

`PropertyDetails.tsx` exposes an `onManageDocuments` callback prop (defined at line ~224):
```ts
onManageDocuments: () => void;
```

Every "Upload Document" button and the "Manage Documents" Quick Action button in `PropertyDetails` call this single callback:
- Header dropdown `onSelect={() => onManageDocuments()}` (line ~470)
- Documents tab "Upload Document" button: `onClick={onManageDocuments}` (line ~594)
- Documents tab empty-state "Upload Documents" button: `onClick={onManageDocuments}` (line ~610)
- Compliance status sidebar link: `onClick={onManageDocuments}` (line ~795)
- Quick Actions sidebar: `action: onManageDocuments` (line ~766)

In `App.tsx` at line 3077, `PropertyDetails` is rendered as:
```ts
onManageDocuments={() => navigateToScreen('document-management')}
```

`navigateToScreen('document-management')` renders the **full `DocumentManagement` page** (a separate full-screen component with its own header, search, filters, stats, and assign-to-property logic) — this is the "old flow" described in the issue.

`DocumentUploadModal` (`DocumentUploadModal.tsx`) already exists and is used in `TenantDetails.tsx` (line 1154) as a self-contained portal:
```tsx
<DocumentUploadModal
  isOpen={isUploadModalOpen}
  isUploading={isUploadingDocument}
  uploadError={uploadError}
  onClose={() => { setIsUploadModalOpen(false); setUploadError(null); }}
  onUpload={handleDocumentUpload}
/>
```

`DocumentUploadModal` props are:
- `isOpen: boolean`
- `onClose: () => void`
- `onUpload: (document: { name, type, file, expiryDate? }) => void`
- `isUploading?: boolean`
- `uploadError?: string | null`

It renders via `createPortal` onto `document.body`, so it can be mounted anywhere.

**Note:** `DocumentUploadModal` uses a lighter document type set (`tenancy-agreement`, `deposit-certificate`, `right-to-rent`, `id-document`, `employment-reference`, `bank-statement`, `other`) while `DocumentManagement` uses the property-centric set (`epc`, `gas-cert`, `tenancy-agreement`, `insurance`, `other`). For property documents, the type options in `DocumentUploadModal` should be updated to match the property-document types, or a `documentTypes` prop should be added.

### Minimal Fix

1. **`PropertyDetails.tsx`** — import `DocumentUploadModal`. Add local state:
   ```ts
   const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);
   const [isUploadingDoc, setIsUploadingDoc] = useState(false);
   const [docUploadError, setDocUploadError] = useState<string | null>(null);
   ```

2. Remove the `onManageDocuments` prop from `PropertyDetailsProps` (or keep it for the "Manage Documents" full-page action and rename to `onFullDocumentManagement` to separate the two concerns). Replace all "Upload Document" button click handlers with `() => setIsDocUploadOpen(true)`.

3. Add an `onDocumentUpload` prop (or implement inline) that calls `propertyService.addDocumentToProperty` + `updateProperty` (same pattern used in `DocumentManagement.tsx` lines 215–235).

4. Render `<DocumentUploadModal>` at the bottom of `PropertyDetails`, wired to the new state and handler. Update its document type options to include `epc`, `gas-cert`, `tenancy-agreement`, `insurance`, `other`.

5. **`App.tsx`** — `onManageDocuments` on `PropertyDetails` can be kept to navigate to the full management screen only from the "Manage Documents" Quick Action (or the header dropdown item). The "Upload Document" buttons no longer need it.

---

## Issue 3: Clicking a Document Should Open a Details Drawer

### Finding

In `PropertyDetails.tsx` around lines 590–620, document rows are `<li>` elements:
```tsx
<li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
  <DocStatusIcon status={doc.status} />
  <div className="flex-1 min-w-0">
    <p>{doc.name}</p>
    <p>{DOC_TYPE_LABELS[doc.type]}</p>
  </div>
  <div className="text-right text-[11.5px]">
    <p>Issued {dates.docs[doc.id]?.issue}</p>
    {doc.expiryDate && <p>Expires {dates.docs[doc.id]?.expiry}</p>}
  </div>
</li>
```

There is **no `onClick` handler**, no cursor-pointer, and no drawer/modal. The "navigates away" UX is because the only document interaction available is the sidebar "Upload compliance documents" link which calls `onManageDocuments()` (→ `document-management` screen).

**No `DocumentDetailsDrawer` component exists.** The existing pattern for a details slide-over is `ClientDetailsDrawer` (`ClientDetailsDrawer.tsx`), which is a full-screen portal overlay with a tab system, used by `TenantDetails` and `LandlordDetails`.

`PropertyDocument` data available on each `doc` object:
```ts
{
  id: string;
  name: string;
  type: 'epc' | 'gas-cert' | 'tenancy-agreement' | 'insurance' | 'other';
  url: string;               // download/preview URL
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring-soon' | 'expired';
}
```

### Minimal Fix

**Option A — Inline slide-over panel (recommended, minimal):**  
Add a `selectedDoc` state in `PropertyDetails`. Clicking a `<li>` sets `selectedDoc`. Render a simple slide-over `<aside>` (fixed right panel, no new component file needed) that shows doc name, type, status, issue/expiry dates, a Download button (`window.open(doc.url)`), and a Preview button. Dismiss via an overlay click or ✕ button. This follows the spirit of `ClientDetailsDrawer` without requiring the full tab system.

**Option B — Reuse `ClientDetailsDrawer`:**  
`ClientDetailsDrawer` requires `initials`, `name`, `statusLabel`, `statusTone`, `subtitle`, `tabs`, and `onClose`. It can be reused but is heavyweight for a document; a single-tab version would be awkward.

**Recommended:** Option A. Add `selectedDoc: PropertyDocument | null` state, make `<li>` elements `cursor-pointer` with `onClick={() => setSelectedDoc(doc)}`, render a minimal fixed right-side `<aside>` panel (or a `<Dialog>` modal) with the doc details and a download link. No new component file is strictly required.

---

## Issue 4: Hero Image / Gallery Alignment

### Finding

In `PropertyDetails.tsx`, the hero + thumbnail strip (lines ~490–550):

```tsx
{/* Hero container */}
<div className="relative w-full rounded-[16px] overflow-hidden bg-[#e2e8f0]"
  style={{ height: "340px" }}>
  <img src={heroPhoto!.url} className="w-full h-full object-cover" />
  {/* nav arrows + counter */}
</div>

{/* Thumbnail strip */}
{heroPhotos.length > 1 && (
  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
    {heroPhotos.map((p, i) => (
      <button key={p.id} type="button"
        style={{ width: 72, height: 52, ... }}>
        <img className="w-full h-full object-cover" />
      </button>
    ))}
  </div>
)}
```

**Identified layout issues:**

1. **Fixed 340px hero height with no responsive breakpoint.** On narrow viewports (mobile, or the narrower two-column layout at `lg`), 340px is too tall and causes the hero to dominate the screen. Should be `clamp(200px, 40vw, 340px)` or use a `aspect-[16/9]` class instead of a fixed pixel height.

2. **Thumbnail strip `overflow-x-auto` without `scrollbar-hide` or `pb-2`.** Currently `pb-1` (4px) — on some browsers the horizontal scrollbar consumes this space, clipping the thumbnail bottom border-radius. Should be `pb-2` (8px) or add `scrollbar-hide` utility.

3. **Thumbnail strip parent `<div className="mb-6">` has no `overflow: hidden` or `min-w-0`.** The parent that wraps both hero and thumbnails is inside `max-w-[1160px] mx-auto px-6`, which is fine, but the thumbnail `<button>` uses fixed `width: 72` — this is fine and won't overflow.

4. **Hero container `overflow-hidden` clips `outline`** on the selected thumbnail. The selected thumbnail uses `outline: 2.5px solid #136C9E` — because the thumbnail is not inside the hero container, it should render correctly. No issue here.

5. **Thumbnail buttons have `shrink-0`** — correct, prevents squishing. No issue here.

**Summary of actual problems:** (1) fixed hero height is the main alignment complaint on non-desktop viewports, and (2) thumbnail scrollbar clipping is a minor polish issue.

### Minimal Fix

1. **`PropertyDetails.tsx`** hero container: change `style={{ height: "340px" }}` to a responsive CSS approach:
   ```tsx
   className="relative w-full rounded-[16px] overflow-hidden bg-[#e2e8f0] aspect-[16/9] max-h-[360px]"
   // remove the style height prop entirely
   ```
   Or keep the inline style but use a clamp: `style={{ height: 'clamp(200px, 38vw, 340px)' }}`.

2. Thumbnail strip: change `pb-1` to `pb-2` to prevent scrollbar clipping.

---

## Conclusions and Recommendations

### Priority Order

**P1 — Issue 2 (Upload Document modal):** Smallest change, highest UX impact. Replace `onManageDocuments` calls on the three "Upload" buttons with a local `DocumentUploadModal` instance. The modal already exists and works (proven in `TenantDetails`). Needs only: local state in `PropertyDetails`, an upload handler that calls `propertyService.addDocumentToProperty`, and a type-list update.

**P2 — Issue 3 (Document click → drawer):** Low effort if done as a simple Dialog/side panel. The `doc` object has all necessary fields. No new component file is required; a `selectedDoc` state + a small overlay panel is sufficient.

**P3 — Issue 1 (Save as Draft):** The `PropertiesPage` Drafts tab is already built and waiting. The only missing pieces are: extend the `status` union to include `'draft'`, add an `onSaveDraft` prop + button to `AddPropertyWizard`, and wire it in `App.tsx`.

**P4 — Issue 4 (Gallery alignment):** One-line fix for the hero height + one-line fix for thumbnail scrollbar. Low risk.

### Key Files to Change

| File | Change |
|---|---|
| `components/PropertyDetails.tsx` | Add local `DocumentUploadModal`, `selectedDoc` drawer, responsive hero height, thumbnail pb-2 |
| `components/AddPropertyWizard.tsx` | Add `onSaveDraft` prop + "Save as Draft" button |
| `App.tsx` | Wire `onSaveDraft` handler; extend `Property.status` union; keep `onManageDocuments` only for full-page manage action |
| `components/DocumentUploadModal.tsx` | Optionally add `documentTypes` prop to support property-specific document types |

No new component files are strictly required for any of the four issues.
