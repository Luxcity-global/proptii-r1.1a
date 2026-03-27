# Deploy Firebase Storage Rules - Step by Step Guide

## Method 1: Firebase Console (Easiest - Recommended)

### Step 1: Open Firebase Console Storage Rules
1. Go to: https://console.firebase.google.com/project/proptii-16946/storage/rules
2. Or navigate manually:
   - Go to: https://console.firebase.google.com/project/proptii-16946
   - Click **Storage** in the left sidebar
   - Click **Rules** tab at the top

### Step 2: Copy Storage Rules
Open the `storage.rules` file in your project root and copy its contents:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Contracts folder - allow public read, authenticated write
    match /contracts/{allPaths=**} {
      // Allow read access to all (for email attachments)
      allow read: if true;
      // Allow write (upload) for authenticated users with file size limit
      allow write: if request.auth != null && 
                   request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    // Other files - maintain existing rules
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 3: Paste and Publish
1. **Clear** any existing rules in the Firebase Console editor
2. **Paste** the rules above
3. Click **Publish** button (usually at the top right)
4. Wait for success message: "Rules published successfully"

### Step 4: Verify
- You should see a confirmation message
- The rules editor should show your new rules
- CORS errors should stop after a few seconds

---

## Method 2: Firebase CLI (Alternative)

If you have Firebase CLI installed:

### Step 1: Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase (if not already done)
```bash
firebase init storage
```
- Select your project: `proptii-16946`
- Choose to use existing `storage.rules` file

### Step 4: Deploy Rules
```bash
firebase deploy --only storage
```

You should see:
```
✔  Deploy complete!

Storage Rules deployed successfully
```

---

## Quick Visual Guide

### Firebase Console Navigation:
```
Firebase Console
└── proptii-16946 (your project)
    └── Storage (left sidebar)
        └── Rules (tab at top)
            └── [Editor with rules]
                └── [Publish button]
```

---

## What These Rules Do

### For `/contracts/**` files:
- ✅ **Public Read**: Anyone can read/download contract files
  - Needed for email attachments to work
  - Files are accessible via download URLs
- ✅ **Authenticated Write**: Only logged-in users can upload
  - Maximum file size: 10MB per file

### For Other Files:
- ✅ **Authenticated Read/Write**: Requires login

---

## After Deployment

1. **Clear Browser Cache**
   - Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open DevTools → Network tab → Check "Disable cache"

2. **Test the App**
   - Navigate to Contracts page
   - Try uploading a contract
   - Check browser console - CORS errors should be gone

3. **Verify File Access**
   - Try viewing/downloading a contract file
   - Should work without CORS errors

---

## Troubleshooting

### Issue: Rules Not Working
**Solution:**
- Wait 1-2 minutes for rules to propagate
- Clear browser cache and refresh
- Check rules were saved correctly in Firebase Console

### Issue: Still Getting CORS Errors
**Check:**
1. Rules are published (not just saved)
2. File path matches `/contracts/**` pattern
3. Browser console shows no other errors

### Issue: Can't Access Firebase Console
**Solution:**
- Verify you're logged into correct Google account
- Check project ID: `proptii-16946`
- Try direct link: https://console.firebase.google.com/project/proptii-16946

---

## Security Note

**Current Rules (Development):**
- Contracts folder: Public read access
- This is fine for development/testing

**For Production:**
Consider more restrictive rules:
```javascript
match /contracts/{allPaths=**} {
  // Only authenticated users can read
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
               request.resource.size < 10 * 1024 * 1024;
}
```

But this requires email service to authenticate, which may need adjustment.

---

## Quick Checklist

- [ ] Opened Firebase Console Storage Rules page
- [ ] Copied `storage.rules` contents
- [ ] Pasted into Firebase Console editor
- [ ] Clicked "Publish" button
- [ ] Saw success confirmation
- [ ] Cleared browser cache
- [ ] Tested app - CORS errors gone

---

*The storage rules file is located at: `storage.rules` in your project root*

