# Firestore Index Setup - Quick Fix

## Issue
You're seeing: **"Firestore index missing. Fetching without orderBy and sorting in memory."**

This happens because Firestore requires indexes for queries that combine `where` filters with `orderBy`.

## Quick Fix (2 Minutes)

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project: **proptii-16946**
3. Navigate to **Firestore Database** → **Indexes** tab

### Step 2: Create Indexes

Click **"Create Index"** and add these 3 indexes:

---

#### Index 1: Contracts by Status
- **Collection ID**: `contracts`
- **Fields**:
  - `status` → Ascending
  - `createdAt` → Descending
- **Query scope**: Collection
- Click **Create**

---

#### Index 2: Contracts by Landlord Email
- **Collection ID**: `contracts`
- **Fields**:
  - `landlordEmail` → Ascending
  - `status` → Ascending
  - `createdAt` → Descending
- **Query scope**: Collection
- Click **Create**

---

#### Index 3: Signed Contracts by User
- **Collection ID**: `signedContracts`
- **Fields**:
  - `userId` → Ascending
  - `createdAt` → Descending
- **Query scope**: Collection
- Click **Create**

---

### Step 3: Wait for Indexes to Build

- Each index takes **1-2 minutes** to build
- You'll see status change from "Building" → "Enabled"
- Refresh your app after all indexes are enabled

---

## Alternative: Use the Console Link

If you see an error message with a link like:

```
The query requires an index. You can create it here:
https://console.firebase.google.com/v1/r/project/proptii-16946/firestore/indexes?create_composite=...
```

**Just click the link!** It will auto-fill the index configuration.

---

## Visual Guide

### Where to Find Indexes Tab

```
Firebase Console
  └── Firestore Database
      ├── Data
      ├── Rules
      ├── Indexes  ← Click here
      └── Usage
```

### What the Index Form Looks Like

```
┌─────────────────────────────────────────┐
│ Create a new index                      │
├─────────────────────────────────────────┤
│ Collection ID: contracts                │
│                                         │
│ Fields to index:                        │
│   1. status         [Ascending ▼]      │
│   2. createdAt      [Descending ▼]     │
│                                         │
│ Query scope: [Collection ▼]            │
│                                         │
│         [Cancel]  [Create Index]        │
└─────────────────────────────────────────┘
```

---

## Verification

After creating indexes, run this in your browser console:

```typescript
// Should load without warnings
const { contractService } = await import('./src/landlord_agent/src/services/contractService');
const contracts = await contractService.getContracts({ status: 'signed' });
console.log('✅ Loaded contracts:', contracts.length);
```

---

## Why Are Indexes Needed?

Firestore requires composite indexes when you:
- **Combine** `where()` filters with `orderBy()`
- **Sort** by a field that's not part of the filter

Example query that needs an index:
```typescript
query(
  collection(db, 'contracts'),
  where('status', '==', 'signed'),    // Filter
  orderBy('createdAt', 'desc')        // Sort
)
```

Without the index, this query fails. Our code handles it gracefully by:
1. Fetching without `orderBy`
2. Sorting in memory (JavaScript)

But **indexes are faster** and remove the warning!

---

## Troubleshooting

### "Index already exists"
- Check **Indexes** tab in Firebase Console
- You might have created it already
- Wait a few minutes for it to enable

### "Permission denied"
- Make sure you're logged into Firebase Console
- Check if you have edit permissions for the project

### "Still seeing the warning"
- Wait 1-2 minutes after creating index
- Refresh your browser
- Clear cache (Ctrl+Shift+R)

---

## Index Status

Track your index creation progress:

- [ ] `contracts` by `status` + `createdAt` - **Index 1**
- [ ] `contracts` by `landlordEmail` + `status` + `createdAt` - **Index 2**
- [ ] `signedContracts` by `userId` + `createdAt` - **Index 3**

✅ All indexes enabled → No more warnings!

---

## Performance Impact

**Before indexes** (current state):
- ⚠️ Warning message in console
- 🐌 Fetches all documents, sorts in memory
- 💾 More data transferred
- 📊 Works fine for small datasets

**After indexes** (optimized):
- ✅ No warnings
- 🚀 Fast server-side sorting
- 💾 Only relevant documents transferred
- 📊 Scales to large datasets

---

## Need Help?

If indexes don't solve the issue:

1. **Check console for the exact error**
2. **Look for the auto-generated link** in the error
3. **Share the error message** for specific help

The warning you're seeing is **normal for the first run**. Just create the indexes and it will go away!

