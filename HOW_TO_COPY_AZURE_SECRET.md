# 🎯 How to Copy the Correct Azure Client Secret

## The Problem
You're getting error **AADSTS7000215** because you're copying the **Secret ID** instead of the **Secret Value**.

## Visual Guide

When you go to **Azure Portal** → **App registrations** → **Certificates & secrets**, you see a table like this:

```
┌─────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┬─────────────┐
│ Description         │ Secret ID                            │ Value                                │ Expires     │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┼─────────────┤
│ Backend API Secret  │ abc-123-def-456-ghi-789              │ TMZ8Q~LkYo9kdqH0fsMxkd2gRrRH4Xmx... │ Feb 14, 2028│
│                     │   ❌ WRONG - Don't copy this!        │   ✅ CORRECT - Copy this!            │             │
└─────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┴─────────────┘
```

### Secret ID vs Secret Value

| Secret ID (WRONG ❌) | Secret Value (CORRECT ✅) |
|---------------------|--------------------------|
| Looks like a GUID: `abc-123-def-456` | Starts with letters, has `~`: `TMZ8Q~Lk...` |
| Stays visible forever | Only visible once when created |
| Azure rejects this | Azure accepts this |

---

## Step-by-Step: Create a NEW Secret

### Why Create a New One?
Once you've seen a secret's value, Azure **hides it forever** and shows dots (`••••••••`). If you didn't copy it correctly the first time, you **MUST create a new one**.

### Steps:

1. **Open Azure Portal**
   - Go to: https://portal.azure.com
   - Sign in with your Azure account

2. **Navigate to Your App**
   - Search: "Azure AD B2C"
   - Click: **App registrations**
   - Find your app: Client ID `49f7bfc0-cab3-4c54-aa25-279cc788551f`
   - Click on it

3. **Go to Certificates & Secrets**
   - Left sidebar: Click **"Certificates & secrets"**

4. **Create New Client Secret**
   - Click: **"+ New client secret"**
   - Description: `Backend API - Feb 14 2026 - FINAL`
   - Expires: **24 months** (recommended)
   - Click: **"Add"**

5. **IMMEDIATELY Copy the Value** ⚠️
   - A new row appears in the table
   - Look at the **"Value"** column (3rd column from left)
   - You'll see something like: `XyZ8Q~abcdefghijklmnopqrstuvwxyz1234567890`
   - Click the **📋 copy icon** next to the value
   - **DO NOT REFRESH THE PAGE** until you've copied and pasted it!

6. **Verify What You Copied**
   - Paste it into Notepad first
   - Check:
     - ✅ Starts with letters/numbers
     - ✅ Contains a tilde `~` character
     - ✅ Is about 40-45 characters long
     - ✅ Looks like: `XyZ8Q~abcdefghijklmnopqrstuvwxyz1234567890`
     - ❌ Does NOT look like: `abc-123-def-456-ghi-789`
     - ❌ Does NOT have dashes `-` everywhere

7. **Update Your .env File**
   - Open: `proptii-backend/.env`
   - Find line 6: `AZURE_AD_B2C_CLIENT_SECRET=...`
   - Replace with your new value (no spaces before/after):
     ```
     AZURE_AD_B2C_CLIENT_SECRET=XyZ8Q~abcdefghijklmnopqrstuvwxyz1234567890
     ```
   - **Save the file**

8. **Restart Backend Server**
   ```bash
   cd proptii-backend
   # Press Ctrl+C to stop
   npm run start:dev
   ```

9. **Test**
   - Refresh the "Select existing user" page
   - Users should now load!

---

## Common Mistakes

### ❌ Mistake 1: Copying Secret ID
```
Secret ID: abc-123-def-456-ghi-789
            ^^^^^^^^^^^^^^^^^^^^^
            This is WRONG!
```

### ❌ Mistake 2: Copying Truncated Value
If you see `TMZ8Q~Lk...` with dots, Azure has already hidden it. You need to create a NEW secret.

### ❌ Mistake 3: Extra Spaces
```
# WRONG - has space at the end
AZURE_AD_B2C_CLIENT_SECRET=XyZ8Q~abcd... 

# CORRECT - no spaces
AZURE_AD_B2C_CLIENT_SECRET=XyZ8Q~abcd...
```

### ❌ Mistake 4: Missing the Tilde ~
If your secret doesn't have a `~` character, it's probably the Secret ID, not the Value.

---

## Still Not Working?

### Check the Backend is Using the New Value
1. Stop the backend completely (Ctrl+C)
2. Double-check the `.env` file was saved
3. Start the backend again
4. Look for the log: `🔑 Attempting to acquire access token...`

### Verify in Azure Portal
- Go back to Azure Portal → Certificates & secrets
- Check that your new secret is listed
- Expiration date should be in 2028 (24 months from now)

### Alternative: Use Azure CLI
If the portal is confusing, you can create a secret via command line:

```bash
az ad app credential reset --id 49f7bfc0-cab3-4c54-aa25-279cc788551f --append
```

This will output the secret value directly in the terminal.

---

## Success Indicators

When it works, you'll see in the backend terminal:
```
[Nest] 12345  - 02/14/2026, 8:15:00 PM     LOG [AzureUsersService] 🔑 Attempting to acquire access token...
[Nest] 12345  - 02/14/2026, 8:15:01 PM     LOG [AzureUsersService] ✅ Successfully acquired access token
[Nest] 12345  - 02/14/2026, 8:15:02 PM     LOG [AzureUsersService] 📋 Found X users in Azure AD B2C
```

And in the browser:
- Users appear in the list
- No error messages
- You can search and select users

---

## Need More Help?

If you're still stuck after creating a NEW secret and following ALL steps:

1. **Send a screenshot** of the Azure Portal "Certificates & secrets" page (hide the Secret Value column)
2. **Send the backend terminal output** (the error message)
3. **Confirm** you created a NEW secret (not trying to use an old one)
4. **Confirm** you copied from the "Value" column (not "Secret ID")
5. **Confirm** you restarted the backend after updating `.env`
