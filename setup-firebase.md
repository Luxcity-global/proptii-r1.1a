# Quick Firebase Setup

## Immediate Fix for Permission Errors

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name it `proptii-16946` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore
1. In your project, go to "Firestore Database"
2. Click "Create database"
3. **IMPORTANT**: Choose "Start in test mode" 
4. Select location (closest to you)
5. Click "Done"

### 3. Get Your Credentials
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web app (</>)
4. Register app with name "Proptii Web"
5. Copy the config values

### 4. Create .env.local File
Create `.env.local` in your project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Update Firestore Rules (IMPORTANT)
In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING**: This rule allows anyone to read/write. Only use for development!

### 6. Restart Your App
```bash
npm run dev
```

## What Happens Now
- ✅ Form saves to **local storage** (always works)
- ✅ Form saves to **Cosmos DB** (existing backend)
- ✅ Form saves to **Firestore** (new cloud storage)
- ⚠️ If Firestore fails, you'll see a warning but form still saves locally

## Test It
1. Open the referencing form
2. Fill in some data
3. Click "Save"
4. Check browser console for success messages
5. Check Firebase Console → Firestore Database to see your data

## Production Security Rules
For production, replace the test rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /referencingForms/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```
