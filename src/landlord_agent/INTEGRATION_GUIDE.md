# Referencing Integration Guide

## Current Issue

The tenant data shown in the Clients page is **hardcoded mock data** from `src/landlord_agent/src/App.tsx` (line 556).

All mock tenants have `referencingStatus: 'complete'` hardcoded, which is why they show as "Referencing: Complete" even though they don't exist in the Firestore `referencingForms` collection.

## Solutions

### Option 1: Load Real Tenants from Firestore (Recommended)

The app already has a `tenantService` that can load tenants from Firestore. Here's how to use it:

1. **In `App.tsx`, replace mock tenants with Firestore data:**

```typescript
// Around line 350-380, add this useEffect:
useEffect(() => {
  const loadTenantsFromFirestore = async () => {
    try {
      console.log('[App] Loading tenants from Firestore...');
      const loadedTenants = await tenantService.getTenants();
      console.log('[App] Loaded tenants:', loadedTenants.length);
      setTenants(loadedTenants);
    } catch (error) {
      console.error('[App] Error loading tenants:', error);
      // Fallback to mock data if Firestore fails
      setTenants(mockTenants);
    }
  };

  loadTenantsFromFirestore();
}, []);
```

2. **Keep mock data as fallback:**
Keep the `mockTenants` array (line 556) but don't set it by default. It will only be used if Firestore loading fails.

### Option 2: Update Mock Emails to Match Real Referencing Forms

If you want to test with mock data, update the email addresses to match users who have actually submitted referencing forms:

```typescript
const mockTenants: Tenant[] = [
  {
    id: 't1',
    name: 'Sarah Johnson',
    email: 'actual-user@example.com', // ← Change to real email from referencing_forms
    phone: '+44 7700 900123',
    propertyAddress: '123 Regent Street, London W1B 4EA',
    propertyId: '1',
    rentAmount: 2400,
    leaseStart: new Date('2023-03-01'),
    leaseEnd: new Date('2025-02-28'),
    status: 'active',
    referencingStatus: 'not-started', // ← Remove hardcoded status
    paymentStatus: 'overdue',
    // ... rest of tenant data
  },
  // ... more tenants
];
```

The `referencingService` will then fetch the actual status from Firestore and override this value.

## Testing with Real Data

### Step 1: Add a Real Tenant

1. Navigate to the Clients page
2. Click "Add New Tenant"
3. Fill in the tenant details with a real email address
4. Save the tenant

### Step 2: Have the Tenant Submit a Referencing Form

1. The tenant should visit your referencing page
2. Submit the referencing form with the same email address
3. The form will be saved in Firestore `referencingForms` collection

### Step 3: Verify Integration

1. Go back to the Clients page
2. The tenant's referencing status should now show:
   - **"In Progress"** if they started but didn't submit
   - **"Complete"** if they fully submitted the form

## Firestore Collections Required

### 1. `tenants` Collection
```typescript
{
  id: "auto-generated",
  name: "John Doe",
  email: "john@example.com",
  phone: "+44 7700 900000",
  propertyAddress: "123 Main St",
  propertyId: "prop-123",
  rentAmount: 1500,
  leaseStart: Timestamp,
  leaseEnd: Timestamp,
  status: "active",
  // referencingStatus is fetched dynamically - don't store it
  paymentStatus: "current",
  createdAt: Timestamp
}
```

### 2. `referencingForms` Collection
```typescript
{
  userId: "user-id",
  propertyId: "prop-id",
  formData: {
    identity: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com", // ← Must match tenant email
      // ... other fields
    },
    // ... other form sections
  },
  isSubmitted: true, // ← Determines if status is "complete"
  currentStep: 6,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  submittedAt: Timestamp
}
```

## How the Integration Works

1. **ClientsPage loads** → Fetches all tenant emails
2. **For each tenant email** → Queries `referencingForms` where `formData.identity.email == tenant.email`
3. **Status determination:**
   - If `isSubmitted: true` → **"Complete"**
   - If `currentStep > 0` → **"In Progress"**
   - If no document found → **"Not Started"**

## Firestore Index Required

Create a composite index for efficient queries:

**Collection:** `referencingForms`  
**Fields:**
- `formData.identity.email` (Ascending)
- `updatedAt` (Descending)

Firestore will provide a link to create this index automatically when you first query.

## Navigation Fix

Changed navigation from React Router (`/landlord`) to direct link (`/landlord/index.html`):

```typescript
// src/pages/AgentHome.tsx - line 49
window.location.href = '/landlord/index.html';
```

Now clicking "Go to Landlord Dashboard" will open the built landlord app at `http://localhost/landlord/index.html`.

## Quick Test Commands

```bash
# Rebuild the landlord app
cd src/landlord_agent
npm run build

# Copy build to public/landlord/
# (Usually handled by your build process)
```

## Summary

✅ **Referencing service created** - Fetches real data from Firestore  
✅ **ClientsPage updated** - Shows real referencing status  
✅ **TenantDetails updated** - Shows real referencing status  
✅ **Navigation fixed** - Now uses `/landlord/index.html`  
⚠️ **Mock data** - Update to use real Firestore tenants  

To complete the integration, implement Option 1 above to load tenants from Firestore.


