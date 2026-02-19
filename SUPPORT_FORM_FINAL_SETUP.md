# Support Form - Final Setup ✅

## What I Did

Created a **dedicated support email service** instead of using the referencing endpoint. This is cleaner, more maintainable, and avoids conflicts.

## New Backend Endpoint

**Route**: `/api/support/send-email`  
**Method**: POST  
**Backend**: `proptii-backend` (runs on port 3002 or Render.com)

### Files Created/Modified:

1. ✅ `proptii-backend/src/routes/supportRoutes.js` - New dedicated support route
2. ✅ `proptii-backend/src/services/emailService.js` - Added `generateSupportEmailTemplate()` method
3. ✅ `proptii-backend/src/index.js` - Registered `/api/support` route
4. ✅ `src/components/HelpFormModal.tsx` - Updated to use new support endpoint

## How It Works

```
User submits form
     ↓
Save to Firestore ✅
     ↓
POST /api/support/send-email
     ↓
Generate HTML email
     ↓
Send via SMTP → contactus@theluxcity.co.uk
     ↓
Success!
```

## Backend Setup Required

### 1. Start the Backend Server

```bash
cd proptii-backend
npm install  # if not already installed
npm start    # or npm run dev
```

The server should start on **port 3002** and show:
```
Server running on port 3002
SMTP_HOST: Set
SMTP_PORT: Set
SMTP_USER: Set
SMTP_FROM_EMAIL: Set
```

### 2. Verify SMTP Configuration

Make sure your `.env` file (in `proptii-backend` folder or root) has:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=your-from-email
```

**Note**: Since your other modals are working, this should already be configured!

## Test It Now! 🧪

### Step 1: Start Backend
```bash
cd proptii-backend
npm start
```

### Step 2: Test the Form

1. Go to http://localhost:5173/faq
2. Click "Click here" to open contact support
3. Fill out the form:
   - Subject: Technical Support
   - Heading: Test Support Request
   - Message: This is a test message
   - Email: your-email@example.com
4. Click "Submit"

### Expected Console Output:

```
Submitting support form...
Saving to Firestore...
✅ Support form saved to Firestore successfully
Sending email...
Trying primary endpoint: http://localhost:3000/api/support/send-email
✅ Email sent via primary endpoint
✅ Email sent successfully: { success: true, messageId: '...' }
```

### If Local Backend Not Running:

The form will automatically fallback to the Render.com hosted API:

```
Primary endpoint failed, trying fallback...
Trying fallback endpoint: https://proptii-r1-1a.onrender.com/api/support/send-email
✅ Email sent via fallback endpoint
```

## Email Details

**To**: contactus@theluxcity.co.uk  
**From**: Your configured SMTP from email  
**Subject**: `[Support Request] {subject} - {heading}`  
**Reply-To**: User's email address  

### Email Template Includes:

- Professional Proptii branding
- Subject category
- Heading
- User's email (clickable)
- Full message body
- Timestamp
- "Reply to User" button

## API Endpoint Details

### Request Format:

```javascript
POST /api/support/send-email
Content-Type: application/json

{
  "to": "contactus@theluxcity.co.uk",
  "subject": "[Support Request] Technical Support - Test",
  "from": "user@example.com",
  "formData": {
    "subject": "Technical Support",
    "heading": "Test Support Request",
    "body": "This is a test message",
    "email": "user@example.com",
    "submittedAt": "2025-11-02T12:00:00.000Z"
  }
}
```

### Response Format:

```javascript
{
  "success": true,
  "messageId": "<unique-smtp-message-id>"
}
```

## Troubleshooting

### ❌ "Connection Refused" Error
**Cause**: Backend not running on port 3002  
**Solution**: 
```bash
cd proptii-backend
npm start
```

### ❌ "HTTP 500" Error
**Cause**: SMTP configuration issue  
**Solution**:
1. Check backend console for error details
2. Verify SMTP credentials in `.env`
3. Test SMTP connection manually

### ❌ Fallback Also Fails
**Cause**: Render.com backend not deployed or down  
**Solution**:
1. Deploy to Render.com with new support route
2. Or ensure local backend is running

## Deployment Notes

### When Deploying to Render.com:

1. Push changes to Git repository
2. Render.com will automatically rebuild
3. New `/api/support/send-email` endpoint will be available
4. Frontend will use fallback URL automatically

### Environment Variables on Render.com:

Make sure these are set in Render.com dashboard:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`

## Files Modified Summary

### Backend (`proptii-backend`):
1. **NEW** `src/routes/supportRoutes.js` - Support email route handler
2. **MODIFIED** `src/index.js` - Added support route registration
3. **MODIFIED** `src/services/emailService.js` - Added support email template

### Frontend:
1. **MODIFIED** `src/components/HelpFormModal.tsx` - Uses `/api/support/send-email`
2. **ALREADY DONE** `src/services/firestoreService.ts` - Support form Firestore methods
3. **ALREADY DONE** `firestore.rules` - Support forms collection rules

## Why This Approach is Better

1. ✅ **Dedicated Endpoint** - Clean separation from referencing system
2. ✅ **Proper Data Structure** - No need to fake referencing form data
3. ✅ **Custom Template** - Email template designed specifically for support requests
4. ✅ **Maintainable** - Easy to modify without affecting other features
5. ✅ **Scalable** - Can add more support features easily

## Next Steps

1. **Start backend server** (if not running)
2. **Test the form** on FAQ page
3. **Check email inbox** at contactus@theluxcity.co.uk
4. **Verify Firestore** has the submission in `supportForms` collection

---

**Status**: ✅ COMPLETE - Ready for Testing  
**Backend Port**: 3002  
**Frontend Port**: 5173  
**Endpoint**: `/api/support/send-email`  
**Email To**: contactus@theluxcity.co.uk  

**Just start the backend and test!** 🚀

