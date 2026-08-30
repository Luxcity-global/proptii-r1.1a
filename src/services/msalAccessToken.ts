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

  // 1. Try Firebase Auth User
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken(false);
      if (token) return token;
    } catch (err) {
      console.error('[Auth] Error getting Firebase ID token:', err);
    }
  }

  // 3. Fallback to stored token
  const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (storedToken) return storedToken;

  return null;
}
