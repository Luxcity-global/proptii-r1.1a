/**
 * msalAccessToken.ts — Bearer token acquisition for API calls.
 *
 * Design notes (abbreviated — see git history for full rationale):
 * 1. Always await waitForAuthReady() first to avoid racing MSAL hydration.
 * 2. No ssoSilent / hidden-iframe: B2C sets COOP: same-origin, blocking iframe postMessage.
 * 3. No forceRefresh: bypasses MSAL cache and can throw AADB2C90077 unnecessarily.
 * 4. notifySessionExpired() is guarded by hasEverSucceeded to suppress false positives on cold load.
 *
 * Dependency graph (no circular imports):
 *   msalAccessToken → authReady (waitForAuthReady)
 *   msalAccessToken → AuthContext (getMsalInstance — one-way, no cycle)
 *   msalAccessToken → authConfig (loginRequest)
 */

import type { AuthenticationResult } from '@azure/msal-browser';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { getMsalInstance } from '../contexts/AuthContext';
import { waitForAuthReady } from './authReady';
import { loginRequest } from '../config/authConfig';

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function isJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

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

function isTokenExpired(token: string): boolean {
  if (!isJwtFormat(token)) return true;
  const exp = getJwtExpiry(token);
  if (exp === 0) return true;
  return Math.floor(Date.now() / 1000) >= exp;
}

/**
 * Picks the best Bearer JWT from an MSAL result.
 * B2C often returns an opaque accessToken while idToken is always a proper JWT.
 * The Nest guard validates aud which matches the SPA client-id in idToken.
 */
function bearerJwtFromResult(r: AuthenticationResult | null | undefined): string | null {
  if (!r) return null;
  const access = r.accessToken?.trim() ?? '';
  const idTok  = r.idToken?.trim()     ?? '';
  if (idTok  && isJwtFormat(idTok))  return idTok;
  if (access && isJwtFormat(access)) return access;
  return access || idTok || null;
}

// ─── Session-expiry notification ─────────────────────────────────────────────

/**
 * Set true on the first successful token acquisition this session.
 * Guards notifySessionExpired() against false positives during MSAL hydration.
 */
let hasEverSucceeded = false;

export function notifySessionExpired(): void {
  if (!hasEverSucceeded) {
    console.warn('[Token] notifySessionExpired() suppressed — no confirmed token yet this session (likely cold-start race)');
    return;
  }
  console.warn('[Token] notifySessionExpired() dispatching auth-session-expired');
  window.dispatchEvent(new CustomEvent('auth-session-expired'));
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a Bearer JWT for API calls, or null when unauthenticated.
 *
 * Acquisition order:
 *   1. Mock token (DEV only)
 *   2. acquireTokenSilent (MSAL cache → refresh token)
 *   3. localStorage auth_token (unexpired fallback)
 *   → null + notifySessionExpired() (guarded)
 */
export async function getAccessTokenForApiRequest(): Promise<string | null> {
  console.log('[Token] getAccessTokenForApiRequest() called — waiting for auth ready...');
  await waitForAuthReady();

  const msal    = getMsalInstance();
  const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0];

  // Dev mock
  if (import.meta.env.DEV) {
    const mock = localStorage.getItem('mock_token');
    if (mock) {
      console.log('[Token] Returning mock token (DEV)');
      return mock;
    }
  }

  const storedToken = (): string | null => localStorage.getItem('auth_token');

  if (!account) {
    const stored = storedToken();
    if (stored && !isTokenExpired(stored)) {
      console.log('[Token] No MSAL account — returning non-expired localStorage token');
      return stored;
    }
    console.log('[Token] No account, no valid stored token → unauthenticated');
    return null;
  }

  if (!msal.getActiveAccount()) msal.setActiveAccount(account);
  console.log('[Token] Calling acquireTokenSilent for:', account.username);

  try {
    const result = await msal.acquireTokenSilent({ ...loginRequest, account });
    const token  = bearerJwtFromResult(result);
    if (token) {
      localStorage.setItem('auth_token', token);
      if (!hasEverSucceeded) {
        hasEverSucceeded = true;
        console.log('[Token] acquireTokenSilent succeeded — hasEverSucceeded=true');
      }
      return token;
    }
    console.warn('[Token] acquireTokenSilent returned a result but no usable JWT');
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      console.warn('[Token] InteractionRequiredAuthError — refresh token gone:', (err as any)?.errorCode ?? err);
      localStorage.removeItem('auth_token');
      notifySessionExpired();
      return null;
    }
    console.warn('[Token] acquireTokenSilent threw (non-auth error):', (err as any)?.message ?? err, '— trying localStorage fallback');
  }

  // localStorage fallback for transient failures (network blip, etc.)
  const stored = storedToken();
  if (stored && !isTokenExpired(stored)) {
    console.log('[Token] Returning non-expired localStorage token as fallback');
    hasEverSucceeded = true;
    return stored;
  }

  console.warn('[Token] All token sources exhausted');
  notifySessionExpired();
  return null;
}
