import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import SessionManager from '../services/SessionManager';
import { notifyAuthReady } from '../services/authReady';

import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../config/authConfig';

let msalInstance: PublicClientApplication | null = null;

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize().catch(() => {});
    await msalInstance.handleRedirectPromise().catch(() => null);
  }
  return msalInstance;
}

export async function waitForMsalReady(): Promise<void> {
  await getMsalInstance();
}

export const MSALProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

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
const LANDLORD_ROLES = new Set(['landlord', 'agent']);
const LOCAL_STORAGE_KEYS = ['mock_token', 'auth_token', 'proptii_auth_state'];

function clearAuthStorage(): void {
  LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem('redirectAfterLogin');
  Object.keys(localStorage)
    .filter(k => k.startsWith('proptii_role_'))
    .forEach(k => localStorage.removeItem(k));
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────
interface AuthProviderProps { children: ReactNode }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser]                       = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  const sessionManager = SessionManager.getInstance();

  useEffect(() => {
    let cancelled = false;

    // Check for dev mock token first
    const mockToken = localStorage.getItem('mock_token');
    if (mockToken?.startsWith('mock-token-')) {
      const id   = mockToken.replace('mock-token-', '');
      const role = id.startsWith('tenant') ? 'tenant' : 'landlord';
      setUser({ id, email: `${role}@test.proptii.co`, name: `Test ${role}`, roles: [role], roleResolved: true });
      setIsAuthenticated(true);
      setIsLoading(false);
      notifyAuthReady();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;

      if (!firebaseUser) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        notifyAuthReady();
        return;
      }

      const userId = firebaseUser.uid;
      const email = firebaseUser.email || '';
      const name = firebaseUser.displayName || email.split('@')[0];
      const phone = firebaseUser.phoneNumber || undefined;

      let roles: string[] = [];
      let roleResolved = false;
      try {
        const { resolveRole } = await import('../services/roleService');
        const role = await resolveRole(userId, email);
        if (role) {
          roles = [role];
          if (LANDLORD_ROLES.has(role)) {
            const redir = sessionStorage.getItem('redirectAfterLogin');
            if (!redir || redir === '/dashboard' || redir === '/') {
              sessionStorage.setItem('redirectAfterLogin', '/landlord');
            }
          }
        }
        roleResolved = true;
      } catch (err) {
        console.error('[Auth] Role resolution failed:', err);
      }

      if (!cancelled) {
        setUser({
          id: userId,
          email,
          name,
          givenName: name.split(' ')[0],
          familyName: name.split(' ').slice(1).join(' '),
          phone,
          roles,
          roleResolved,
        });
        setIsAuthenticated(true);
        setIsLoading(false);
        notifyAuthReady();
        sessionManager.updateActivity('authentication', 'Session initialized via Firebase');
      }
    });

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
      unsubscribe();
      window.removeEventListener('message',              onAuthRequest);
      window.removeEventListener('session_timeout',      onSessionTimeout);
      window.removeEventListener('account-locked',       onAccountLocked);
      window.removeEventListener('auth-session-expired', onSessionExpired);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const login = async (providerType?: 'microsoft' | 'google'): Promise<void> => {
    try {
      if (providerType === 'microsoft' || !providerType) {
        try {
          const msal = await getMsalInstance();
          const { loginRequest } = await import('../config/authConfig');
          const response = await msal.loginPopup(loginRequest);
          if (response?.account) {
            const email = response.account.username || response.account.name || 'user@proptii.co';
            const name = response.account.name || email.split('@')[0];
            const role = email.includes('landlord') ? 'landlord' : 'tenant';
            setUser({
              id: response.account.homeAccountId || response.account.localAccountId,
              email,
              name,
              roles: [role],
              roleResolved: true,
            });
            setIsAuthenticated(true);
            setIsLoading(false);
            notifyAuthReady();
            return;
          }
        } catch (msalErr: any) {
          console.warn('[Auth] MSAL popup error:', msalErr);
          throw new Error(msalErr?.errorMessage || msalErr?.message || 'Microsoft Sign In failed or was cancelled.');
        }
      }

      // Firebase Google Auth fallback
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('[Auth] Login failed:', err);
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: false } }));
    }
  };

  const logout = async (): Promise<void> => {
    sessionManager.updateActivity('interaction', 'User logout');
    setIsAuthenticated(false);
    setUser(null);
    clearAuthStorage();
    
    // Mock user — nothing more needed
    if (user?.id?.startsWith('tenant-test-') || user?.id?.startsWith('landlord-test-')) return;
    
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Auth] Firebase logout threw:', err);
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
    console.warn('editProfile not implemented for Firebase yet.');
  };

  const refreshUserData = async (): Promise<void> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
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

export default AuthContext;
