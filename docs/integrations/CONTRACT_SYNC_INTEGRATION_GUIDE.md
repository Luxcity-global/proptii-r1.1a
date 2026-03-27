# Contract Sync Integration Guide

## Overview

This guide explains how signed contracts from the **tenant app** (ContractModal/SendContract) automatically sync to the **landlord agent dashboard** (ContractsPage) when sent to registered landlord/agent email addresses.

## Architecture

### Two Apps, One Database
- **Tenant App** (Port 5173): `src/` - Where tenants sign and send contracts
- **Landlord Dashboard** (Port 3000): `src/landlord_agent/` - Where landlords manage contracts
- **Shared Firebase**: Both apps use the same Firebase project (`proptii-16946`)

### Firestore Collections

#### 1. `landlordUsers` (NEW)
Stores registered landlord/agent accounts that can receive synced contracts.

```typescript
{
  id: string;
  email: string;              // Used to identify landlords when contracts are sent
  name: string;
  role: 'landlord' | 'agent';
  phone?: string;
  companyName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. `signedContracts`
Stores signed contracts from the tenant app.

```typescript
{
  id: string;
  userId: string;             // Sender's user ID
  templateId: string;
  templateName: string;
  propertyName: string;
  propertyAddress: string;
  agentName: string;
  agentEmail: string;
  tenantName: string;
  tenantEmail: string;
  signedDate: string;
  documentUrl?: string;
  documentBase64?: string;    // Stored for offline access
  documentName: string;
  documentSize: number;
  documentType: string;
  status: 'signed' | 'sent' | 'delivered';
  emailSent: boolean;
  emailSentDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 3. `contracts` (Landlord Dashboard)
Stores contracts for the landlord dashboard.

```typescript
{
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  landlordEmail?: string;     // Email of the landlord who received this
  landlordId?: string;        // ID from landlordUsers collection
  status: 'sent' | 'unsigned' | 'signed';
  sentDate: Date | Timestamp;
  signedDate?: Date | Timestamp;
  expiryDate?: Date | Timestamp;
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other';
  fileUrl: string;
  fileName: string;
  fileBase64?: string;        // Synced from signedContracts
  additionalInfo?: string;    // Includes sync metadata
  createdAt?: Timestamp;
  notificationSent?: boolean;
  reminderCount?: number;
}
```

## Integration Flow

### Step 1: Register Landlord/Agent Accounts

Before the integration works, you need to register landlord/agent email addresses in the `landlordUsers` collection.

#### Option A: Using Browser Console

1. Open your tenant app in browser (http://localhost:5173)
2. Open browser console (F12)
3. Import and run the script:

```typescript
import { registerLandlordUser, checkLandlordUser, listAllLandlordUsers } from './src/scripts/registerLandlordUser';

// Register a new landlord
await registerLandlordUser({
  email: 'john.smith@proptii.com',
  name: 'John Smith',
  role: 'landlord',
  phone: '+44 7911 123456',
  companyName: 'Proptii Properties Ltd'
});

// Check if registered
await checkLandlordUser('john.smith@proptii.com');

// List all registered landlords
await listAllLandlordUsers();
```

#### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`proptii-16946`)
3. Navigate to **Firestore Database**
4. Create a new collection called `landlordUsers`
5. Add a document with the structure shown above

### Step 2: Send Signed Contract

1. **In Tenant App (Port 5173)**:
   - Navigate to Contracts page
   - Upload a contract template
   - Customize and sign the contract
   - Go to "Send" tab
   - Add recipient email (must be a registered landlord/agent email)
   - Click "Send Contract"

2. **What Happens**:
   ```
   ┌─────────────────────────────────────────┐
   │  1. User signs contract in tenant app   │
   └───────────────┬─────────────────────────┘
                   │
                   v
   ┌─────────────────────────────────────────┐
   │  2. SendContract.tsx sends emails       │
   │     to all recipients                   │
   └───────────────┬─────────────────────────┘
                   │
                   v
   ┌─────────────────────────────────────────┐
   │  3. contractSyncService checks if       │
   │     recipients are landlords/agents     │
   └───────────────┬─────────────────────────┘
                   │
                   v
   ┌─────────────────────────────────────────┐
   │  4. Contract saved to signedContracts   │
   │     collection (tenant app data)        │
   └───────────────┬─────────────────────────┘
                   │
                   v
   ┌─────────────────────────────────────────┐
   │  5. If recipient is landlord/agent:     │
   │     Contract synced to contracts        │
   │     collection (landlord dashboard)     │
   └─────────────────────────────────────────┘
   ```

### Step 3: View Contract in Landlord Dashboard

1. **In Landlord Dashboard (Port 3000)**:
   - Navigate to Contracts page
   - Click "Signed" tab
   - The synced contract will appear with a green badge "Received from Tenant"

## Services Created

### 1. `landlordUserService.ts`
**Location**: `src/services/landlordUserService.ts`

**Purpose**: Manages landlord/agent user registration and lookup

**Key Functions**:
- `isLandlordOrAgent(email)` - Check if email belongs to landlord/agent
- `registerLandlordUser(userData)` - Register new landlord/agent
- `getLandlordUserByEmail(email)` - Get landlord user details
- `getAllLandlordUsers()` - Get all registered landlords/agents

### 2. `contractSyncService.ts`
**Location**: `src/services/contractSyncService.ts`

**Purpose**: Syncs signed contracts from tenant app to landlord dashboard

**Key Functions**:
- `checkRecipientsForLandlords(emails[])` - Check which recipients are landlords
- `syncSignedContractToLandlordDashboard(contract, landlordEmail)` - Sync single contract
- `syncToMultipleLandlords(contract, landlordEmails[])` - Sync to multiple landlords

### 3. Updated `SendContract.tsx`
**Location**: `src/components/contract/SendContract.tsx`

**Changes**:
- Added import for `contractSyncService`
- Added landlord check after email sending
- Automatically syncs to landlord dashboard if recipient is registered

### 4. Updated `ContractsPage.tsx`
**Location**: `src/landlord_agent/src/components/ContractsPage.tsx`

**Changes**:
- Added console logging for debugging
- Added visual badge for contracts received from tenant app
- Enhanced contract display with sync metadata

## Testing the Integration

### Prerequisites
1. Both apps running:
   ```bash
   # Terminal 1: Tenant app
   npm run dev
   
   # Terminal 2: Landlord dashboard
   cd src/landlord_agent
   npm run dev
   ```

2. At least one landlord/agent registered in `landlordUsers` collection

### Test Flow

1. **Register a test landlord**:
   ```typescript
   // In browser console (tenant app)
   await registerLandlordUser({
     email: 'test.landlord@proptii.com',
     name: 'Test Landlord',
     role: 'landlord',
     phone: '+44 7911 123456'
   });
   ```

2. **Upload and sign a contract**:
   - Go to http://localhost:5173/contracts
   - Upload a PDF contract
   - Customize and sign it
   - Navigate to "Send" tab

3. **Send to landlord**:
   - Add recipient: `test.landlord@proptii.com`
   - Click "Send Contract"
   - Check console for sync logs:
     ```
     🔍 Checking if recipients are landlords/agents...
     ✅ Found landlord/agent recipients: 1
     🔄 Syncing signed contract to landlord dashboard(s)...
     ✅ Successfully synced to 1 landlord dashboard(s)
     ```

4. **Verify in landlord dashboard**:
   - Go to http://localhost:3000/contracts
   - Click "Signed" tab
   - Contract should appear with green "Received from Tenant" badge

### Expected Console Output

#### Tenant App (when sending):
```
📧 Sending signed contract emails to 1 recipient(s)...
✅ Email sent successfully to test.landlord@proptii.com
🔍 Checking if recipients are landlords/agents...
✅ Found landlord/agent recipients: 1
📋 Landlords: Test Landlord (test.landlord@proptii.com)
🔄 Saving signed contract to Firestore via Send button...
✅ Signed contract saved to Firestore successfully: signed_...
🔄 Syncing signed contract to landlord dashboard(s)...
✅ Successfully synced to 1 landlord dashboard(s)
```

#### Landlord Dashboard (when loading contracts):
```
🔄 ContractsPage - Loading contracts for tab: signed
✅ ContractsPage - Loaded 1 contracts with status 'signed'
📋 Signed contracts: [{
  title: "Test Contract",
  tenant: "Test Tenant",
  signedDate: Date,
  landlordEmail: "test.landlord@proptii.com"
}]
```

## Troubleshooting

### Contract not appearing in landlord dashboard

**Check 1: Is recipient registered?**
```typescript
await checkLandlordUser('recipient@email.com');
```

**Check 2: Check Firestore**
- Go to Firebase Console
- Check `landlordUsers` collection for the email
- Check `contracts` collection for the synced contract

**Check 3: Console logs**
- Look for sync errors in tenant app console
- Check if landlord dashboard successfully loaded contracts

### Email sent but contract not synced

**Possible causes**:
1. Recipient email not in `landlordUsers` collection
2. Firestore permissions issue
3. Network error during sync

**Solution**:
- Check console for error messages
- Verify Firestore security rules allow write to `contracts` collection
- Re-register the landlord user

### Duplicate contracts appearing

**Cause**: Contract sent multiple times or to multiple registered landlords

**Expected Behavior**: Each landlord recipient gets their own copy of the contract

## Firestore Security Rules

Make sure your Firestore security rules allow the operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Landlord users collection
    match /landlordUsers/{userId} {
      allow read: if true;  // Anyone can check if email is landlord
      allow write: if true; // For development - restrict in production
    }
    
    // Signed contracts (tenant app)
    match /signedContracts/{contractId} {
      allow read, write: if true; // For development
    }
    
    // Contracts (landlord dashboard)
    match /contracts/{contractId} {
      allow read, write: if true; // For development
    }
  }
}
```

**Note**: These rules are permissive for development. In production, add proper authentication and authorization.

## Production Considerations

### Security
1. Restrict Firestore rules to authenticated users only
2. Add email verification for landlord registration
3. Implement role-based access control

### Performance
1. Add Firestore indexes for common queries:
   - `contracts` collection: `status` + `createdAt`
   - `contracts` collection: `landlordEmail` + `status`
   - `landlordUsers` collection: `email`

### Monitoring
1. Add analytics events for:
   - Contract sync attempts
   - Successful/failed syncs
   - Landlord registration
2. Set up error logging for sync failures

## Summary

✅ **What was implemented**:
1. Landlord user registration system
2. Automatic contract sync from tenant app to landlord dashboard
3. Visual indicators for synced contracts
4. Comprehensive logging and debugging

✅ **Key files created/modified**:
- `src/services/landlordUserService.ts` (NEW)
- `src/services/contractSyncService.ts` (NEW)
- `src/scripts/registerLandlordUser.ts` (NEW)
- `src/components/contract/SendContract.tsx` (UPDATED)
- `src/landlord_agent/src/components/ContractsPage.tsx` (UPDATED)

✅ **Required setup**:
1. Register landlord/agent emails in `landlordUsers` collection
2. Send contracts from tenant app to registered emails
3. View synced contracts in landlord dashboard "Signed" tab

✅ **Next steps**:
1. Test the complete flow with real users
2. Add proper Firestore security rules
3. Implement email verification for landlord registration
4. Add analytics and monitoring




