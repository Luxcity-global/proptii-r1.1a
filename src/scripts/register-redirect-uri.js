/**
 * This script helps you register the correct redirect URI in Azure AD B2C.
 * Run this script with: node register-redirect-uri.js
 */

// Get the current origin
const currentOrigin = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.VITE_REDIRECT_URI || 'http://localhost:5175';

console.log(`
=====================================================================
AZURE AD B2C REDIRECT URI REGISTRATION INSTRUCTIONS
=====================================================================

You need to register the following redirect URI in your Azure AD B2C tenant:

${currentOrigin}

Follow these steps:

1. Log in to the Azure Portal (https://portal.azure.com)
2. Navigate to your Azure AD B2C tenant
3. Go to "App registrations" in the left menu
4. Find and select your application (with client ID '49f7bfc0-cab3-4c54-aa25-279cc788551f')
5. Go to "Authentication" in the left menu
6. Under "Platform configurations", click "Add a platform" if needed
7. Select "Web" platform
8. In the "Redirect URIs" section, add: ${currentOrigin}
9. Make sure "Access tokens" and "ID tokens" are checked under "Implicit grant and hybrid flows"
10. Click "Configure" or "Save" to save your changes

After completing these steps, restart your application.

=====================================================================
`);

// If running in Node.js, exit the process
if (typeof window === 'undefined') {
  console.log('Script executed successfully.');
} 