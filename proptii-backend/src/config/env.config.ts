// Remove the Firebase configuration section.

export const envConfig = {
  // MSAL Configuration
  msal: {
    clientId: process.env.MSAL_CLIENT_ID || process.env.AZURE_AD_B2C_CLIENT_ID || 'your-msal-client-id',
    authority: process.env.MSAL_AUTHORITY || process.env.AZURE_AD_B2C_AUTHORITY || 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3002,
    environment: process.env.NODE_ENV || 'development',
  },
}; 