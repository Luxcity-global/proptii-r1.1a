# Resend Email Setup Guide

## Overview
The backend now uses **Resend** as the primary email service. Resend is a modern email API that provides reliable email delivery with excellent deliverability rates.

## Quick Setup

### 1. Get Your Resend API Key
You already have your Resend API Key:
```
re_Tb2rMU6P_7ofzXz2rya7WDkaDPaT9pCVj
```

### 2. Configure Environment Variables

#### For Localhost Development

Create or update your `proptii-backend/.env` file:

```env
# Resend API Configuration (Primary Email Service)
RESEND_API_KEY=re_Tb2rMU6P_7ofzXz2rya7WDkaDPaT9pCVj

# Email From Address (use your verified domain)
EMAIL_FROM_ADDRESS=noreply@proptii.co

# App URL (for links in emails)
APP_URL=http://localhost:5173

# Port (optional, defaults to 3000)
PORT=3000
```

**Note for Localhost:**
- If you haven't verified a domain yet, Resend will use `onboarding@resend.dev` as the default from address
- This default address can only send emails to your own verified email address (for testing)
- To send emails to any recipient, verify your domain in Resend dashboard

#### For Render Production

In your Render dashboard, add these environment variables:

```env
RESEND_API_KEY=re_Tb2rMU6P_7ofzXz2rya7WDkaDPaT9pCVj
EMAIL_FROM_ADDRESS=noreply@proptii.co
APP_URL=https://proptii.co
```

**Important:** Replace `yourdomain.com` with your actual verified domain in Resend.

### 3. Verify Your Domain in Resend

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `theluxcity.co.uk`)
4. Add the required DNS records (SPF, DKIM, DMARC) to your domain's DNS settings
5. Wait for verification (usually 5-15 minutes)
6. Once verified, update `EMAIL_FROM_ADDRESS` to use your verified domain:
   ```env
   EMAIL_FROM_ADDRESS=noreply@proptii.co
   ```

## How It Works

### Email Service Priority

1. **Resend API** (Primary) - Used when `RESEND_API_KEY` is set
2. **SMTP** (Fallback) - Used if Resend is not configured or fails

### Features

✅ **Reliable Delivery** - Resend provides excellent deliverability rates  
✅ **Attachment Support** - PDFs and other attachments are supported  
✅ **HTML Emails** - Rich HTML email templates work perfectly  
✅ **Domain Verification** - Use your own verified domain for professional emails  
✅ **Automatic Fallback** - Falls back to SMTP if Resend fails (if SMTP is configured)

## Testing

### 1. Start the Backend

```bash
cd proptii-backend
npm run build
npm start
```

You should see:
```
✅ Email service initialized with Resend API
📧 Using from address: noreply@yourdomain.com
```

### 2. Test Email Sending

**Check configuration:**
```bash
curl http://localhost:3000/api/referencing/test-email-config
```

**Send a test email:**
```bash
curl -X POST http://localhost:3000/api/referencing/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### 3. Verify Email Delivery

- Check your inbox (and spam folder)
- Check Resend dashboard for delivery logs: https://resend.com/emails

## Email Types Supported

The following email types are sent via Resend:

1. **Referencing Emails:**
   - User confirmation
   - Agent notification
   - Referee request
   - Guarantor request

2. **Viewing Emails:**
   - Viewing request confirmation
   - Viewing confirmed
   - Viewing rescheduled
   - Viewing cancelled

3. **Contract Emails:**
   - Signed contract delivery (with PDF attachment)

## Troubleshooting

### "Email service not configured"
- Make sure `RESEND_API_KEY` is set in your `.env` file
- Restart the backend after adding the environment variable

### "Only send testing emails to your own email address"
- This means you're using the default `onboarding@resend.dev` address
- Verify your domain in Resend dashboard
- Set `EMAIL_FROM_ADDRESS` to your verified domain (e.g., `noreply@proptii.co`)

### Emails not arriving
- Check spam/junk folders
- Verify recipient email addresses
- Check Resend dashboard for delivery logs: https://resend.com/emails
- Verify your domain is properly verified in Resend

### Domain verification issues
- Make sure all DNS records (SPF, DKIM, DMARC) are correctly added
- Wait 5-15 minutes after adding DNS records
- Check Resend dashboard for verification status

## Production Deployment on Render

1. **Add Environment Variables in Render:**
   - Go to your Render service dashboard
   - Navigate to "Environment" tab
   - Add:
     - `RESEND_API_KEY=re_Tb2rMU6P_7ofzXz2rya7WDkaDPaT9pCVj`
     - `EMAIL_FROM_ADDRESS=noreply@proptii.co` (use your verified domain)
     - `APP_URL=https://yourdomain.com` (your production URL)

2. **Redeploy:**
   - Render will automatically redeploy when you save environment variables
   - Or manually trigger a redeploy

3. **Verify:**
   - Check Render logs for: `✅ Email service initialized with Resend API`
   - Test sending an email
   - Check Resend dashboard for delivery logs

## Cost

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for testing and small-scale use

**Resend Paid Plans:**
- Start at $20/month for 50,000 emails/month
- Scale as needed

## Migration from SMTP

If you were previously using SMTP (Gmail, SendGrid, etc.):

1. ✅ **Resend is now primary** - No code changes needed
2. ✅ **SMTP is fallback** - Still works if Resend fails
3. ✅ **Same email templates** - All existing emails work the same
4. ✅ **Better deliverability** - Resend provides better email delivery rates

You can keep SMTP credentials as a backup, or remove them if you only want to use Resend.

## Support

- Resend Documentation: https://resend.com/docs
- Resend Dashboard: https://resend.com
- Check email delivery logs: https://resend.com/emails











