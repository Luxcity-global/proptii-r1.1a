# Email Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Backend Server Not Running

**Symptoms:**
- "Cannot connect to backend server" error
- ECONNREFUSED error in console
- Network request fails

**Solution:**
1. Check if backend server is running:
   ```bash
   cd server
   npm start
   ```
2. Verify server is listening on port 10000:
   - Check console output: "Server running on http://localhost:10000"
   - Visit: http://localhost:10000/
   - Should see: `{"message":"Email server is running"}`

### Issue 2: CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" error in browser console
- Request blocked by CORS policy

**Solution:**
- Already fixed: Updated CORS config to include `localhost:5176`
- Restart backend server after changes

### Issue 3: SMTP Not Configured

**Symptoms:**
- "Missing required environment variables" error
- Server exits on startup
- Email fails silently

**Solution:**
1. Create `.env` file in `server/` directory:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_EMAIL=noreply@proptii.com
   PORT=10000
   ```

2. For Gmail:
   - Enable 2-factor authentication
   - Generate app password: https://myaccount.google.com/apppasswords
   - Use app password in `SMTP_PASS`

3. Restart server after adding environment variables

### Issue 4: Firebase Storage File Access

**Symptoms:**
- "Failed to fetch contract file" error
- File download fails

**Solution:**
1. Check Firebase Storage rules allow read access:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /contracts/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

2. Verify file URL is accessible:
   - Check browser console for file URL
   - Try opening URL directly in browser

### Issue 5: File Size Too Large

**Symptoms:**
- Upload fails
- Timeout errors

**Solution:**
- Current limit: 10MB per file
- Check file size before uploading
- Compress PDF if needed

## Debugging Steps

### Step 1: Check Backend Server

```bash
# Navigate to server directory
cd server

# Check if .env exists
ls -la .env

# Start server
npm start

# Should see:
# - "SMTP connection verified successfully"
# - "Server running on http://localhost:10000"
```

### Step 2: Check Browser Console

Open browser DevTools (F12) → Console tab:
- Look for error messages
- Check Network tab for failed requests
- Verify API calls are being made

### Step 3: Test Email Endpoint Directly

```bash
# Test backend health
curl http://localhost:10000/

# Test email endpoint (if configured)
curl -X POST http://localhost:10000/api/email/send \
  -F "to=test@example.com" \
  -F "subject=Test" \
  -F "html=<p>Test</p>"
```

### Step 4: Check Server Logs

Look for:
- "Received email request" - request received
- "Files received" - file uploaded
- "Attempting to send email" - email sending started
- "Email sent successfully" - email sent
- Error messages with details

## Testing Checklist

- [ ] Backend server running on port 10000
- [ ] `.env` file exists in `server/` directory
- [ ] SMTP credentials configured correctly
- [ ] CORS allows requests from landlord app
- [ ] Firebase Storage file accessible
- [ ] Contract file size < 10MB
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API request

## Quick Fixes

### Fix 1: Restart Backend Server
```bash
cd server
npm start
```

### Fix 2: Clear Browser Cache
- Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Or DevTools → Network tab → "Disable cache"

### Fix 3: Rebuild Landlord App
```bash
cd src/landlord_agent
npm run build
cd ../..
copy src\landlord_agent\build\assets\index-*.js public\assets\
copy src\landlord_agent\build\assets\index-*.css public\assets\
# Update public/landlord/index.html with new file names
```

## Still Not Working?

1. **Check Server Logs**: Look for detailed error messages
2. **Check Browser Console**: Look for JavaScript errors
3. **Check Network Tab**: Verify API requests are being made
4. **Test Backend Directly**: Use curl or Postman to test API
5. **Verify SMTP**: Test email sending outside the app

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot connect to backend server` | Server not running | Start server: `cd server && npm start` |
| `ECONNREFUSED` | Wrong port/URL | Check server is on port 10000 |
| `Missing required email fields` | Form data not sent | Check FormData is created correctly |
| `SMTP connection verification failed` | SMTP not configured | Add SMTP credentials to `.env` |
| `Failed to fetch contract file` | Firebase Storage issue | Check Storage rules and file URL |
| `CORS error` | Origin not allowed | Restart server after CORS fix |

---

*Last Updated: [Current Date]*

