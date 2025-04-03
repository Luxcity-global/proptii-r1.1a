# Registering Redirect URI in Azure AD B2C

## Error Details

You're seeing this error because the redirect URI `http://localhost:5175` is not registered in your Azure AD B2C application:

```
Error handling redirect: ServerError: redirect_uri_mismatch: AADB2C90006: The redirect URI 'http://localhost:5175' provided in the request is not registered for the client id '49f7bfc0-cab3-4c54-aa25-279cc788551f'.
```

## Solution: Register the Redirect URI

### Option 1: Register the URI in Azure Portal

1. Go to the [Azure Portal](https://portal.azure.com)
2. Sign in with your Azure account
3. Search for "Azure AD B2C" in the search bar at the top
4. Select your B2C tenant (proptii)
5. In the left menu, click on "App registrations"
6. Find the application with ID `49f7bfc0-cab3-4c54-aa25-279cc788551f`
7. Click on the application name to open its details
8. In the left menu, click on "Authentication"
9. Under "Platform configurations", look for the Web platform
10. If it doesn't exist, click "Add a platform" and select "Web"
11. In the "Redirect URIs" section, add:
    ```
    http://localhost:5175
    ```
12. Make sure "Access tokens" and "ID tokens" are checked under "Implicit grant and hybrid flows"
13. Click "Save" at the top of the page

### Option 2: Use Azure CLI

If you have Azure CLI installed, you can register the redirect URI using the following command:

```bash
az ad app update --id 49f7bfc0-cab3-4c54-aa25-279cc788551f --web-redirect-uris http://localhost:5175
```

### Option 3: Use a Different Port

If you can't access the Azure portal or use Azure CLI, you can run your application on a port that's already registered:

1. Find out what redirect URIs are already registered (ask your team or check in the Azure portal)
2. Update your `.env.local` file to use one of those URIs
3. Run your application on the matching port

For example, if `http://localhost:3000` is already registered:

```
VITE_REDIRECT_URI=http://localhost:3000
```

Then run your application on port 3000:

```bash
npm start -- --port 3000
```

## Temporary Development Solution

If you're just developing locally and don't need real authentication, you can:

1. Set `DEV_MODE = true` in `src/contexts/AuthContext.tsx`
2. This will bypass the real authentication and use a mock user
3. Remember to set it back to `false` before deploying to production

## Verifying the Solution

After registering the redirect URI:

1. Restart your application
2. Try logging in again
3. The redirect URI mismatch error should be resolved

If you're still seeing issues, double-check that:
- The URI is exactly as shown (including http:// and no trailing slash)
- You've saved the changes in the Azure portal
- You've restarted your application 