import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMsal, MsalProvider } from '@azure/msal-react';
import {
  PublicClientApplication,
  EventType,
  EventMessage,
  AuthenticationResult,
  InteractionRequiredAuthError,
  AccountInfo
} from '@azure/msal-browser';
import { msalConfig, loginRequest, b2cPolicies } from '../config/authConfig';
import SessionManager from '../services/SessionManager';
import SecurityMiddleware from '../middleware/SecurityMiddleware';
import SecurityPolicyService from '../services/SecurityPolicyService';

// Singleton pattern for MSAL instance
let msalInstance: PublicClientApplication | null = null;

// Initialize MSAL instance only once
export const getMsalInstance = () => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    
    // Initialize the MSAL instance
    msalInstance.initialize().catch(error => {
      console.error("Error initializing MSAL:", error);
    });

    // Register event callbacks for redirect handling
    msalInstance.addEventCallback((event: EventMessage) => {
      if (event.eventType === EventType.LOGIN_SUCCESS) {
        console.log('Login successful');
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        console.log('Logout successful');
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
      if (event.eventType === EventType.LOGIN_FAILURE || event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
        console.log('Authentication failed:', event.error && 'errorMessage' in event.error ? event.error.errorMessage : event.error?.message);
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
    });
  }
  return msalInstance;
};

// Development mode flag - set to true to bypass authentication for development
const DEV_MODE = false; // Set to false in production

// Initialize services
const securityPolicyService = SecurityPolicyService.getInstance();

interface User {
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  editProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to check if popups are blocked
const isPopupBlocked = (popup: Window | null): boolean => {
  return popup === null || typeof popup === 'undefined' || popup.closed || popup.closed === undefined;
};

// Provider component to wrap the app with
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionManager = SessionManager.getInstance();
  const securityMiddleware = SecurityMiddleware.getInstance();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Handle redirect response if any
        await instance.handleRedirectPromise();

        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          setIsAuthenticated(true);
          setUser({
            id: currentAccount.localAccountId || currentAccount.homeAccountId,
            givenName: currentAccount.name?.split(' ')[0],
            familyName: currentAccount.name?.split(' ').slice(1).join(' '),
            email: currentAccount.username,
            name: currentAccount.name
          });

          // Try silent token acquisition
          await instance.acquireTokenSilent({
            ...loginRequest,
            account: currentAccount
          });

          // Record session activity
          sessionManager.recordActivity('interaction', 'Session initialized');
        }
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // Silent token acquisition failed, user needs to sign in interactively
          setIsAuthenticated(false);
          setUser(null);
        }
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for session timeout
    const handleSessionTimeout = () => {
      logout();
    };
    window.addEventListener('session_timeout', handleSessionTimeout);

    // Listen for account lockout
    const handleAccountLockout = () => {
      logout();
      // Show lockout notification to user
      // You would need to implement this UI component
    };
    window.addEventListener('account-locked', handleAccountLockout);

    // Listen for password reuse attempts
    const handlePasswordReuseAttempt = () => {
      // Show password reuse error to user
      // You would need to implement this UI component
    };
    window.addEventListener('password-reuse-attempt', handlePasswordReuseAttempt);

    return () => {
      window.removeEventListener('session_timeout', handleSessionTimeout);
      window.removeEventListener('account-locked', handleAccountLockout);
      window.removeEventListener('password-reuse-attempt', handlePasswordReuseAttempt);
    };
  }, [instance, accounts]);

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // First, refresh CSRF token
      await securityMiddleware.refreshCsrfToken();

      // Try popup login
      const result = await instance.loginPopup(loginRequest);

      if (result) {
        // Dispatch auth state change event with success status
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: {
            success: true,
            userId: result.account?.localAccountId || result.account?.homeAccountId
          }
        }));

        setIsAuthenticated(true);
        setUser({
          id: result.account?.localAccountId || result.account?.homeAccountId || '',
          email: result.account?.username || '',
          name: result.account?.name,
          givenName: result.account?.name?.split(' ')[0],
          familyName: result.account?.name?.split(' ').slice(1).join(' ')
        });

        // Record login activity
        sessionManager.recordActivity('interaction', 'User login');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Dispatch auth state change event with failure status
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: {
          success: false,
          userId: accounts[0]?.localAccountId || accounts[0]?.homeAccountId
        }
      }));

      // Try redirect login as fallback
      await instance.loginRedirect(loginRequest);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Record logout activity before clearing session
      sessionManager.recordActivity('interaction', 'User logout');

      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      });

      setIsAuthenticated(false);
      setUser(null);

      // Clear session
      localStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Try redirect logout as fallback
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Record profile edit activity
      sessionManager.recordActivity('interaction', 'Profile edit');

      await instance.loginPopup({
        ...loginRequest,
        authority: `${instance.config.auth?.authority}/profile-edit`
      });
    } catch (error) {
      console.error('Profile edit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        editProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// MSAL Provider wrapper component
interface MSALProviderWrapperProps {
  children: ReactNode;
}

export const MSALProviderWrapper: React.FC<MSALProviderWrapperProps> = ({ children }) => {
  return (
    <MsalProvider instance={getMsalInstance()}>
      <AuthProvider>{children}</AuthProvider>
    </MsalProvider>
  );
};

export default AuthContext;