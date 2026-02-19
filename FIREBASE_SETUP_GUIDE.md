# Firebase Setup Guide for Proptii

## Current Status
✅ **Firestore integration is already implemented** in `ReferencingModal.OLD.tsx`
✅ **CSP headers have been updated** to allow Firebase connections
✅ **Error handling has been improved** for offline scenarios

## What You Need to Do

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `proptii-16946` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

### 3. Get Firebase Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Register your app with a nickname (e.g., "Proptii Web")
5. Copy the configuration values

### 4. Create Environment File
Create a `.env.local` file in your project root with these values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Set Up Firestore Security Rules
In Firebase Console → Firestore Database → Rules, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own referencing forms
    match /referencingForms/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Allow public read access to test collection (for development)
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

### 6. Test the Integration
1. Restart your development server: `npm run dev`
2. Open the dashboard and try to save a referencing form
3. Check the browser console for success messages
4. Check Firebase Console → Firestore Database to see saved data

## How It Works

### Data Flow
1. **User fills form** → Data stored in React state
2. **User clicks "Save"** → Data saved to:
   - Local Storage (for offline access)
   - Cosmos DB (existing backend)
   - **Firestore (new cloud storage)**
3. **User submits form** → Final data saved to Firestore and marked as submitted

### Firestore Structure
```
referencingForms/
  └── {userId}_{propertyId}/
      ├── userId: string
      ├── propertyId: string
      ├── formData: object (all form sections)
      ├── currentStep: number
      ├── stepStatus: object
      ├── isSubmitted: boolean
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      └── submissionDate: timestamp (if submitted)
```

### Error Handling
- **Offline detection**: Shows appropriate messages when device is offline
- **Network errors**: Graceful fallback to local storage
- **Permission errors**: Clear error messages for authentication issues
- **Timeout handling**: Prevents hanging requests

## Troubleshooting

### Common Issues

1. **"Firebase connection failed"**
   - Check your `.env.local` file has correct values
   - Verify Firebase project is created and Firestore is enabled
   - Check browser console for specific error messages

2. **"Permission denied"**
   - Update Firestore security rules (see step 5 above)
   - Ensure user is authenticated

3. **"CSP violation"**
   - The CSP headers have been updated, but if you still see issues:
   - Temporarily disable CSP in `index.html` (comment out the meta tag)
   - Check `staticwebapp.config.json` has Firebase domains

4. **Data not saving**
   - Check browser console for errors
   - Verify Firebase project is active
   - Check Firestore rules allow writes

### Development Tips
- Use Firebase Console to monitor data in real-time
- Check browser Network tab for failed requests
- Use browser DevTools to inspect localStorage for fallback data
- Test with different user accounts to verify data isolation

## Production Considerations
- Update Firestore security rules for production
- Set up proper authentication if not using Azure MSAL
- Consider data retention policies
- Monitor Firestore usage and costs
- Set up proper error monitoring and logging

## Files Modified
- `src/config/firebaseConfig.ts` - Firebase initialization
- `src/services/firestoreService.ts` - Firestore operations
- `src/components/ReferencingModal.OLD.tsx` - Form integration
- `staticwebapp.config.json` - CSP headers
- `src/middleware/SecurityMiddleware.ts` - CSP for middleware
- `index.html` - CSP meta tag (temporarily disabled)
- `vite.config.ts` - CSP headers (temporarily disabled)
