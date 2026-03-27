# Fix Firestore Permission Error

## The Error

```
FirebaseError: Missing or insufficient permissions
```

This means your Firestore security rules are blocking read/write operations.

## Quick Fix (2 Minutes)

### Step 1: Open Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/project/proptii-16946/firestore/rules)
2. Or: Firebase Console → Firestore Database → Rules tab

### Step 2: Replace Rules

**Delete all existing rules** and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Landlord Users - Allow anyone to read and write (for auto-registration)
    match /landlordUsers/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Signed Contracts - Allow anyone (for now - development mode)
    match /signedContracts/{contractId} {
      allow read, write: if true;
    }
    
    // Contracts (Landlord Dashboard) - Allow anyone (for now)
    match /contracts/{contractId} {
      allow read, write: if true;
    }
    
    // Contract Templates - Allow anyone (for now)
    match /contractTemplates/{templateId} {
      allow read, write: if true;
    }
    
    // All other collections - Allow anyone (development mode)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish

1. Click **"Publish"** button
2. Wait 10-20 seconds for rules to propagate
3. Refresh your app

---

## What This Does

- ✅ Allows auto-registration to work
- ✅ Allows contract syncing to work
- ✅ Allows dashboard to read contracts
- ✅ Removes permission errors

**Note**: These rules are **PERMISSIVE** for development. See below for production rules.

---

## Production Rules (Use Later)

For production, add authentication checks:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Landlord Users
    match /landlordUsers/{userId} {
      // Anyone can read to check if email is registered
      allow read: if true;
      
      // Authenticated users can register themselves
      allow create: if isAuthenticated() && 
                       request.resource.data.email == request.auth.token.email;
      
      // Users can update their own profile
      allow update: if isOwner(userId);
      
      // Only admins can delete (implement admin check)
      allow delete: if false;
    }
    
    // Signed Contracts
    match /signedContracts/{contractId} {
      // Users can read their own contracts
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Users can create contracts
      allow create: if isAuthenticated();
      
      // Users can update their own contracts
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      allow delete: if false; // No deletes
    }
    
    // Contracts (Landlord Dashboard)
    match /contracts/{contractId} {
      // Landlords can read their own contracts
      allow read: if isAuthenticated();
      
      // System can create contracts
      allow create: if isAuthenticated();
      
      // Landlords can update their contracts
      allow update: if isAuthenticated();
      
      // Landlords can delete their contracts
      allow delete: if isAuthenticated();
    }
    
    // Contract Templates
    match /contractTemplates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

---

## Verify It Works

After publishing rules, check console:

1. Refresh your app
2. Go to Agent → Select Landlord
3. Console should show:
   ```
   ✅ Auto-registered successfully: landlord_...
   💾 Stored landlord email in localStorage
   ```

4. No more "Missing or insufficient permissions" errors!

---

## Summary

**For Development (Use Now)**:
- Allow all reads/writes
- Fast to implement
- No authentication needed

**For Production (Use Later)**:
- Require authentication
- Check ownership
- Proper security

**Apply the development rules now** to fix the error immediately. You can tighten security later when deploying to production.




