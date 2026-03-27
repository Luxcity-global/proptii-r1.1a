# Support Form - Simple Setup Guide

## Quick Fix Applied ✅

The support form now uses your **existing SMTP email service** (the same one that works for other modals) and sends emails to **contactus@theluxcity.co.uk**.

## What Changed

1. **Removed Azure Functions dependency** - Now uses existing email server
2. **Email destination** - All support requests go to `contactus@theluxcity.co.uk`
3. **Uses existing SMTP** - Same setup as your working modals
4. **Saves to Firestore** - Form data is stored in Firebase database

## How It Works

```
User submits form
     ↓
Save to Firestore ✅
     ↓
Send email via existing SMTP server → contactus@theluxcity.co.uk ✅
     ↓
Show success message
```

## Requirements

### 1. Email Server Running
The email server at `server/index.js` needs to be running on port 3002:

```bash
# Make sure your email server is running
# (Since other modals work, this is likely already running)
```

### 2. Environment Variables
Your `.env` file (or server environment) needs these SMTP settings:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username  
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=your-from-email
```

**Note**: Since your other modals are working, these are already configured! ✅

### 3. Frontend Environment
Optional - if you want to customize the API URL:

```env
# .env.local (optional)
VITE_API_URL=http://localhost:3002/api
```

Default is `http://localhost:3002/api` if not set.

## Testing

1. **Navigate to FAQ page**: http://localhost:5173/faq
2. **Click "Click here"** to open contact support form
3. **Fill out the form**:
   - Subject: Technical Support
   - Heading: Test submission
   - Message: This is a test message
   - Email: your-test-email@example.com
4. **Click Submit**

### Expected Results:

**Console Output:**
```
✅ Support form saved to Firestore successfully
✅ Email sent successfully
```

**Email to contactus@theluxcity.co.uk:**
- Professional HTML template
- All form details
- User's email address for reply

**Firestore Database:**
- New document in `supportForms` collection
- Contains all form data
- Status: "pending"

## Email Template

The email sent to `contactus@theluxcity.co.uk` includes:

```
Subject: [Support Request] {subject} - {heading}

Body:
┌─────────────────────────────────────┐
│   New Support Request               │
│   FAQ Contact Form Submission       │
└─────────────────────────────────────┘

Subject: {selected subject}
Heading: {user heading}
User Email: {user email}
Message: {user message}
```

## Troubleshooting

### ❌ Error: "Failed to fetch" or 404
**Cause**: Email server not running  
**Solution**: Check if server is running on port 3002

```bash
# Check if server is running
netstat -an | grep 3002

# If not running, start it
node server/index.js
```

### ❌ Email not received
**Cause**: SMTP configuration issue  
**Solution**: 
1. Check console logs for SMTP errors
2. Verify SMTP credentials are correct
3. Check spam folder
4. Test with the working modals to confirm SMTP is working

### ❌ "Firestore permission denied"
**Cause**: Firestore rules not configured  
**Solution**: Deploy updated Firestore rules:

```bash
firebase deploy --only firestore:rules
```

## API Endpoint

**Endpoint**: `POST /api/email/send`

**Request Body**:
```json
{
  "to": "contactus@theluxcity.co.uk",
  "subject": "[Support Request] Technical Support - Test",
  "html": "<html>...</html>"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "message-id-from-smtp"
}
```

## Files Modified

1. ✅ `src/components/HelpFormModal.tsx` - Updated to use existing email service
2. ✅ `src/services/firestoreService.ts` - Added support form methods
3. ✅ `firestore.rules` - Added supportForms collection rules

## No Additional Setup Needed

Since your SMTP is already working for other modals:
- ✅ Email server is configured
- ✅ SMTP credentials are set
- ✅ Server is running
- ✅ No Azure Functions needed
- ✅ No additional npm install required

## Just Test It!

Go to http://localhost:5173/faq and submit the form. It should work immediately! 🎉

---

**Support**: If you encounter issues, check the browser console and server logs for detailed error messages.

