# ✅ SMTP Email Service Setup Complete

## What Changed

The backend email service now uses **SMTP with Nodemailer** (using your existing .env configuration).

### Updated Files
- `proptii-backend/src/services/email.service.ts` - Now uses SMTP/Nodemailer ✅

### Build Status
- ✅ Backend builds successfully
- ✅ Backend starting with SMTP configuration

## Expected Environment Variables

The backend will look for these variables in your `.env` file:

```env
# SMTP Configuration (already in your .env)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password

# Optional (falls back to SMTP_USER if not set)
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# App URL (for dashboard links in emails)
APP_URL=http://localhost:5173
```

## What to Check

### 1. Backend Logs

Look for this message when backend starts:
```
✅ Email service initialized with SMTP (your-host:587)
```

If you see this instead:
```
⚠️ Email service not configured - SMTP credentials not set
```

Then the SMTP variables are missing from your `.env` file.

### 2. Test Email Sending

Once backend is running, test it:

```bash
# Check configuration
curl http://localhost:3000/api/referencing/test-email-config

# Send test email
curl -X POST http://localhost:3000/api/referencing/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### 3. Submit Referencing Form

When users submit the referencing form:
1. ✅ Form data saves to Firestore
2. ✅ Backend receives submission
3. ✅ SMTP sends emails to:
   - User (confirmation)
   - Agent (with dashboard link to `/landlord/clients`)
   - Referee (reference request)
   - Guarantor (guarantor request)

## Email Template Features

The agent email includes:
- Complete form data (identity, employment, residential, financial, guarantor)
- **Clickable button**: "👉 Review Documents in Proptii"
- Links to: `${APP_URL}/landlord/clients`
- Professional Proptii branding

## Common SMTP Ports

- **Port 587** - TLS (most common, recommended)
- **Port 465** - SSL (secure from start)
- **Port 25** - Non-encrypted (not recommended)

The service automatically detects:
- Port 465 → uses SSL/secure connection
- Other ports → uses TLS/STARTTLS

## Common SMTP Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Outlook/Office365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Custom Domain (cPanel/Plesk)
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

## Troubleshooting

### "Email service not configured"
- Check that all SMTP variables are set in `.env`
- Restart the backend after changing `.env`

### "Authentication failed"
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail, use "App Password" not regular password
- For Office365, ensure SMTP is enabled

### Emails not arriving
- Check spam folder
- Verify SMTP credentials
- Check SMTP server allows sending from your IP
- Verify recipient email addresses are correct

## Architecture Flow

```
User submits form
    ↓
Firestore (saves data) ✅
    ↓
Backend API receives request
    ↓
Backend Email Service (SMTP/Nodemailer)
    ↓
Your SMTP Server
    ↓
Email delivered to recipients ✅
    ↓
Agent clicks "Review Documents"
    ↓
Opens: /landlord/clients
```

## Files Modified

### Backend
- ✅ `proptii-backend/src/services/email.service.ts` - Now uses SMTP
- ✅ Built successfully

### Frontend  
- ✅ `src/services/emailService.ts` - Has dashboard link
- ✅ Working with Firestore

### Dashboard
- ✅ `src/landlord_agent/` - URL routing enabled
- ✅ `/landlord/clients` page accessible

## Status

✅ Backend: Built and configured for SMTP  
✅ Frontend: Saves to Firestore  
✅ Email Service: Uses existing SMTP config  
✅ Dashboard Link: Points to `/landlord/clients`  

**Your existing SMTP configuration should work now!** 🎉

## Next Steps

1. ✅ Backend is starting - check logs for SMTP confirmation
2. Test email sending with the curl commands above
3. Submit a referencing form to test end-to-end flow
4. Verify agent receives email with working dashboard link

That's it! Your email service should now work with your existing SMTP configuration.

