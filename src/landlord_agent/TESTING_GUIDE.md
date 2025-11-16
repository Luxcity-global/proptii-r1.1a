# Testing Referencing Integration - Complete Guide

## Current Status

✅ **Code is already set up correctly!**

The app is already loading tenants from Firestore (see `App.tsx` line 644-653).  
The referencing integration is working correctly.

## Why You're Seeing "Referencing: Complete" for All Tenants

**The mock data (line 556-850 in App.tsx) is NOT being used.**  
Instead, you're seeing either:
1. Empty tenant list (if Firestore `tenants` collection is empty)
2. Test tenants you added earlier with incorrect referencing status

## Complete Testing Steps

### Step 1: Add Real Tenants to Firestore

Open your browser console on `/landlord/index.html` and run:

```javascript
// Quick script to add test tenants
const addTestTenants = async () => {
  const tenants = [
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+44 7700 900123',
      propertyAddress: '123 Regent Street, London W1B 4EA',
      propertyId: 'prop-1',
      rentAmount: 2400,
      leaseStart: new Date('2023-03-01'),
      leaseEnd: new Date('2025-02-28'),
      status: 'active',
      paymentStatus: 'current'
      // NOTE: Don't include referencingStatus - it's fetched dynamically!
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+44 7700 900456',
      propertyAddress: '45 Victoria Park Road, London E9 7JN',
      propertyId: 'prop-2',
      rentAmount: 2100,
      leaseStart: new Date('2024-01-15'),
      leaseEnd: new Date('2025-01-14'),
      status: 'active',
      paymentStatus: 'current'
    },
    {
      name: 'Emma Watson',
      email: 'emma.watson@email.com',
      phone: '+44 7700 900789',
      propertyAddress: '78 Oak Gardens, London SW4 9AL',
      propertyId: 'prop-3',
      rentAmount: 2800,
      leaseStart: new Date('2023-06-01'),
      leaseEnd: new Date('2025-05-31'),
      status: 'active',
      paymentStatus: 'current'
    }
  ];

  for (const tenant of tenants) {
    const response = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenant)
    });
    console.log(`Added ${tenant.name}:`, response.status);
  }
};

// Run it
addTestTenants();
```

**OR** use the "Add Tenant" button in the Clients page.

### Step 2: Verify Referencing Form Data

Check if any of your test tenants have submitted referencing forms:

1. Open Firebase Console → Firestore Database
2. Navigate to `referencingForms` collection
3. Look for documents where `formData.identity.email` matches your tenant emails

**Example document structure:**
```javascript
{
  userId: "user-123",
  propertyId: "prop-456",
  formData: {
    identity: {
      email: "sarah.johnson@email.com", // ← Must match tenant email
      firstName: "Sarah",
      lastName: "Johnson",
      // ...
    },
    // ... other form data
  },
  isSubmitted: true, // ← If true, status will be "Complete"
  currentStep: 6,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  submittedAt: Timestamp
}
```

### Step 3: Test Different Referencing Statuses

#### Test Status: "Not Started"
- Add a tenant with email `newuser@test.com`
- Don't create any referencing form for this email
- **Result:** Should show "Referencing: Not yet started" (gray badge)

#### Test Status: "In Progress"
- Have a user submit a partial referencing form
- Set `isSubmitted: false` and `currentStep: 3`
- **Result:** Should show "Referencing: In progress" (blue badge)

#### Test Status: "Complete"
- Have a user fully submit the referencing form
- Set `isSubmitted: true`
- **Result:** Should show "Referencing: Complete" (green badge)

### Step 4: Test the Integration

1. **Navigate to:** `http://localhost/landlord/index.html`
2. **Go to:** Clients page
3. **Observe:** 
   - Loading state: "Checking referencing..." (gray with spinning clock)
   - Then: Real status from Firestore

4. **Click on a tenant** → Should show detailed status

5. **Check browser console:**
```
🔍 [landlord_agent] Checking referencing status for email: sarah.johnson@email.com
✅ [landlord_agent] Found referencing data for sarah.johnson@email.com
```

## Debugging

### If all tenants show "Not Started"

**Check:**
1. Are tenant emails exact matches? (case-sensitive!)
2. Is the `referencingForms` collection populated?
3. Does `formData.identity.email` field exist?

**Console check:**
```javascript
// Run in browser console
firebase.firestore().collection('referencingForms')
  .where('formData.identity.email', '==', 'sarah.johnson@email.com')
  .get()
  .then(snap => {
    console.log('Found forms:', snap.size);
    snap.forEach(doc => console.log(doc.data()));
  });
```

### If you see "Firestore index required" error

Firestore will provide a link in the console to create the required composite index:

**Collection:** `referencingForms`  
**Fields:**
- `formData.identity.email` (Ascending)
- `updatedAt` (Descending)

Click the link and wait 1-2 minutes for the index to build.

### If tenants list is empty

The app loads tenants from Firestore `tenants` collection. If empty:
1. Add tenants using the "Add Tenant" button
2. Or run the script from Step 1 above

## Expected Behavior

### Clients Page (List View)
```
┌─────────────────────────────────────────┐
│ 👤 Sarah Johnson                        │
│    📧 sarah.johnson@email.com          │
│    🟢 Active | 🟢 Referencing: Complete │
│                                         │
│ 👤 Michael Chen                         │
│    📧 michael.chen@email.com           │
│    🟢 Active | 🔵 Referencing: In Progress│
│                                         │
│ 👤 Emma Watson                          │
│    📧 emma.watson@email.com            │
│    🟢 Active | ⚪ Referencing: Not Started│
└─────────────────────────────────────────┘
```

### Tenant Details Page
```
┌─────────────────────────────────────────┐
│ 👤 Sarah Johnson                        │
│    🟢 Active | 🟢 Referencing: Complete  │
│                                         │
│ Overview | Payments | Documents        │
│ ─────────────────────────────────────  │
│ Email: sarah.johnson@email.com         │
│ Phone: +44 7700 900123                 │
│ Property: 123 Regent Street            │
│ Rent: £2,400/month                     │
└─────────────────────────────────────────┘
```

## Navigation

- **Wrong:** `http://localhost:5173/landlord` ❌
- **Correct:** `http://localhost/landlord/index.html` ✅

The "Go to Landlord Dashboard" button now navigates to the correct URL.

## Summary

✅ Integration is **already working**  
✅ App loads tenants from Firestore  
✅ Referencing status fetched dynamically  
✅ Navigation fixed to use `/landlord/index.html`  

**To see real data:** Add tenants and referencing forms to Firestore!





