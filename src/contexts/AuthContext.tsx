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
  phone?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  editProfile: () => Promise<void>;
  refreshUserData: () => Promise<void>;
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

// Helper function to extract phone number from token claims
const extractPhoneNumber = (claims: any): string | undefined => {
  if (!claims) {
    console.log('❌ No claims provided to extractPhoneNumber');
    return undefined;
  }
  
  console.log('🔍 All available claims:', Object.keys(claims));
  console.log('🔍 All claim values:', claims);
  
  const possibleKeys = [
    'extension_PhoneNumber', // Most common Azure AD B2C custom attribute name
    'Phone Number',
    'phoneNumber',
    'phone_number',
    'mobilePhone',
    'mobile_phone',
    'Mobile Phone',
    'extension_phoneNumber',
    'telephone',
    'telephoneNumber',
    'signInNames.phoneNumber' // Alternative location
  ];
  
  for (const key of possibleKeys) {
    if (claims[key]) {
      console.log(`✅ Found phone number with key "${key}":`, claims[key]);
      return claims[key] as string;
    }
  }
  
  console.log('❌ No phone number found in any of the expected keys');
  return undefined;
};

// Helper function to refresh user data from Azure AD B2C
const refreshUserData = async (instance: any, accounts: any[], loginRequest: any, setUser: any, extractPhoneNumber: any) => {
  try {
    console.log('🔄 Refreshing user data from Azure AD B2C...');
    
    if (!accounts || accounts.length === 0) {
      console.log('No accounts found for refresh');
      return;
    }

    // Try to get fresh token without iframe
    try {
      const freshResult = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
        forceRefresh: true // Force refresh to get latest claims
      });
      
      if (freshResult && freshResult.account) {
        const phoneNumber = extractPhoneNumber(freshResult.account.idTokenClaims);
        const stableUserId = 
          freshResult.account.idTokenClaims?.oid || 
          freshResult.account.idTokenClaims?.sub ||
          freshResult.account.localAccountId || 
          freshResult.account.homeAccountId || 
          '';
        
        setUser({
          id: stableUserId,
          name: freshResult.account.name || '',
          email: freshResult.account.username || '',
          phone: phoneNumber
        });

        console.log('✅ User data refreshed successfully with phone:', phoneNumber);
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: {
            success: true,
            userId: stableUserId
          }
        }));
      }
    } catch (silentError) {
      console.log('Silent token acquisition failed, trying popup approach:', silentError);
      
      // Fallback to popup if silent fails
      try {
        const popupResult = await instance.acquireTokenPopup({
          ...loginRequest,
          account: accounts[0]
        });
        
        if (popupResult && popupResult.account) {
          const phoneNumber = extractPhoneNumber(popupResult.account.idTokenClaims);
          const stableUserId = 
            popupResult.account.idTokenClaims?.oid || 
            popupResult.account.idTokenClaims?.sub ||
            popupResult.account.localAccountId || 
            popupResult.account.homeAccountId || 
            '';
          
          setUser({
            id: stableUserId,
            name: popupResult.account.name || '',
            email: popupResult.account.username || '',
            phone: phoneNumber
          });

          console.log('✅ User data refreshed via popup with phone:', phoneNumber);
          
          // Dispatch auth state change event
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: {
              success: true,
              userId: stableUserId
            }
          }));
        }
      } catch (popupError) {
        console.error('❌ Both silent and popup token acquisition failed:', popupError);
        throw popupError;
      }
    }
  } catch (error) {
    console.error('❌ Error refreshing user data:', error);
    throw error;
  }
};

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
        const redirectResponse = await instance.handleRedirectPromise();
        
        // Check if there's a redirect path in the response state
        if (redirectResponse && redirectResponse.state) {
          try {
            const state = JSON.parse(redirectResponse.state);
            if (state.redirect) {
              console.log('🔐 Restored redirect path from state:', state.redirect);
              sessionStorage.setItem('redirectAfterLogin', state.redirect);
            }
          } catch (e) {
            // State might not be JSON, that's okay
            console.log('State is not JSON:', redirectResponse.state);
          }
        }

        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          setIsAuthenticated(true);
          
          // Debug: Log all available claims
          console.log('🔍 All available token claims:', currentAccount.idTokenClaims);
          console.log('🔍 All claim keys:', Object.keys(currentAccount.idTokenClaims || {}));
          console.log('🔍 All account properties:', Object.keys(currentAccount));
          console.log('🔍 Full token claims object:', JSON.stringify(currentAccount.idTokenClaims, null, 2));
          
          // Try to find phone number in ALL possible locations
          const claims = currentAccount.idTokenClaims || {};
          let phoneNumber = undefined;
          
          console.log('🔍 Searching for phone number in claims...');
          console.log('🔍 All available claim keys:', Object.keys(claims));
          
          // Try exact match for each possible key
          // Azure AD B2C custom attributes are typically named like: extension_PhoneNumber
          const possibleKeys = [
            'extension_PhoneNumber', // Most common Azure AD B2C custom attribute name
            'Phone Number',
            'phoneNumber',
            'phone_number',
            'mobilePhone',
            'mobile_phone',
            'Mobile Phone',
            'extension_phoneNumber',
            'telephone',
            'telephoneNumber',
            'signInNames.phoneNumber' // Alternative location
          ];
          
          for (const key of possibleKeys) {
            if (claims[key as keyof typeof claims]) {
              phoneNumber = claims[key as keyof typeof claims] as string;
              console.log(`✅ Found phone number with key "${key}":`, phoneNumber);
              break;
            } else {
              console.log(`❌ Key "${key}" not found in claims`);
            }
          }
          
          // If no phone number found, log all claims for debugging
          if (!phoneNumber) {
            console.log('❌ No phone number found in any expected keys');
            console.log('🔍 All claims values:', claims);
          }
          
          // Also check direct account properties
          if (!phoneNumber) {
            phoneNumber = (currentAccount as any).phoneNumber || (currentAccount as any).phone;
          }
          
          console.log('📞 Final phone number:', phoneNumber);
          
          const stableUserId = 
            currentAccount.idTokenClaims?.oid || 
            currentAccount.idTokenClaims?.sub ||
            currentAccount.localAccountId || 
            currentAccount.homeAccountId || 
            '';
          
          setUser({
            id: stableUserId,
            givenName: currentAccount.name?.split(' ')[0],
            familyName: currentAccount.name?.split(' ').slice(1).join(' '),
            email: currentAccount.username,
            name: currentAccount.name,
            phone: phoneNumber,
            roles: ['tenant'] // Default role for new users
          });
          
          console.log('👤 User object set with phone:', phoneNumber);

          // Try silent token acquisition
          await instance.acquireTokenSilent({
            ...loginRequest,
            account: currentAccount
          });

          // Record session activity
          sessionManager.updateActivity('interaction', 'Session initialized');
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

    // Authentication bridge - listen for requests from landlord app
    const handleAuthStateRequest = (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_AUTH_STATE') {
        console.log('Tenant app received auth state request from landlord app');
        
        const authState = {
          isAuthenticated,
          user,
          isLoading
        };
        
        // Send authentication state to landlord app
        event.source?.postMessage({
          type: 'AUTH_STATE',
          payload: authState
        }, '*');
        
        // Also store in localStorage for direct access
        localStorage.setItem('proptii_auth_state', JSON.stringify(authState));
      }
    };

    // Listen for authentication state requests
    window.addEventListener('message', handleAuthStateRequest);

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
      window.removeEventListener('message', handleAuthStateRequest);
    };
  }, [instance, accounts]);

  // Broadcast authentication state changes to landlord app
  useEffect(() => {
    const authState = {
      isAuthenticated,
      user,
      isLoading
    };

    // Store in localStorage for landlord app access
    localStorage.setItem('proptii_auth_state', JSON.stringify(authState));

    // Broadcast to any listening landlord apps
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: authState
    }));

    console.log('Authentication state updated:', authState);
  }, [isAuthenticated, user, isLoading]);

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Get the intended redirect path from sessionStorage
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      console.log('🔐 Login starting with redirect path:', redirectPath);

      // Create login request with state to preserve redirect
      const loginRequestWithState = {
        ...loginRequest,
        // Store redirect path in state to survive the auth flow
        state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined
      };

      // Try popup login first
      const result = await instance.loginPopup(loginRequestWithState);

      if (result) {
        // Extract stable userId from token claims (oid or sub)
        // These are consistent across browsers/sessions, unlike localAccountId
        const stableUserId = 
          result.account?.idTokenClaims?.oid || 
          result.account?.idTokenClaims?.sub ||
          result.account?.localAccountId || 
          result.account?.homeAccountId || 
          '';
        
        // Dispatch auth state change event with success status
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: {
            success: true,
            userId: stableUserId
          }
        }));

        setIsAuthenticated(true);
        
        // Debug: Log all available claims
        console.log('🔍 Login - All available token claims:', result.account?.idTokenClaims);
        console.log('🔍 Login - All account properties:', Object.keys(result.account || {}));
        console.log('🔑 Login - Using stable userId (oid/sub):', stableUserId);
        
        // Try multiple possible phone number claim names
        const phoneNumber = 
          result.account?.idTokenClaims?.['Phone Number'] ||
          result.account?.idTokenClaims?.['phoneNumber'] ||
          result.account?.idTokenClaims?.extension_PhoneNumber ||
          result.account?.idTokenClaims?.phone_number ||
          result.account?.idTokenClaims?.mobilePhone ||
          result.account?.idTokenClaims?.phoneNumber ||
          (result.account as any)?.phoneNumber ||
          (result.account as any)?.phone;
        
        console.log('📞 Login - Phone number found:', phoneNumber);
        
        setUser({
          id: stableUserId,
          email: result.account?.username || '',
          name: result.account?.name,
          givenName: result.account?.name?.split(' ')[0],
          familyName: result.account?.name?.split(' ').slice(1).join(' '),
          phone: phoneNumber,
          roles: ['tenant'] // Default role for new users
        });
        
        console.log('👤 Login - User object set:', { id: stableUserId, email: result.account?.username, phone: phoneNumber });

        // Record login activity
        sessionManager.updateActivity('interaction', 'User login');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Dispatch auth state change event with failure status
      const fallbackUserId = 
        accounts[0]?.idTokenClaims?.oid || 
        accounts[0]?.idTokenClaims?.sub ||
        accounts[0]?.localAccountId || 
        accounts[0]?.homeAccountId;
      
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: {
          success: false,
          userId: fallbackUserId
        }
      }));

      // Get the intended redirect path from sessionStorage
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      console.log('🔐 Login popup failed, using redirect flow with path:', redirectPath);

      // Create login request with state to preserve redirect
      const loginRequestWithState = {
        ...loginRequest,
        // Store redirect path in state to survive the auth flow
        state: redirectPath ? JSON.stringify({ redirect: redirectPath }) : undefined,
        // Ensure redirect fallback returns user to the current page context.
        redirectStartPage: window.location.href
      };

      // Try redirect login as fallback - this is more reliable for Azure B2C signup
      await instance.loginRedirect(loginRequestWithState);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Record logout activity before clearing session
      sessionManager.updateActivity('interaction', 'User logout');

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
      console.log('🔄 Starting profile edit...');
      console.log('🔄 MSAL instance:', instance);
      console.log('🔄 Current accounts:', accounts);
      
      // Record profile edit activity
      sessionManager.updateActivity('interaction', 'Profile edit');

      // Try MSAL's built-in profile editing first
      try {
        console.log('🔄 Attempting MSAL profile edit with profile editing authority...');
        
        const result = await instance.loginPopup({
          scopes: loginRequest.scopes,
          authority: `https://proptii.b2clogin.com/proptii.onmicrosoft.com/b2c_1_profileediting`,
          prompt: 'login',
          extraQueryParameters: {
            'ui_locales': 'en'
          }
        });
        
        console.log('✅ MSAL profile edit completed:', result);
        
        // Update user data immediately
        if (result && result.account) {
          const phoneNumber = extractPhoneNumber(result.account.idTokenClaims);
          const stableUserId = 
            result.account.idTokenClaims?.oid || 
            result.account.idTokenClaims?.sub ||
            result.account.localAccountId || 
            result.account.homeAccountId || 
            '';
          
          setUser({
            id: stableUserId,
            name: result.account.name || '',
            email: result.account.username || '',
            phone: phoneNumber
          });

          console.log('✅ Profile updated successfully with phone:', phoneNumber);
          
          // Dispatch auth state change event
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: {
              success: true,
              userId: stableUserId
            }
          }));
        }
        
        return; // Success, exit early
        
      } catch (msalError) {
        console.log('MSAL profile edit failed, trying fallback approach:', msalError);
        
        // Fallback: Open Azure AD B2C profile editing page in new window
        const profileEditUrl = `https://proptii.b2clogin.com/proptii.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_profileediting&client_id=532e1fa0-18a6-4356-bd78-1f62bd6d5e2f&nonce=defaultNonce&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=openid&response_type=id_token&prompt=login`;
        
        console.log('🔄 Opening profile edit URL in new window:', profileEditUrl);
        
        const profileWindow = window.open(profileEditUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        if (!profileWindow) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Monitor the popup window
        const checkClosed = setInterval(() => {
          if (profileWindow.closed) {
            clearInterval(checkClosed);
            console.log('Profile edit window closed');
            
            // Refresh user data after profile edit
            setTimeout(async () => {
              try {
                console.log('🔄 Refreshing user data after profile edit...');
                
                // Force refresh the user data by re-acquiring tokens
                await refreshUserData(instance, accounts, loginRequest, setUser, extractPhoneNumber);
                
              } catch (refreshError) {
                console.error('❌ Error refreshing user data:', refreshError);
              }
            }, 1000);
          }
        }, 1000);

        // Also add a focus event listener to refresh when user returns to the main window
        const handleWindowFocus = async () => {
          console.log('🔄 Window focused - checking for profile updates...');
          try {
            await refreshUserData(instance, accounts, loginRequest, setUser, extractPhoneNumber);
          } catch (error) {
            console.error('❌ Error refreshing user data on focus:', error);
          }
        };

        window.addEventListener('focus', handleWindowFocus);
        
        // Clean up the event listener when the profile window closes
        const originalCheckClosed = checkClosed;
        const checkClosedWithCleanup = setInterval(() => {
          if (profileWindow.closed) {
            clearInterval(checkClosedWithCleanup);
            window.removeEventListener('focus', handleWindowFocus);
            console.log('Profile edit window closed');
            
            // Refresh user data after profile edit
            setTimeout(async () => {
              try {
                console.log('🔄 Refreshing user data after profile edit...');
                await refreshUserData(instance, accounts, loginRequest, setUser, extractPhoneNumber);
              } catch (refreshError) {
                console.error('❌ Error refreshing user data:', refreshError);
              }
            }, 1000);
          }
        }, 1000);
      }

    } catch (error: any) {
      console.error('❌ Profile edit error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Popup blocked')) {
        alert('Popup was blocked. Please allow popups for this site and try again.');
      } else {
        alert('Failed to edit profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create a refresh function that can be called manually
  const manualRefreshUserData = async () => {
    try {
      console.log('🔄 Manual refresh triggered...');
      await refreshUserData(instance, accounts, loginRequest, setUser, extractPhoneNumber);
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
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
        editProfile,
        refreshUserData: manualRefreshUserData
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