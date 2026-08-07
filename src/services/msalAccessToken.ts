/**
 * msalAccessToken.ts
 *
 * Single source of truth for acquiring a Bearer token for API calls.
 *
 * Design decisions
 * ─────────────────
 * 1. Wait for full auth initialisation before attempting any MSAL call.
 *    `waitForAuthReady()` resolves after `handleRedirectPromise()` and role
 *    resolution are both done. Calling `acquireTokenSilent` before that point
 *    races with MSAL's internal hydration and throws `InteractionRequiredAuthError`
 *    even when a valid refresh token exists — that's the root of every
 *    "spurious session-expired redirect" this codebase has seen.
 *
 * 2. No `ssoSilent` / hidden-iframe fallback.
 *    Azure B2C sets `Cross-Origin-Opener-Policy: same-origin` on their auth
 *    pages. Under COOP a hidden iframe cannot communicate the token back via
 *    postMessage, so `ssoSilent` always times out (10 s delay per call) and
 *    adds zero value. It has been removed entirely.
 *
 * 3. No `forceRefresh: true`.
 *    `forceRefresh` bypasses MSAL's cache and hits the B2C server directly.
 *    If the B2C server-side session cookie has expired it throws AADB2C90077
 *    even when a perfectly valid refresh token is present in the local cache.
 *    Without `forceRefresh`, MSAL uses the refresh token automatically when
 *    the cached access/id token is expired — no server session required.
 *
 * 4. `notifySessionExpired()` is guarded by `hasEverSucceeded`.
 *    On a fresh page load MSAL hasn't finished hydrating when the first API
 *    interceptor fires. `acquireTokenSilent` may throw `InteractionRequiredAuthError`
 *    transiently during that window. Without the guard, the app would treat that
 *    as a genuine session expiry and redirect to login on every cold load.
 *    The guard ensures the event only fires after we've confirmed at least one
 *    real token exists this session.
 *
 * Dependency graph (no circular imports)
 * ────────────────────────────────────────
 *   msalAccessToken  →  authReady       (waitForAuthReady)
 *   msalAccessToken  →  AuthContext     (getMsalInstance)
 *   msalAccessToken  →  authConfig      (loginRequest)
 *   AuthContext      →  msalAccessToken (getAccessTokenForApiRequest) ← no cycle
 *   AuthContext      →  authReady       (notifyAuthReady)
 */

import type { AuthenticationResult } from '@azure/msal-browser';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { getMsalInstance } from '../contexts/AuthContext';
import { waitForAuthReady } from './authReady';
import { loginRequest } from '../config/authConfig';

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/** Returns true only when the string looks like a three-segment Base64url JWT. */
function isJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Decodes the `exp` claim (seconds since epoch) from a JWT payload.
 * Returns 0 when the token cannot be decoded.
 */
function getJwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return typeof payload.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
}

/** Returns true when the token has already expired. */
function isTokenExpired(token: string): boolean {
  if (!isJwtFormat(token)) return true;
  const exp = getJwtExpiry(token);
  if (exp === 0) return true;
  return Math.floor(Date.now() / 1000) >= exp;
}

/**
 * Picks the best Bearer token from an MSAL result.
 *
 * B2C often returns an **opaque** `accessToken` (not a JWT) while `idToken`
 * is always a proper RS256 JWT whose `aud` matches our SPA client-id. The Nest
 * JWT guard validates `aud`, so we prefer `idToken` whenever it is a JWT.
 */
function bearerJwtFromResult(r: AuthenticationResult | null | undefined): string | null {
  if (!r) return null;
  const access = r.accessToken?.trim() ?? '';
  const idTok  = r.idToken?.trim()     ?? '';
  if (idTok  && isJwtFormat(idTok))  return idTok;
  if (access && isJwtFormat(access)) return access;
  // Last resort: return whatever string we have (may be opaque, backend may reject)
  return access || idTok || null;
}

// ─── Session-expiry notification ─────────────────────────────────────────────

/**
 * Set to `true` the first time we successfully return a token this session.
 *
 * Guards `notifySessionExpired()` against false positives during MSAL's initial
 * hydration window (before `handleRedirectPromise` completes), when
 * `acquireTokenSilent` may transiently throw `InteractionRequiredAuthError`.
 */
let hasEverSucceeded = false;

/**
 * Dispatches `auth-session-expired` so `AuthContext` can clear stale state.
 *
 * Suppressed until at least one successful token acquisition has happened in
 * this page session — see note on `hasEverSucceeded` above.
 */
export function notifySessionExpired(): void {
  if (!hasEverSucceeded) {
    console.warn('[msal] notifySessionExpired suppressed — auth not yet confirmed this session');
    return;
  }
  window.dispatchEvent(new CustomEvent('auth-session-expired'));
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a Bearer JWT for authenticating API requests, or `null` when the
 * user is not signed in.
 *
 * Acquisition strategy (in order):
 *   1. Mock token (dev toolbar only, `import.meta.env.DEV`)
 *   2. `acquireTokenSilent` — uses cached token or refresh token
 *   3. Cached `auth_token` in `localStorage` (not expired)
 *
 * On `InteractionRequiredAuthError` (refresh token also gone):
 *   - Clears the stale cached token
 *   - Calls `notifySessionExpired()` (guarded; see above)
 *   - Returns `null`
 *
 * Does NOT call `ssoSilent`. See module-level design note #2.
 */
export async function getAccessTokenForApiRequest(): Promise<string | null> {
  // Block until handleRedirectPromise + role resolution are done so we never
  // race with MSAL's internal hydration.
  await waitForAuthReady();

  const msal    = getMsalInstance();
  const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0];

  // ── Dev mock ──────────────────────────────────────────────────────────────
  if (import.meta.env.DEV) {
    const mock = localStorage.getItem('mock_token');
    if (mock) return mock;
  }

  const storedToken = (): string | null => localStorage.getItem('auth_token');

  // ── No MSAL account ───────────────────────────────────────────────────────
  if (!account) {
    // User is not signed in. Return a non-expired localStorage token if one
    // was left from a previous session; otherwise null (unauthenticated).
    const stored = storedToken();
    return stored && !isTokenExpired(stored) ? stored : null;
  }

  // Ensure MSAL tracks the active account so silent calls work.
  if (!msal.getActiveAccount()) msal.setActiveAccount(account);

  // ── Silent token refresh via MSAL cache / refresh token ──────────────────
  try {
    const result = await msal.acquireTokenSilent({ ...loginRequest, account });
    const token  = bearerJwtFromResult(result);
    if (token) {
      localStorage.setItem('auth_token', token);
      hasEverSucceeded = true;
      return token;
    }
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      // Both the cached token and the refresh token are gone.
      // The user will need to sign in again interactively.
      localStorage.removeItem('auth_token');
      notifySessionExpired(); // no-op if hasEverSucceeded is false
      return null;
    }
    // Any other error (network, timeout, etc.) — fall through to localStorage.
    console.warn('[msal] acquireTokenSilent failed:', err);
  }

  // ── localStorage fallback ─────────────────────────────────────────────────
  // `acquireTokenSilent` failed for a transient reason (e.g. network hiccup)
  // but we may still have a valid non-expired token from a previous call.
  const stored = storedToken();
  if (stored && !isTokenExpired(stored)) {
    hasEverSucceeded = true;
    return stored;
  }

  // All paths exhausted — token is gone.
  // Only fire session-expired when we know the user was previously authenticated.
  notifySessionExpired();
  return null;
}
