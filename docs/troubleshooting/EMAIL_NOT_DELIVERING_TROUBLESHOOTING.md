# Email Not Delivering - Troubleshooting Guide

If emails aren't being delivered, check these issues:

## Step 1: Backend Server Must Be Running

The email backend server must be running on port 10000.

### Check if Server is Running:

1. **Open a new terminal/PowerShell window**
2. **Navigate to project root:**
   ```powershell
   cd "C:\Users\lgapr\OneDrive\Documents\GitHub\R Prop\proptii-r1.1a"
   ```

3. **Start the backend server:**
   ```powershell
   cd server
   $env:PORT=10000
   node index.js
   ```

4. **You should see:**
   ```
   Email server is running on port 10000
   SMTP connection verified successfully
   ```

### If Server Fails to Start:

**Error:** `Missing required environment variables`

**Solution:** You need to create a `.env` file in the project root with SMTP credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

**For Gmail:**
- Enable 2-factor authentication
- Create an "App Password" at: https://myaccount.google.com/apppasswords
- Use the app password (not your regular password) for `SMTP_PASS`

## Step 2: Check Browser Console

When you click "Send Contract", check the browser console for:

1. **"Sending contract to: [email]"** - Confirms the email address
2. **"Backend server not accessible"** - Server isn't running
3. **"Email API response"** - Check if success: true
4. **Any error messages** - Will tell you what's wrong

## Step 3: Check Backend Server Logs

When you send a contract, you should see in the backend terminal:

```
Received email request: { to: '...', subject: '...', filesCount: 1 }
Attempting to send email with options: { from: '...', to: '...', subject: '...' }
Email sent successfully: { messageId: '...', ... }
```

### Common Backend Errors:

**1. "Missing required email fields"**
- **Fix:** Frontend isn't sending data correctly

**2. SMTP Authentication Error**
- **Fix:** Check SMTP credentials in `.env` file

**3. Connection timeout**
- **Fix:** Check SMTP_HOST and SMTP_PORT are correct

## Step 4: Verify Email Address

- Make sure the recipient email is correct
- Check for typos
- Some email providers block emails from unknown senders (check spam folder)

## Step 5: Test Email Sending

### Quick Test:

1. **Open browser console (F12)**
2. **Send a contract**
3. **Look for:**
   - ✅ "Sending contract to: [email]" 
   - ✅ "Email API response: { success: true, messageId: '...' }"
   - ❌ Any errors

### Check Server Terminal:

1. **Look for:**
   - ✅ "Received email request"
   - ✅ "Email sent successfully"
   - ❌ Any error messages

## Quick Checklist

- [ ] Backend server is running on port 10000
- [ ] `.env` file exists with SMTP credentials
- [ ] SMTP credentials are correct (test with Gmail or your provider)
- [ ] Browser console shows "Email API response: { success: true }"
- [ ] Backend terminal shows "Email sent successfully"
- [ ] Check recipient's spam/junk folder

## Common Issues

### Issue: "Cannot connect to backend server"
**Solution:** Start the backend server (see Step 1)

### Issue: "SMTP connection verification failed"
**Solution:** Check SMTP credentials in `.env` file

### Issue: Email says sent but not delivered
**Solutions:**
1. Check spam/junk folder
2. Verify recipient email address is correct
3. Check backend logs for SMTP errors
4. Some email providers delay delivery

### Issue: "Missing required environment variables"
**Solution:** Create `.env` file in project root with SMTP settings

## Still Not Working?

1. **Check backend server terminal** - It will show exact errors
2. **Check browser console** - It will show API errors
3. **Try sending without attachment** - Remove file upload to test basic email
4. **Test with a different email address** - Rule out recipient issues


