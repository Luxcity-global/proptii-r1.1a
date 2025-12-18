# Agent Email Authentication & Redirect Fix

## Problem Summary

When agents receive email notifications and click links to access the platform (e.g., to `/landlord/viewings`), they were experiencing two issues:

1. **Intermediate "Sign in with Microsoft" page**: Users had to see an intermediate login page before being redirected to Azure B2C
2. **Lost redirect after signup**: After signing up in Azure B2C, users were redirected to the homepage instead of the intended destination (e.g., `/landlord/viewings`)

## Root Cause

### Issue 1: Intermediate Login Page
The authentication flow was:
- Email link → ProtectedRoute → `/login` page → Show "Sign in with Microsoft" button → User clicks → Azure B2C popup

This created an unnecessary step where users had to manually click a button.

### Issue 2: Lost Redirect After Signup
- The redirect path was stored in `sessionStorage` but not passed through the Azure B2C authentication flow
- When new users signed up in Azure B2C, the MSAL library didn't preserve the intended destination
- Azure B2C redirected back to the configured `redirectUri` (just the origin, e.g., `https://proptii.co`) without the specific path

## Solutions Implemented

### Solution 1: Auto-Trigger Azure B2C Login

**File**: `src/pages/Login.tsx`

Added automatic login trigger when the login page is loaded with a redirect parameter, with safeguards to prevent loops for already-authenticated users:

```typescript
// Auto-trigger login when landing on this page with a redirect parameter
// Only runs ONCE when component mounts
useEffect(() => {
  // Don't do anything while auth is loading
  if (isLoading) {
    console.log('⏳ Auth is loading, waiting...');
    return;
  }

  // If already authenticated, don't trigger auto-login
  if (isAuthenticated) {
    console.log('✅ Already authenticated, skipping auto-login');
    return;
  }

  // Only auto-login if we haven't triggered it yet in this session
  const shouldAutoLogin = new URLSearchParams(window.location.search).get('redirect');
  const hasAutoLoginRun = sessionStorage.getItem('autoLoginAttempted');
  
  if (shouldAutoLogin && !autoLoginTriggered && !hasAutoLoginRun) {
    console.log('🔐 Auto-triggering login for redirect:', shouldAutoLogin);
    setAutoLoginTriggered(true);
    sessionStorage.setItem('autoLoginAttempted', 'true');
    
    setTimeout(() => {
      handleLogin();
    }, 500);
  }
}, [isLoading, isAuthenticated, autoLoginTriggered]);
```

**Key Features**:
- ✅ Waits for auth state to load before checking
- ✅ Skips auto-login if user is already authenticated
- ✅ Uses component state to ensure it only runs once
- ✅ Prevents infinite loops for signed-in users

**Result**: Users now go directly from email link → Azure B2C authentication (skipping the intermediate "Sign in with Microsoft" button), and already-signed-in users are redirected immediately without triggering login

### Solution 2: Preserve Redirect Through MSAL State Parameter

**File**: `src/contexts/AuthContext.tsx`

#### Part A: Pass redirect path in MSAL state
```typescript
const login = async (): Promise<void> => {
  // Get the intended redirect path from sessionStorage
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  
  // Create login request with state to preserve redirect
  const loginRequestWithState = {
    ...loginRequest,
    // Store redirect path in state to survive the auth flow
    state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined
  };
  
  const result = await instance.loginPopup(loginRequestWithState);
  // ...
};
```

#### Part B: Restore redirect path from MSAL state after authentication
```typescript
const initializeAuth = async () => {
  // Handle redirect response if any
  const redirectResponse = await instance.handleRedirectPromise();
  
  // Check if there's a redirect path in the response state
  if (redirectResponse && redirectResponse.state) {
    try {
      const state = JSON.parse(redirectResponse.state);
      if (state.redirect) {
        console.log('🔐 Restored redirect path from state:', state.redirect);
        sessionStorage.setItem('redirectAfterLogin', state.redirect);
      }
    } catch (e) {
      console.log('State is not JSON:', redirectResponse.state);
    }
  }
  // ...
};
```

**Result**: The redirect path is now preserved through the entire Azure B2C flow, even for new signups

### Solution 3: Enhanced Redirect Flow Fallback

**File**: `src/contexts/AuthContext.tsx`

Improved the fallback to use redirect flow (more reliable for Azure B2C signup):

```typescript
} catch (error: any) {
  // Get the intended redirect path from sessionStorage
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  
  // Create login request with state to preserve redirect
  const loginRequestWithState = {
    ...loginRequest,
    state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined
  };
  
  // Try redirect login as fallback - more reliable for Azure B2C signup
  await instance.loginRedirect(loginRequestWithState);
}
```

## Azure B2C Configuration

### Important: Redirect URI Configuration in Azure Portal

In the Azure Portal, under your App Registration → Authentication → Redirect URIs, you should configure:

**✅ Correct Configuration:**
- `https://proptii.co` (base URL/origin only)
- `http://localhost:5173` (for development)

