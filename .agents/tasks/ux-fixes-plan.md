# UX Fixes Implementation Plan

**Codebase root:** `/home/angeli/Desktop/luxcity/proptii-r1.1a/src/landlord_agent/src/`
**Build command:** `cd /home/angeli/Desktop/luxcity/proptii-r1.1a/src/landlord_agent && npm run build`
**Verify command (TypeScript):** `npx tsc --noEmit --skipLibCheck --jsx react --esModuleInterop --moduleResolution bundler --target esnext src/App.tsx` (or just run `npm run build` which runs vite build and catches TS errors)

---

## Fix 4 — Hero image responsive height + thumbnail scroll fix (P4)

Start here because it is a two-line change that touches nothing else and acts as a smoke test that the file is editable.

- [ ] 1. **Remove hardcoded 340px hero height and fix thumbnail scrollbar clipping.**
      In `PropertyDetails.tsx`:
      - Line 585–587: The hero container `<div>` has `style={{ height: "340px" }}`. Remove the inline `style` prop entirely and add `aspect-[16/9] max-h-[360px]` to the existing `className`. The full className becomes:
        ```
        "relative w-full rounded-[16px] overflow-hidden bg-[#e2e8f0] aspect-[16/9] max-h-[360px]"
        ```
      - Line 622: Change `pb-1` to `pb-2` in the thumbnail strip `<div className="flex gap-2 mt-2 overflow-x-auto pb-1">`.

      Files: `src/components/PropertyDetails.tsx` (lines 585–587, 622)
      Verify: `npm run build` from `src/landlord_agent/` — zero errors. Visually confirm hero scales proportionally on a narrower window.

---

## Fix 2 — Upload Document triggers new modal instead of old page (P1)

- [ ] 2. **Add `PropertyDocument` to the imports in `PropertyDetails.tsx`.**
      Line 62 currently reads:
      ```ts
      import { Property, PropertyPhoto, Tenant } from "../App";
      ```
      Change to:
      ```ts
      import { Property, PropertyPhoto, Tenant, PropertyDocument } from "../App";
      ```
      (Needed for the `onDocumentUpload` prop type and `handleDocUpload` in the steps below.)

      Files: `src/components/PropertyDetails.tsx` (line 62)
      Verify: part of the `npm run build` check in step 6.

- [ ] 3. **Import `DocumentUploadModal` in `PropertyDetails.tsx`.**
      Add after the existing internal imports (around line 85, after the `getAccessTokenForApiRequest` import):
      ```ts
      import { DocumentUploadModal } from "./DocumentUploadModal";
      ```

      Files: `src/components/PropertyDetails.tsx` (after line 85)
      Verify: part of the `npm run build` check in step 6.

- [ ] 4. **Add `onDocumentUpload` prop to `PropertyDetailsProps`.**
      In the `PropertyDetailsProps` interface (lines 232–245), add one optional prop after `onManageDocuments`:
      ```ts
      onDocumentUpload?: (
        propertyId: string,
        doc: { name: string; type: string; file: File; expiryDate?: string }
      ) => Promise<void>;
      ```
      Also add `onDocumentUpload` to the destructuring at line 253 (the `PropertyDetails` function signature).

      Files: `src/components/PropertyDetails.tsx` (lines 232–245 for interface, line 253 for destructuring)
      Verify: part of the `npm run build` check in step 6.

- [ ] 5. **Add doc-upload state variables and `handleDocUpload` handler inside `PropertyDetails`.**
      After the existing state block that ends at line 277 (`previewPhoto`), add:
      ```ts
      // ── Document upload modal state ──────────────────────────────────────────
      const [isDocUploadOpen, setIsDocUploadOpen]   = useState(false);
      const [isUploadingDoc,  setIsUploadingDoc]    = useState(false);
      const [docUploadError,  setDocUploadError]    = useState<string | null>(null);

      async function handleDocUpload(doc: { name: string; type: string; file: File; expiryDate?: string }) {
        if (!property || !onDocumentUpload) return;
        setIsUploadingDoc(true);
        setDocUploadError(null);
        try {
          await onDocumentUpload(property.id, doc);
          setIsDocUploadOpen(false);
        } catch (err: any) {
          setDocUploadError(err?.message || 'Upload failed. Please try again.');
        } finally {
          setIsUploadingDoc(false);
        }
      }
      ```

      Files: `src/components/PropertyDetails.tsx` (after line 277)
      Verify: part of the `npm run build` check in step 6.

