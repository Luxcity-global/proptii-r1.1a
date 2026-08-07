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
import { getAccessTokenForApiRequest } from '../services/msalAccessToken';
import { notifyAuthReady } from '../services/authReady';

// ─── MSAL singleton ──────────────────────────────────────────────────────────

let msalInstance: PublicClientApplication | null = null;
/** Settled once initialize() completes — awaited by axios interceptors. */
let msalInitPromise: Promise<void> | null = null;

export const getMsalInstance = (): PublicClientApplication => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);

    msalInitPromise = msalInstance.initialize();
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

/** Await MSAL initialization before making API calls that need a valid token. */
export async function waitForMsalReady(): Promise<void> {
  if (!msalInstance) getMsalInstance();
  if (msalInitPromise) await msalInitPromise;
}

// Re-export from the canonical leaf module so any existing imports from AuthContext keep working.
export { isAuthReady, waitForAuthReady } from '../services/authReady';

// ─── Types ───────────────────────────────────────────────────────────────────

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
   * Patch the in-memory user immediately without a full re-init.
   * Used by RoleSelect after writing a new role so the React tree sees
   * the updated role before any navigation happens — no page reload needed.
   */
  patchUser: (patch: Partial<User>) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract phone number from Azure AD B2C id-token claims.
 * Azure B2C custom attributes land as `extension_<AttributeName>`.
 */
function extractPhoneNumber(claims: Record<string, unknown> | undefined): string | undefined {
  if (!claims) return undefined;
  const keys = [
    'extension_PhoneNumber',
    'phoneNumber',
    'phone_number',
    'mobilePhone',
    'extension_phoneNumber',
    'telephone',
  ];
  for (const key of keys) {
    if (typeof claims[key] === 'string' && claims[key]) return claims[key] as string;
  }
  return undefined;
}

/** Derive a stable user ID from token claims (oid > sub > localAccountId). */
function resolveUserId(account: { idTokenClaims?: Record<string, unknown>; localAccountId?: string; homeAccountId?: string }): string {
  return (
    (account.idTokenClaims?.oid as string) ||
    (account.idTokenClaims?.sub as string) ||
    account.localAccountId ||
    account.homeAccountId ||
    ''
  );
}

const LANDLORD_ROLES = new Set(['landlord', 'agent']);
const SESSION_KEYS = ['mock_token', 'auth_token', 'proptii_auth_state', 'redirectAfterLogin'];

function clearSessionStorage(): void {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem('redirectAfterLogin');
}

