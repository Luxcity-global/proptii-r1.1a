# Email Setup with SendGrid

## Overview
The backend now uses **SendGrid** for sending emails instead of Azure Communication Services. This is simpler and works great with Firestore (no Cosmos DB needed).

## What Changed

✅ **Email Service Updated** to use SendGrid  
✅ **Cosmos DB is Optional** - emails work without it  
✅ **Firestore Integration** - form data saved to Firestore, emails sent via SendGrid  

## Environment Variables Required

Add these to your `proptii-backend/.env` file:

```env
# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# App URL (for dashboard links in emails)
APP_URL=https://yourdomain.com

# Port (optional, defaults to 3000)
PORT=3000
```

## How to Get SendGrid API Key

1. **Sign up for SendGrid** (free tier available):
   - Go to: https://sendgrid.com/
   - Sign up for a free account (100 emails/day)

2. **Create an API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it (e.g., "Proptii Backend")
   - Give it "Full Access" or at least "Mail Send" permission
   - Copy the API key (you'll only see it once!)

3. **Verify a Sender Email**:
   - Go to Settings → Sender Authentication
   - Verify your email address (e.g., `noreply@yourdomain.com`)
   - This is required before you can send emails

4. **Add to your `.env` file**:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM_ADDRESS=your-verified-email@domain.com
   APP_URL=http://localhost:5173
   ```

## Testing

### 1. Start the Backend
```bash
cd proptii-backend
npm start
```

You should see:
```
✅ Email service initialized with SendGrid
```

Instead of:
```
⚠️ Email service not configured
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

### 3. Submit a Referencing Form

Now when users submit the referencing form:
1. ✅ Form data saves to **Firestore** (frontend)
2. ✅ Backend receives the submission
3. ✅ **SendGrid sends emails** to:
   - User (confirmation)
   - Agent (with dashboard link)
   - Referee (reference request)
   - Guarantor (guarantor request)

## Email Template Features

The agent email includes:
- Complete form data (identity, employment, residential, financial, guarantor)
- **Clickable button**: "👉 Review Documents in Proptii"
- Links to: `${APP_URL}/landlord/clients`
- Professional styling with Proptii branding

## Troubleshooting

### "Email not sent" error
- Check that `SENDGRID_API_KEY` is set correctly
- Verify your sender email in SendGrid
- Check SendGrid dashboard for delivery logs

### Emails not arriving
- Check spam folder
- Verify recipient email addresses
- Check SendGrid activity dashboard for delivery status

### Dashboard link doesn't work
- Make sure `APP_URL` is set correctly in `.env`
- For local dev: `APP_URL=http://localhost:5173`
- For production: `APP_URL=https://yourdomain.com`

## Production Deployment

When deploying to production:

1. Set environment variables:
   ```env
   SENDGRID_API_KEY=your_production_key
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   APP_URL=https://yourdomain.com
   ```

2. Use your actual domain for `APP_URL`

3. Make sure your domain's sender email is verified in SendGrid

4. Consider upgrading SendGrid plan if sending more than 100 emails/day

## Cost

**SendGrid Free Tier:**
- 100 emails/day
- Perfect for testing and small-scale use

**SendGrid Paid Plans:**
- Start at $15/month for 40,000 emails/month
- Scale as needed

## No Cosmos DB Needed!

✅ The backend now works perfectly **without Cosmos DB**:
- Form data is saved in **Firestore** (frontend)
- Emails are sent via **SendGrid** (backend)
- Cosmos DB is completely optional

This makes the system simpler and more cost-effective!

