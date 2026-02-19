# Firestore Database Setup for Contract Sync

## Overview

This document details the Firestore database structure required for the contract sync integration between the tenant app and landlord dashboard.

## Collections

### 1. `landlordUsers` Collection (NEW - Required)

**Purpose**: Store registered landlord and agent accounts that can receive synced signed contracts.

**Structure**:
```typescript
Collection: landlordUsers/
  Document: {landlordUserId}
    - id: string                      // Auto-generated document ID
    - email: string                   // Unique email (indexed)
    - name: string                    // Full name
    - role: 'landlord' | 'agent'      // User role
    - phone?: string                  // Optional phone number
    - companyName?: string            // Optional company name
    - createdAt: Timestamp            // Auto-generated
    - updatedAt: Timestamp            // Auto-generated
```

**Example Document**:
```json
{
  "id": "landlord_1699901234567_abc123",
  "email": "john.smith@proptii.com",
  "name": "John Smith",
  "role": "landlord",
  "phone": "+44 7911 123456",
  "companyName": "Smith Properties Ltd",
  "createdAt": "2024-11-11T10:30:00Z",
  "updatedAt": "2024-11-11T10:30:00Z"
}
```

**Indexes Required**:
- `email` (Ascending) - For quick lookup by email

**Create via Firebase Console**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `proptii-16946`
3. Navigate to **Firestore Database**
4. Click **Start Collection**
5. Collection ID: `landlordUsers`
6. Add first document with sample data above

---

### 2. `signedContracts` Collection (Existing - Enhanced)

**Purpose**: Store signed contracts from the tenant app. Used as source for syncing to landlord dashboard.

**Structure**:
```typescript
Collection: signedContracts/
  Document: {signedContractId}
    - id: string                      // Auto-generated
    - userId: string                  // Sender's user ID
    - templateId: string              // Original template ID
    - templateName: string            // Contract name
    - propertyName: string            // Property name
    - propertyAddress: string         // Full property address
    - agentName: string               // Agent name
    - agentEmail: string              // Agent email
    - tenantName: string              // Tenant name
    - tenantEmail: string             // Tenant email
    - signedDate: string              // ISO date string
    - documentUrl?: string            // Public URL (if available)
    - documentBase64?: string         // Base64 data URL (fallback)
    - documentName: string            // File name
    - documentSize: number            // File size in bytes
    - documentType: string            // MIME type
    - status: 'signed' | 'sent' | 'delivered'
    - emailSent: boolean              // Email sent flag
    - emailSentDate?: string          // ISO date string
    - createdAt: Timestamp            // Auto-generated
    - updatedAt: Timestamp            // Auto-generated
```

**Example Document**:
```json
{
  "id": "signed_dev-user-123_1699901234567_xyz789",
  "userId": "dev-user-123",
  "templateId": "template-id-123",
  "templateName": "Tenancy Agreement",
  "propertyName": "Sunset Apartments",
  "propertyAddress": "123 Main Street, London, SW1A 1AA",
  "agentName": "Jane Agent",
  "agentEmail": "jane.agent@proptii.com",
  "tenantName": "John Tenant",
  "tenantEmail": "john.tenant@example.com",
  "signedDate": "2024-11-11T10:30:00Z",
  "documentBase64": "data:application/pdf;base64,JVBERi0xLjQK...",
  "documentName": "tenancy_agreement_signed.pdf",
  "documentSize": 245678,
  "documentType": "application/pdf",
  "status": "sent",
  "emailSent": true,
  "emailSentDate": "2024-11-11T10:30:00Z",
  "createdAt": "2024-11-11T10:30:00Z",
  "updatedAt": "2024-11-11T10:30:00Z"
}
```

**Indexes Required**:
- `userId` + `createdAt` (Descending) - For user's contracts list
- `status` + `createdAt` (Descending) - For filtering by status

---

### 3. `contracts` Collection (Landlord Dashboard)

**Purpose**: Store contracts for the landlord dashboard. Receives synced contracts from tenant app.

