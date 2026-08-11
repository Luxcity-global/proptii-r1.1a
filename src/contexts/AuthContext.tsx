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

let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<void> | null = null;

export const getMsalInstance = (): PublicClientApplication => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    msalInitPromise = msalInstance.initialize() as Promise<void>;
    msalInitPromise.catch((err) => console.error('[Auth] MSAL initialize() failed:', err));

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

export async function waitForMsalReady(): Promise<void> {
  if (!msalInstance) getMsalInstance();
  if (msalInitPromise) await msalInitPromise;
}

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
  patchUser: (patch: Partial<User>) => void;
}

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
  // Clear all role cache entries (keyed by uid)
  Object.keys(localStorage)
    .filter(k => k.startsWith('proptii_role_'))
    .forEach(k => localStorage.removeItem(k));
}

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
      console.warn('[Auth] Firebase token exchange failed:', res.status, res.statusText);
      window.dispatchEvent(new CustomEvent('firebase-auth-sync-failed', { detail: { status: res.status } }));
    }
  } catch (err) {
    console.warn('[Auth] Firebase sync error (non-fatal):', err instanceof Error ? err.message : err);
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

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Dev mock shortcut
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

        // Process any pending B2C redirect response — MUST be awaited before
        // any other MSAL call to avoid racing MSAL's internal hydration.
        const redirect = await instance.handleRedirectPromise();
        if (redirect?.account) instance.setActiveAccount(redirect.account);
        if (redirect?.state) {
          try {
            const parsed = JSON.parse(redirect.state);
            if (parsed.redirect) sessionStorage.setItem('redirectAfterLogin', parsed.redirect);
          } catch { /* state is not JSON */ }
        }

        const logoutInProgress = sessionStorage.getItem('logout_in_progress');
        if (accounts.length === 0) {
          if (logoutInProgress) {
            sessionStorage.removeItem('logout_in_progress');
          }
          return;
        }

        if (logoutInProgress === 'true') {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

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
            roles = [role];
            if (LANDLORD_ROLES.has(role)) {
              const redir = sessionStorage.getItem('redirectAfterLogin');
              if (!redir || redir === '/dashboard') {
                sessionStorage.setItem('redirectAfterLogin', '/landlord');
              }
            }
          }
          roleResolved = true;
        } catch (err) {
          console.error('[Auth] Role resolution failed:', err);
          // roleResolved stays false — ProtectedRoute holds on spinner
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

        // Firebase sync — non-blocking, uses MSAL directly to avoid deadlock
        // with waitForAuthReady() (notifyAuthReady hasn't fired yet here).
        instance.acquireTokenSilent({ ...loginRequest, account })
          .then((r) => { if (r.idToken) syncFirebaseAuth(r.idToken); })
          .catch((e) => {
            console.warn('[Auth] Firebase sync token failed (non-fatal):', e?.message ?? e);
          });

        sessionManager.updateActivity('authentication', 'Session initialized');

      } catch (err) {
        const code = (err as any)?.errorCode ?? (err as any)?.name ?? 'unknown';
        console.error('[Auth] init() error — code:', code, err);
        if (err instanceof InteractionRequiredAuthError) {
          if (!cancelled) { setIsAuthenticated(false); setUser(null); }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          notifyAuthReady();
        }
      }
    };

    init();

    const onAuthRequest = (event: MessageEvent) => {
      if (event.data?.type !== 'REQUEST_AUTH_STATE') return;
      const origin = event.origin;
      if (origin !== window.location.origin && !origin.endsWith('.onrender.com')) return;
      event.source?.postMessage(
        { type: 'AUTH_STATE', payload: { isAuthenticated, user, isLoading } },
        { targetOrigin: origin } as WindowPostMessageOptions,
      );
    };

    const onSessionTimeout = () => logout();
    const onAccountLocked  = () => logout();
    const onSessionExpired = () => {
      console.warn('[Auth] Session expired — clearing auth state');
      localStorage.removeItem('auth_token');
      if (!cancelled) { setIsAuthenticated(false); setUser(null); }
    };

    window.addEventListener('message',              onAuthRequest);
    window.addEventListener('session_timeout',      onSessionTimeout);
    window.addEventListener('account-locked',       onAccountLocked);
    window.addEventListener('auth-session-expired', onSessionExpired);

    return () => {
      cancelled = true;
      window.removeEventListener('message',              onAuthRequest);
      window.removeEventListener('session_timeout',      onSessionTimeout);
      window.removeEventListener('account-locked',       onAccountLocked);
      window.removeEventListener('auth-session-expired', onSessionExpired);
    };
  }, [instance, accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(
        'proptii_auth_state',
        JSON.stringify({ isAuthenticated, userId: user?.id ?? null }),
      );
    }
  }, [isAuthenticated, user?.id, isLoading]);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    import('../services/quickRequestService')
      .then((m) => m.default.autoMerge(user.email))
      .catch((err) => console.error('[Auth] Auto-merge error:', err));
  }, [isAuthenticated, user?.email]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = async (): Promise<void> => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    const req = {
      ...loginRequest,
      state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined,
      redirectStartPage: window.location.href,
    };
    try {
      await instance.loginRedirect(req);
    } catch (err) {
      console.error('[Auth] loginRedirect() failed:', err);
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: false } }));
    }
  };

  const logout = async (): Promise<void> => {
    sessionManager.updateActivity('interaction', 'User logout');

    // Set logout in progress to prevent init() from re-authenticating the user
    // during the redirect round-trip.
    sessionStorage.setItem('logout_in_progress', 'true');

    // Clear local state immediately — do not wait for any MSAL round-trip.
    setIsAuthenticated(false);
    setUser(null);
    clearAuthStorage();

    // Mock user: nothing further needed.
    if (user?.id?.startsWith('tenant-test-') || user?.id?.startsWith('landlord-test-')) {
      sessionStorage.removeItem('logout_in_progress');
      return;
    }

    try {
      const activeAccount = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
      await instance.logoutRedirect({
        account: activeAccount ?? undefined,
      });
    } catch (err) {
      console.warn('[Auth] logoutRedirect() threw (local state already cleared):', err);
      sessionStorage.removeItem('logout_in_progress');
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
      console.warn('[Auth] editProfile popup failed — opening fallback window:', msalErr);
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

export const MSALProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <MsalProvider instance={getMsalInstance()}>
    <AuthProvider>{children}</AuthProvider>
  </MsalProvider>
);

export default AuthContext;
