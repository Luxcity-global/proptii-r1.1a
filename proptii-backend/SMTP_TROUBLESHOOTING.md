# SMTP Connection Timeout - Troubleshooting Guide

## Problem
SMTP connection to Gmail is timing out on Render with error: `ETIMEDOUT - Connection timeout`

## What Changed in the Code

### Improved SMTP Configuration
The email service has been updated with:

1. **Increased Timeouts**:
   - Connection timeout: 30s → 60s
   - Socket timeout: 30s → 60s
   - Greeting timeout: 15s → 30s

2. **Disabled Connection Pooling on Cloud Platforms**:
   - Connection pooling can cause issues on serverless/cloud environments
   - Now uses single connections on Render (more reliable)

3. **Rate Limiting on Cloud**:
   - Limits to 1 email per second on cloud platforms
   - Prevents Gmail from blocking due to rapid requests

4. **Better Error Logging**:
   - Added SMTP verification on startup
   - More detailed error messages to help diagnose issues

## Most Likely Causes (In Order)

### 1. Gmail App Password Expired or Revoked ⭐ MOST COMMON

**Symptoms**: Connection timeouts, authentication failures

**Solution**:
1. Go to https://myaccount.google.com/apppasswords
2. Sign in to the Google account used for `SMTP_USER`
3. Check if the App Password still exists
4. If not, generate a new one:
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → enter "Proptii Backend"
   - Copy the 16-character password (remove spaces)
5. Update Render environment variable:
   ```
   SMTP_PASS=xxxx xxxx xxxx xxxx  (your new app password)
   ```
6. Restart the Render service

**Note**: Gmail App Passwords can expire or be revoked if:
- You changed your Google account password
- You enabled/disabled 2-factor authentication
- Gmail detected suspicious activity

### 2. Gmail Account Security Settings Changed

**Symptoms**: Connection timeouts, "Less secure app" errors

**Solution**:
1. Make sure 2-Factor Authentication is **enabled** on the Gmail account
2. Check that App Passwords are allowed:
   - Go to https://myaccount.google.com/security
   - Under "How you sign in to Google", verify 2-Step Verification is ON
   - App Passwords option should be available
3. Check for security alerts:
   - Go to https://myaccount.google.com/notifications
   - Look for blocked sign-in attempts
   - Approve the Render IP address if blocked

### 3. Gmail Blocking Render's IP Address

**Symptoms**: Connection timeouts, intermittent failures

**Solution**:
1. Check Gmail's recent security activity:
   - Go to https://myaccount.google.com/device-activity
   - Look for blocked sign-in attempts from Render's IP
2. If blocked, try:
   - Manually approve the device/IP
   - OR use a different email provider (SendGrid, Mailgun, Resend)

### 4. Environment Variables Not Set Correctly on Render

**Symptoms**: "Email service not configured" errors

**Solution**:
1. Go to Render Dashboard → Your Backend Service → Environment
2. Verify these variables are set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM_ADDRESS=your-email@gmail.com
   ```
3. Make sure there are no extra spaces or quotes around the values
4. After updating, manually trigger a redeploy

### 5. Render Network/Firewall Issue

**Symptoms**: Connection timeouts only on Render, works locally

**Solution**:
1. Check Render's status page: https://status.render.com/
2. Contact Render support if SMTP is being blocked
3. OR switch to Resend API (already configured as fallback)

## Quick Test Steps

### Step 1: Verify Environment Variables
Check Render logs on startup. You should see:
```
✅ Email service initialized with SMTP (smtp.gmail.com:587)
   Connection pooling: disabled (cloud platform)
   Timeouts: connection=60000ms, socket=60000ms, greeting=30000ms
🔍 Verifying SMTP connection to Gmail...
```

If you see:
```
❌ SMTP verification failed: ...
```
Then follow the error message instructions.

### Step 2: Test Locally
1. Add SMTP credentials to your local `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```
2. Run locally: `npm start`
3. Test sending an email
4. If it works locally but fails on Render → Issue is with Render or Gmail blocking Render's IP

### Step 3: Check Gmail Activity
1. Go to https://myaccount.google.com/device-activity
2. Look for recent sign-in attempts from Render
3. If you see blocked attempts:
   - The IP might be flagged
   - Generate a new App Password
   - Or switch to Resend API

## Recommended Solutions (In Order)

### Option 1: Regenerate Gmail App Password (Try This First) ⭐

This fixes 80% of cases:

1. Delete old app password: https://myaccount.google.com/apppasswords
2. Generate new app password
3. Update `SMTP_PASS` in Render
4. Redeploy

### Option 2: Use Resend API (Already Configured)

If Gmail SMTP continues to fail, Resend is already set up as a fallback:

1. Verify your domain in Resend:
   - Go to https://resend.com/domains
   - Add domain: `theluxcity.co.uk`
   - Add required DNS records (SPF, DKIM, DMARC)
   - Wait for verification (~5-15 minutes)

2. Update Render environment variable:
   ```
   EMAIL_FROM_ADDRESS=noreply@theluxcity.co.uk
   ```

3. The backend will automatically:
   - Try SMTP first
   - Fall back to Resend if SMTP fails
   - No code changes needed!

### Option 3: Switch to SendGrid or Mailgun

Both are more reliable than Gmail for production:

**SendGrid**:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun**:
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Debugging Commands

### Check DNS Resolution
```bash
nslookup smtp.gmail.com
```
Should return: `142.250.x.x` (Google's IP range)

### Test SMTP Connection
```bash
telnet smtp.gmail.com 587
```
Should connect and show:
```
220 smtp.gmail.com ESMTP ...
```
If this times out, Render's network is blocking it.

### Check Render Logs
Look for these patterns:
```
❌ SMTP error while sending email (attempt 1/3): Error: Connection timeout
   Error code: ETIMEDOUT
```

## Current Configuration

After the fix, your SMTP configuration is:

✅ **Timeouts**: All increased to 60s for cloud reliability
✅ **Connection Pooling**: Disabled on cloud (more stable)
✅ **Rate Limiting**: 1 email/second on cloud (prevents Gmail blocks)
✅ **Verification**: Connection verified on startup
✅ **Fallback**: Resend API automatically used if SMTP fails
✅ **Retries**: 3 attempts with exponential backoff (2s, 4s, 6s)

## Next Steps

1. **Deploy the updated code** to Render (already compiled ✅)
2. **Regenerate Gmail App Password** (most likely fix)
3. **Update SMTP_PASS** in Render environment variables
4. **Check logs** for the verification message
5. **Test** by sending an email
6. If still failing, **verify Resend domain** as backup

## Need Help?

If the issue persists after trying all solutions:
1. Share the full error logs from Render
2. Confirm which step you're stuck on
3. Check if you can test SMTP locally (to isolate the issue)

































