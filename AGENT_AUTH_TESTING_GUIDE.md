# Agent Authentication Testing Guide

## Quick Testing Steps

### Test 1: New Agent Signup via Email
1. Create a viewing request that will send email to a **new agent** (not registered yet)
2. Check the email inbox for the viewing notification
3. Click the "Manage Viewing Requests on Proptii" button
4. **Expected Behavior**:
   - ✅ Should go **directly to Azure B2C** signup page (no intermediate "Sign in with Microsoft" page)
   - ✅ After completing signup, should land on `/landlord/viewings` (NOT homepage)
   - ✅ Should see the viewings page with the request

### Test 2: Existing Agent Login via Email
1. Create a viewing request that will send email to an **existing agent**
2. Click the "Manage Viewing Requests on Proptii" button
3. **Expected Behavior**:
   - ✅ Should go **directly to Azure B2C** login page (no intermediate button)
   - ✅ After signing in, should land on `/landlord/viewings` (NOT homepage)
   - ✅ Should see the viewings page with the request

### Test 3: Referencing Email Link
1. Send a referencing notification to an agent
2. Click "Review Documents in Proptii"
3. **Expected Behavior**:
   - ✅ Should authenticate and land on `/Agent` page

## Browser Console Verification

Open browser DevTools (F12) → Console tab. You should see these logs:

### During Login Flow:
```
🔒 ProtectedRoute: User not authenticated, redirecting to login
🔒 Intended path: /landlord/viewings
🔒 Login path: /login?redirect=%2Flandlord%2Fviewings
🔐 Auto-triggering login for redirect: /landlord/viewings
🔐 Login starting with redirect path: /landlord/viewings
```

### After Azure B2C Redirect (for new signups):
```
🔐 Restored redirect path from state: /landlord/viewings
```

### After Authentication Success:
```
Login successful
✅ User data refreshed successfully
```

## Troubleshooting

### Problem: Still showing intermediate "Sign in with Microsoft" page
**Cause**: Auto-login not triggering

**Check**:
1. URL should have `?redirect=` parameter when landing on login page
2. Check console for `🔐 Auto-triggering login` message
3. Clear browser cache and try again

**Fix**: Hard refresh (Ctrl+Shift+R) or clear sessionStorage

### Problem: Redirect to homepage instead of intended page
**Cause**: State not being preserved through Azure B2C flow

**Check**:
1. Look for console message: `🔐 Restored redirect path from state`
2. Check if sessionStorage has `redirectAfterLogin` key after auth

**Possible Causes**:
- Azure Portal redirect URI configuration issue
- Browser blocking cookies/storage

**Fix Options**:
1. **Check Azure Portal Configuration**:
   - Go to Azure Portal → Azure AD B2C → App registrations
   - Select your app → Authentication
   - Verify Redirect URIs include:
     - Production: `https://proptii.co`
     - Development: `http://localhost:5173`
   - Should be base URL only, NOT specific paths like `/landlord/viewings`

2. **Check Browser Settings**:
   - Allow cookies and site data
   - Disable any ad blockers for this site
   - Try in incognito mode to rule out extensions

3. **Check MSAL Configuration**:
   - File: `src/config/authConfig.ts`
   - Verify `navigateToLoginRequestUrl: true` (line 17)
   - Verify `storeAuthStateInCookie: true` (line 22)

### Problem: Popup blocked or login fails
**Cause**: Browser popup blocker

**What happens**: 
- Login falls back to redirect flow automatically
- Should still preserve redirect path via state parameter

**Check**:
- Console should show: `Login popup failed, using redirect flow`
- Page will do a full redirect instead of popup

## Azure Portal Double-Check

If redirects are still not working, verify Azure configuration:

1. **Navigate to Azure Portal**:
   ```
   portal.azure.com → Azure AD B2C → App registrations
   → Proptii Web Client → Authentication
   ```

2. **Verify Platform Configuration**:
   - Type: "Single-page application"
   - Redirect URIs (should NOT include paths):
     ```
     https://proptii.co
     http://localhost:5173
     ```

3. **Verify Implicit Grant**:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit flows)

4. **Verify Supported Account Types**:
   - Should be: "Accounts in any organizational directory or any identity provider"

## Manual Testing Workflow

### Detailed Steps for Test 1 (New Agent Signup):

1. **Setup**: Create a property and viewing request in the app
2. **Send Email**: System sends viewing notification to agent
3. **Open Email**: Check temp-mail.org or real email
4. **Click Link**: Click "Manage Viewing Requests on Proptii"
5. **Observe Flow**:
   - Page loads → `/login?redirect=/landlord/viewings`
   - Should see brief "Redirecting to login..." message
   - Azure B2C signup page opens (popup or redirect)
   - No intermediate "Sign in with Microsoft" button
6. **Complete Signup**:
   - Fill in name, email, password
   - Click "Create account"
7. **Verify Landing Page**:
   - Should land on `/landlord/viewings` (check URL bar)
   - Should see ViewingsPage component
   - Should see the viewing request in the list

### Detailed Steps for Test 2 (Existing Agent Login):

1. **Setup**: Same as above but use existing agent email
2. **Open Email**: Click link in email
3. **Observe Flow**:
   - Page loads → `/login?redirect=/landlord/viewings`
   - Azure B2C login page opens directly
4. **Sign In**: Enter existing credentials
5. **Verify**: Land on `/landlord/viewings` with data

## Success Criteria

- ✅ No manual button click required (auto-triggers Azure B2C)
- ✅ New signups land on intended page (not homepage)
- ✅ Existing users land on intended page (not homepage)
- ✅ Console logs show redirect preservation
- ✅ Works in both popup and redirect flow modes

## Files to Monitor

If you need to debug further, check these files:

1. `src/pages/Login.tsx` - Auto-trigger logic
2. `src/contexts/AuthContext.tsx` - State preservation logic
3. `src/components/common/ProtectedRoute.tsx` - Redirect capture logic
4. `src/config/authConfig.ts` - MSAL configuration

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Sign in with Microsoft" button still showing | Clear sessionStorage, hard refresh |
| Landing on homepage after auth | Check Azure Portal redirect URIs |
| Popup blocked | Browser will auto-fallback to redirect flow |
| Login loop | Clear all site data, cookies, and try again |
| State not preserved | Verify Azure redirect URI is base URL only |

## Need Help?

If issues persist:
1. Capture full browser console logs
2. Take screenshots of Azure Portal configuration
3. Note the exact URL flow (each step)
4. Check Network tab for redirect responses

