import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMsal, MsalProvider } from '@azure/msal-react';
import {
  PublicClientApplication,
  EventType,
  EventMessage,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { msalConfig, loginRequest, b2cPolicies } from '../config/authConfig';
import SessionManager from '../services/SessionManager';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { notifyAuthReady } from '../services/authReady';

// ─── MSAL singleton ───────────────────────────────────────────────────────────
//
// One PublicClientApplication instance for the lifetime of the page.
// Created on first call; initialize() is called immediately and the promise
// cached so callers can await it cheaply.

let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<void> | null = null;

export const getMsalInstance = (): PublicClientApplication => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);

    // Kick off initialization immediately; errors are swallowed here and
    // surfaced later when callers await msalInitPromise.
    msalInitPromise = msalInstance.initialize() as Promise<void>;
    msalInitPromise.catch((err) => console.error('[MSAL] init error:', err));

    msalInstance.addEventCallback((event: EventMessage) => {
      const succeeded =
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.LOGOUT_SUCCESS;
      const failed =
        event.eventType === EventType.LOGIN_FAILURE ||
        event.eventType === EventType.ACQUIRE_TOKEN_FAILURE;
      if (succeeded || failed) {
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
    });
  }
  return msalInstance;
};

/** Resolves once msalInstance.initialize() has settled. */
export async function waitForMsalReady(): Promise<void> {
  if (!msalInstance) getMsalInstance();
  if (msalInitPromise) await msalInitPromise;
}

