import type { AuthenticationResult } from '@azure/msal-browser';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
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
 * Returns true if the token has already expired.
 * Does NOT check near-expiry — we let MSAL's own refresh logic handle that.
 */
function isTokenExpired(token: string): boolean {
  if (!isJwtFormat(token)) return true;
  const exp = getJwtExpiry(token);
  if (exp === 0) return true;
  return Math.floor(Date.now() / 1000) >= exp;
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
 * Fires a global event telling the app the user's session has fully expired
 * and they must log in again interactively. AuthContext listens for this and
 * redirects to /login (or opens the login popup).
 *
 * Only fires if we've previously had a successful token acquisition in this
 * page session. This prevents false positives during MSAL's initial hydration
 * (handleRedirectPromise) when acquireTokenSilent may briefly fail before
 * the account/tokens are ready in the cache.
 */
let hasEverSucceeded = false;

export function notifySessionExpired(): void {
  if (!hasEverSucceeded) {
    // We've never successfully gotten a token in this page load — this is
    // likely a timing issue during MSAL init, not a genuine session expiry.
    return;
  }
  window.dispatchEvent(new CustomEvent('auth-session-expired'));
}

/**
 * Returns a Bearer token for API calls: MSAL silent → ssoSilent → localStorage `auth_token`.
 *
 * Key design decisions:
 * - Do NOT use forceRefresh:true. It skips MSAL's cache and hits B2C's server directly.
 *   When the B2C server-side session (cookie) has expired, this throws AADB2C90077
 *   even when MSAL still has a valid refresh token that could work without forceRefresh.
 * - MSAL's acquireTokenSilent (without forceRefresh) uses the refresh token automatically
 *   when the access/id token in cache is expired — no B2C session required.
 * - If InteractionRequiredAuthError is thrown, it means the refresh token is also gone
 *   (session fully expired) and the user must log in again interactively.
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
    // No MSAL account — check localStorage as last resort
    const stored = fromStorage();
    if (stored && !isTokenExpired(stored)) return stored;
    return null;
  }

  if (!msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(account);
  }

  try {
    // acquireTokenSilent without forceRefresh:
    // - Returns cached token if still valid
    // - Uses refresh token to get a new token if cached one expired
    // - Does NOT require an active B2C server session for refresh token flow
    const r = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    const t = bearerJwtFromResult(r);
    if (t) {
      localStorage.setItem('auth_token', t);
      hasEverSucceeded = true;
      return t;
    }
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      // Refresh token also expired — the user MUST log in again interactively.
      // Clear stale storage and notify the app so it can redirect to /login.
      localStorage.removeItem('auth_token');
      notifySessionExpired();
      return null;
    }
    console.warn('[msal] acquireTokenSilent failed:', e);
  }

  // Hidden iframe SSO — fallback when silent refresh fails for non-interaction reasons
  // (e.g. network hiccup). Skip if B2C session is known to be gone (AADB2C90077).
  try {
    const r = await msalInstance.ssoSilent({
      scopes: loginRequest.scopes,
      authority: msalConfig.auth.authority,
      loginHint: account.username,
    });
    const t = bearerJwtFromResult(r);
    if (t) {
      localStorage.setItem('auth_token', t);
      hasEverSucceeded = true;
      return t;
    }
  } catch {
    // Expected when no server session or iframe blocked — fall through
  }

  // Final fallback: return cached token only if not expired
  const stored = fromStorage();
  if (stored && !isTokenExpired(stored)) {
    hasEverSucceeded = true;
    return stored;
  }

  // Token is expired and we couldn't refresh — notify app
  if (account) notifySessionExpired();
  return null;
}
