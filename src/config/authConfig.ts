import { Configuration } from "@azure/msal-browser";

// Azure AD B2C configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: "49f7bfc0-cab3-4c54-aa25-279cc788551f",
    authority: "https://proptii.b2clogin.com/proptii.onmicrosoft.com/B2C_1_SignUpandSignInProptii",
    knownAuthorities: ["proptii.b2clogin.com"],
    redirectUri: "http://localhost:5173",
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
          default:
            console.log(message);
            return;
        }
      },
      logLevel: 3
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
};

// Authentication endpoints
export const b2cPolicies = {
  signUpSignIn: "B2C_1_SignUpandSignInProptii",
  forgotPassword: "B2C_1_passwordreset",
  editProfile: "B2C_1_profileediting",
};

// Token Validation Parameters
export const tokenValidationParameters = {
  validationParameters: {
    issuer: `https://proptii.b2clogin.com/${import.meta.env.VITE_AZURE_AD_TENANT_NAME}/v2.0/`,
    validAudience: msalConfig.auth.clientId,
  }
}; 