**❌ Incorrect Configuration:**
- ~~`https://proptii.co/landlord/viewings`~~ (specific paths)
- ~~`https://proptii.co/Agent`~~ (specific paths)

### Why Base URL Only?

MSAL (Microsoft Authentication Library) handles internal routing within your application. Azure B2C should redirect to your base URL, and then:
1. MSAL processes the authentication response
2. Restores the state parameter containing the intended path
3. Your app's routing logic redirects to the final destination

## Authentication Flow (After Fix)

### For New Users (Signup)
```
1. Agent clicks email link → https://proptii.co/landlord/viewings
2. ProtectedRoute detects: not authenticated
3. Stores path in sessionStorage: "/landlord/viewings"
4. Redirects to: /login?redirect=/landlord/viewings
5. Login page auto-triggers Azure B2C popup with state: {"redirect":"/landlord/viewings"}
6. User completes signup in Azure B2C
7. Azure B2C redirects to: https://proptii.co (with auth response + state in URL hash)
8. MSAL processes response and extracts state
9. App restores redirect path from state to sessionStorage
10. Login page detects authentication success
11. Redirects to: /landlord/viewings ✅
```

### For Existing Users (Login)
```
1. Agent clicks email link → https://proptii.co/landlord/viewings
2. ProtectedRoute detects: not authenticated
3. Stores path in sessionStorage: "/landlord/viewings"
4. Redirects to: /login?redirect=/landlord/viewings
5. Login page auto-triggers Azure B2C popup with state: {"redirect":"/landlord/viewings"}
6. User signs in with existing credentials
7. Popup closes with auth response
8. Login page detects authentication success
9. Redirects to: /landlord/viewings ✅
```

## Testing Checklist

- [ ] **New User Signup via Email Link**
  1. Send viewing request email to new agent
  2. Click "Manage Viewing Requests on Proptii" button
  3. Should go directly to Azure B2C (no intermediate page)
  4. Complete signup
  5. Should land on `/landlord/viewings` (not homepage) ✅

- [ ] **Existing User Login via Email Link**
  1. Send viewing request email to existing agent
  2. Click "Manage Viewing Requests on Proptii" button
  3. Should go directly to Azure B2C (no intermediate page)
  4. Sign in
  5. Should land on `/landlord/viewings` (not homepage) ✅

- [ ] **Referencing Email Link**
  1. Send referencing email to agent
  2. Click "Review Documents in Proptii" button
  3. Should authenticate and land on `/Agent` ✅

## Benefits

1. **Seamless UX**: No intermediate "Sign in with Microsoft" button to click
2. **Preserved Context**: Users land exactly where the email intended them to go
3. **Works for Signup**: New users signing up are also redirected correctly
4. **Reliable**: Uses MSAL's built-in state parameter mechanism
5. **Fallback Support**: Redirect flow as fallback if popup is blocked

## Technical Notes

### MSAL State Parameter
- MSAL supports passing a `state` parameter through the authentication flow
- This state is preserved even when Azure B2C redirects (including during signup)
- We use JSON.stringify to pass complex data in the state parameter

### Popup vs Redirect Flow
- **Popup**: Better UX, stays on the same page, used as primary method
- **Redirect**: More reliable for complex scenarios (like signup), used as fallback
- Both flows now preserve the redirect path via the state parameter

### Session Storage
- Used as backup storage for redirect path
- MSAL state parameter is the primary mechanism
- Session storage is restored from state after Azure B2C redirect

## Files Modified

1. `src/pages/Login.tsx` - Auto-trigger login
2. `src/contexts/AuthContext.tsx` - Preserve redirect in MSAL state
3. `docs/AGENT_EMAIL_AUTH_FIX.md` - This documentation

## Verification

To verify the fix is working:
1. Check browser console for log messages:
   - `🔐 Auto-triggering login for redirect: /landlord/viewings`
   - `🔐 Login starting with redirect path: /landlord/viewings`
   - `🔐 Restored redirect path from state: /landlord/viewings`
2. After authentication, confirm you land on the intended page (not homepage)
3. Test with both new signup and existing login scenarios

## Azure Portal Configuration Checklist

If the redirect is still not working:

1. **Check Redirect URIs**:
   - Azure Portal → Azure AD B2C → App registrations → Your app
   - Go to "Authentication"
   - Verify redirect URIs include your base URL only (not specific paths)
   - Should be: `https://proptii.co` and/or `http://localhost:5173`

2. **Check Implicit Grant Settings**:
   - Same Authentication page
   - Ensure "Access tokens" and "ID tokens" are checked

3. **Check Application Type**:
   - Platform should be "Single-page application"

4. **Check User Flow Configuration** (if using custom flows):
   - Azure Portal → Azure AD B2C → User flows
   - Select your sign-up/sign-in flow
   - Under "Application claims", ensure required claims are selected

## Additional Resources

- [MSAL Browser State Parameter](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request)
- [Azure AD B2C Redirect URI Configuration](https://docs.microsoft.com/en-us/azure/active-directory-b2c/tutorial-register-applications)

