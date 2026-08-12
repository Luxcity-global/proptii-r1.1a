import { auth } from '../config/firebaseConfig';
import { waitForAuthReady } from './authReady';
import { getMsalInstance } from '../contexts/AuthContext';

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

  // 2. Try MSAL Account (Microsoft Auth)
  try {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
      const activeAccount = msal.getActiveAccount() || accounts[0];
      const response = await msal.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email'],
        account: activeAccount
      }).catch(() => null);

      if (response?.idToken) {
        return response.idToken;
      }
    }
  } catch (msalErr) {
    console.warn('[Auth] MSAL token acquisition warning:', msalErr);
  }

  // 3. Fallback to stored token
  const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (storedToken) return storedToken;

  return null;
}