- [ ] 6. **Replace the three "Upload Document" `onClick` handlers with `() => setIsDocUploadOpen(true)`.**

      Three locations to change (all in `PropertyDetails.tsx`):

      a. **Documents tab header button** (line 772): `onClick={onManageDocuments}` → `onClick={() => setIsDocUploadOpen(true)}`

      b. **Documents tab empty-state button** (line 790): `onClick={onManageDocuments}` → `onClick={() => setIsDocUploadOpen(true)}`

      c. **Compliance sidebar inline link** (line 1203): `onClick={onManageDocuments}` → `onClick={() => setIsDocUploadOpen(true)}`

      Leave the header dropdown "Manage Documents" item (line 553: `onSelect={() => onManageDocuments()}`) and the Quick Actions "Manage Documents" (line 1006: `action: onManageDocuments`) unchanged — these still navigate to the full management page.

      Files: `src/components/PropertyDetails.tsx` (lines 772, 790, 1203)
      Verify: part of the `npm run build` check in step 6.

- [ ] 7. **Mount `<DocumentUploadModal>` at the bottom of the `PropertyDetails` JSX and update document types.**
      Just before the final closing `</div>` of the component's return (line 1337, which wraps the `<Dialog>` for photo preview), add:
      ```tsx
      <DocumentUploadModal
        isOpen={isDocUploadOpen}
        isUploading={isUploadingDoc}
        uploadError={docUploadError}
        onClose={() => { setIsDocUploadOpen(false); setDocUploadError(null); }}
        onUpload={handleDocUpload}
      />
      ```

      Also open `DocumentUploadModal.tsx` and replace the `documentTypes` array (lines ~37–44) with property-centric types:
      ```ts
      const documentTypes = [
        { value: 'epc',                 label: 'EPC Certificate' },
        { value: 'gas-cert',            label: 'Gas Safety Certificate' },
        { value: 'tenancy-agreement',   label: 'Tenancy Agreement' },
        { value: 'insurance',           label: 'Insurance Document' },
        { value: 'other',               label: 'Other Document' },
      ];
      ```

      Files: `src/components/PropertyDetails.tsx` (line 1337 area), `src/components/DocumentUploadModal.tsx` (lines ~37–44)
      Verify: `npm run build` — zero errors. (Runtime: open a property → Documents tab → click "Upload Document" → DocumentUploadModal appears with property-specific type options.)

