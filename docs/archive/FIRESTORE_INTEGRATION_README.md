# Firestore Integration for Referencing Modal

This document outlines the implementation of Firestore storage for the referencing modal forms and the fix for the email display issue in the dashboard header.

## Changes Made

### 1. Firebase Configuration (`src/config/firebaseConfig.ts`)
- Created Firebase configuration file with environment variable support
- Initialized Firestore and Auth services
- Uses fallback values for development

### 2. Firestore Service (`src/services/firestoreService.ts`)
- Created comprehensive Firestore service for referencing forms
- Implements CRUD operations for referencing form data
- Includes proper TypeScript interfaces
- Handles form submission status tracking

### 3. Referencing Modal Updates (`src/components/ReferencingModal.OLD.tsx`)
- Integrated Firestore service into save operations
- Maintains backward compatibility with existing Cosmos DB storage
- Saves to both Firestore and Cosmos DB for redundancy
- Updated success messages to indicate Firestore storage

### 4. Dashboard Header Fix (`src/components/dashboard/ui/DashboardHeader.tsx`)
- Added support for user email and phone props
- Replaced hardcoded email with dynamic user data
- Maintains fallback values for missing data

### 5. Dashboard Component Updates (`src/components/dashboard/Dashboard.tsx`)
- Updated to pass user email and phone to DashboardHeader
- Uses authenticated user data from MSAL context

### 6. Dashboard Home Updates (`src/components/dashboard/sections/DashboardHome.tsx`)
- Integrated Firestore data loading
- Falls back to localStorage if Firestore is unavailable
- Uses authenticated user context for better data consistency

## Environment Setup

### Required Environment Variables
Create a `.env.local` file with the following Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Project Setup
1. Create a Firebase project in the Firebase Console
2. Enable Firestore Database
3. Set up security rules (see `firestore.rules` in the project root)
4. Get your project configuration from Project Settings > General > Your apps

## Features Implemented

### Firestore Storage
- **Save Operations**: All form data is saved to Firestore when the save button is clicked
- **Load Operations**: Form data is loaded from Firestore with localStorage fallback
- **Submission Tracking**: Tracks form submission status in Firestore
- **User Association**: Forms are associated with authenticated users

### Email Display Fix
- **Dynamic Email**: Dashboard header now displays the actual user's email from MSAL authentication
- **Fallback Support**: Shows default email if user data is not available
- **Phone Support**: Also displays user phone number when available

## Data Structure

### Firestore Collection: `referencingForms`
```typescript
interface ReferencingDocument {
  userId: string;
  propertyId: string;
  formData: ReferencingFormData;
  currentStep: number;
  stepStatus: { [key: number]: 'empty' | 'partial' | 'complete' };
  lastSaved: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isSubmitted: boolean;
}
```

## Security Considerations

- Forms are associated with authenticated users
- User can only access their own form data
- Firestore security rules should be configured appropriately
- Sensitive data like file uploads are stored as base64 in Firestore

## Backward Compatibility

- Maintains existing localStorage functionality
- Cosmos DB integration continues to work
- Gradual migration approach allows for testing
- Fallback mechanisms ensure reliability

## Testing

1. **Authentication**: Ensure MSAL authentication is working
2. **Firestore**: Verify Firebase project is configured correctly
3. **Form Saving**: Test save button functionality
4. **Email Display**: Verify user email appears in dashboard header
5. **Data Persistence**: Check that data persists across sessions

## Troubleshooting

### Common Issues
1. **Firebase not initialized**: Check environment variables
2. **Permission denied**: Verify Firestore security rules
3. **Email not showing**: Check MSAL authentication status
4. **Data not saving**: Check browser console for errors

### Debug Steps
1. Check browser console for error messages
2. Verify Firebase configuration in browser dev tools
3. Check Firestore console for data
4. Verify MSAL authentication tokens

## Future Enhancements

- Real-time updates using Firestore listeners
- Offline support with Firestore offline persistence
- File upload optimization (move from base64 to Firebase Storage)
- Advanced security rules for different user roles
- Data migration tools for existing localStorage data
