# Contract Flow: Landlord to Tenant

## Overview
This document describes the implementation that connects the landlord's "Send Contract" functionality with the tenant's contract viewing system.

## How It Works

### 1. Landlord Sends Contract (Landlord App)

**Location:** `src/landlord_agent/src/components/ContractsPage.tsx`

When a landlord clicks "Send Contract":
1. Opens `SendContractModal` to select recipient and upload PDF
2. Sends email with contract attachment to tenant
3. Saves contract to Firestore `contracts` collection with:
   - `tenantEmail` - recipient's email address
   - `landlordEmail` - sender's email address
   - `status` - 'sent', 'unsigned', or 'signed'
   - `fileUrl` - base64 data URL of the contract PDF
   - `fileName` - original file name
   - Other metadata (title, sentDate, expiryDate, etc.)

**Key Code Changes:**
```typescript
// ContractsPage.tsx - Line 293-304
const contractId = await contractService.createContractWithBase64({
  title: contractData.file.name.replace(/\.[^/.]+$/, ''),
  propertyAddress: '',
  tenantName: contractData.recipientName,
  tenantEmail: contractData.recipientEmail,
  contractType: 'tenancy-agreement',
  additionalInfo: contractData.additionalEmail,
  status: 'sent',
  sentDate: new Date(),
  expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  landlordEmail: landlordEmail || undefined, // ✅ Now includes landlord email
} as any, contractData.file.name, base64Data);
```

### 2. Contract Service Saves to Firestore (Landlord App)

**Location:** `src/landlord_agent/src/services/contractService.ts`

The `createContractWithBase64` method now accepts and stores the `landlordEmail` field:

```typescript
// contractService.ts - Line 96-140
async createContractWithBase64(
  contractData: Omit<Contract, 'id' | 'fileUrl' | 'fileName'> & { landlordEmail?: string },
  fileName: string,
  base64Data: string
): Promise<string> {
  // ... stores contract with landlordEmail field
  if ((contractData as any).landlordEmail) {
    contractDoc.landlordEmail = (contractData as any).landlordEmail;
  }
}
```

### 3. Tenant Views Received Contracts (Tenant App)

**Location:** `src/components/contract/ContractModal.tsx`

The tenant's ContractModal now has three tabs:
- **Uploaded Templates** - Templates uploaded by tenant for customization
- **Received Contracts** ✅ NEW - Contracts sent by landlords
- **Deleted Templates** - Soft-deleted templates

**New State:**
```typescript
const [activeTab, setActiveTab] = useState<'uploaded' | 'deleted' | 'received'>('uploaded');
const [receivedContracts, setReceivedContracts] = useState<any[]>([]);
```

**Loading Contracts:**
```typescript
// ContractModal.tsx - Line 213-225
if (user?.email) {
  console.log('🔄 Fetching received contracts for tenant:', user.email);
  const receivedResult = await contractService.getReceivedContracts(user.email);
  
  if (receivedResult.success && receivedResult.contracts) {
    console.log(`✅ Loaded ${receivedResult.contracts.length} received contracts`);
    setReceivedContracts(receivedResult.contracts);
  }
}
```

### 4. Contract Service Query Methods (Tenant App)

**Location:** `src/services/contractService.ts`

Added two new methods to query contracts from the shared `contracts` collection:

#### `getReceivedContracts(tenantEmail, statusFilter?)`
Queries contracts where `tenantEmail` matches the logged-in tenant's email.

```typescript
// contractService.ts - Line 386-485
async getReceivedContracts(
  tenantEmail: string,
  statusFilter?: 'sent' | 'unsigned' | 'signed'
): Promise<{ success: boolean; contracts?: any[]; error?: string }>
```

**Features:**
- Filters by tenant email
- Optional status filter
- Handles missing Firestore indexes gracefully
- Sorts by sent date (descending)
- Returns standardized contract objects

#### `subscribeToReceivedContracts(tenantEmail, callback, statusFilter?, onError?)`
Real-time subscription for live updates when landlords send new contracts.

