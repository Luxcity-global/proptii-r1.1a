# Firebase Rules Deployment Guide

This guide will help you deploy both Firestore and Storage rules to fix the permission errors.

## Issues to Fix

1. **Firestore**: `Missing or insufficient permissions` error
2. **Firebase Storage CORS**: Files not accessible for email attachments

## Method 1: Deploy via Firebase Console (Recommended)

### Step 1: Deploy Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **proptii-16946**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the entire contents of `firestore.rules` from your project
5. Paste it into the Firebase Console editor
6. Click **Publish** button

### Step 2: Deploy Storage Rules

1. In Firebase Console, go to **Storage** → **Rules** tab
2. Copy the entire contents of `storage.rules` from your project
3. Paste it into the Firebase Console editor
4. Click **Publish** button

## Method 2: Deploy via Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

## Current Rules Configuration

### Firestore Rules (`firestore.rules`)
- **Contracts collection**: Public read/write access (development mode)
- **Catch-all rule**: Allows all read/write for development

### Storage Rules (`storage.rules`)
- **Contracts folder** (`/contracts/**`): Public read access (required for email attachments)
- **Write access**: Authenticated users only (10MB file size limit)
- **Other files**: Require authentication

## Verification

After deploying:

1. **Firestore**: Try loading contracts again - the permission error should be gone
2. **Storage CORS**: Try sending a contract - the CORS error should be resolved

## Notes

- These rules are set for **development mode** with permissive access
- **Important**: Restrict these rules for production use
- The Storage rules allow public read access to contracts specifically for email attachment functionality


