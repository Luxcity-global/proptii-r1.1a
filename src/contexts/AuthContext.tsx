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

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Development mode flag - set to true to bypass authentication for development
const DEV_MODE = false; // Set to false in production

// Initialize the MSAL instance before using it
msalInstance.initialize().catch(error => {
  console.error("Error initializing MSAL:", error);
});

// Export a function to get the MSAL instance
export const getMsalInstance = () => msalInstance;

// Register event callbacks for redirect handling
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log('Login successful');
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
  }
  if (event.eventType === EventType.LOGOUT_SUCCESS) {
    console.log('Logout successful');
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
  }
  if (event.eventType === EventType.LOGIN_FAILURE || event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
    console.log('Authentication failed:', event.error && 'errorMessage' in event.error ? event.error.errorMessage : event.error?.message);
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
  }
});

// Define the shape of our auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  editProfile: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
  editProfile: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // We don't need to initialize MSAL here again since we already did it above
  useEffect(() => {
    setIsInitialized(true);
    
    // In development mode, create a mock user
    if (DEV_MODE) {
      setUser({
        homeAccountId: 'dev-account',
        localAccountId: 'dev-account',
        environment: 'development',
        tenantId: 'dev-tenant',
        username: 'dev@example.com',
        name: 'Development User',
      } as AccountInfo);
      setIsLoading(false);
    }
  }, []);

  // Handle redirect responses
  useEffect(() => {
    const handleRedirectResponse = async () => {
      // Only proceed if MSAL is initialized
      if (!isInitialized) return;
      
      try {
        // Handle redirect response if any
        await instance.handleRedirectPromise();
        
        // Update auth state based on accounts
        if (accounts.length > 0) {
          setIsAuthenticated(true);
          setUser(accounts[0]);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
        setIsAuthenticated(false);
        setUser(null);
        
        // Store the error in localStorage for the warning component to display
        if (error instanceof Error) {
          localStorage.setItem('auth_error', error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isInitialized) {
      handleRedirectResponse();
    }
  }, [instance, accounts, isInitialized]);

  // Try silent token acquisition on component mount
  useEffect(() => {
    const acquireTokenSilently = async () => {
      // Only proceed if MSAL is initialized
      if (!isInitialized) return;
      
      if (accounts.length > 0) {
        try {
          await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });
          setIsAuthenticated(true);
          setUser(accounts[0]);
        } catch (error) {
          if (error instanceof InteractionRequiredAuthError) {
            // Silent token acquisition failed, user needs to sign in interactively
            setIsAuthenticated(false);
            setUser(null);
          } else {
            console.error("Silent token acquisition failed:", error);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (isInitialized) {
      acquireTokenSilently();
    }
  }, [instance, accounts, isInitialized]);

  // Update auth state when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      setIsAuthenticated(true);
      setUser(accounts[0]);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    
    // Dispatch custom event when auth state changes
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
  }, [accounts]);

  // Login function
  const login = async (): Promise<void> => {
    // In development mode, just set authenticated to true
    if (DEV_MODE) {
      setIsAuthenticated(true);
      setUser({
        homeAccountId: 'dev-account',
        localAccountId: 'dev-account',
        environment: 'development',
        tenantId: 'dev-tenant',
        username: 'dev@example.com',
        name: 'Development User',
      } as AccountInfo);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First, try to detect if popups are blocked by opening a test popup
      const testPopup = window.open('about:blank', '_blank', 'width=1,height=1');
      
      // If the test popup is blocked, go straight to redirect
      if (isPopupBlocked(testPopup)) {
        console.warn("Popup blocked by browser, using redirect login instead");
        // Close the test popup if it somehow opened
        if (testPopup) testPopup.close();
        // Use redirect login
        instance.loginRedirect(loginRequest);
        return; // Exit early as redirect will reload the page
      }
      
      // Close the test popup since it was just for testing
      testPopup?.close();
      
      // Try popup authentication
      try {
        // Configure popup window - use minimal configuration to avoid triggering popup blockers
        const popupConfig = {
          ...loginRequest,
          // Don't set popupWindowAttributes here as it can trigger popup blockers
          // Let the browser handle the popup dimensions and position
        };
        
        // Attempt popup login with minimal configuration
        await instance.loginPopup(popupConfig);
        
        // Update authentication state after successful login
        if (accounts.length > 0) {
          setIsAuthenticated(true);
          setUser(accounts[0]);
        }
      } catch (popupError: any) {
        // If popup fails and it's not just user cancellation, try redirect
        if (popupError.errorCode !== "user_cancelled") {
          console.warn("Popup login failed, falling back to redirect:", popupError);
          
          // Fall back to redirect login
          instance.loginRedirect(loginRequest);
          return; // Exit early as redirect will reload the page
        } else {
          // If user cancelled, just log and continue
          console.log("User cancelled login");
          throw popupError; // Re-throw to be caught by outer catch
        }
      }
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    } catch (error: any) {
      // Handle any errors
      if (error.errorCode !== "user_cancelled") {
        console.error("Login failed:", error);
      }
      setIsLoading(false);
      // Dispatch event even on failure to update UI
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    // In development mode, just set authenticated to false
    if (DEV_MODE) {
      setIsAuthenticated(false);
      setUser(null);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
      return;
    }
    
    try {
      setIsLoading(true);
      // Use popup for logout as well
      await instance.logoutPopup();
    } catch (error: any) {
      // Ignore user_cancelled errors
      if (error.errorCode !== "user_cancelled") {
        console.error("Logout failed:", error);
      }
      setIsLoading(false);
      // Dispatch event even on failure to update UI
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    }
  };

  // Edit profile function
  const editProfile = async (): Promise<void> => {
    // In development mode, just show a message
    if (DEV_MODE) {
      console.log('Edit profile not available in development mode');
      alert('Edit profile not available in development mode');
      return;
    }
    
    try {
      setIsLoading(true);
      // Use popup for profile editing
      const popupWidth = 500;
      const popupHeight = 600;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;
      
      const popupWindowAttributes = {
        popupSize: { width: popupWidth, height: popupHeight },
        popupPosition: { top, left }
      };
      
      // Use the correct edit profile policy from the config
      await instance.loginPopup({
        ...loginRequest,
        authority: `https://proptii.b2clogin.com/proptii.onmicrosoft.com/${b2cPolicies.editProfile}`,
        popupWindowAttributes
      });
    } catch (error: any) {
      // Ignore user_cancelled errors
      if (error.errorCode !== "user_cancelled") {
        console.error("Edit profile failed:", error);
      }
      setIsLoading(false);
      // Dispatch event even on failure to update UI
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        editProfile,
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
    <MsalProvider instance={msalInstance}>
      <AuthProvider>{children}</AuthProvider>
    </MsalProvider>
  );
}; 