# Support Form Setup Guide

This document explains how the FAQ Contact Support Form works and how to set it up.

## Overview

The Contact Support Form on the FAQ page now includes:
1. **Firestore Database Storage** - All form submissions are saved to Firebase Firestore
2. **SMTP Email Notifications** - Support team receives email notifications for each submission
3. **User Confirmation Emails** - Users receive automatic confirmation emails

## Architecture

### Frontend (FAQ Page)
- **Location**: `src/pages/FAQ.tsx`
- **Component**: `src/components/HelpFormModal.tsx`
- Form includes:
  - Subject (dropdown)
  - Heading (text)
  - Message (textarea)
  - User Email (email input)

### Backend
- **Azure Function**: `api/src/functions/support-email/index.ts`
- **Firestore Service**: `src/services/firestoreService.ts`

### Data Flow
1. User fills out form on FAQ page
2. Form data is saved to Firestore (`supportForms` collection)
3. Azure Function sends email to support team via SMTP
4. User receives confirmation email
5. Success message is displayed to user

## Setup Instructions

### 1. Firebase/Firestore Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing `proptii-2ae8d`
3. Enable Firestore Database
   - Click "Firestore Database" → "Create database"
   - Choose "Start in test mode" for development
   - Select your region

#### Configure Firestore Rules
In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Support forms collection
    match /supportForms/{formId} {
      // Allow anyone to create support forms
      allow create: if true;
      // Only authenticated users can read/update/delete
      allow read, update, delete: if request.auth != null;
    }
    
    // Other collections...
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Set Environment Variables
Create or update `.env.local` in project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=proptii-2ae8d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proptii-2ae8d
VITE_FIREBASE_STORAGE_BUCKET=proptii-2ae8d.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Endpoint (for Azure Functions)
VITE_API_ENDPOINT=http://localhost:7071
```

### 2. SMTP Email Configuration

#### Configure Azure Functions (Local Development)
Update `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your-email@gmail.com",
    "SMTP_PASS": "your-app-password",
    "SMTP_FROM_EMAIL": "your-email@gmail.com",
    "SUPPORT_EMAIL": "support@proptii.com"
  }
}
```

#### SMTP Provider Options

##### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-gmail@gmail.com
```

**Note**: For Gmail, you need to:
1. Enable 2-factor authentication
2. Create an App Password at https://myaccount.google.com/apppasswords
3. Use the App Password instead of your regular password

##### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
```

##### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@proptii.com
```

##### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM_EMAIL=noreply@proptii.com
```

### 3. Install Dependencies

```bash
# Install API dependencies
cd api
npm install

# Go back to root
cd ..

# Frontend dependencies are already installed
```

### 4. Start Development Servers

#### Terminal 1 - Frontend
```bash
npm run dev
```

#### Terminal 2 - Azure Functions (API)
```bash
cd api
npm start
```

## Testing

### 1. Test Locally

1. Navigate to http://localhost:5173/faq (or your frontend URL)
2. Click "Click here" to open the contact support form
3. Fill out the form:
   - Select a subject
   - Enter a heading
   - Write a message
   - Enter your email
4. Click "Submit"
5. Check:
   - Console logs for success messages
   - Firebase Console → Firestore Database → `supportForms` collection
   - Support team email inbox
   - User email inbox for confirmation

### 2. Check Firestore

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Look for `supportForms` collection
4. You should see documents with:
   - id
   - subject
   - heading
   - body
   - email
   - status (pending)
   - createdAt
   - updatedAt

### 3. Check Emails

**Support Team Email** should receive:
- Professional formatted email
- All form details
- Reply button to user's email

**User Confirmation Email** should include:
- Thank you message
- Summary of their submission
- Expected response time

## Firestore Data Structure

### supportForms Collection

```typescript
{
  id: string;                          // Unique form ID
  subject: string;                     // general, technical, feedback, other
  heading: string;                     // Brief description
  body: string;                        // Full message
  email: string;                       // User's email
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: Timestamp;                // Form submission time
  updatedAt: Timestamp;                // Last update time
}
```

## API Endpoints

### POST /api/support-email

Sends support form emails via SMTP.

**Request Body:**
```json
{
  "subject": "technical",
  "heading": "Login Issue",
  "body": "I cannot log into my account...",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Support request sent successfully"
}
```

## Firestore Service Methods

### saveSupportForm()
```typescript
await firestoreService.saveSupportForm({
  subject: 'technical',
  heading: 'Login Issue',
  body: 'Cannot log in...',
  email: 'user@example.com'
});
```

### getAllSupportForms()
```typescript
const result = await firestoreService.getAllSupportForms();
// Returns array of all support form submissions
```

### updateSupportFormStatus()
```typescript
await firestoreService.updateSupportFormStatus(
  'form_id',
  'in-progress'
);
```

## Deployment

### Azure Functions Configuration

When deploying to Azure, add these Application Settings:

1. Go to Azure Portal
2. Navigate to your Function App
3. Settings → Configuration → Application Settings
4. Add:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM_EMAIL`
   - `SUPPORT_EMAIL`

### Frontend Configuration

Update production environment variables:
```env
VITE_API_ENDPOINT=https://your-function-app.azurewebsites.net
```

## Troubleshooting

### Firestore Permission Denied
- Check Firebase rules allow write access to `supportForms`
- Verify Firebase configuration in `.env.local`

### Email Not Sending
- Verify SMTP credentials are correct
- Check SMTP provider requires App Password (Gmail)
- Review Azure Function logs for errors
- Ensure port 587 is not blocked by firewall

### Form Submission Fails
- Check browser console for errors
- Verify API endpoint is accessible
- Check network tab for failed requests
- Review Azure Function logs

### User Doesn't Receive Confirmation Email
- Check spam/junk folder
- Verify user email is valid
- Check Azure Function logs for email send status

## Features

### Current Features
- ✅ Save form submissions to Firestore
- ✅ Send email to support team
- ✅ Send confirmation email to user
- ✅ Professional HTML email templates
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Offline detection

### Future Enhancements
- [ ] Admin dashboard to view/manage submissions
- [ ] Email templates customization
- [ ] Auto-response based on subject
- [ ] File attachments support
- [ ] Ticket tracking system
- [ ] Integration with help desk software

## Security Considerations

1. **Firestore Rules**: Only allow create operations for unauthenticated users on supportForms
2. **Email Validation**: Form validates email format before submission
3. **Rate Limiting**: Consider adding rate limiting to prevent spam
4. **SMTP Credentials**: Never commit SMTP credentials to version control
5. **Environment Variables**: Use Azure Key Vault for production secrets

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review Firestore rules and permissions
- Verify SMTP configuration
- Check Azure Function logs in Azure Portal

## Related Documentation

- [Firebase Setup Guide](../../FIREBASE_SETUP_GUIDE.md)
- [Firestore Integration](../../FIRESTORE_INTEGRATION_README.md)
- [Email Service Setup](../../proptii-backend/CONTRACT_EMAIL_SETUP.md)
- [Environment Variables](../environment-variables.md)

