# Fix Resend Domain Verification to Send Emails to Any Recipient

## Current Issue

Resend is currently limiting emails to only your verified email address (`aisha.d@theluxcity.co.uk`). To send emails to **any recipient**, you need to verify your domain in Resend.

## Error Message

```
You can only send testing emails to your own email address (aisha.d@theluxcity.co.uk). 
To send emails to other recipients, please verify a domain at resend.com/domains, 
and change the `from` address to an email using this domain.
```

## Solution: Verify Your Domain in Resend

### Step 1: Go to Resend Domains

1. Log in to your Resend account: https://resend.com
2. Navigate to **Domains**: https://resend.com/domains
3. Click **Add Domain**

### Step 2: Add Your Domain

1. Enter your domain: `theluxcity.co.uk`
2. Click **Add Domain**
3. Resend will provide DNS records you need to add

### Step 3: Add DNS Records

You need to add these DNS records to your domain's DNS settings:

#### Required DNS Records:

1. **SPF Record** (TXT):
   ```
   v=spf1 include:resend.com ~all
   ```
   - Name: `@` (or your root domain)
   - Type: `TXT`
   - Value: `v=spf1 include:resend.com ~all`

2. **DKIM Records** (TXT):
   - Resend will provide 2-3 DKIM records
   - They look like:
     ```
     resend._domainkey.theluxcity.co.uk
     ```
   - Copy the exact values from Resend

3. **DMARC Record** (TXT) - Optional but recommended:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@theluxcity.co.uk
   ```
   - Name: `_dmarc`
   - Type: `TXT`
   - Value: `v=DMARC1; p=none; rua=mailto:dmarc@theluxcity.co.uk`

### Step 4: Verify DNS Records

1. After adding DNS records, go back to Resend
2. Click **Verify** on your domain
3. Wait for verification (can take a few minutes to 24 hours)
4. Once verified, you'll see a green checkmark ✅

### Step 5: Update Environment Variables

Once your domain is verified, update your Render environment variables:

1. Go to your Render dashboard
2. Navigate to your backend service
3. Go to **Environment** tab
4. Add or update:

```env
EMAIL_FROM_ADDRESS=noreply@theluxcity.co.uk
```

**Important**: Use an email address from your verified domain (e.g., `noreply@theluxcity.co.uk`, `hello@theluxcity.co.uk`, etc.)

### Step 6: Restart Your Backend

After updating the environment variable:

1. In Render dashboard, go to your backend service
2. Click **Manual Deploy** → **Deploy latest commit**
   OR
3. The service will auto-restart when you save the environment variable

### Step 7: Verify It Works

Check your backend logs. You should see:

```
✅ Resend initialized for cloud platform (will be used as fallback if SMTP fails)
📧 Using from address: noreply@theluxcity.co.uk
```

## Alternative: Use a Subdomain

If you prefer, you can verify a subdomain instead:

1. Add domain: `mail.theluxcity.co.uk`
2. Add DNS records for the subdomain
3. Use: `EMAIL_FROM_ADDRESS=noreply@mail.theluxcity.co.uk`

## Quick Reference: DNS Records Location

### Where to Add DNS Records:

- **If using Cloudflare**: DNS → Records → Add record
- **If using GoDaddy**: DNS Management → Add
- **If using Namecheap**: Advanced DNS → Add New Record
- **If using AWS Route 53**: Hosted Zones → Create Record

### DNS Propagation Time:

- Usually takes **5-30 minutes**
- Can take up to **24 hours** in rare cases
- Use a DNS checker: https://dnschecker.org

## Testing After Verification

Once verified, try sending an email to any recipient. You should see:

```
✅ Email sent successfully via Resend API to recipient@example.com (ID: xxxxx)
```

Instead of the domain verification error.

## Troubleshooting

### Domain Not Verifying?

1. **Check DNS Propagation**: Use https://dnschecker.org to verify records are live
2. **Wait Longer**: DNS can take up to 24 hours
3. **Check Record Format**: Make sure you copied the exact values from Resend
4. **Check TTL**: Lower TTL (300 seconds) helps with faster propagation

### Still Getting Domain Error?

1. **Verify Domain Status**: Check Resend dashboard - is it showing as verified?
2. **Check EMAIL_FROM_ADDRESS**: Must match your verified domain exactly
3. **Restart Backend**: After changing environment variables, restart the service

### Need Help?

- Resend Documentation: https://resend.com/docs/dashboard/domains/introduction
- Resend Support: support@resend.com

## Summary

✅ **Current Status**: Can only send to `aisha.d@theluxcity.co.uk`  
🎯 **Goal**: Send to any recipient  
🔧 **Solution**: Verify `theluxcity.co.uk` domain in Resend  
📧 **Then**: Set `EMAIL_FROM_ADDRESS=noreply@theluxcity.co.uk`  
🚀 **Result**: Can send emails to anyone!

