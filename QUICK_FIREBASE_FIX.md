# Quick Fix: Firebase Permission Errors

You're seeing two errors that need Firebase rules deployment:

## Error 1: Firestore Permission Error
```
FirebaseError: Missing or insufficient permissions.
```

## Error 2: Storage CORS Error
```
Access to XMLHttpRequest ... blocked by CORS policy
```

## Solution: Deploy Rules to Firebase Console

### Step 1: Deploy Firestore Rules (2 minutes)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/proptii-16946/firestore/rules

2. **Copy Rules:**
   Open `firestore.rules` in your project and copy ALL contents (lines 1-62)

3. **Paste & Deploy:**
   - Paste into the Firebase Console editor
   - Click **"Publish"** button (top right)
   - Wait for "Rules published successfully" message

### Step 2: Deploy Storage Rules (2 minutes)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/proptii-16946/storage/rules

2. **Copy Rules:**
   Open `storage.rules` in your project and copy ALL contents (lines 1-20)

3. **Paste & Deploy:**
   - Paste into the Firebase Console editor  
   - Click **"Publish"** button (top right)
   - Wait for "Rules published successfully" message

### Step 3: Test

1. **Clear browser cache:** Press `Ctrl + F5`
2. **Refresh the app** - errors should be gone

## What These Rules Do

### Firestore Rules:
- ✅ Allows public read/write to `contracts` collection (for development)
- ✅ Catch-all rule allows all access (development mode)

### Storage Rules:
- ✅ Allows public read access to `/contracts/**` files (needed for email attachments)
- ✅ Requires authentication for writes

## Quick Links

- **Firestore Rules:** https://console.firebase.google.com/project/proptii-16946/firestore/rules
- **Storage Rules:** https://console.firebase.google.com/project/proptii-16946/storage/rules

## After Deployment

The app should work immediately. If you still see errors:
1. Wait 1-2 minutes for rules to propagate
2. Hard refresh: `Ctrl + Shift + R`
3. Check browser console for any remaining errors


