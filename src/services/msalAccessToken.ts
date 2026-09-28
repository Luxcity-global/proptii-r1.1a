import { auth } from '../config/firebaseConfig';
import { waitForAuthReady } from './authReady';


// ─── Session-expiry notification ─────────────────────────────────────────────

export function notifySessionExpired(force = false): void {
  window.dispatchEvent(new CustomEvent('auth-session-expired'));
}

// ─── Token cache ──────────────────────────────────────────────────────────────
// Keep the last successfully acquired token in memory so we can serve it when
// IndexedDB is temporarily unavailable (tab hidden, visibility change, etc.)

let _lastGoodToken: string | null = null;
let _lastGoodTokenAt = 0;
const TOKEN_MEMORY_TTL_MS = 55 * 60 * 1000; // 55 min (Firebase tokens last 60 min)

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getAccessTokenForApiRequest(): Promise<string | null> {
  await waitForAuthReady();

  if (import.meta.env.DEV) {
    const mock = localStorage.getItem('mock_token');
    if (mock) return mock;
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    // Strategy 1: cached getIdToken (reads IndexedDB — fast but can fail when tab is hidden)
    try {
      const token = await currentUser.getIdToken(false);
      if (token) {
        _lastGoodToken = token;
        _lastGoodTokenAt = Date.now();
        // Persist for cross-tab / storage fallback
        try { localStorage.setItem('auth_token', token); } catch {}
        return token;
      }
    } catch (err: any) {
      const isDbClosing =
        err?.message?.includes('closing') ||
        err?.message?.includes('hidden') ||
        err?.message?.includes('IndexedDB') ||
        err?.code === 'auth/internal-error';

      if (!isDbClosing) {
        console.error('[Auth] Error getting Firebase ID token:', err);
      }
      // Fall through to Strategy 2
    }

    // Strategy 2: force-refresh — hits Firebase servers, bypasses IndexedDB
    try {
      const token = await currentUser.getIdToken(true);
      if (token) {
        _lastGoodToken = token;
        _lastGoodTokenAt = Date.now();
        try { localStorage.setItem('auth_token', token); } catch {}
        return token;
      }
    } catch {
      // Fall through to Strategy 3
    }
  }

  // Strategy 3: in-memory cache (valid for 55 min)
  if (_lastGoodToken && Date.now() - _lastGoodTokenAt < TOKEN_MEMORY_TTL_MS) {
    return _lastGoodToken;
  }

  // Strategy 4: localStorage / sessionStorage (written by Strategy 1 above)
  const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (storedToken) return storedToken;

  return null;
}
