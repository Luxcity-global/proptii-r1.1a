import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import SessionManager from '../services/SessionManager';
import { notifyAuthReady } from '../services/authReady';
import userService from '../services/userService';
import EditProfileModal from '../components/profile/EditProfileModal';

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
  login: (providerType?: 'microsoft' | 'google') => Promise<void>;
  loginAsMockUser: (id: string, role: string) => void;
  logout: () => Promise<void>;
  editProfile: () => Promise<void>;
  updateUserProfile: (data: { name: string; phone?: string }) => Promise<void>;
  refreshUserData: () => Promise<void>;
  patchUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LANDLORD_ROLES = new Set(['landlord', 'agent']);

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const sessionManager = SessionManager.getInstance();

  const clearAuthStorage = () => {
    sessionStorage.removeItem('firebase_token');
    sessionStorage.removeItem('user_roles');
    sessionStorage.removeItem('user_email');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('last_auth_provider');
  };

  // Listen for global open-edit-profile-modal event
  useEffect(() => {
    const handleOpenEdit = () => {
      setIsEditProfileModalOpen(true);
    };
    window.addEventListener('open-edit-profile-modal', handleOpenEdit);
    return () => {
      window.removeEventListener('open-edit-profile-modal', handleOpenEdit);
    };
  }, []);

  // Primary: Pure Firebase Auth observer
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Check for mock token fallback
        const mockToken = localStorage.getItem('mock_token');
        if (mockToken && mockToken.startsWith('mock-token-')) {
          const id = mockToken.replace('mock-token-', '');
          const role = id.startsWith('landlord-') ? 'landlord' : 'tenant';
          if (!cancelled) {
            setUser({
              id,
              name: `Test ${role}`,
              givenName: 'Test',
              familyName: role,
              email: `${role}@test.proptii.co`,
              roles: [role],
              roleResolved: true,
            });
            setIsAuthenticated(true);
            setIsLoading(false);
            notifyAuthReady();
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: true } }));
          }
          return;
        }

        if (!cancelled) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          notifyAuthReady();
          window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: false } }));
        }
        return;
      }

      const userId = firebaseUser.uid;
      const email = firebaseUser.email || '';
      let name = firebaseUser.displayName || email.split('@')[0];
      let phone = firebaseUser.phoneNumber || undefined;

      // Check cached profile in localStorage
      try {
        const cached = localStorage.getItem(`proptii_profile_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) name = parsed.name;
          if (parsed.phone) phone = parsed.phone;
        }
      } catch {}

      // Check if a phone number was captured during registration flow
      const pendingRegistrationPhone = sessionStorage.getItem('pending_registration_phone');
      if (pendingRegistrationPhone) {
        phone = pendingRegistrationPhone;
        sessionStorage.removeItem('pending_registration_phone');
        try {
          localStorage.setItem(`proptii_profile_${userId}`, JSON.stringify({ name, phone }));
        } catch {}
        void userService.updateUser(userId, { name, phone });
      }

      if (!cancelled) {
        setUser({
          id: userId,
          email,
          name,
          givenName: name.split(' ')[0],
          familyName: name.split(' ').slice(1).join(' '),
          phone,
          roles: [],
          roleResolved: false,
        });
        setIsAuthenticated(true);
        setIsLoading(false);
        notifyAuthReady();
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: true } }));
        sessionManager.updateActivity('authentication', 'Session initialized via Firebase');
      }

      // Asynchronously resolve role in the background without blocking login
      void (async () => {
        try {
          const { resolveRole } = await import('../services/roleService');
          const role = await resolveRole(userId, email);
          if (role && !cancelled) {
            setUser((prev) => (prev ? { ...prev, roles: [role], roleResolved: true } : prev));
          } else if (!cancelled) {
            setUser((prev) => (prev ? { ...prev, roleResolved: true } : prev));
          }
        } catch (err) {
          console.warn('[Auth] Role resolution notice:', err);
          if (!cancelled) {
            setUser((prev) => (prev ? { ...prev, roleResolved: true } : prev));
          }
        }
      })();
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
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('message', onAuthRequest);
    sessionManager.on('sessionTimeout', onSessionTimeout);
    sessionManager.on('accountLocked', onAccountLocked);
    sessionManager.on('sessionExpired', onSessionExpired);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('message', onAuthRequest);
      sessionManager.off('sessionTimeout', onSessionTimeout);
      sessionManager.off('accountLocked', onAccountLocked);
      sessionManager.off('sessionExpired', onSessionExpired);
    };
  }, []);

  const login = async (providerType: 'microsoft' | 'google' = 'google'): Promise<void> => {
    try {
      if (providerType === 'microsoft') {
        try {
          const instance = await getMsalInstance();
          const response = await instance.loginPopup({
            scopes: ['openid', 'profile', 'email'],
            prompt: 'select_account',
          });

          if (response?.account) {
            const account = response.account;
            const email = account.username || '';
            const userId = account.homeAccountId || account.localAccountId;
            const name = account.name || email.split('@')[0];
            const phone = (account.idTokenClaims as any)?.phone || (account.idTokenClaims as any)?.mobilePhone || undefined;

            let roles: string[] = [];
            let roleResolved = false;
            try {
              const { resolveRole } = await import('../services/roleService');
              const role = await resolveRole(userId, email);
              if (role) {
                roles = [role];
              }
              roleResolved = true;
            } catch {
              roleResolved = true;
            }

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
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: true } }));
            return;
          }
        } catch (msalErr: any) {
          console.warn('[Auth] MSAL popup error:', msalErr);
          throw new Error(msalErr?.errorMessage || msalErr?.message || 'Microsoft Sign In failed or was cancelled.');
        }
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('[Auth] Login failed:', err);
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { success: false } }));
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    sessionManager.updateActivity('interaction', 'User logout');
    setIsAuthenticated(false);
    setUser(null);
    clearAuthStorage();
    localStorage.removeItem('mock_token');
    
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Auth] Firebase logout threw:', err);
    }
  };

  const loginAsMockUser = (id: string, role: string) => {
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

  const updateUserProfile = async (data: { name: string; phone?: string }): Promise<void> => {
    if (!user) throw new Error('No authenticated user found.');

    const name = data.name.trim();
    const phone = data.phone?.trim() || undefined;

    // 1. Cache immediately in localStorage
    try {
      localStorage.setItem(`proptii_profile_${user.id}`, JSON.stringify({ name, phone }));
    } catch {}

    // 2. Update local state immediately
    const givenName = name.split(' ')[0];
    const familyName = name.split(' ').slice(1).join(' ');
    setUser((prev) => (prev ? { ...prev, name, givenName, familyName, phone } : prev));

    // 3. Update Firebase Auth displayName
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name });
      } catch (fbErr) {
        console.warn('[Auth] Firebase displayName update notice:', fbErr);
      }
    }

    // 4. Persist to Firestore / backend asynchronously
    void userService.updateUser(user.id, {
      name,
      phone,
    }).catch((apiErr) => {
      console.warn('[Auth] UserService profile update warning:', apiErr);
    });
  };

  const editProfile = async (): Promise<void> => {
    setIsEditProfileModalOpen(true);
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
      value={{
        user,
        isAuthenticated,
        isLoading,
        userRole,
        login,
        loginAsMockUser,
        logout,
        editProfile,
        updateUserProfile,
        refreshUserData,
        patchUser,
      }}
    >
      {children}

      {/* Global In-App Edit Profile Modal */}
      {isAuthenticated && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          initialName={user?.name || user?.givenName || ''}
          initialEmail={user?.email || ''}
          initialPhone={user?.phone || ''}
          onSave={updateUserProfile}
        />
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
