# Referencing Documents - Test Checklist

## Quick Test Guide

Use this checklist to verify the referencing documents integration is working correctly.

## Prerequisites

- [ ] Landlord agent app is running: `cd src/landlord_agent ; npm run dev`
- [ ] At least one tenant has completed the referencing form with uploaded documents
- [ ] Firebase/Firestore is configured and accessible
- [ ] Browser console is open for debugging

## Test Scenarios

### ✅ 1. View Referencing Documents

**Steps:**
1. [ ] Navigate to `http://localhost:3000` (or your landlord app URL)
2. [ ] Click on "Clients" in the sidebar
3. [ ] Click on a tenant who has completed referencing
4. [ ] Click on the "Documents" tab

**Expected Results:**
- [ ] Documents tab loads without errors
- [ ] Referencing documents are displayed
- [ ] Each referencing document has a blue "Referencing" badge
- [ ] Document name shows the type (e.g., "Identity Document - passport.jpg")
- [ ] Upload date is displayed
- [ ] File size is displayed (e.g., "245.67 KB")
- [ ] File type is displayed (e.g., "image/jpeg")
- [ ] Status badge shows "valid"
- [ ] Three-dot menu button is visible on each document
- [ ] Header shows count of referencing documents (e.g., "5 from referencing")

---

### ✅ 2. View Document in New Tab

**Steps:**
1. [ ] Navigate to Documents tab for a tenant
2. [ ] Click the three-dot menu on a referencing document
3. [ ] Click "View Document"

**Expected Results:**
- [ ] New browser tab opens
- [ ] Document displays correctly (image or PDF)
- [ ] No console errors

---

### ✅ 3. Download Document

**Steps:**
1. [ ] Navigate to Documents tab for a tenant
2. [ ] Click the three-dot menu on a referencing document
3. [ ] Click "Download"

**Expected Results:**
- [ ] Browser shows download prompt or auto-downloads
- [ ] File downloads with correct filename
- [ ] Downloaded file can be opened successfully
- [ ] File content matches original upload

---

### ✅ 4. Loading State

**Steps:**
1. [ ] Navigate to Clients page
2. [ ] Click on a tenant
3. [ ] Immediately click on Documents tab

**Expected Results:**
- [ ] Loading spinner appears while fetching data
- [ ] Loading message shows: "Loading documents..."
- [ ] Spinner disappears when data is loaded
- [ ] Documents display correctly after loading

---

### ✅ 5. Empty State (No Documents)

**Steps:**
1. [ ] Navigate to a tenant who hasn't completed referencing
2. [ ] Go to Documents tab

**Expected Results:**
- [ ] Empty state icon (large file icon) is displayed
- [ ] Message shows: "No documents available"
- [ ] Helpful text shows: "Upload documents or have the tenant complete referencing"
- [ ] "Upload Document" button is still visible in header

---

### ✅ 6. Mixed Documents (Regular + Referencing)

**Steps:**
1. [ ] Navigate to a tenant with both uploaded documents and referencing documents
2. [ ] Go to Documents tab

**Expected Results:**
- [ ] Both types of documents are displayed
- [ ] Referencing documents have blue "Referencing" badge
- [ ] Regular documents don't have "Referencing" badge
- [ ] All documents are in chronological order
- [ ] Each document type displays appropriate information

---

### ✅ 7. All Document Types Present

**Verify all 5 referencing document types are displayed:**

1. [ ] Identity Document (from Identity section)
2. [ ] Employment Proof (from Employment section)
3. [ ] Proof of Address (from Residential section)
4. [ ] Proof of Income (from Financial section)
5. [ ] Guarantor ID (from Guarantor section, if filled)

**Note:** Guarantor documents only appear if the tenant filled the Guarantor section.

---

### ✅ 8. Document Actions Menu

**Steps:**
1. [ ] Click three-dot menu on any referencing document
2. [ ] Verify menu items

**Expected Results:**
- [ ] Menu opens
- [ ] "View Document" option is present with file icon
- [ ] "Download" option is present with file icon
- [ ] Menu items are clickable
- [ ] Icons are properly styled (orange color)