- [ ] 8. **Wire `onDocumentUpload` in `App.tsx` on the `<PropertyDetails>` render.**
      In App.tsx at line 3077 the `<PropertyDetails>` block runs until ~line 3170. After the existing `onManageDocuments` prop (line 3077), add:
      ```tsx
      onDocumentUpload={async (propertyId, doc) => {
        if (!userProfile) return;
        // Upload file to storage
        const formData = new FormData();
        formData.append('file', doc.file);
        const token = await import('./services/msalAccessToken')
          .then(m => m.getAccessTokenForApiRequest());
        const base = (await import('../../../config/apiBaseUrl'))
          .getResolvedApiBaseUrl();
        const res = await fetch(`${base}/api/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        const { url } = await res.json() as { url: string };
        const newDoc: Omit<PropertyDocument, 'id'> = {
          name: doc.name,
          type: doc.type as PropertyDocument['type'],
          url,
          issueDate: new Date(),
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
          status: 'valid',
        };
        await propertyService.addDocumentToProperty(propertyId, newDoc);
        addDocumentToProperty(propertyId, newDoc);
      }}
      ```

      **Note:** The upload endpoint pattern above follows the same pattern used in `DocumentManagement.tsx` lines 215–235 and `App.tsx`'s own `uploadPropertyDocuments` helper (line 913). If the upload endpoint path or token approach differs from those helpers, align it to them — check `propertyService.ts` line 270 and `uploadPropertyDocuments` at line 913 to confirm the correct endpoint URL before implementing.

      Also add `PropertyDocument` to the App.tsx imports if it is not already in scope at the top of the render function (it is exported from App.tsx itself so it is in scope).

      Files: `src/App.tsx` (line 3077 area)
      Verify: `npm run build` — zero errors.

---

## Fix 3 — Clicking a document opens a details drawer (P2)

- [ ] 9. **Add `selectedDoc` state in `PropertyDetails.tsx`.**
      After the doc-upload state block added in step 5, add:
      ```ts
      const [selectedDoc, setSelectedDoc] = useState<PropertyDocument | null>(null);
      ```

      Files: `src/components/PropertyDetails.tsx`
      Verify: part of the `npm run build` check in step 10.

- [ ] 10. **Make document `<li>` elements clickable.**
      The document list `<li>` at line 799 (inside `property.documents.map((doc) => (...))`):
      ```tsx
      <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
      ```
      Change to:
      ```tsx
      <li
        key={doc.id}
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f8fafc] transition-colors"
        onClick={() => setSelectedDoc(doc)}
      >
      ```

      Files: `src/components/PropertyDetails.tsx` (line 799–801)
      Verify: part of the `npm run build` check in step 11.

- [ ] 11. **Add the document details drawer JSX.**
      Immediately before the `<DocumentUploadModal>` added in step 7 (i.e., just before the closing `</div>` at line 1337), add an inline slide-over drawer:
      ```tsx
      {/* ── Document Details Drawer ─────────────────────────────────────── */}
      {selectedDoc && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setSelectedDoc(null)}
          />
          {/* Panel */}
          <aside
            className="fixed right-0 top-0 h-full z-50 w-[340px] max-w-full flex flex-col"
            style={{
              background: "white",
              borderLeft: "1px solid #e2e8f0",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #f1f5f9" }}
            >
              <p
                className="text-[15px] font-bold text-[#1e293b] truncate"
                style={{ fontFamily: "Archivo,sans-serif" }}
              >
                {selectedDoc.name}
              </p>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-all shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Type */}
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                  Document Type
                </p>
                <p className="text-[13.5px] text-[#334155]">{DOC_TYPE_LABELS[selectedDoc.type] ?? selectedDoc.type}</p>
              </div>
              {/* Status */}
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1.5" style={{ fontFamily: "Archivo,sans-serif" }}>
                  Status
                </p>
                <span className="inline-flex items-center gap-1.5">
                  <DocStatusIcon status={selectedDoc.status} />
                  <span className="text-[13px] text-[#334155] capitalize">{selectedDoc.status.replace("-", " ")}</span>
                </span>
              </div>
              {/* Issued date */}
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                  Issued
                </p>
                <p className="text-[13.5px] text-[#334155]">{dates.docs[selectedDoc.id]?.issue ?? "—"}</p>
              </div>
              {/* Expiry date (if present) */}
              {selectedDoc.expiryDate && (
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-[#94a3b8] mb-1" style={{ fontFamily: "Archivo,sans-serif" }}>
                    Expires
                  </p>
                  <p className="text-[13.5px] text-[#334155]">{dates.docs[selectedDoc.id]?.expiry ?? "—"}</p>
                </div>
              )}
            </div>
            {/* Footer — download */}
            <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                onClick={() => window.open(selectedDoc.url, "_blank", "noopener")}
                className="w-full h-[44px] rounded-[12px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "#136C9E", color: "white", fontFamily: "Archivo,sans-serif" }}
              >
                <Download size={16} /> Download Document
              </button>
            </div>
          </aside>
        </>
      )}
      ```

      The `X`, `Download`, `DocStatusIcon`, `DOC_TYPE_LABELS`, and `dates` identifiers are all already in scope in `PropertyDetails.tsx`. No new imports needed.

      Files: `src/components/PropertyDetails.tsx`
      Verify: `npm run build` — zero errors. (Runtime: open a property with documents → click a document row → slide-over panel appears with details and download button.)

---

## Fix 1 — Save as Draft (P3)

- [ ] 12. **Extend the `Property['status']` union in `App.tsx`.**
      Line 125:
      ```ts
      status: 'vacant' | 'occupied' | 'under-renovation';
      ```
      Change to:
      ```ts
      status: 'vacant' | 'occupied' | 'under-renovation' | 'draft';
      ```

      Files: `src/App.tsx` (line 125)
      Verify: part of the `npm run build` check in step 17.

- [ ] 13. **Extend `StatusKey` and `STATUS_META` in `PropertyDetails.tsx` to include `'draft'`.**
      Line 133:
      ```ts
      type StatusKey = "occupied" | "vacant" | "under-renovation";
      ```
      Change to:
      ```ts
      type StatusKey = "occupied" | "vacant" | "under-renovation" | "draft";
      ```
      In `STATUS_META` (lines 134–151), add a `draft` entry after `"under-renovation"`:
      ```ts
      draft: {
        label: "Draft",
        dot: "#94a3b8",
        bg: "#f1f5f9",
        text: "#475569",
      },
      ```

      Files: `src/components/PropertyDetails.tsx` (lines 133, 151)
      Verify: part of the `npm run build` check in step 17.

- [ ] 14. **Add `onSaveDraft` prop to `AddPropertyWizardProps` and `WizardPropertyData.status`.**
      In `AddPropertyWizard.tsx`:

      a. `WizardPropertyData.status` (line ~60) currently allows `'vacant' | 'occupied' | 'under-renovation'`. Extend it to also accept `'draft'`:
      ```ts
      status?: 'vacant' | 'occupied' | 'under-renovation' | 'draft';
      ```

      b. In `AddPropertyWizardProps` (lines 65–74), add after `onAddTenant`:
      ```ts
      onSaveDraft?: (data: WizardPropertyData) => Promise<void>;
      isSavingDraft?: boolean;
      ```

      c. In the component destructuring (line ~230):
      ```ts
      export function AddPropertyWizard({
        initialData, isEditing = false, isPublishing = false,
        onPublish, onBulkImport, onBack, onAddTenant, isSavingForTenant = false,
      }: AddPropertyWizardProps)
      ```
      Add `onSaveDraft, isSavingDraft = false` to the destructuring.

      d. Add a `savingDraft` local state variable alongside `publishing` (line ~244):
      ```ts
      const [savingDraft, setSavingDraft] = useState(false);
      ```

      e. Add a `handleSaveDraft` function after `handlePublish` (line ~310):
      ```ts
      async function handleSaveDraft() {
        setSavingDraft(true);
        try {
          await onSaveDraft?.({ ...form, status: 'draft' });
        } catch (err: any) {
          setGE(err?.message || 'Failed to save draft. Please try again.');
        } finally {
          setSavingDraft(false);
        }
      }
      ```

      Files: `src/components/AddPropertyWizard.tsx` (lines ~60, ~65–74, ~230, ~244, ~310)
      Verify: part of the `npm run build` check in step 17.

- [ ] 15. **Add "Save as Draft" button to the wizard navbar (top right) and Step 5 Review panel.**

      a. **Navbar** — inside the `<div className="flex items-center gap-3">` header right group (line ~473), add a "Save as Draft" text button *before* the existing ✕ cancel button (so it sits between "Step X of 5" and the ✕). Only show it when `onSaveDraft` is provided and we are not in edit mode:
      ```tsx
      {!isEditing && onSaveDraft && (
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={savingDraft || isSavingDraft}
          className="hidden sm:flex text-[12.5px] font-semibold text-[#136C9E] hover:underline disabled:opacity-50 transition-all"
          style={{ fontFamily: 'Archivo,sans-serif' }}
        >
          {(savingDraft || isSavingDraft) ? 'Saving…' : 'Save as Draft'}
        </button>
      )}
      ```

      b. **Step 5 Review panel** — after the "Add a Tenant Now" button block (line ~884, the block that ends `</button>` and then `</> )}`) and before the closing `</div>` of the Actions section, add:
      ```tsx
      {!isEditing && onSaveDraft && (
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={savingDraft || isSavingDraft}
          className="w-full h-[44px] rounded-[14px] border font-semibold text-[13.5px] flex items-center justify-center gap-2 transition-all hover:bg-[#f8fafc] disabled:opacity-50"
          style={{ borderColor: '#cbd5e1', color: '#64748b', fontFamily: 'Archivo,sans-serif' }}
        >
          {(savingDraft || isSavingDraft)
            ? <><Loader2 size={15} className="animate-spin" /> Saving draft…</>
            : 'Save as Draft'
          }
        </button>
      )}
      ```

      Files: `src/components/AddPropertyWizard.tsx` (line ~473 area for navbar, line ~884 area for Step 5)
      Verify: part of the `npm run build` check in step 17.

- [ ] 16. **Locate the exact end of the Step 5 actions block.**
      The Step 5 "Add a Tenant Now" button ends at approximately line 884. Read the file from line 860 to 890 to confirm the exact line before adding the Draft button — the JSX nesting must be correct (the draft button must be a sibling of the `{!isEditing && onAddTenant && (...)}` block, inside the same parent `<div className="flex flex-col gap-3">`).

      Files: `src/components/AddPropertyWizard.tsx` — read-only check before editing
      Verify: n/a (preparation step).

- [ ] 17. **Wire `onSaveDraft` in `App.tsx` on the `<AddPropertyWizard>` render.**
      In App.tsx at line 2727, the `<AddPropertyWizard>` block has `onPublish` wired at line 2775. After `onPublish`'s closing `}}` (around line 2948) and before the final `/>` of `<AddPropertyWizard>` (around line 2950), add:
      ```tsx
      onSaveDraft={async (wizardData: WizardPropertyData) => {
        if (!userProfile) {
          window.parent.postMessage({ type: 'REQUIRE_AUTH', payload: { action: 'save-draft' } }, '*');
          throw new Error('Authentication required');
        }
        // Re-use the same full save path but force status to 'draft'
        // The onPublish handler already reads wizardData.status via preservedStatus,
        // so call onPublish with status patched to 'draft'.
        // We invoke the save inline here to avoid duplicating the full upload logic.
        setIsPublishing(true);
        try {
          // Patch status then delegate to the same handler body that onPublish uses.
          // Simplest approach: call savePropertyFromWizard-equivalent inline.
          // Because the full publish logic lives inside the onPublish closure,
          // extract a shared helper `savePropertyFromWizard` (see note below).
          await (onPublish as any)({ ...wizardData, status: 'draft' });
        } finally {
          setIsPublishing(false);
        }
        toast.success('Property saved as draft');
        navigateToMainApp('properties');
      }}
      ```

      **Important note:** The `onPublish` closure in App.tsx is defined inline and is not callable from `onSaveDraft`. The correct approach is to extract the publish logic into a named `async function savePropertyFromWizard(wizardData: WizardPropertyData)` at the component level (around line 2775), then have both `onPublish` and `onSaveDraft` call it:
      ```tsx
      // Extract before the return statement, e.g. around line 1414 near addProperty:
      const savePropertyFromWizard = useCallback(async (wizardData: WizardPropertyData) => {
        // ... move the entire body of the onPublish handler here ...
        // The only change: use wizardData.status directly (don't override to 'vacant').
        // preservedStatus should become:
        //   wizardData.status || (isEditing && selectedProperty ? selectedProperty.status : 'vacant')
      }, [/* dependencies: isEditing, selectedProperty, properties, tenants, propertySetupData, ... */]);
      ```
      Then:
      ```tsx
      onPublish={async (wizardData) => { await savePropertyFromWizard(wizardData); }}
      onSaveDraft={async (wizardData) => {
        await savePropertyFromWizard({ ...wizardData, status: 'draft' });
        toast.success('Property saved as draft');
        navigateToMainApp('properties');
      }}
      ```

      **Assumption:** The refactor to `savePropertyFromWizard` is the clean approach. If the implementer prefers not to extract a helper, the alternative is to duplicate the entire `onPublish` handler body into `onSaveDraft` with `status: 'draft'` — this is safe but verbose. Choose the extraction approach.

      Files: `src/App.tsx` (line 2775–2950 area)
      Verify: `npm run build` — zero errors. (Runtime: start the Add Property wizard → click "Save as Draft" in the navbar or Step 5 → property appears in the Properties list under the Drafts tab with a grey "Draft" pill.)

---

## Final verification

- [ ] 18. **Full build clean pass.**
      Run `npm run build` from `src/landlord_agent/`. Expected: zero TypeScript/Rollup errors. The build output is `../../public/landlord/`.

      Files: n/a
      Verify: `cd /home/angeli/Desktop/luxcity/proptii-r1.1a/src/landlord_agent && npm run build` exits with code 0.
