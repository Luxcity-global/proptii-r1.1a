/**
 * msalAccessToken.ts — Bearer token acquisition for API calls.
 *
 * Design decisions:
 * 1. Wait for full auth initialisation (waitForAuthReady) before any MSAL call.
 * 2. No ssoSilent / hidden-iframe: B2C COOP blocks iframe postMessage.
 * 3. No forceRefresh: bypasses MSAL cache and can throw AADB2C90077 needlessly.
 * 4. notifySessionExpired() guarded by hasEverSucceeded — prevents false
 *    positives during MSAL hydration on cold page loads.
 *
 * Dependency graph (no circular imports):
 *   msalAccessToken → authReady     (waitForAuthReady)
 *   msalAccessToken → AuthContext   (getMsalInstance — one-way, no cycle)
 *   msalAccessToken → authConfig    (loginRequest)
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
 * B2C often returns an opaque accessToken; idToken is always a proper JWT
 * whose aud matches the SPA client-id required by the Nest JWT guard.
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

let hasEverSucceeded = false;

export function notifySessionExpired(): void {
  if (!hasEverSucceeded) {
    console.warn('[Auth] notifySessionExpired suppressed — no token confirmed yet this session');
    return;
  }
  window.dispatchEvent(new CustomEvent('auth-session-expired'));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getAccessTokenForApiRequest(): Promise<string | null> {
  await waitForAuthReady();

  const msal    = getMsalInstance();
  const account = msal.getActiveAccount() ?? msal.getAllAccounts()[0];

  if (import.meta.env.DEV) {
    const mock = localStorage.getItem('mock_token');
    if (mock) return mock;
  }

  const storedToken = (): string | null => localStorage.getItem('auth_token');

  if (!account) {
    const stored = storedToken();
    return stored && !isTokenExpired(stored) ? stored : null;
  }

  if (!msal.getActiveAccount()) msal.setActiveAccount(account);

  try {
    const result = await msal.acquireTokenSilent({ ...loginRequest, account });
    const token  = bearerJwtFromResult(result);
    if (token) {
      localStorage.setItem('auth_token', token);
      hasEverSucceeded = true;
      return token;
    }
    console.warn('[Auth] acquireTokenSilent returned no usable JWT');
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      console.warn('[Auth] Session expired — refresh token gone:', (err as any)?.errorCode ?? '');
      localStorage.removeItem('auth_token');
      notifySessionExpired();
      return null;
    }
    console.warn('[Auth] acquireTokenSilent failed (transient):', (err as any)?.message ?? err);
  }

  const stored = storedToken();
  if (stored && !isTokenExpired(stored)) {
    hasEverSucceeded = true;
    return stored;
  }

  notifySessionExpired();
  return null;
}