/** Sync Firebase identity from B2C token. Non-fatal on failure. */
async function syncFirebaseAuth(b2cToken: string): Promise<void> {
  const base = (import.meta.env.VITE_NEST_API_ENDPOINT || 'http://localhost:3000').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/auth/firebase-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${b2cToken}`, 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const { firebaseToken } = await res.json();
      if (firebaseToken) await signInWithCustomToken(auth, firebaseToken);
    } else {
      console.warn('[Auth] Firebase token exchange failed:', res.status, res.statusText);
      window.dispatchEvent(
        new CustomEvent('firebase-auth-sync-failed', { detail: { status: res.status } }),
      );
    }
  } catch (err) {
    console.error('[Auth] Firebase sync error:', err);
    window.dispatchEvent(
      new CustomEvent('firebase-auth-sync-failed', {
        detail: { message: err instanceof Error ? err.message : 'Unknown' },
      }),
    );
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

  // ── Initialise auth on mount / account change ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Mock user shortcut (dev toolbar)
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

        // Process any pending B2C redirect
        const redirect = await instance.handleRedirectPromise();
        if (redirect?.account) instance.setActiveAccount(redirect.account);

        if (redirect?.state) {
          try {
            const parsed = JSON.parse(redirect.state);
            if (parsed.redirect) sessionStorage.setItem('redirectAfterLogin', parsed.redirect);
          } catch { /* state is not JSON, ignore */ }
        }

        if (accounts.length === 0) return;

        const account = accounts[0];
        instance.setActiveAccount(account);

        const userId = resolveUserId(account as any);
        const phone  = extractPhoneNumber(account.idTokenClaims as Record<string, unknown>);

        // Resolve role from Firestore/backend
        let roles: string[]    = [];
        let roleResolved        = false;
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

        // Firebase sync (non-blocking)
        const b2cToken = await getAccessTokenForApiRequest().catch(() => null);
        if (b2cToken) syncFirebaseAuth(b2cToken);

        // Silent token refresh (non-fatal)
        instance.acquireTokenSilent({ ...loginRequest, account }).catch((err) => {
          if (!(err instanceof InteractionRequiredAuthError)) {
            console.warn('[Auth] Silent token refresh failed:', err);
          }
        });

        sessionManager.updateActivity('authentication', 'Session initialized');
      } catch (err) {
        if (err instanceof InteractionRequiredAuthError) {
          if (!cancelled) { setIsAuthenticated(false); setUser(null); }
        }
        console.error('[Auth] Initialization error:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          notifyAuthReady();
        }
      }
    };

    init();

    // Cross-iframe auth bridge for the landlord sub-app
    const onAuthRequest = (event: MessageEvent) => {
      if (event.data?.type !== 'REQUEST_AUTH_STATE') return;
      const origin = event.origin;
      // Only respond to same-origin or known Render origins
      if (origin !== window.location.origin && !origin.endsWith('.onrender.com')) return;

      event.source?.postMessage(
        { type: 'AUTH_STATE', payload: { isAuthenticated, user, isLoading } },
        { targetOrigin: origin } as WindowPostMessageOptions,
      );
    };

    const onSessionTimeout = () => logout();
    const onAccountLocked  = () => logout();
    // Fired by msalAccessToken.ts when refresh token is also expired (InteractionRequiredAuthError).
    // Clear auth state and redirect to login so the user isn't stuck in a 401 loop.
    const onSessionExpired = () => {
      console.warn('[Auth] Session fully expired — clearing state and redirecting to login');
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setUser(null);
      // loginPopup() gets blocked by browsers when not initiated by a user click,
      // which causes COOP errors and React ErrorBoundary crashes.
      // Use loginRedirect instead for automatic session expiry.
      instance.loginRedirect(loginRequest).catch(console.error);
    };

    window.addEventListener('message', onAuthRequest);
    window.addEventListener('session_timeout', onSessionTimeout);
    window.addEventListener('account-locked', onAccountLocked);
    window.addEventListener('auth-session-expired', onSessionExpired);

    return () => {
      cancelled = true;
      window.removeEventListener('message', onAuthRequest);
      window.removeEventListener('session_timeout', onSessionTimeout);
      window.removeEventListener('account-locked', onAccountLocked);
      window.removeEventListener('auth-session-expired', onSessionExpired);
    };
  }, [instance, accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync auth state to localStorage for the landlord iframe (read-only snapshot)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(
        'proptii_auth_state',
        JSON.stringify({ isAuthenticated, userId: user?.id ?? null }),
      );
    }
  }, [isAuthenticated, user?.id, isLoading]);

  // Auto-merge guest conversations on login
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    import('../services/quickRequestService')
      .then((m) => m.default.autoMerge(user.email))
      .catch((err) => console.error('[Auth] Auto-merge error:', err));
  }, [isAuthenticated, user?.email]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = async (): Promise<void> => {
    setIsLoading(true);
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    const req = {
      ...loginRequest,
      state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined,
    };

    try {
      const result = await instance.loginPopup(req);
      if (result?.account) instance.setActiveAccount(result.account);

      const userId = resolveUserId(result.account as any);
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: true, userId } }));
      setIsAuthenticated(true);

      const phone = extractPhoneNumber(result.account?.idTokenClaims as Record<string, unknown>);

      let roles: string[] = [];
      let roleResolved = false;
      try {
        const { resolveRole } = await import('../services/roleService');
        const role = await resolveRole(userId, result.account?.username ?? '');
        if (role) {
          roles = [role];
          roleResolved = true;
          if (LANDLORD_ROLES.has(role)) {
            const redir = sessionStorage.getItem('redirectAfterLogin');
            if (!redir || redir === '/dashboard' || redir === '/') {
              sessionStorage.setItem('redirectAfterLogin', '/landlord');
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Role resolution on login failed:', err);
      }

      setUser({
        id: userId,
        email:      result.account?.username ?? '',
        name:       result.account?.name,
        givenName:  result.account?.name?.split(' ')[0],
        familyName: result.account?.name?.split(' ').slice(1).join(' '),
        phone,
        roles,
        roleResolved,
      });

      sessionManager.updateActivity('interaction', 'User login');
    } catch (err) {
      console.error('[Auth] Login popup failed, falling back to redirect:', err);
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: false } }));
      await instance.loginRedirect({ ...req, redirectStartPage: window.location.href });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    sessionManager.updateActivity('interaction', 'User logout');

    // Mock user logout
    if (user?.id.startsWith('tenant-test-') || user?.id.startsWith('landlord-test-')) {
      setIsAuthenticated(false);
      setUser(null);
      clearSessionStorage();
      setIsLoading(false);
      return;
    }

    try {
      await instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    } catch {
      await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      clearSessionStorage();
      setIsLoading(false);
    }
  };

  const loginAsMockUser = (id: string, role: string): void => {
    const names: Record<string, { name: string; givenName: string; familyName: string; email: string }> = {
      'tenant-test-001':   { name: 'Sarah Jones',  givenName: 'Sarah',  familyName: 'Jones',  email: 'tenant@test.proptii.co' },
      'tenant-test-002':   { name: 'Emily Davis',  givenName: 'Emily',  familyName: 'Davis',  email: 'tenant-two@test.proptii.co' },
      'landlord-test-001': { name: 'John Smith',   givenName: 'John',   familyName: 'Smith',  email: 'landlord@test.proptii.co' },
      'landlord-test-002': { name: 'Jack Smith',   givenName: 'Jack',   familyName: 'Smith',  email: 'landlord-two@test.proptii.co' },
    };
    const defaults = { name: `Test ${role}`, givenName: 'Test', familyName: role, email: `${role}@test.proptii.co` };
    const info = names[id] ?? defaults;

    localStorage.setItem('mock_token', `mock-token-${id}`);
    setUser({ id, ...info, roles: [role], roleResolved: true });
    setIsAuthenticated(true);
    setIsLoading(false);
  };

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
          prev
            ? { ...prev, id: stableUserId, name: result.account.name ?? '', email: result.account.username, phone }
            : prev,
        );
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: true, userId: stableUserId } }));
      }
    } catch (msalErr) {
      // Fallback: open policy URL in new window and refresh when it closes
      console.warn('[Auth] Profile edit popup failed, opening window:', msalErr);
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
        // Quietly attempt a silent refresh to pick up updated claims
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