---

### ✅ 9. Console Logs (Developer Check)

**Open browser console and verify:**

1. [ ] No error messages in console
2. [ ] Success logs show:
   - `[TenantDetails] Fetching referencing status for: [email]`
   - `[TenantDetails] Referencing result: {status: '...', data: {...}}`
   - `[TenantDetails] Extracted X referencing documents`
   - `Document opened in new tab: [filename]` (when viewing)
   - `Document download initiated: [filename]` (when downloading)

---

### ✅ 10. Mobile Responsiveness

**Steps:**
1. [ ] Open browser DevTools
2. [ ] Switch to mobile view (e.g., iPhone or Android)
3. [ ] Navigate to Documents tab

**Expected Results:**
- [ ] Layout adjusts for mobile screen
- [ ] Documents are still readable
- [ ] Badges are visible
- [ ] Three-dot menu is accessible
- [ ] Actions work on mobile

---

### ✅ 11. Different Tenants

**Test with multiple tenant scenarios:**

1. [ ] Tenant with completed referencing (all documents)
   - Expected: All 5 documents visible

2. [ ] Tenant with incomplete referencing (some documents)
   - Expected: Only uploaded documents visible

3. [ ] Tenant with no referencing (not started)
   - Expected: Empty state or only regular documents

4. [ ] Tenant not in system
   - Expected: "Tenant not found" or error handling

---

### ✅ 12. Error Handling

**Test error scenarios:**

1. [ ] Network error (disable internet, try to load documents)
   - Expected: Error message or fallback behavior

2. [ ] Invalid document URL
   - Expected: Console warning, graceful failure

3. [ ] Missing tenant email
   - Expected: Console warning, skips referencing check

---

## Performance Checks

- [ ] Documents load within 2 seconds
- [ ] No lag when switching to Documents tab
- [ ] Smooth scrolling through document list
- [ ] Quick response when clicking menu actions

---

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Common Issues & Solutions

### Issue: Documents not appearing

**Checklist:**
- [ ] Tenant has completed referencing?
- [ ] Tenant uploaded documents during referencing?
- [ ] Console shows any errors?
- [ ] Firestore has the data?

**Solution:**
1. Check browser console for errors
2. Verify Firestore document structure
3. Check tenant email matches Firestore query
4. Verify Firestore security rules

---

### Issue: Download doesn't work

**Checklist:**
- [ ] Console shows download initiated message?
- [ ] Browser blocking downloads?
- [ ] File size reasonable (<5MB)?

**Solution:**
1. Check browser download settings
2. Verify base64 data is valid
3. Try with smaller file

---

### Issue: View opens blank page

**Checklist:**
- [ ] File type supported by browser?
- [ ] Popup blocker enabled?
- [ ] Base64 data valid?

**Solution:**
1. Disable popup blocker
2. Try with JPEG/PNG images
3. Check console for errors

---

## Data Verification

### Firestore Console Check

1. [ ] Open Firestore console
2. [ ] Navigate to `referencingForms` collection
3. [ ] Find document by tenant email
4. [ ] Verify structure:
   - [ ] `formData` object exists
   - [ ] `formData.identity.identityProof` has `dataUrl`
   - [ ] Other proof documents have `dataUrl`
   - [ ] `isSubmitted` is `true`
   - [ ] `createdAt` and `updatedAt` timestamps exist

---

## Final Checks

- [ ] All tests pass
- [ ] No console errors
- [ ] UI looks correct
- [ ] Actions work as expected
- [ ] Performance is acceptable
- [ ] Works on multiple browsers
- [ ] Mobile view works correctly

---

## Notes

Document any issues found during testing:

```
Issue 1:
Description: 
Steps to reproduce:
Expected:
Actual:
```

```
Issue 2:
Description:
Steps to reproduce:
Expected:
Actual:
```

---

## Sign-Off

- **Tester Name:** _______________
- **Date:** _______________
- **Test Environment:** _______________
- **Result:** ☐ Pass ☐ Fail ☐ Pass with Issues

**Additional Comments:**

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________