```typescript
// contractService.ts - Line 490-544
subscribeToReceivedContracts(
  tenantEmail: string,
  callback: (contracts: any[]) => void,
  statusFilter?: 'sent' | 'unsigned' | 'signed',
  onError?: (error: Error) => void
): () => void
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LANDLORD APP                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ContractsPage.tsx                                  │    │
│  │  - User clicks "Send Contract"                      │    │
│  │  - Fills form with tenant email                     │    │
│  │  - Uploads PDF                                       │    │
│  └─────────────┬────────────────────────────────────────┘    │
│                │                                              │
│                ▼                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  contractService.createContractWithBase64()         │    │
│  │  - Saves to Firestore 'contracts' collection       │    │
│  │  - Includes: tenantEmail, landlordEmail, status    │    │
│  └─────────────┬────────────────────────────────────────┘    │
└────────────────┼─────────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   FIRESTORE      │
        │   'contracts'    │
        │   collection     │
        └─────────┬────────┘
                 │
                 ▼
┌────────────────┼─────────────────────────────────────────────┐
│                │              TENANT APP                      │
│                ▼                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  contractService.getReceivedContracts()             │    │
│  │  - Queries by tenantEmail                           │    │
│  │  - Returns contracts sent to this tenant            │    │
│  └─────────────┬────────────────────────────────────────┘    │
│                │                                              │
│                ▼                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ContractModal.tsx                                  │    │
│  │  - "Received Contracts" tab                         │    │
│  │  - Displays contracts in table                      │    │
│  │  - Shows: title, status, sent date, landlord email │    │
│  │  - "View" button to preview PDF                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Firestore Schema

### Collection: `contracts`

```typescript
{
  id: string;                    // Auto-generated document ID
  title: string;                 // Contract title
  propertyAddress: string;       // Property address
  tenantName: string;            // Tenant's name
  tenantEmail: string;           // ✅ KEY: Used to query contracts for tenant
  landlordEmail: string;         // ✅ NEW: Landlord who sent the contract
  status: 'sent' | 'unsigned' | 'signed';
  contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other';
  fileUrl: string;               // Base64 data URL of PDF
  fileName: string;              // Original file name
  sentDate: Timestamp;           // When contract was sent
  signedDate?: Timestamp;        // When contract was signed
  expiryDate?: Timestamp;        // Contract expiry date
  additionalInfo?: string;       // Additional notes
  createdAt: Timestamp;          // Document creation timestamp
  notificationSent: boolean;     // Email notification status
  reminderCount: number;         // Number of reminders sent
}
```

## UI Changes

### Landlord App - ContractsPage
- No visible UI changes
- Backend now saves `landlordEmail` with each contract

### Tenant App - ContractModal

#### New Tab: "Received Contracts"
Located between "Uploaded Templates" and "Deleted Templates"

**Table Layout:** (Same as "Uploaded Templates")
| Contract | Date | Actions |
|----------|------|---------|

**Displays:**
- Contract file name (bold)
- Status badge inline (Sent/Awaiting Signature/Signed) with color coding:
  - 🔵 Sent (blue)
  - 🟡 Awaiting Signature (yellow)
  - 🟢 Signed (green)
- Landlord email (who sent it) - shown below filename
- Sent date
- **Actions:** Same as "Uploaded Templates"
  - **Manage** button (dropdown with):
    - Customize - Opens received contract in customization view
    - Download - Downloads the PDF contract
  - **Preview** button - Opens PDF viewer modal

**Empty State:**
```
No contracts received yet
Contracts sent by your landlord will appear here
```

## Testing Instructions

### Test the Complete Flow

1. **As Landlord:**
   - Navigate to Contracts page in landlord app
   - Click "Send Contract" button
   - Fill in:
     - Recipient Name: "Test Tenant"
     - Recipient Email: (use same email as tenant login)
     - Upload a PDF contract
   - Click "Send"
   - Verify success message

2. **As Tenant:**
   - Login with the same email used above
   - Open ContractModal (contract management)
   - Click "Received Contracts" tab
   - Verify the contract appears in the table
   - Check that it shows:
     - Contract title
     - Status: "Sent"
     - Landlord's email
     - Sent date
   - Click "View" to preview the PDF

3. **Verify Real-time Updates:**
   - Keep tenant's ContractModal open
   - As landlord, send another contract
   - Tenant should see the new contract appear automatically (if using real-time subscription)

## Firestore Security Rules

Add these rules to allow tenants to read their contracts:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Contracts - landlords can write, tenants can read their own
    match /contracts/{contractId} {
      // Allow landlords to create contracts
      allow create: if request.auth != null && 
                      request.resource.data.landlordEmail == request.auth.token.email;
      
      // Allow tenants to read contracts sent to them
      allow read: if request.auth != null && 
                    (resource.data.tenantEmail == request.auth.token.email ||
                     resource.data.landlordEmail == request.auth.token.email);
      
      // Allow updates for signing
      allow update: if request.auth != null && 
                      (resource.data.tenantEmail == request.auth.token.email ||
                       resource.data.landlordEmail == request.auth.token.email);
    }
  }
}
```

## Future Enhancements

1. **Status Updates:**
   - Add "Sign" button for tenants to mark contracts as signed
   - Update contract status to 'signed' with signedDate

2. **Real-time Subscriptions:**
   - Use `subscribeToReceivedContracts()` for live updates
   - Show notification badge when new contracts arrive

3. **Filtering:**
   - Filter received contracts by status (sent/unsigned/signed)
   - Search by contract title or landlord email

4. **Download:**
   - Add download button to save contract PDF locally

5. **Notifications:**
   - Email notifications when new contracts are received
   - In-app notifications

## Troubleshooting

### Contract Not Appearing for Tenant

**Check:**
1. Tenant email matches exactly (case-sensitive)
2. Landlord email was captured correctly
3. Firestore security rules allow read access
4. Network connectivity to Firestore

**Debug:**
```javascript
// Check in browser console
console.log('Tenant email:', user?.email);
console.log('Received contracts:', receivedContracts);
```

### PDF Preview Not Working

**Check:**
1. Base64 data is valid
2. File size is reasonable (<10MB)
3. Browser supports blob URLs
4. No CSP (Content Security Policy) blocking

**Solution:**
The implementation handles both base64 data URLs and regular URLs, converting as needed for preview.

## Files Modified

1. ✅ `src/landlord_agent/src/components/ContractsPage.tsx`
   - Added `landlordEmail` to contract creation

2. ✅ `src/landlord_agent/src/services/contractService.ts`
   - Updated `createContractWithBase64` to accept `landlordEmail`

3. ✅ `src/services/contractService.ts`
   - Added `getReceivedContracts()` method
   - Added `subscribeToReceivedContracts()` method

4. ✅ `src/components/contract/ContractModal.tsx`
   - Added "Received Contracts" tab
   - Loads and displays contracts sent by landlords
   - Added preview functionality for received contracts

## Summary

The implementation successfully connects the landlord's "Send Contract" button with the tenant's contract viewing interface. Contracts are stored in a shared Firestore collection and can be queried by tenant email. The tenant now has a dedicated "Received Contracts" tab in their ContractModal to view all contracts sent to them by landlords.

