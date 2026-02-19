# Support Form - Issue Fixed ✅

## Problem
Form was trying to connect to port 3000 instead of port 3002 where the email server is running.

## Root Cause
The code was using `VITE_API_URL` environment variable which points to port 3000 (your main API), but the email server runs on port 3002.

## Solution
Updated the code to specifically use port 3002 for the email endpoint, independent of `VITE_API_URL`.

### Before:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
// This would use port 3000 if VITE_API_URL was set
```

### After:
```javascript
const emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL || 
                       (window.location.hostname === 'localhost' 
                           ? 'http://localhost:3002' 
                           : 'https://proptii-r1-1a.onrender.com');
// Always uses port 3002 for localhost
```

## Test Now! 🧪

1. **Refresh your browser** (or restart dev server if needed)
2. Go to: http://localhost:5173/faq
3. Click "Click here" to open the contact form
4. Fill out and submit

### Expected Console Output:
```
Submitting support form...
Saving to Firestore...
✅ Support form saved to Firestore successfully
Sending email...
✅ Email sent successfully
```

### Expected Results:
- ✅ No 404 errors
- ✅ Email sent to contactus@theluxcity.co.uk
- ✅ Success message displayed
- ✅ Data saved in Firestore

## Email Details

**Recipient**: contactus@theluxcity.co.uk  
**Subject**: [Support Request] {subject} - {heading}  
**Format**: Professional HTML template with all form details

## Files Modified

1. ✅ `src/components/HelpFormModal.tsx` - Fixed to use port 3002
2. ✅ `src/services/firestoreService.ts` - Support form methods (already done)
3. ✅ `firestore.rules` - Support forms collection rules (already done)

## Optional: Custom Email Server URL

If you want to customize the email server URL, add to `.env.local`:

```env
VITE_EMAIL_SERVER_URL=http://localhost:3002
```

But this is optional - it defaults to port 3002 automatically.

## Architecture

```
Support Form Submission
        ↓
Save to Firestore (port N/A - Firebase)
        ↓
Send Email via SMTP Server (port 3002) → contactus@theluxcity.co.uk
        ↓
Show Success Message
```

**Main API** (VITE_API_URL): Port 3000 - For general API calls  
**Email Server**: Port 3002 - For sending emails (this is what we use now)

## No Additional Setup Required

✅ Email server already running on port 3002  
✅ SMTP credentials already configured  
✅ Firestore rules already deployed  
✅ No npm install needed  

## Just Refresh and Test!

The fix is complete. Simply refresh your browser and try submitting the form again! 🎉

---

**Status**: ✅ FIXED - Ready for immediate testing

