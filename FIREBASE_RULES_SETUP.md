# Fix Firestore Permission Denied Error

## Quick Fix (Development Only)

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select your project
3. Go to **Firestore Database** → **Rules**

### Step 2: Replace the Rules
Replace the existing rules with this **temporary development rule**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click **"Publish"** button
2. Wait for confirmation

### Step 4: Test Your App
1. Go back to your app
2. Try saving the referencing form
3. Check browser console - you should see "✅ Referencing form saved to Firestore successfully"

## Production Security Rules (Use Later)

Once everything works, replace with secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own referencing forms
    match /referencingForms/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Allow public access to test collection
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

## Why This Happens
- Firestore has **strict security by default**
- Your app tries to write without proper authentication
- The temporary rule allows all access for development
- **Remember to secure it for production!**

## Verification
After updating rules, you should see:
- ✅ No more "permission denied" errors
- ✅ "Progress saved successfully to Firestore" message
- ✅ Data appears in Firebase Console → Firestore Database
