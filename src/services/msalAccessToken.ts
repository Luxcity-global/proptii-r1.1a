import type { AuthenticationResult } from '@azure/msal-browser';
import { getMsalInstance, waitForMsalReady } from '../contexts/AuthContext';
import { loginRequest, msalConfig } from '../config/authConfig';

/** Three Base64url segments — opaque B2C access tokens are not valid JWTs for our Nest guard. */
function isJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Returns the expiry time (in seconds since epoch) from a JWT payload.
 * Returns 0 if the token cannot be decoded.
 */
function getJwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns true if the token is a JWT that expires within the next 5 minutes,
 * or has already expired. Used to decide whether to force a silent refresh.
 */
function isTokenNearExpiry(token: string): boolean {
  if (!isJwtFormat(token)) return true; // opaque tokens should always be refreshed
  const exp = getJwtExpiry(token);
  if (exp === 0) return true;
  const nowPlusFiveMinutes = Math.floor(Date.now() / 1000) + 5 * 60;
  return exp < nowPlusFiveMinutes;
}

/**
 * Pick a Bearer string the backend can verify (RS256 + aud = SPA client id).
 * B2C often returns an **opaque** `accessToken` while `idToken` is a JWT — sending the opaque
 * string breaks passport-jwt. If both are JWTs, prefer `idToken` so `aud` matches `MSAL_CLIENT_ID`
 * (access can target another resource after refresh).
 */
function bearerJwtFromResult(r: AuthenticationResult | null | undefined): string | null {
  if (!r) return null;
  const access = r.accessToken?.trim() ?? '';
  const idTok = r.idToken?.trim() ?? '';
  const accessJwt = access && isJwtFormat(access);
  const idJwt = idTok && isJwtFormat(idTok);
  // Prefer id_token when it is a JWT: `aud` matches the SPA app; access_token may be opaque or for another resource.
  if (idJwt) return idTok;
  if (accessJwt) return access;
  return access || idTok || null;
}

/**
 * Returns a Bearer token for API calls: MSAL silent (+ id_token fallback) → ssoSilent → localStorage `auth_token`.
 * Does not open popups (those were flashing closed and only read accessToken, missing id_token).
 * Forces a refresh when the cached token is near expiry (<5 min) to prevent backend 401s.
 */
export async function getAccessTokenForApiRequest(): Promise<string | null> {
  await waitForMsalReady();
  const msalInstance = getMsalInstance();
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

  // Check for mock token first in development
  if (import.meta.env.DEV) {
    const mockToken = localStorage.getItem('mock_token');
    if (mockToken) return mockToken;
  }


  const fromStorage = () => localStorage.getItem('auth_token');

  if (!account) {
    return fromStorage();
  }

  if (!msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(account);
  }

  // Determine if we need a forced refresh (cached token near expiry or expired)
  const cachedToken = fromStorage();
  const needsRefresh = !cachedToken || isTokenNearExpiry(cachedToken);

  try {
    const r = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
      // Force a server-side token refresh if the cached token is near expiry.
      // Without this, MSAL returns the same in-memory cached token even if it's 58 min old.
      forceRefresh: needsRefresh,
    });
    const t = bearerJwtFromResult(r);
    if (t) {
      localStorage.setItem('auth_token', t);
      return t;
    }
  } catch (e) {
    console.warn('[msal] acquireTokenSilent failed:', e);
  }

  // Hidden iframe SSO — no popup; helps when silent refresh fails but session cookies exist
  try {
    const r = await msalInstance.ssoSilent({
      scopes: loginRequest.scopes,
      authority: msalConfig.auth.authority,
      loginHint: account.username,
    });
    const t = bearerJwtFromResult(r);
    if (t) {
      localStorage.setItem('auth_token', t);
      return t;
    }
  } catch {
    // Expected when no server session or iframe blocked
  }

  return fromStorage();
}
