# Contract Sync Integration - Quick Start Guide

## What Was Implemented

✅ **Automatic contract sync** from tenant app to landlord dashboard when contracts are sent to registered landlord/agent email addresses.

## Files Created/Modified

### New Services
1. **`src/services/landlordUserService.ts`** - Manages landlord/agent user registration
2. **`src/services/contractSyncService.ts`** - Syncs contracts between apps
3. **`src/utils/setupLandlordUsers.ts`** - Quick setup utilities with sample data
4. **`src/scripts/registerLandlordUser.ts`** - Manual registration script

### Updated Components
1. **`src/components/contract/SendContract.tsx`** - Now checks recipients and syncs to landlord dashboard
2. **`src/landlord_agent/src/components/ContractsPage.tsx`** - Displays synced contracts with badges

### Documentation
1. **`CONTRACT_SYNC_INTEGRATION_GUIDE.md`** - Complete integration guide
2. **`FIRESTORE_DATABASE_SETUP.md`** - Database structure and setup
3. **`CONTRACT_INTEGRATION_QUICKSTART.md`** - This file

---

## Quick Setup (5 Minutes)

### Step 1: Create Firestore Collection

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project: `proptii-16946`
3. Go to **Firestore Database**
4. Click **Start Collection**
5. Collection ID: `landlordUsers`
6. Add a test document:
   ```json
   {
     "email": "test@proptii.com",
     "name": "Test Landlord",
     "role": "landlord",
     "phone": "+44 7911 123456"
   }
   ```

**OR** Skip this and use the setup script in Step 3.

### Step 2: Update Firestore Rules

In Firebase Console > **Firestore Database** > **Rules**, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /landlordUsers/{userId} {
      allow read, write: if true;
    }
    match /signedContracts/{contractId} {
      allow read, write: if true;
    }
    match /contracts/{contractId} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**.

### Step 3: Register Test Landlord Users

**Option A: Quick Setup Script**

Open browser console in your tenant app and run:

```typescript
// This will register 4 sample landlord/agent users
await setupAllLandlordUsers();

// Verify they were registered
await verifyLandlordUsers();

// List all registered users
await listRegisteredLandlords();
```

**Option B: Register Manually**

Create a test file `src/setupTest.ts`:

```typescript
import { registerLandlordUser } from './scripts/registerLandlordUser';

// Register a test landlord
await registerLandlordUser({
  email: 'john.smith@proptii.com',
  name: 'John Smith',
  role: 'landlord',
  phone: '+44 7911 123456'
});
```

---

## Testing the Integration

### Step 1: Start Both Apps

```bash
# Terminal 1: Tenant app (where contracts are sent)
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Landlord dashboard (where contracts appear)
cd src/landlord_agent
npm run dev
# Runs on http://localhost:3000
```

### Step 2: Send a Contract to Landlord

