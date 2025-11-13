# Testing the Contract Sync Integration

## Quick Test Guide

Follow these steps to test that signed contracts properly sync to the landlord dashboard:

### Step 1: Register as Landlord/Agent (2 minutes)

1. **Open Tenant App**: http://localhost:5173
2. **Click "Agent" tab** in the navigation
3. **You'll see Role Selection Popup**:
   - Select either "Landlord" or "Agent"
   - Click "Continue"
4. **Fill out the Registration Form**:
   ```
   Full Name: John Smith
   Email: john.smith@proptii.com
   Phone: +44 7911 123456
   Company: Smith Properties
   ```
5. **Click "Complete Registration"**
6. **You should see**: "Successfully registered as landlord!"

**What happened:**
- ✅ User registered in `landlordUsers` Firestore collection
- ✅ Email stored in localStorage as `landlordEmail`

---

### Step 2: Send a Signed Contract (3 minutes)

1. **Stay in Tenant App** (http://localhost:5173)
2. **Go to Contracts page** (`/contracts`)
3. **Upload a PDF contract template**
4. **Sign the contract** (in the Edit tab)
5. **Go to "Send" tab**
6. **Add recipient**: `john.smith@proptii.com` (the email you registered)
7. **Click "Send Contract"**

**Check Console** - You should see:
```
✅ Email sent successfully to john.smith@proptii.com
🔍 Checking if recipients are landlords/agents...
✅ Found landlord/agent recipients: 1
📋 Landlords: John Smith (john.smith@proptii.com)
🔄 Syncing signed contract to landlord dashboard(s)...
✅ Successfully synced to 1 landlord dashboard(s)
```

**What happened:**
- ✅ Signed contract saved to `signedContracts` collection
- ✅ System checked if recipient is a landlord/agent
- ✅ Contract synced to `contracts` collection with:
  - `status: 'signed'`
  - `landlordEmail: 'john.smith@proptii.com'`
  - `additionalInfo: 'Signed contract sent from tenant app...'`

---

### Step 3: View in Landlord Dashboard (1 minute)

1. **Open Landlord Dashboard**: http://localhost:3000
2. **Go to Contracts page**
3. **Click "Signed" tab**
4. **You should see your contract** with:
   - Green badge: "Received from Tenant"
   - Contract title
   - Tenant name and email
   - Signed date

**Check Console** - You should see:
```
✅ Found landlord email in localStorage: john.smith@proptii.com
🔄 ContractsPage - Loading contracts for tab: signed
🔍 Filtering contracts by landlord email: john.smith@proptii.com
✅ ContractsPage - Loaded 1 contracts with status 'signed'
📋 Signed contracts: [{...}]
```

**What happened:**
- ✅ Dashboard loaded landlord email from localStorage
- ✅ Queried contracts WHERE `landlordEmail = 'john.smith@proptii.com'` AND `status = 'signed'`
- ✅ Displayed the signed contract in the table

---

## Troubleshooting

### Issue: "No signed contracts" in dashboard

**Check 1: Is the recipient registered?**

Open browser console in tenant app:
```javascript
import landlordUserService from './src/services/landlordUserService';
await landlordUserService.isLandlordOrAgent('john.smith@proptii.com');
```

Should return: `{ isLandlord: true, user: {...} }`

**Check 2: Did the sync happen?**

Look in tenant app console after sending. Should see:
```
✅ Successfully synced to 1 landlord dashboard(s)
```

**Check 3: Check Firestore**

1. Go to [Firebase Console](https://console.firebase.google.com/project/proptii-16946/firestore/data)
2. Open `contracts` collection
3. Look for document with:
   - `status: 'signed'`
   - `landlordEmail: 'john.smith@proptii.com'`
   - `additionalInfo` contains "Signed contract sent from tenant app"

**Check 4: Is landlord email in localStorage?**

In landlord dashboard console:
```javascript
localStorage.getItem('landlordEmail')
```

Should return: `"john.smith@proptii.com"`

If not, set it manually:
```javascript
localStorage.setItem('landlordEmail', 'john.smith@proptii.com');
location.reload();
```

---

### Issue: Registration form doesn't appear

**Cause**: User might already be registered or no auth context

**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Try registration again

---

### Issue: Contract sent but not synced

**Cause**: Recipient email not in `landlordUsers` collection

**Check**:
```javascript
// In browser console
import { checkLandlordUser } from './src/scripts/registerLandlordUser';
await checkLandlordUser('recipient@email.com');
```

**Solution**: Register the recipient first before sending contracts

---

### Issue: "Firestore index missing" warning

**This is expected!** The code falls back to sorting in memory.

**To fix permanently**: See `FIRESTORE_INDEX_SETUP.md`

---

## Complete Test Checklist

- [ ] **Step 1**: Register landlord/agent in tenant app
  - [ ] Registration form appears
  - [ ] Form submission successful
  - [ ] Success message shown
  - [ ] Email stored in localStorage

- [ ] **Step 2**: Send signed contract
  - [ ] Contract uploaded and signed
  - [ ] Recipient email matches registered landlord
  - [ ] Email sent successfully
  - [ ] Sync confirmation in console
  - [ ] No errors in console

- [ ] **Step 3**: View in dashboard
  - [ ] Landlord dashboard opens
  - [ ] Contracts page loads
  - [ ] "Signed" tab shows contract
  - [ ] Green "Received from Tenant" badge visible
  - [ ] Contract details correct

- [ ] **Firestore Verification**:
  - [ ] `landlordUsers` collection has entry
  - [ ] `signedContracts` collection has entry  
  - [ ] `contracts` collection has entry with `landlordEmail`

---

## Expected Firestore Structure

After successful test, you should see:

### `landlordUsers` Collection:
```json
{
  "id": "landlord_1699901234567_abc123",
  "email": "john.smith@proptii.com",
  "name": "John Smith",
  "role": "landlord",
  "phone": "+44 7911 123456",
  "companyName": "Smith Properties",
  "createdAt": "2024-11-11T12:00:00Z",
  "updatedAt": "2024-11-11T12:00:00Z"
}
```

### `signedContracts` Collection:
```json
{
  "id": "signed_dev-user-123_1699901234567_xyz789",
  "userId": "dev-user-123",
  "templateName": "Tenancy Agreement",
  "tenantEmail": "tenant@example.com",
  "status": "sent",
  "emailSent": true,
  // ... other fields
}
```

### `contracts` Collection (Landlord Dashboard):
```json
{
  "id": "abc123def456",
  "title": "Tenancy Agreement",
  "tenantName": "John Tenant",
  "tenantEmail": "john.tenant@example.com",
  "landlordEmail": "john.smith@proptii.com",
  "landlordId": "landlord_1699901234567_abc123",
  "status": "signed",
  "additionalInfo": "Signed contract sent from tenant app. Agent: Jane Agent",
  // ... other fields
}
```

---

## Success Criteria

✅ **Registration works**:
- Form appears after role selection
- User can register with email
- Email stored in localStorage
- User entry in `landlordUsers` collection

✅ **Sync works**:
- Tenant can send to registered landlord email
- System detects landlord recipient
- Contract syncs to `contracts` collection
- Console logs show successful sync

✅ **Display works**:
- Dashboard loads landlord email
- Signed tab shows synced contracts
- Badge displays correctly
- Contract details are accurate

---

## Demo Video Script

**Opening Scene** (Tenant App):
1. "First, let's register as a landlord"
2. Click Agent → Select Landlord → Fill form → Register
3. "Now let's send a signed contract to this landlord"
4. Upload contract → Sign → Send to landlord email
5. Show console logs confirming sync

**Second Scene** (Landlord Dashboard):
6. "Now let's check the landlord dashboard"
7. Open dashboard → Go to Contracts → Signed tab
8. "Here's our signed contract from the tenant!"
9. Show green badge and contract details
10. Show console logs confirming email filter

**Closing**:
11. "That's it! Signed contracts automatically appear in the landlord dashboard"
12. Show Firestore data for proof

---

## Next Steps After Testing

1. ✅ **Create Firestore indexes** (see `FIRESTORE_INDEX_SETUP.md`)
2. ✅ **Add more landlord users** for testing
3. ✅ **Test with multiple recipients**
4. ✅ **Test error cases** (unregistered emails, network errors)
5. ✅ **Update Firestore security rules** for production

---

## Quick Commands for Testing

```javascript
// Check if email is registered
import landlordUserService from './src/services/landlordUserService';
await landlordUserService.isLandlordOrAgent('test@example.com');

// List all registered landlords
await landlordUserService.getAllLandlordUsers();

// Check localStorage
console.log('Landlord email:', localStorage.getItem('landlordEmail'));

// Clear and reset
localStorage.clear();
location.reload();
```

---

Happy testing! 🎉




