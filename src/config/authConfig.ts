import { Configuration, BrowserCacheLocation, LogLevel } from "@azure/msal-browser";

// ─── Environment variables with hardcoded fallbacks ───────────────────────────
const clientId    = import.meta.env.VITE_AZURE_AD_CLIENT_ID   || "532e1fa0-18a6-4356-bd78-1f62bd6d5e2f";
const tenantName  = import.meta.env.VITE_AZURE_AD_TENANT_NAME || "proptii.onmicrosoft.com";
const policyName  = import.meta.env.VITE_AZURE_AD_POLICY_NAME || "B2C_1_SignUpandSignInProptii";

// redirectUri: baked at build time from env, falls back to runtime origin.
// Evaluated lazily inside a function so it's never read at module parse time
// in non-browser environments (SSR / test workers).
function getRedirectUri(): string {
  return import.meta.env.VITE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');
}
function getPostLogoutRedirectUri(): string {
  return import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');
}

// ─── MSAL configuration ───────────────────────────────────────────────────────
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://proptii.b2clogin.com/${tenantName}/${policyName}`,
    knownAuthorities: ["proptii.b2clogin.com"],
    redirectUri:            getRedirectUri(),
    postLogoutRedirectUri:  getPostLogoutRedirectUri(),
    // Do NOT re-navigate to the original URL after redirect — the SPA router
    // handles post-login navigation via sessionStorage.redirectAfterLogin.
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // localStorage so tokens survive page refreshes and redirect round-trips.
    cacheLocation: "localStorage" as BrowserCacheLocation,
    // Cookies needed for third-party contexts (iframes, Safari ITP).
    storeAuthStateInCookie: true,
  },
  system: {
    // Hidden-iframe redirects are disabled: the ssoSilent iframe is removed from
    // the token acquisition flow (see msalAccessToken.ts) because B2C sets
    // Cross-Origin-Opener-Policy: same-origin on their auth pages, which makes
    // iframe postMessage unreliable. allowRedirectInIframe:false prevents MSAL
    // from trying a redirect inside iframes (e.g. the landlord sub-app).
    allowRedirectInIframe: false,
    // Generous timeouts — Render cold-start can be slow.
    windowHashTimeout: 60_000,
    iframeHashTimeout: 10_000,
    loadFrameTimeout:  10_000,
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:   console.error(message); break;
          case LogLevel.Warning: console.warn(message);  break;
          default:               break;
        }
      },
    },
  },
};

// ─── Token request ────────────────────────────────────────────────────────────

const extraScopes = (import.meta.env.VITE_AZURE_AD_EXTRA_SCOPES || '')
  .trim()
  .split(/[\s,]+/)
  .filter(Boolean);

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'offline_access', ...extraScopes],
  // Request phone-number custom claim from B2C.
  claims: JSON.stringify({ id_token: { extension_PhoneNumber: null } }),
};

// ─── Policy names ─────────────────────────────────────────────────────────────

export const b2cPolicies = {
  signUpSignIn:  import.meta.env.VITE_AZURE_AD_POLICY_NAME                    || "B2C_1_SignUpandSignInProptii",
  forgotPassword:import.meta.env.VITE_AZURE_AD_RESET_PASSWORD_POLICY_NAME     || "B2C_1_passwordreset",
  editProfile:   import.meta.env.VITE_AZURE_AD_EDIT_PROFILE_POLICY_NAME       || "B2C_1_profileediting",
};

// ─── Token validation (backend use) ──────────────────────────────────────────

export const tokenValidationParameters = {
  validationParameters: {
    issuer:        `https://proptii.b2clogin.com/${tenantName}/v2.0/`,
    validAudience: clientId,
  },
};
