# 🔑 Azure Client Secret Expired - Fix Guide

## Problem
The Azure AD B2C client secret has expired, preventing user fetching from Azure AD B2C.

**Error Message:**
```
AADSTS7000222: The provided client secret keys for app '49f7bfc0-cab3-4c54-aa25-279cc788551f' are expired.
```

## Solution: Generate a New Client Secret

### Step 1: Access Azure Portal
1. Go to https://portal.azure.com
2. Sign in with your Azure account

### Step 2: Navigate to Azure AD B2C
1. In the search bar at the top, type **"Azure AD B2C"**
2. Click on **Azure AD B2C** from the results
3. Select your tenant: **proptii.onmicrosoft.com**

### Step 3: Find Your App Registration
1. In the left sidebar, click **"App registrations"**
2. Find and click on the app with Client ID: **49f7bfc0-cab3-4c54-aa25-279cc788551f**
   - Or search for it by name

### Step 4: Create a New Client Secret
1. In the left sidebar of the app, click **"Certificates & secrets"**
2. Under **"Client secrets"**, click **"+ New client secret"**
3. Add a description (e.g., "Backend API Secret - Feb 2026")
4. Select an expiration period (recommended: **24 months** or **Custom** with a future date)
5. Click **"Add"**

### Step 5: Copy the New Secret
⚠️ **CRITICAL:** The secret value is only shown ONCE. Copy it immediately!

1. In the "Value" column, you'll see the new secret
2. Click the **copy icon** next to it
3. Save it somewhere safe temporarily

The secret will look something like: `abc8Q~xyzABC123...`

### Step 6: Update Your Backend .env File
1. Open `proptii-backend/.env`
2. Find the line: `AZURE_AD_B2C_CLIENT_SECRET=<your_old_secret>`
3. Replace the old secret with your new secret:
   ```env
   AZURE_AD_B2C_CLIENT_SECRET=YOUR_NEW_SECRET_HERE
   ```
4. Save the file

### Step 7: Restart the Backend Server
```bash
cd proptii-backend
# Press Ctrl+C to stop the server
npm run start:dev
```

### Step 8: Test
1. Refresh the "Select existing user" page in your browser
2. Users should now load from Azure AD B2C

---

## Alternative: Quick Link
Azure provides a direct link for creating new client secrets:
**https://aka.ms/NewClientSecret**

---

## Important Notes

### Security Best Practices
- ✅ Set expiration to 24 months or custom date
- ✅ Store secrets securely (never commit to git)
- ✅ Consider using Azure Key Vault for production
- ❌ Don't share secrets in screenshots or public forums

### If You Can't Access Azure Portal
Contact your Azure administrator or the person who created the Azure AD B2C tenant to generate a new secret for you.

### Multiple Environments
If you have multiple environments (dev, staging, production):
- Each environment can use the same client secret
- Or you can create separate secrets for each environment
- Update the `.env` file for each environment accordingly

---

## Verification
After updating the secret and restarting, you should see:
1. ✅ No errors in the backend terminal
2. ✅ Users appearing in the "Select existing user" page
3. ✅ Backend logs showing: "🔑 Attempting to acquire access token..." followed by success messages

## If Still Not Working
Check:
1. The secret was copied correctly (no extra spaces)
2. The `.env` file was saved
3. The backend server was restarted
4. The correct `.env` file was updated (in `proptii-backend/`)
5. No firewall blocking Azure AD B2C API calls