**Structure**:
```typescript
Collection: contracts/
  Document: {contractId}
    - id: string                      // Auto-generated
    - title: string                   // Contract title
    - propertyAddress: string         // Property address
    - tenantName: string              // Tenant name
    - tenantEmail: string             // Tenant email
    - landlordEmail?: string          // Landlord who received this (NEW)
    - landlordId?: string             // Reference to landlordUsers (NEW)
    - status: 'sent' | 'unsigned' | 'signed'
    - sentDate: Timestamp             // When sent
    - signedDate?: Timestamp          // When signed
    - expiryDate?: Timestamp          // Contract expiry
    - contractType: 'tenancy-agreement' | 'deposit-certificate' | 'right-to-rent' | 'other'
    - fileUrl: string                 // File URL (may be base64 data URL)
    - fileName: string                // File name
    - fileBase64?: string             // Base64 data (for synced contracts) (NEW)
    - additionalInfo?: string         // Notes (includes sync metadata) (NEW)
    - createdAt?: Timestamp           // Auto-generated
    - notificationSent?: boolean      // Email notification sent
    - reminderCount?: number          // Reminder count
```

**Example Document** (Synced from tenant app):
```json
{
  "id": "abc123def456",
  "title": "Tenancy Agreement",
  "propertyAddress": "123 Main Street, London, SW1A 1AA",
  "tenantName": "John Tenant",
  "tenantEmail": "john.tenant@example.com",
  "landlordEmail": "john.smith@proptii.com",
  "landlordId": "landlord_1699901234567_abc123",
  "status": "signed",
  "sentDate": "2024-11-11T10:30:00Z",
  "signedDate": "2024-11-11T10:30:00Z",
  "expiryDate": "2025-11-11T10:30:00Z",
  "contractType": "tenancy-agreement",
  "fileUrl": "data:application/pdf;base64,JVBERi0xLjQK...",
  "fileName": "tenancy_agreement_signed.pdf",
  "fileBase64": "data:application/pdf;base64,JVBERi0xLjQK...",
  "additionalInfo": "Signed contract sent from tenant app. Agent: Jane Agent",
  "createdAt": "2024-11-11T10:30:00Z",
  "notificationSent": true,
  "reminderCount": 0
}
```

**Indexes Required**:
- `status` + `createdAt` (Descending) - For filtering by status
- `landlordEmail` + `status` (Ascending) - For landlord's contracts
- `tenantEmail` + `createdAt` (Descending) - For tenant's contracts

---

## Firestore Security Rules

### Development Rules (Permissive)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Landlord users collection - anyone can read to check emails
    match /landlordUsers/{userId} {
      allow read: if true;
      allow write: if true; // Development only
    }
    
    // Signed contracts (tenant app)
    match /signedContracts/{contractId} {
      allow read, write: if true; // Development only
    }
    
    // Contracts (landlord dashboard)
    match /contracts/{contractId} {
      allow read, write: if true; // Development only
    }
  }
}
```

### Production Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is landlord/agent
    function isLandlordOrAgent() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/landlordUsers/$(request.auth.uid));
    }
    
    // Landlord users collection
    match /landlordUsers/{userId} {
      // Anyone can read to check if email is registered
      allow read: if true;
      
      // Only authenticated users can register
      allow create: if isAuthenticated() && 
                       request.resource.data.email == request.auth.token.email;
      
      // Users can only update their own profile
      allow update, delete: if isAuthenticated() && 
                               userId == request.auth.uid;
    }
    
    // Signed contracts (tenant app)
    match /signedContracts/{contractId} {
      // Users can read their own contracts
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Users can create contracts
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      
      // Users can update their own contracts
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      // Only admins can delete
      allow delete: if false; // Implement admin check
    }
    
    // Contracts (landlord dashboard)
    match /contracts/{contractId} {
      // Landlords can read their own contracts
      allow read: if isAuthenticated() && (
                       isLandlordOrAgent() ||
                       resource.data.landlordEmail == request.auth.token.email
                     );
      
      // System can create contracts (for sync)
      allow create: if isAuthenticated();
      
      // Landlords can update their own contracts
      allow update: if isAuthenticated() && 
                       resource.data.landlordEmail == request.auth.token.email;
      
      // Only landlords can delete their contracts
      allow delete: if isAuthenticated() && 
                       resource.data.landlordEmail == request.auth.token.email;
    }
  }
}
```

---

## Setup Instructions

### Step 1: Apply Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `proptii-16946`
3. Navigate to **Firestore Database** > **Rules**
4. Copy the **Development Rules** above
5. Click **Publish**

**Note**: Use Production Rules when deploying to production.

### Step 2: Create Collections

