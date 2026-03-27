# 🔓 Fix Azure API Permissions - 403 Authorization Error

## ✅ Good News: Authentication Working!
The client secret is now correct! The backend successfully acquired an access token from Azure AD.

## ❌ New Problem: Missing API Permissions
The app registration doesn't have permission to read users from Microsoft Graph API.

**Error:**
```
403 - Authorization_RequestDenied
Insufficient privileges to complete the operation
```

## Solution: Add Microsoft Graph API Permissions

### Step 1: Open Azure Portal
1. Go to: https://portal.azure.com
2. Navigate to: **Azure AD B2C** → **App registrations**
3. Find your app: Client ID `49f7bfc0-cab3-4c54-aa25-279cc788551f`
4. Click on it

### Step 2: Add API Permissions
1. In the left sidebar, click **"API permissions"**
2. Click **"+ Add a permission"**
3. Click **"Microsoft Graph"**
4. Click **"Application permissions"** (NOT Delegated permissions)

### Step 3: Add User.Read.All Permission
1. In the search box, type: `User`
2. Expand **"User"** section
3. Check the box for **"User.Read.All"**
   - This allows the app to read all users' full profiles
4. Click **"Add permissions"** at the bottom

### Step 4: Grant Admin Consent (CRITICAL!)
⚠️ **This step is REQUIRED or it won't work!**

1. After adding the permission, you'll see it listed but with status: **"Not granted"**
2. Click the button: **"Grant admin consent for [Your Directory]"**
3. Click **"Yes"** to confirm
4. Wait for the status to change to: **"Granted for [Your Directory]"** with a green checkmark ✅

### Step 5: Verify Permissions
You should now see in the API permissions list:

| API / Permissions name | Type        | Status                               |
|------------------------|-------------|--------------------------------------|
| User.Read.All          | Application | ✅ Granted for [Your Directory Name] |

### Step 6: Test
1. The backend is already running - no need to restart
2. Refresh the "Select existing user" page in your browser
3. Users should now appear!

---

## Alternative: If You Need More Permissions

Depending on your Azure AD B2C setup, you might also need:

### Additional Recommended Permissions:
1. **Directory.Read.All**
   - Allows reading directory data
   - Type: Application permission
   
2. **User.ReadBasic.All**
   - Read basic user profiles
   - Type: Application permission

### How to Add Multiple Permissions:
1. Click **"+ Add a permission"**
2. **Microsoft Graph** → **Application permissions**
3. Check all the permissions you need:
   - ✅ User.Read.All
   - ✅ Directory.Read.All
4. Click **"Add permissions"**
5. Click **"Grant admin consent for [Your Directory]"**

---

## Troubleshooting

### Error: "Need admin approval"
**Problem:** You don't have admin rights to grant consent.

**Solution:**
- Contact your Azure administrator
- They need to grant admin consent for these permissions
- Or they need to make you an admin of the app registration

### Error: Still getting 403 after granting consent
**Wait 5 minutes** - Sometimes Azure takes a few minutes to propagate permission changes.

Then:
1. Restart the backend server
2. Try again

### Error: Can't find "Grant admin consent" button
**Problem:** You might not have sufficient privileges.

**Solution:**
- You need to be a **Global Administrator**, **Application Administrator**, or **Cloud Application Administrator** in Azure AD
- Contact your Azure admin to grant consent

---

## What These Permissions Do

### User.Read.All (Application Permission)
- Allows the backend to read all users in the directory
- Required for listing users in the "Select existing user" feature
- Does NOT require user login (service-to-service)

### Why Application Permissions?
- **Application permissions** = The app runs without a signed-in user (backend API)
- **Delegated permissions** = The app acts on behalf of a signed-in user (not what we need)

---

## Security Note
The **User.Read.All** permission is powerful. It allows the backend to read all user data. This is necessary for the "Select existing user" feature, but ensure:
- ✅ The client secret is kept secure (never committed to git)
- ✅ Only authorized personnel can access the backend `.env` file
- ✅ The app registration is properly secured in Azure Portal

---

## Summary of Changes Needed

1. ✅ Fixed client secret (DONE - authentication working!)
2. ⏳ Add API permissions (User.Read.All)
3. ⏳ Grant admin consent
4. ⏳ Test the feature

After completing steps 2-3, the "Select existing user" feature should work perfectly!
