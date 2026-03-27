# Testing Contract Flow: Landlord → Tenant

## Quick Test Guide

### Prerequisites
- Firebase/Firestore is configured and accessible
- Both landlord and tenant apps are running
- You have test accounts for both landlord and tenant

### Step-by-Step Test

#### 1. Setup Test Accounts
```
Landlord Email: landlord@test.com
Tenant Email: tenant@test.com
```

#### 2. Send Contract as Landlord

1. **Login as Landlord**
   - Open landlord app: `http://localhost:5173/landlord`
   - Login with landlord credentials

2. **Navigate to Contracts**
   - Click on "Contracts" in the navigation menu
   - You should see the Contracts page with tabs: Sent, Unsigned, Signed

3. **Send a Contract**
   - Click the orange "Send Contract" button (top right)
   - Fill in the modal:
     - **Recipient Name:** "Test Tenant"
     - **Recipient Email:** `tenant@test.com` (use actual tenant email)
     - **Additional Message:** (optional) "Please review and sign"
     - **Attach File:** Upload a PDF contract (max 10MB)
   - Click "Send Contract"

4. **Verify Success**
   - You should see a success alert
   - The contract should appear in the "Sent" tab
   - Check browser console for: `✅ Contract saved to Firestore: [ID]`

#### 3. View Contract as Tenant

1. **Login as Tenant**
   - Open tenant app: `http://localhost:3000`
   - Login with tenant credentials (`tenant@test.com`)

2. **Open Contract Modal**
   - Navigate to the contracts section
   - Open the ContractModal

3. **Check Received Contracts Tab**
   - You should see three tabs:
     - Uploaded Templates
     - **Received Contracts** ← Click this one
     - Deleted Templates
   
4. **Verify Contract Appears**
   - The contract sent by landlord should appear in the table
   - Check that it shows:
     - ✅ Contract filename (bold)
     - ✅ Status badge inline: "Sent" (blue background)
     - ✅ Landlord email below: `From: landlord@test.com`
     - ✅ Sent date: Today's date
     - ✅ Two action buttons: **Manage** and **Preview**

5. **Test Actions**
   
   **Preview Button:**
   - Click "Preview" button
   - PDF preview modal should open
   - Verify the PDF content is correct
   - Check navigation controls work (if multi-page)
   - Close preview with X button or ESC

   **Manage Dropdown:**
   - Click "Manage" button
   - Dropdown menu should appear with:
     - ✅ "Customize" option
     - ✅ "Download" option
   
   **Customize Action:**
   - Click "Customize" from dropdown
   - Should open the customization view
   - Contract should be editable/fillable
   
   **Download Action:**
   - Click "Download" from dropdown
   - PDF should download to your computer
   - Verify downloaded file opens correctly

#### 4. Test Multiple Contracts

1. **Send 2-3 More Contracts**
   - As landlord, send additional contracts with different names
   - Use the same tenant email

2. **Verify All Appear**
   - As tenant, refresh or reopen ContractModal
   - All contracts should appear in "Received Contracts" tab
   - Sorted by sent date (newest first)

### Expected Console Logs

#### Landlord Side (ContractsPage.tsx)
```
🔄 ContractsPage - Landlord email: landlord@test.com
✅ Contract saved to Firestore: abc123xyz
📧 Contract email sent successfully with attachment
```

#### Tenant Side (ContractModal.tsx)
```
🔄 Fetching received contracts for tenant: tenant@test.com
🔄 Getting contracts received by tenant: tenant@test.com
✅ Found 1 contracts for tenant tenant@test.com
✅ Loaded 1 received contracts
```

### Troubleshooting

#### Contract Not Appearing

**Problem:** Tenant doesn't see the contract

**Check:**
1. Email addresses match exactly (case-sensitive)
2. Firestore rules allow tenant to read contracts
3. Browser console for errors
4. Network tab in DevTools for failed requests

**Solution:**
```javascript
// Run this in tenant's browser console
console.log('User email:', user?.email);
console.log('Received contracts:', receivedContracts);
```

#### PDF Preview Not Working

**Problem:** "View" button doesn't show PDF

**Check:**
1. PDF file is valid
2. Base64 encoding is correct
3. Browser supports blob URLs
4. No CSP errors in console

**Debug:**
```javascript
// Check contract data in console
console.log('Contract fileUrl:', contract.fileUrl);
console.log('Is base64?', contract.fileUrl.startsWith('data:'));
```

### Firestore Verification

#### Check Contract Document

1. Open Firebase Console
2. Navigate to Firestore Database
3. Open `contracts` collection
4. Find your test contract
5. Verify fields:
   ```
   {
     tenantEmail: "tenant@test.com",
     landlordEmail: "landlord@test.com",
     status: "sent",
     fileName: "test-contract.pdf",
     fileUrl: "data:application/pdf;base64,..." (very long)
   }
   ```

### Security Rules Testing

#### Test Read Access

1. **Tenant Can Read Their Contracts**
   ```javascript
   // Should succeed
   getReceivedContracts('tenant@test.com')
   ```

2. **Other Users Cannot Read**
   ```javascript
   // Should return empty or fail
   getReceivedContracts('other-user@test.com')
   ```

### Performance Testing

#### Test with Large Files

1. Upload a 5-10MB PDF contract
2. Verify upload completes
3. Check preview loads in reasonable time
4. Monitor browser memory usage

#### Test with Many Contracts

1. Send 20-30 contracts to same tenant
2. Verify all load efficiently
3. Check scroll performance in table
4. Monitor Firestore read count

### Edge Cases

#### Test Empty States

1. **No Contracts Received**
   - Login as new tenant with no contracts
   - Open "Received Contracts" tab
   - Should show: "No contracts received yet"

2. **All Contracts Signed**
   - After signing all contracts
   - "Sent" filter should show empty

#### Test Different File Types

1. **Valid PDF:** ✅ Should work
2. **Large PDF (>10MB):** ❌ Should reject with error
3. **Corrupt PDF:** ❌ Should handle gracefully
4. **Non-PDF file:** ❌ Should reject

### Success Criteria

✅ Contract sent by landlord appears in tenant's "Received Contracts" tab
✅ All contract details displayed correctly
✅ PDF preview works
✅ Multiple contracts can be sent and viewed
✅ Contracts filtered by tenant email (no cross-contamination)
✅ Real-time updates work (if implemented)
✅ Error handling works gracefully

### Next Steps After Testing

1. **Add Firestore indexes** if you see index warnings
2. **Configure security rules** for production
3. **Set up email notifications** for new contracts
4. **Add contract signing functionality**
5. **Implement download feature**

## Quick Commands

### Start Landlord App
```bash
cd src/landlord_agent
npm run dev
```

### Start Tenant App
```bash
npm run dev
```

### Check Firestore Data
```bash
# Firebase CLI
firebase firestore:indexes
firebase firestore:get contracts/[CONTRACT_ID]
```

### Clear Test Data
```javascript
// Run in browser console (only in development!)
// This will clear all test contracts
const clearTestContracts = async () => {
  const snapshot = await getDocs(collection(db, 'contracts'));
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
  console.log('Cleared', snapshot.size, 'contracts');
};
```

## Video Recording Suggestion

Consider recording a video walkthrough showing:
1. Landlord logging in and sending contract
2. Tenant logging in and viewing received contract
3. PDF preview functionality
4. Multiple contracts being managed

This will help with:
- User documentation
- Training new team members
- Stakeholder demonstrations
- Bug reporting with reproduction steps

