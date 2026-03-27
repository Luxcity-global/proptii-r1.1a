# 🔍 Azure App Registration Verification

## Critical Issue
Azure keeps rejecting the secret with error **AADSTS7000215**, which means:
- Either you're copying the Secret ID instead of the Secret Value, OR
- The secret belongs to a different app registration

## ⚠️ VERIFY YOU'RE IN THE CORRECT APP

### Step 1: Open Azure Portal
1. Go to: https://portal.azure.com
2. Search for: **"Azure AD B2C"**
3. Click on **Azure AD B2C**

### Step 2: Find the EXACT App Registration
1. Click **"App registrations"** in the left sidebar
2. **CRITICAL**: You MUST find the app with **EXACTLY** this Client ID:
   ```
   49f7bfc0-cab3-4c54-aa25-279cc788551f
   ```

3. Search for this exact GUID in the list
4. Click on that specific app (note the app name for verification)

### Step 3: Verify You're in the Right App
Once you open the app, the **Overview** page should show:
- **Application (client) ID**: `49f7bfc0-cab3-4c54-aa25-279cc788551f` ✅
- If it shows a different ID, you're in the WRONG app! ❌

### Step 4: Create a New Secret (In the CORRECT App)
Only after verifying the Client ID matches:

1. Click **"Certificates & secrets"** in the left sidebar
2. Click **"+ New client secret"**
3. Description: `Backend API - Final Attempt - Feb 14 2026`
4. Expires: **24 months**
5. Click **"Add"**

### Step 5: Copy the Secret Value (ONE CHANCE ONLY!)
⚠️ **CRITICAL**: You get ONE chance to see and copy this!

In the table that appears, you'll see these columns:

```
Description | Secret ID | Value | Expires
```

**Copy from the "Value" column (3rd column)**

The Value column will show something like:
```
XyZ8Q~abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 6: Test in Notepad First
Before pasting into `.env`, paste into Notepad and verify:
- ✅ Starts with letters/numbers
- ✅ Contains a `~` (tilde) character
- ✅ Is about 40-45 characters long
- ✅ Does NOT look like: `abc-123-def-456` (that's Secret ID!)

### Step 7: Update .env and Test
1. Open `proptii-backend/.env`
2. Find line 6:
   ```env
   AZURE_AD_B2C_CLIENT_SECRET=YOUR_SECRET_HERE
   ```
3. Replace with the NEW secret (no spaces!)
4. Save
5. Restart backend:
   ```bash
   cd proptii-backend
   npm run start:dev
   ```
6. Refresh the "Select existing user" page

---

## Alternative: Check If You Have Multiple B2C Tenants

### Problem
You might have multiple Azure AD B2C tenants, and you're creating the secret in the wrong tenant.

### Solution
1. In Azure Portal, click your profile icon (top right)
2. Click **"Switch directory"**
3. Look for **"proptii.onmicrosoft.com"**
4. Make sure you're in the CORRECT directory before creating the secret

---

## Still Not Working? Let's Debug

### Option 1: Use Azure CLI
Open PowerShell and run:

```powershell
# Login to Azure
az login

# List all app registrations to find yours
az ad app list --query "[?appId=='49f7bfc0-cab3-4c54-aa25-279cc788551f']" --output table

# Create a new credential
az ad app credential reset --id 49f7bfc0-cab3-4c54-aa25-279cc788551f --append
```

The last command will output the new secret directly. Copy it from there.

### Option 2: Screenshot Verification
Take a screenshot of:
1. The Azure Portal Overview page showing the Client ID
2. The Certificates & secrets page (hide the Secret Value column for security)

This will help us verify you're in the correct app.

---

## Common Mistake Pattern

❌ **WRONG Flow:**
1. User searches for "app registration"
2. Clicks on first app that appears
3. Creates secret in THAT app
4. But the backend needs secret from app `49f7bfc0-cab3-4c54-aa25-279cc788551f`

✅ **CORRECT Flow:**
1. Find app with EXACT Client ID: `49f7bfc0-cab3-4c54-aa25-279cc788551f`
2. Verify Client ID on Overview page
3. THEN create secret
4. Copy from "Value" column

---

## What Happens if You Use the Wrong App's Secret?
You get **EXACTLY** the error you're seeing:
```
AADSTS7000215: Invalid client secret provided
```

Because Azure is saying: "This secret doesn't belong to app 49f7bfc0-cab3-4c54-aa25-279cc788551f"

---

## Next Steps

1. **VERIFY** you're in the correct app registration (check Client ID)
2. **CREATE** a brand new secret in THAT specific app
3. **COPY** from the "Value" column (not "Secret ID")
4. **TEST** in Notepad first (check for ~ character)
5. **UPDATE** `.env` file
6. **RESTART** backend server
7. **REFRESH** browser page

If it still doesn't work after this, there may be a permissions issue with the app registration itself.
