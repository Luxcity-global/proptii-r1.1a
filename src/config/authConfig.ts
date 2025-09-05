import { Configuration, BrowserCacheLocation, LogLevel } from "@azure/msal-browser";

// Get environment variables with fallbacks
const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID || "532e1fa0-18a6-4356-bd78-1f62bd6d5e2f";
const tenantName = import.meta.env.VITE_AZURE_AD_TENANT_NAME || "proptii.onmicrosoft.com";
const policyName = import.meta.env.VITE_AZURE_AD_POLICY_NAME || "B2C_1_SignUpandSignInProptii";
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin;
const postLogoutRedirectUri = import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI || window.location.origin;

// Azure AD B2C configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId,
    authority: `https://proptii.b2clogin.com/${tenantName}/${policyName}`,
    knownAuthorities: ["proptii.b2clogin.com"],
    redirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
    postLogoutRedirectUri: postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: "localStorage" as BrowserCacheLocation,
    storeAuthStateInCookie: true,
  },
  system: {
    allowRedirectInIframe: true,
    windowHashTimeout: 60000, // Increase timeout for popup operations to 60 seconds
    iframeHashTimeout: 10000,
    loadFrameTimeout: 10000,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          default:
            console.log(message);
            return;
        }
      },
      logLevel: LogLevel.Verbose
    }
  }
};

// Add scopes for token request
export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access"
  ]
  // Removed popup window attributes to avoid triggering popup blockers
};

// Authentication endpoints
export const b2cPolicies = {
  signUpSignIn: import.meta.env.VITE_AZURE_AD_POLICY_NAME || "B2C_1_SignUpandSignInProptii",
  forgotPassword: import.meta.env.VITE_AZURE_AD_RESET_PASSWORD_POLICY_NAME || "B2C_1_passwordreset",
  editProfile: import.meta.env.VITE_AZURE_AD_EDIT_PROFILE_POLICY_NAME || "B2C_1_profileediting",
};

// Token Validation Parameters
export const tokenValidationParameters = {
  validationParameters: {
    issuer: `https://proptii.b2clogin.com/${tenantName}/v2.0/`,
    validAudience: clientId,
  }
}; 