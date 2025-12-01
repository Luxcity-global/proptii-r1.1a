# Email Issues Fix Summary

## Issues Identified

### 1. ✅ CSP (Content Security Policy) Violation - FIXED
**Error**: `Connecting to '<URL>' violates the following Content Security Policy directive`

**Root Cause**: The SecurityMiddleware was only adding `proptii-r1-1a-new-backend.onrender.com` in development mode, but the frontend needs to connect to both backend URLs in production.

**Fix Applied**: Updated `src/middleware/SecurityMiddleware.ts` to always include both backend URLs:
- `https://proptii-r1-1a-1.onrender.com`
- `https://proptii-r1-1a-new-backend.onrender.com`

**Status**: ✅ Fixed - Deploy the updated code

---

### 2. ⚠️ SMTP Connection Timeout - EXPECTED ON RENDER
**Error**: `Connection timeout (ETIMEDOUT)` when trying to connect to SMTP server

**Root Cause**: Render (and many cloud platforms) **block outbound SMTP connections** on ports 25, 465, and sometimes 587. This is a security measure to prevent spam.

**Status**: ⚠️ Expected behavior - SMTP won't work on Render

**Solution**: The code already has **Resend API fallback** built in. When SMTP fails, it automatically tries Resend. This is working correctly - you can see in the logs:
```
⚠️ SMTP failed, trying Resend API as fallback...
📧 Sending email via Resend API to: aisha.d@theluxcity.co.uk
✅ Email sent successfully via Resend API
```

**Action Required**: None - the fallback is working. Just need to fix Resend domain verification (see #3).

---

### 3. 🔧 Resend Domain Verification - NEEDS ACTION
**Error**: `You can only send testing emails to your own email address (aisha.d@theluxcity.co.uk)`

**Root Cause**: Resend's free/testing mode only allows sending to your verified email address. To send to **any recipient**, you need to verify your domain.

**Status**: 🔧 Needs manual action

**Solution**: 
1. Verify `theluxcity.co.uk` domain in Resend (see `RESEND_DOMAIN_VERIFICATION_FIX.md`)
2. Set environment variable: `EMAIL_FROM_ADDRESS=noreply@theluxcity.co.uk`
3. Restart backend

**Detailed Guide**: See `RESEND_DOMAIN_VERIFICATION_FIX.md`

---

## Current Email Flow

```
1. Try SMTP → ❌ Timeout (expected on Render)
2. Fallback to Resend → ⚠️ Domain not verified (can only send to aisha.d@theluxcity.co.uk)
3. Email sent successfully to verified email ✅
```

## After Fixing Resend Domain

```
1. Try SMTP → ❌ Timeout (expected on Render)
2. Fallback to Resend → ✅ Domain verified → Can send to anyone
3. Email sent successfully to any recipient ✅
```

## Quick Fix Checklist

- [x] **CSP Fix**: Updated SecurityMiddleware (deploy needed)
- [ ] **Resend Domain Verification**: 
  - [ ] Add domain `theluxcity.co.uk` to Resend
  - [ ] Add DNS records (SPF, DKIM, DMARC)
  - [ ] Wait for verification
  - [ ] Set `EMAIL_FROM_ADDRESS=noreply@theluxcity.co.uk` in Render
  - [ ] Restart backend

## Files Changed

1. ✅ `src/middleware/SecurityMiddleware.ts` - Fixed CSP to include both backend URLs
2. ✅ `server/index.js` - Already has cloud-optimized SMTP (from previous fix)
3. ✅ `server/index.mjs` - Already has cloud-optimized SMTP (from previous fix)

## Next Steps

1. **Deploy the CSP fix** (SecurityMiddleware.ts update)
2. **Verify domain in Resend** (follow `RESEND_DOMAIN_VERIFICATION_FIX.md`)
3. **Update environment variable** in Render: `EMAIL_FROM_ADDRESS=noreply@theluxcity.co.uk`
4. **Test email sending** to any recipient

## Expected Results After All Fixes

✅ No CSP errors in browser console  
✅ SMTP timeout (expected, but Resend fallback works)  
✅ Resend sends emails successfully to any recipient  
✅ No domain verification errors  

## Notes

- **SMTP will never work on Render** - this is by design (Render blocks outbound SMTP)
- **Resend is the solution** - it's already integrated and working, just needs domain verification
- **Domain verification is a one-time setup** - once done, you can send to anyone forever