1. **In Tenant App** (http://localhost:5173):
   - Go to **Contracts** page
   - Upload a PDF contract template
   - Sign the contract
   - Click **Send** tab
   - Add recipient email: `john.smith@proptii.com` (or any registered landlord email)
   - Click **Send Contract**

2. **Check Console** - You should see:
   ```
   ✅ Email sent successfully to john.smith@proptii.com
   🔍 Checking if recipients are landlords/agents...
   ✅ Found landlord/agent recipients: 1
   🔄 Syncing signed contract to landlord dashboard(s)...
   ✅ Successfully synced to 1 landlord dashboard(s)
   ```

### Step 3: View Contract in Landlord Dashboard

1. **In Landlord Dashboard** (http://localhost:3000):
   - Go to **Contracts** page
   - Click **Signed** tab
   - The contract should appear with a green badge **"Received from Tenant"**

---

## Verification Checklist

### ✅ Database Setup
- [ ] `landlordUsers` collection created in Firestore
- [ ] Firestore security rules updated
- [ ] At least one landlord user registered

### ✅ Services Working
- [ ] `landlordUserService` can check if email is landlord
- [ ] `contractSyncService` can sync contracts
- [ ] No console errors

### ✅ Integration Working
- [ ] Tenant app can send contracts
- [ ] Contracts sync when sent to landlord email
- [ ] Contracts appear in landlord dashboard "Signed" tab
- [ ] Green "Received from Tenant" badge displays

---

## Common Issues & Solutions

### Issue: "Contract not appearing in landlord dashboard"

**Check 1**: Is the recipient registered?
```typescript
await checkLandlordUser('recipient@email.com');
```

**Check 2**: Check Firestore Database
- Open Firebase Console
- Go to Firestore Database
- Check `landlordUsers` collection - is the email there?
- Check `contracts` collection - was the contract created?

**Check 3**: Check browser console
- Look for sync errors in tenant app console
- Look for loading errors in landlord dashboard console

### Issue: "Email sent but contract not synced"

**Cause**: Recipient email not in `landlordUsers` collection

**Solution**:
```typescript
// Register the recipient
await registerLandlordUser({
  email: 'recipient@email.com',
  name: 'Recipient Name',
  role: 'landlord'
});

// Verify
await checkLandlordUser('recipient@email.com');
```

### Issue: "Firestore permission denied"

**Cause**: Security rules not updated

**Solution**:
1. Go to Firebase Console > Firestore > Rules
2. Copy rules from Step 2 above
3. Click Publish
4. Wait 1 minute for rules to propagate

---

## API Reference

### Landlord User Service

```typescript
import landlordUserService from './services/landlordUserService';

// Check if email is landlord/agent
const result = await landlordUserService.isLandlordOrAgent('email@example.com');
// Returns: { isLandlord: boolean, user?: LandlordUser, error?: string }

// Register new landlord
const result = await landlordUserService.registerLandlordUser({
  email: 'email@example.com',
  name: 'Name',
  role: 'landlord',
  phone: '+44 7911 123456',
  companyName: 'Company Ltd'
});
// Returns: { success: boolean, userId?: string, error?: string }

// Get all landlords
const result = await landlordUserService.getAllLandlordUsers();
// Returns: { success: boolean, users?: LandlordUser[], error?: string }
```

### Contract Sync Service

```typescript
import contractSyncService from './services/contractSyncService';

// Check which recipients are landlords
const result = await contractSyncService.checkRecipientsForLandlords([
  'email1@example.com',
  'email2@example.com'
]);
// Returns: { hasLandlords: boolean, landlords: Array<{email, name, role}> }

// Sync contract to landlord dashboard
const result = await contractSyncService.syncSignedContractToLandlordDashboard(
  signedContractData,
  'landlord@example.com'
);
// Returns: { success: boolean, contractId?: string, error?: string }

// Sync to multiple landlords
const result = await contractSyncService.syncToMultipleLandlords(
  signedContractData,
  ['landlord1@example.com', 'landlord2@example.com']
);
// Returns: { success: boolean, syncedCount: number, results: Array<{email, success, contractId?, error?}> }
```

---

## Sample Landlord Emails (from setup script)

If you ran `setupAllLandlordUsers()`, these emails are registered:

1. **john.smith@proptii.com** - John Smith (Landlord)
2. **jane.doe@proptii.com** - Jane Doe (Agent)
3. **michael.chen@proptii.com** - Michael Chen (Landlord)
4. **sarah.wilson@proptii.com** - Sarah Wilson (Agent)

Use any of these emails when sending test contracts.

---

## What Happens Behind the Scenes

```
┌─────────────────────────────────────────────┐
│  User signs contract in tenant app          │
│  (ContractModal.tsx)                        │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  User sends to: john.smith@proptii.com      │
│  (SendContract.tsx)                         │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Email sent to john.smith@proptii.com       │
│  (contractEmailService)                     │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Check: Is recipient a landlord?            │
│  (contractSyncService.checkRecipientsFor..  │
│   Landlords)                                │
└──────────────────┬──────────────────────────┘
                   │
                   v
        ┌──────────┴──────────┐
        │   Yes!              │   No - Skip sync
        v                     v
┌───────────────────┐    End process
│  Save to Firestore │
│  1. signedContracts│
│  2. contracts      │
│     (landlord DB)  │
└────────┬───────────┘
         │
         v
┌─────────────────────────────────────────────┐
│  Landlord opens dashboard                   │
│  (ContractsPage.tsx)                        │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Loads contracts from Firestore             │
│  (contractService.getContracts)             │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Displays in "Signed" tab with badge        │
│  "Received from Tenant"                     │
└─────────────────────────────────────────────┘
```

---

## Next Steps

### For Development
1. ✅ Test with multiple landlord emails
2. ✅ Test error cases (unregistered emails, network failures)
3. ✅ Test with multiple recipients (some landlords, some not)
4. ✅ Verify contracts appear correctly in dashboard

### For Production
1. ⚠️ Implement proper Firestore security rules (see `FIRESTORE_DATABASE_SETUP.md`)
2. ⚠️ Add email verification for landlord registration
3. ⚠️ Add authentication checks
4. ⚠️ Set up error monitoring and logging
5. ⚠️ Create Firestore indexes for optimal performance

---

## Support & Documentation

- **Full Integration Guide**: `CONTRACT_SYNC_INTEGRATION_GUIDE.md`
- **Database Setup**: `FIRESTORE_DATABASE_SETUP.md`
- **This Quick Start**: `CONTRACT_INTEGRATION_QUICKSTART.md`

---

## Summary

🎉 **You now have**:
- ✅ Automatic contract sync from tenant app to landlord dashboard
- ✅ Landlord user registration system
- ✅ Visual indicators for synced contracts
- ✅ Complete logging and debugging tools
- ✅ Sample data for testing

🚀 **Start testing** by:
1. Running both apps
2. Registering a landlord email
3. Sending a contract to that email
4. Checking the landlord dashboard

Good luck! 🎊




