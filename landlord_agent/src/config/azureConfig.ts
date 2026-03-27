import { Configuration, PopupRequest, LogLevel } from '@azure/msal-browser';

// Development mode dummy client ID
const DEV_CLIENT_ID = '00000000-0000-0000-0000-000000000000';
const DEV_TENANT_ID = 'common';

// Azure AD Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || DEV_CLIENT_ID,
    authority: import.meta.env.VITE_AZURE_AUTHORITY || `https://login.microsoftonline.com/${DEV_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: [
    'User.Read',
    'email',
    'profile',
    'openid',
  ],
  prompt: 'select_account',
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphPhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
};

// Register your application in Azure AD and update these values
export const environmentConfig = {
  production: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID_PROD || '',
    authority: import.meta.env.VITE_AZURE_AUTHORITY_PROD || '',
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI_PROD || '',
  },
  development: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID_DEV || DEV_CLIENT_ID,
    authority: import.meta.env.VITE_AZURE_AUTHORITY_DEV || `https://login.microsoftonline.com/${DEV_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI_DEV || window.location.origin,
  },
};
