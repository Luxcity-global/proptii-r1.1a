# Support Form Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

This guide will get your support form working quickly. For detailed documentation, see [SUPPORT_FORM_SETUP.md](docs/features/SUPPORT_FORM_SETUP.md).

## Prerequisites

- Node.js 18+ installed
- Firebase account
- Gmail account (or other SMTP provider)

## Step 1: Install Dependencies

```bash
# In project root
cd api
npm install
cd ..
```

## Step 2: Configure Firebase

### 2.1 Create Firebase Project (if needed)
1. Go to https://console.firebase.google.com/
2. Click "Add project" or use existing `proptii-2ae8d`
3. Enable Firestore Database:
   - Click "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode"
   - Select your region (e.g., us-central)

### 2.2 Get Firebase Credentials
1. Project Settings (gear icon) → General
2. Scroll to "Your apps" → Web app
3. Copy the config values

### 2.3 Update Firestore Rules
1. In Firebase Console → Firestore Database → Rules
2. Click "Publish" if you see the rules (they're already in the file)
3. Or paste this and publish:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /supportForms/{formId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

## Step 3: Configure Environment Variables

### 3.1 Frontend (.env.local)
Create `.env.local` in project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=proptii-2ae8d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proptii-2ae8d
VITE_FIREBASE_STORAGE_BUCKET=proptii-2ae8d.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# API Endpoint
VITE_API_ENDPOINT=http://localhost:7071
```

### 3.2 Backend (api/local.settings.json)
Update `api/local.settings.json`:

#### Option A: Gmail
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "your-email@gmail.com",
    "SMTP_PASS": "your-16-character-app-password",
    "SMTP_FROM_EMAIL": "your-email@gmail.com",
    "SUPPORT_EMAIL": "support@proptii.com"
  }
}
```

**Gmail App Password Setup**:
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-factor authentication first (if not already)
3. Create an "App Password" for "Mail"
4. Copy the 16-character password
5. Use this password in `SMTP_PASS`

#### Option B: Outlook
```json
{
  "SMTP_HOST": "smtp-mail.outlook.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "your-email@outlook.com",
  "SMTP_PASS": "your-password",
  "SMTP_FROM_EMAIL": "your-email@outlook.com",
  "SUPPORT_EMAIL": "support@proptii.com"
}
```

## Step 4: Start Development Servers

### Terminal 1 - Frontend
```bash
npm run dev
```

### Terminal 2 - Azure Functions
```bash
cd api
npm start
```

Wait for both servers to start:
- Frontend: http://localhost:5173
- Azure Functions: http://localhost:7071

## Step 5: Test the Form

1. Open http://localhost:5173/faq
2. Click "Click here" to contact support
3. Fill out the form:
   - Subject: Technical Support
   - Heading: Test Submission
   - Message: This is a test
   - Email: your-email@example.com
4. Click "Submit"

### Expected Results:
✅ "Message Sent Successfully" dialog appears  
✅ Check browser console for success logs  
✅ Check Firebase Console → Firestore Database → `supportForms` collection  
✅ Check support email inbox for notification  
✅ Check user email inbox for confirmation  

## Troubleshooting

### ❌ "Permission Denied" in Firestore
**Solution**: 
1. Go to Firebase Console → Firestore Database → Rules
2. Make sure rules allow `create: if true` for supportForms
3. Click "Publish"

### ❌ Email Not Sending
**Solution**:
1. Check `api/local.settings.json` has correct SMTP credentials
2. For Gmail, use App Password (not regular password)
3. Check Azure Functions terminal for error messages
4. Test SMTP connection: https://www.gmass.co/smtp-test

### ❌ "Failed to fetch" or CORS Error
**Solution**:
1. Make sure Azure Functions is running on http://localhost:7071
2. Check `.env.local` has `VITE_API_ENDPOINT=http://localhost:7071`
3. Restart both frontend and backend servers

### ❌ Azure Functions Won't Start
**Solution**:
```bash
cd api
npm install
npm run build
npm start
```

### ❌ Form Doesn't Submit
**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. Verify all form fields are filled
4. Check Network tab for failed requests

## Verification Checklist

- [ ] Firebase project created
- [ ] Firestore Database enabled
- [ ] Firestore rules published
- [ ] `.env.local` created with Firebase credentials
- [ ] `api/local.settings.json` updated with SMTP credentials
- [ ] Gmail App Password created (if using Gmail)
- [ ] `npm install` run in api folder
- [ ] Frontend server running (port 5173)
- [ ] Backend server running (port 7071)
- [ ] Form submission successful
- [ ] Data appears in Firestore
- [ ] Support email received
- [ ] User confirmation email received

## Environment Variables Reference

### Required for Frontend
| Variable | Example | Purpose |
|----------|---------|---------|
| VITE_FIREBASE_API_KEY | AIzaSy... | Firebase authentication |
| VITE_FIREBASE_PROJECT_ID | proptii-2ae8d | Firebase project |
| VITE_API_ENDPOINT | http://localhost:7071 | Azure Functions URL |

### Required for Backend
| Variable | Example | Purpose |
|----------|---------|---------|
| SMTP_HOST | smtp.gmail.com | Email server |
| SMTP_PORT | 587 | Email server port |
| SMTP_USER | user@gmail.com | Email username |
| SMTP_PASS | app-password | Email password |
| SMTP_FROM_EMAIL | user@gmail.com | Sender email |
| SUPPORT_EMAIL | support@proptii.com | Support team email |

## Next Steps

Once everything is working:

1. **Update Firestore Rules for Production**
   - Add proper authentication
   - Restrict read/update/delete operations

2. **Configure Production SMTP**
   - Consider SendGrid, Mailgun, or AWS SES for reliability
   - Add rate limiting
   - Set up email queue

3. **Add Monitoring**
   - Enable Application Insights
   - Set up email delivery monitoring
   - Track form submission rates

4. **Create Admin Dashboard**
   - View all support submissions
   - Update ticket status
   - Reply to users
   - Export data

## Support

Need help?
- 📖 [Full Setup Guide](docs/features/SUPPORT_FORM_SETUP.md)
- 📋 [Implementation Summary](SUPPORT_FORM_IMPLEMENTATION_SUMMARY.md)
- 🔥 [Firebase Setup](FIREBASE_SETUP_GUIDE.md)
- 📧 [Email Configuration](proptii-backend/CONTRACT_EMAIL_SETUP.md)

## Common Commands

```bash
# Install dependencies
cd api ; npm install ; cd ..

# Start frontend
npm run dev

# Start backend
cd api ; npm start

# Build backend
cd api ; npm run build

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View Firebase logs
firebase functions:log

# Test SMTP connection (in api folder)
node -e "require('nodemailer').createTransport({host:'smtp.gmail.com',port:587,auth:{user:'USER',pass:'PASS'}}).verify().then(console.log)"
```

## Example Test Data

Use this to test the form:

**Subject**: Technical Support  
**Heading**: Cannot log into my account  
**Message**: I've been trying to log in for the past hour but keep getting an error message saying "Invalid credentials". I'm sure my password is correct. Can you please help?  
**Email**: test@example.com  

---

**Status**: Ready for Testing 🎉

**Estimated Setup Time**: 5-10 minutes

