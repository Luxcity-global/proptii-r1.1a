# Firebase Environment Setup for Backend

## Required Environment Variables

Add these to your `proptii-backend/.env` file:

```env
# Server Configuration
PORT=3000

# Firebase/Firestore Configuration (REQUIRED for referee/guarantor responses)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# App URL (for email links)
APP_URL=http://localhost:5173
```

## How to Get Firebase Credentials

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (e.g., `proptii-2ae8d` or `proptii-16946`)
3. **Go to Project Settings** (gear icon) → **Service Accounts** tab
4. **Click "Generate new private key"**
5. **Download the JSON file**
6. **Extract these values from the JSON:**
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters)

## Example .env File

```env
PORT=3000
FIREBASE_PROJECT_ID=proptii-2ae8d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@proptii-2ae8d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
APP_URL=http://localhost:5173

# Optional: SMTP configuration for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Testing Without Firestore

The backend will still work without Firestore credentials. It will log a warning and continue:

```
⚠️ Firestore not configured - FIREBASE_PROJECT_ID not set
   The application will work without Firestore persistence
```

In this case, responses will still be accepted and emails will be sent (if SMTP is configured), but data won't be persisted to the database.