// Re-export the auth-ready helpers from their canonical leaf module so any
// existing consumer that imports from AuthContext keeps working.
export { isAuthReady, waitForAuthReady } from '../services/authReady';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  phone?: string;
  roles: string[];
  /** true once a canonical role has been resolved (even if roles[] is empty) */
  roleResolved: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: 'tenant' | 'landlord' | 'agent' | null;
  login: () => Promise<void>;
  loginAsMockUser: (id: string, role: string) => void;
  logout: () => Promise<void>;
  editProfile: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  /**
   * Patch the in-memory user without a full re-init.
   * Used by RoleSelect after writing a new role so the React tree sees the
   * updated role before navigation happens — no page reload needed.
   */
  patchUser: (patch: Partial<User>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractPhoneNumber(claims: Record<string, unknown> | undefined): string | undefined {
  if (!claims) return undefined;
  const keys = [
    'extension_PhoneNumber', 'phoneNumber', 'phone_number',
    'mobilePhone', 'extension_phoneNumber', 'telephone',
  ];
  for (const key of keys) {
    if (typeof claims[key] === 'string' && claims[key]) return claims[key] as string;
  }
  return undefined;
}

function resolveUserId(account: {
  idTokenClaims?: Record<string, unknown>;
  localAccountId?: string;
  homeAccountId?: string;
}): string {
  return (
    (account.idTokenClaims?.oid as string) ||
    (account.idTokenClaims?.sub as string) ||
    account.localAccountId ||
    account.homeAccountId ||
    ''
  );
}

const LANDLORD_ROLES = new Set(['landlord', 'agent']);
const LOCAL_STORAGE_KEYS = ['mock_token', 'auth_token', 'proptii_auth_state'];

function clearAuthStorage(): void {
  LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem('redirectAfterLogin');
}

/**
 * Sync Firebase identity from a B2C id-token. Non-fatal — a failure here
 * only means Firestore will fall back to anonymous/unauthenticated rules.
 */
async function syncFirebaseAuth(b2cIdToken: string): Promise<void> {
  const base = (import.meta.env.VITE_NEST_API_ENDPOINT || 'http://localhost:3000').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/auth/firebase-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${b2cIdToken}`, 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const { firebaseToken } = await res.json();
      if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);
    } else {
      window.dispatchEvent(new CustomEvent('firebase-auth-sync-failed', { detail: { status: res.status } }));
    }
  } catch (err) {
    window.dispatchEvent(new CustomEvent('firebase-auth-sync-failed', {
      detail: { message: err instanceof Error ? err.message : 'Unknown' },
    }));
  }
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

interface AuthProviderProps { children: ReactNode }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser]                       = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  const sessionManager = SessionManager.getInstance();

  // ── One-time auth initialisation ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // ── Dev-only mock user shortcut ──────────────────────────────────────
        const mockToken = localStorage.getItem('mock_token');
        if (mockToken?.startsWith('mock-token-')) {
          const id   = mockToken.replace('mock-token-', '');
          const role = id.startsWith('tenant') ? 'tenant' : 'landlord';
          if (!cancelled) {
            setUser({ id, email: `${role}@test.proptii.co`, name: `Test ${role}`, roles: [role], roleResolved: true });
            setIsAuthenticated(true);
          }
          return;
        }

        // ── Process any pending B2C redirect ────────────────────────────────
        // IMPORTANT: handleRedirectPromise() MUST be awaited before any other
        // MSAL call. It processes the hash/query params Azure B2C appends on
        // redirect and clears them — calling acquireTokenSilent before this
        // completes throws InteractionRequiredAuthError, which is the root cause
        // of every spurious "session expired" redirect this codebase has had.
        const redirect = await instance.handleRedirectPromise();
        if (redirect?.account) instance.setActiveAccount(redirect.account);

        // Restore any in-progress navigation target the user had before login.
        if (redirect?.state) {
          try {
            const parsed = JSON.parse(redirect.state);
            if (parsed.redirect) sessionStorage.setItem('redirectAfterLogin', parsed.redirect);
          } catch { /* state is not JSON — ignore */ }
        }

        // No accounts → user is unauthenticated; nothing more to do.
        if (accounts.length === 0) return;

        // ── Resolve user from MSAL account ───────────────────────────────────
        const account = accounts[0];
        instance.setActiveAccount(account);

        const userId = resolveUserId(account as any);
        const phone  = extractPhoneNumber(account.idTokenClaims as Record<string, unknown>);

        let roles: string[]  = [];
        let roleResolved      = false;
        try {
          const { resolveRole } = await import('../services/roleService');
          const role = await resolveRole(userId, account.username);
          if (role) {
            roles        = [role];
            roleResolved = true;
            if (LANDLORD_ROLES.has(role)) {
              const redir = sessionStorage.getItem('redirectAfterLogin');
              if (!redir || redir === '/dashboard' || redir === '/') {
                sessionStorage.setItem('redirectAfterLogin', '/landlord');
              }
            }
          }
        } catch (err) {
          console.error('[Auth] Role resolution failed:', err);
        }

        if (!cancelled) {
          setUser({
            id: userId,
            givenName:  account.name?.split(' ')[0],
            familyName: account.name?.split(' ').slice(1).join(' '),
            email: account.username,
            name:  account.name,
            phone,
            roles,
            roleResolved,
          });
          setIsAuthenticated(true);
        }

        // ── Firebase sync (non-blocking, non-fatal) ──────────────────────────
        // Acquire the token DIRECTLY from MSAL here — do NOT call
        // getAccessTokenForApiRequest(), which would wait for notifyAuthReady()
        // that hasn't been called yet (we're still inside this try block).
        instance.acquireTokenSilent({ ...loginRequest, account })
          .then((r) => { if (r.idToken) syncFirebaseAuth(r.idToken); })
          .catch(() => { /* non-fatal */ });

        sessionManager.updateActivity('authentication', 'Session initialized');

      } catch (err) {
        // InteractionRequiredAuthError here means MSAL's cache is corrupt or the
        // account was removed from B2C. Just mark the user as unauthenticated —
        // do NOT call loginRedirect() because that would cause an infinite loop
        // if the account truly doesn't exist.
        if (err instanceof InteractionRequiredAuthError) {
          if (!cancelled) { setIsAuthenticated(false); setUser(null); }
        }
        console.error('[Auth] Initialization error:', err);
      } finally {
        // Always unblock waitForAuthReady() — even if init threw or returned
        // early. API interceptors will hang forever if this never fires.
        if (!cancelled) {
          setIsLoading(false);
          notifyAuthReady();
        }
      }
    };

    init();

    // ── Event listeners ──────────────────────────────────────────────────────

    // Cross-iframe auth bridge — landlord sub-app reads auth state via postMessage.
    const onAuthRequest = (event: MessageEvent) => {
      if (event.data?.type !== 'REQUEST_AUTH_STATE') return;
      const origin = event.origin;
      if (origin !== window.location.origin && !origin.endsWith('.onrender.com')) return;
      event.source?.postMessage(
        { type: 'AUTH_STATE', payload: { isAuthenticated, user, isLoading } },
        { targetOrigin: origin } as WindowPostMessageOptions,
      );
    };

    // Inactivity / account lock → log out silently.
    const onSessionTimeout = () => logout();
    const onAccountLocked  = () => logout();

    // Fired by msalAccessToken when the refresh token is confirmed expired.
    // Just clear state — do NOT call loginRedirect automatically. The user will
    // be prompted to sign in next time they click something that needs auth.
    const onSessionExpired = () => {
      console.warn('[Auth] Session expired — clearing state');
      localStorage.removeItem('auth_token');
      if (!cancelled) { setIsAuthenticated(false); setUser(null); }
    };

    window.addEventListener('message',            onAuthRequest);
    window.addEventListener('session_timeout',    onSessionTimeout);
    window.addEventListener('account-locked',     onAccountLocked);
    window.addEventListener('auth-session-expired', onSessionExpired);

    return () => {
      cancelled = true;
      window.removeEventListener('message',              onAuthRequest);
      window.removeEventListener('session_timeout',      onSessionTimeout);
      window.removeEventListener('account-locked',       onAccountLocked);
      window.removeEventListener('auth-session-expired', onSessionExpired);
    };
  }, [instance, accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync a read-only auth snapshot to localStorage for the landlord iframe.
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(
        'proptii_auth_state',
        JSON.stringify({ isAuthenticated, userId: user?.id ?? null }),
      );
    }
  }, [isAuthenticated, user?.id, isLoading]);

  // Auto-merge anonymous guest chat conversations on sign-in.
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    import('../services/quickRequestService')
      .then((m) => m.default.autoMerge(user.email))
      .catch((err) => console.error('[Auth] Auto-merge error:', err));
  }, [isAuthenticated, user?.email]);

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Initiates sign-in via a full-page redirect to Azure B2C.
   *
   * We deliberately use loginRedirect (not loginPopup) because:
   * - Azure B2C sets Cross-Origin-Opener-Policy: same-origin on their auth
   *   pages, which nullifies window.opener on return and causes MSAL's popup
   *   handler to throw a BrowserAuthError with empty .message — this is the
   *   exact crash that shows "Something went wrong / Error" in the ErrorBoundary.
   * - Redirect flows work reliably regardless of COOP headers.
   */
  const login = async (): Promise<void> => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    const req = {
      ...loginRequest,
      state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined,
      redirectStartPage: window.location.href,
    };
    try {
      await instance.loginRedirect(req);
      // loginRedirect navigates away — code below never runs in this tab.
    } catch (err) {
      console.error('[Auth] loginRedirect failed:', err);
      // Nothing else we can do — the redirect itself failed (e.g. B2C unreachable).
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: false } }));
    }
  };

  /**
   * Signs out via a full-page redirect so MSAL can clear its server-side
   * session cookie at B2C and the local cache atomically.
   */
  const logout = async (): Promise<void> => {
    sessionManager.updateActivity('interaction', 'User logout');

    // Mock user logout — just clear state, no MSAL round-trip needed.
    if (user?.id?.startsWith('tenant-test-') || user?.id?.startsWith('landlord-test-')) {
      setIsAuthenticated(false);
      setUser(null);
      clearAuthStorage();
      return;
    }

    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      });
      // logoutRedirect navigates away — code below never runs.
    } catch (err) {
      // Redirect itself failed — clear local state so the UI isn't stuck.
      console.error('[Auth] logoutRedirect failed:', err);
      setIsAuthenticated(false);
      setUser(null);
      clearAuthStorage();
    }
  };

  const loginAsMockUser = (id: string, role: string): void => {
    const names: Record<string, { name: string; givenName: string; familyName: string; email: string }> = {
      'tenant-test-001':   { name: 'Sarah Jones', givenName: 'Sarah', familyName: 'Jones',  email: 'tenant@test.proptii.co' },
      'tenant-test-002':   { name: 'Emily Davis', givenName: 'Emily', familyName: 'Davis',  email: 'tenant-two@test.proptii.co' },
      'landlord-test-001': { name: 'John Smith',  givenName: 'John',  familyName: 'Smith',  email: 'landlord@test.proptii.co' },
      'landlord-test-002': { name: 'Jack Smith',  givenName: 'Jack',  familyName: 'Smith',  email: 'landlord-two@test.proptii.co' },
    };
    const defaults = { name: `Test ${role}`, givenName: 'Test', familyName: role, email: `${role}@test.proptii.co` };
    const info = names[id] ?? defaults;
    localStorage.setItem('mock_token', `mock-token-${id}`);
    setUser({ id, ...info, roles: [role], roleResolved: true });
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  /**
   * Opens the B2C profile-edit policy.
   * Uses a popup here (not redirect) so the user stays on the current page
   * while editing. If the popup is blocked, we open a plain window as fallback
   * and poll for its close to trigger a silent token refresh.
   */
  const editProfile = async (): Promise<void> => {
    setIsLoading(true);
    sessionManager.updateActivity('interaction', 'Profile edit');
    try {
      const result = await instance.loginPopup({
        scopes: loginRequest.scopes,
        authority: `https://proptii.b2clogin.com/proptii.onmicrosoft.com/${b2cPolicies.editProfile}`,
        prompt: 'login',
      });
      if (result?.account) {
        const stableUserId = resolveUserId(result.account as any);
        const phone = extractPhoneNumber(result.account.idTokenClaims as Record<string, unknown>);
        setUser((prev) =>
          prev ? { ...prev, id: stableUserId, name: result.account.name ?? '', email: result.account.username, phone } : prev,
        );
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: true, userId: stableUserId } }));
      }
    } catch (msalErr) {
      // Popup was blocked or COOP-killed — open a plain window and poll for close.
      console.warn('[Auth] Profile-edit popup failed, opening fallback window:', msalErr);
      const url = `https://proptii.b2clogin.com/proptii.onmicrosoft.com/oauth2/v2.0/authorize`
        + `?p=b2c_1_profileediting`
        + `&client_id=${msalConfig.auth.clientId}`
        + `&nonce=defaultNonce`
        + `&redirect_uri=${encodeURIComponent(window.location.origin)}`
        + `&scope=openid&response_type=id_token&prompt=login`;
      const win = window.open(url, '_blank', 'width=600,height=700');
      if (!win) { alert('Popup blocked — please allow popups for this site.'); return; }
      const poll = setInterval(async () => {
        if (!win.closed) return;
        clearInterval(poll);
        const account = accounts[0];
        if (!account) return;
        try {
          await instance.acquireTokenSilent({ ...loginRequest, account, forceRefresh: true });
        } catch { /* non-fatal */ }
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async (): Promise<void> => {
    const account = accounts[0];
    if (!account) return;
    try {
      await instance.acquireTokenSilent({ ...loginRequest, account, forceRefresh: true });
    } catch (silentErr) {
      try {
        await instance.acquireTokenPopup({ ...loginRequest, account });
      } catch (err) {
        console.error('[Auth] refreshUserData failed:', err);
        throw err;
      }
    }
  };

  const patchUser = (patch: Partial<User>): void => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const userRole = (user?.roles?.[0] as 'tenant' | 'landlord' | 'agent' | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, userRole, login, loginAsMockUser, logout, editProfile, refreshUserData, patchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── MSALProviderWrapper ──────────────────────────────────────────────────────

export const MSALProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <MsalProvider instance={getMsalInstance()}>
    <AuthProvider>{children}</AuthProvider>
  </MsalProvider>
);

export default AuthContext;