You don't need to manually create collections - they will be created automatically when first document is added. However, you can create them manually for clarity:

1. In Firebase Console, go to **Firestore Database**
2. Click **Start Collection**
3. Collection ID: `landlordUsers`
4. Add a sample document (see example above)
5. Repeat for other collections if needed

### Step 3: Create Indexes

Some queries require composite indexes. Firestore will automatically prompt you to create them when you first run queries that need them.

**Manually create indexes**:

1. Go to **Firestore Database** > **Indexes** > **Composite**
2. Click **Create Index**

**For `contracts` collection**:
- Collection ID: `contracts`
- Fields to index:
  - `status` (Ascending)
  - `createdAt` (Descending)
- Query scopes: Collection

**For `signedContracts` collection**:
- Collection ID: `signedContracts`
- Fields to index:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scopes: Collection

**For `landlordUsers` collection**:
- Collection ID: `landlordUsers`
- Fields to index:
  - `email` (Ascending)
- Query scopes: Collection

### Step 4: Register Sample Landlord Users

Use the setup script to register sample users:

```typescript
// In browser console (tenant app)
import { setupAllLandlordUsers } from './src/utils/setupLandlordUsers';

await setupAllLandlordUsers();
```

Or register manually via Firebase Console:
1. Navigate to **Firestore Database**
2. Open `landlordUsers` collection
3. Click **Add Document**
4. Use the example structure from above

---

## Verification

### Check Collection Structure

Run these queries in Firestore Console to verify:

```javascript
// Check if landlordUsers collection exists
landlordUsers.count()

// Check if specific landlord is registered
landlordUsers.where('email', '==', 'john.smith@proptii.com')

// Check synced contracts
contracts.where('additionalInfo', 'contains', 'Signed contract sent from tenant app')
```

### Check via Browser Console

```typescript
// Import utilities
import { verifyLandlordUsers, listRegisteredLandlords } from './src/utils/setupLandlordUsers';

// Verify all sample users are registered
await verifyLandlordUsers();

// List all registered landlords
await listRegisteredLandlords();
```

---

## Migration from Existing Database

If you already have contracts in your database:

### 1. Backup Existing Data

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Export Firestore data
firebase firestore:export gs://proptii-16946.appspot.com/backups/$(date +%Y%m%d)
```

### 2. Add New Fields to Existing Documents

You can update existing contracts to include the new fields:

```typescript
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './src/config/firebaseConfig';

async function migrateExistingContracts() {
  const contractsRef = collection(db, 'contracts');
  const snapshot = await getDocs(contractsRef);
  
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    
    // Add new fields if they don't exist
    const updates: any = {};
    
    if (!data.landlordEmail) {
      updates.landlordEmail = 'default@proptii.com'; // Set a default
    }
    
    if (!data.fileBase64 && data.fileUrl) {
      updates.fileBase64 = data.fileUrl; // Copy URL as fallback
    }
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'contracts', docSnapshot.id), updates);
      console.log(`Updated contract: ${docSnapshot.id}`);
    }
  }
  
  console.log('Migration completed');
}
```

---

## Troubleshooting

### "Missing or insufficient permissions" Error

**Cause**: Firestore security rules are blocking the operation

**Solution**:
1. Check security rules in Firebase Console
2. Temporarily use development rules (allow all)
3. Debug with Firebase console logs

### "Index required" Error

**Cause**: Query requires a composite index

**Solution**:
1. Click the provided link in error message
2. Or manually create index in Firebase Console
3. Wait 1-2 minutes for index to build

### Collections not appearing

**Cause**: Collections are created only when first document is added

**Solution**:
1. Add a sample document via Firebase Console
2. Or run the setup script to create initial data

---

## Summary

✅ **Collections Created**:
- `landlordUsers` - NEW
- `signedContracts` - Enhanced
- `contracts` - Enhanced

✅ **New Fields Added**:
- `contracts.landlordEmail`
- `contracts.landlordId`
- `contracts.fileBase64`
- `contracts.additionalInfo` (with sync metadata)

✅ **Indexes Required**:
- `landlordUsers.email`
- `contracts.status + createdAt`
- `contracts.landlordEmail + status`
- `signedContracts.userId + createdAt`

✅ **Security Rules**:
- Development rules: Permissive (for testing)
- Production rules: Authentication + authorization required




