# SMTP Error Fix for Deployed Backend

## Problem
The deployed backend on Render (or other cloud platforms) was experiencing SMTP connection errors due to:
1. Port 465 (SSL) being blocked on many cloud platforms
2. Missing cloud-optimized TLS configuration
3. Insufficient timeout settings for cloud network conditions
4. Server exiting on SMTP verification failure, preventing startup

## Solution Applied

### 1. Cloud Platform Detection
The code now automatically detects if it's running on a cloud platform (Render, Heroku, Vercel, AWS, Google Cloud) and applies optimized settings.

### 2. Automatic Port Switching
- **Port 465 → 587**: Automatically switches from port 465 (SSL) to 587 (STARTTLS) on cloud platforms
- Port 587 with STARTTLS is more reliable on cloud hosting providers where port 465 is often blocked

### 3. Enhanced TLS Configuration
- Added `servername` for SNI (Server Name Indication) support
- Set minimum TLS version to 1.2
- Configured `rejectUnauthorized: false` for compatibility with self-signed certificates
- Added `requireTLS` for non-465 ports

### 4. Optimized Timeout Settings
- **Connection timeout**: 30 seconds (increased for cloud)
- **Socket timeout**: 30 seconds
- **Greeting timeout**: 15 seconds on cloud, 10 seconds locally
- **DNS timeout**: 20 seconds on cloud, 30 seconds locally

### 5. Connection Pooling
- Enabled connection pooling (`pool: true`)
- Max connections: 5
- Max messages per connection: 100
- Improves performance and reliability

### 6. Non-Blocking Verification
- SMTP verification no longer blocks server startup
- Server starts even if initial verification fails
- Errors are logged with helpful troubleshooting tips
- Email sending will still be attempted with proper error handling

## Files Updated
- `server/index.js` - Main backend server
- `server/index.mjs` - Alternative backend server

## Environment Variables Required

Make sure these are set in your deployment environment:

```env
SMTP_HOST=smtp.gmail.com          # Your SMTP server
SMTP_PORT=587                     # Use 587 for cloud platforms (or 465 will auto-switch)
SMTP_USER=your-email@gmail.com    # SMTP username
SMTP_PASS=your-app-password       # SMTP password (App Password for Gmail)
SMTP_FROM_EMAIL=your-email@gmail.com  # From email address
```

## Recommended SMTP Settings for Cloud Platforms

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password  # Generate at: https://myaccount.google.com/apppasswords
SMTP_FROM_EMAIL=your-email@gmail.com
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

## Testing the Fix

1. **Deploy the updated code** to your cloud platform
2. **Check startup logs** - You should see:
   ```
   📧 Auto-switching SMTP port from 465 to 587 for cloud compatibility
   ✅ SMTP connection verified successfully (smtp.gmail.com:587)
   ```
3. **Test email sending** - Try sending a test email
4. **Check logs** - If there are still errors, the logs will now provide more detailed information

## Additional Recommendations

### If SMTP Still Fails on Cloud Platforms

1. **Use Port 587**: Ensure `SMTP_PORT=587` in your environment variables
2. **Use Resend API as Fallback**: The `email.service.ts` already has Resend fallback support
   - Set `RESEND_API_KEY` in your environment
   - The system will automatically fall back to Resend if SMTP fails
3. **Check Firewall Rules**: Some cloud providers block outbound SMTP on certain ports
4. **Use SMTP Relay Service**: Consider using SendGrid, Mailgun, or Amazon SES for more reliable delivery

### Enable Resend Fallback (Already Implemented in email.service.ts)

If you're using the NestJS backend (`proptii-backend`), the `EmailService` already has Resend fallback:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com  # Optional: use verified domain
```

The system will:
1. Try SMTP first
2. Automatically fall back to Resend if SMTP fails
3. Log detailed error messages for troubleshooting

## Troubleshooting

### Error: "SMTP connection verification failed"
- Check SMTP credentials are correct
- Verify port 587 is accessible from your cloud platform
- Try using a different SMTP provider (SendGrid, Mailgun)
- Check cloud platform firewall/network restrictions

### Error: "Connection timeout"
- Increase timeout values (already optimized in the fix)
- Check if your cloud provider blocks outbound SMTP
- Consider using an SMTP relay service

### Error: "Authentication failed"
- For Gmail: Use App Password, not regular password
- Verify SMTP_USER and SMTP_PASS are correct
- Check if 2FA is enabled (required for Gmail App Passwords)

## Next Steps

1. ✅ Code has been updated with cloud-optimized SMTP settings
2. 🔄 Deploy the updated code to your cloud platform
3. ✅ Verify SMTP connection in startup logs
4. 🧪 Test email sending functionality
5. 📊 Monitor logs for any remaining issues

The server will now start successfully even if SMTP verification fails initially, and will provide better error messages to help diagnose any remaining issues.

