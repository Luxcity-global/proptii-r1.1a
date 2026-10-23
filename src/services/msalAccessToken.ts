import { auth } from '../config/firebaseConfig';
import { waitForAuthReady } from './authReady';


// ─── Session-expiry notification & JWT validation ─────────────────────────────

export function notifySessionExpired(force = false): void {
  window.dispatchEvent(new CustomEvent('auth-session-expired', { detail: { force } }));
}

/**
 * Check if a JWT string is expired (or will expire within bufferSeconds).
 * Returns true if invalid, unparseable, or expired.
 */
export function isJwtExpired(token: string | null | undefined, bufferSeconds = 60): boolean {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (typeof parsed.exp !== 'number') return false;
    return parsed.exp * 1000 <= Date.now() + bufferSeconds * 1000;
  } catch {
    return true;
  }
}

export function clearStoredAuthToken(): void {
  _lastGoodToken = null;
  _lastGoodTokenAt = 0;
  try {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  } catch {}
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
      if (token && !isJwtExpired(token)) {
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
      if (token && !isJwtExpired(token)) {
        _lastGoodToken = token;
        _lastGoodTokenAt = Date.now();
        try { localStorage.setItem('auth_token', token); } catch {}
        return token;
      }
    } catch {
      // Fall through to Strategy 3
    }
  }

  // Strategy 3: in-memory cache (valid for 55 min and not expired)
  if (_lastGoodToken && !isJwtExpired(_lastGoodToken) && Date.now() - _lastGoodTokenAt < TOKEN_MEMORY_TTL_MS) {
    return _lastGoodToken;
  }

  // Strategy 4: localStorage / sessionStorage
  const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (storedToken) {
    if (!isJwtExpired(storedToken)) {
      return storedToken;
    }
    // Token is expired: purge it immediately to prevent unauthorized loops
    clearStoredAuthToken();
    notifySessionExpired(true);
  }

  return null;
}
