/**
 * msalAccessToken.ts — Bearer token acquisition for API calls.
 * (Now backed by Firebase Auth)
 */

import { auth } from '../config/firebaseConfig';
import { waitForAuthReady } from './authReady';

// ─── Session-expiry notification ─────────────────────────────────────────────

export function notifySessionExpired(force = false): void {
  window.dispatchEvent(new CustomEvent('auth-session-expired'));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getAccessTokenForApiRequest(): Promise<string | null> {
  await waitForAuthReady();

  if (import.meta.env.DEV) {
    const mock = localStorage.getItem('mock_token');
    if (mock) return mock;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('[Auth] No current Firebase user found when acquiring token.');
    return null;
  }

  try {
    // getIdToken(false) gets the cached token if it's not expired, otherwise refreshes it.
    const token = await currentUser.getIdToken(false);
    return token;
  } catch (err) {
    console.error('[Auth] Error getting Firebase ID token:', err);
    notifySessionExpired(true);
    return null;
  }
}
