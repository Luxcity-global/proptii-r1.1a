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
import GraphService from '../services/graphService';

// Function to extract user details from ID token claims
const extractUserDetailsFromClaims = async (instance: any, account: AccountInfo) => {
  try {
    console.log('AuthContext - Attempting to extract user details from ID token claims...');
    console.log('AuthContext - Account for claims extraction:', account);
    
    // Get ID token with all available scopes
    console.log('AuthContext - Requesting ID token with scopes:', loginRequest.scopes);
    const idToken = await instance.acquireTokenSilent({
      ...loginRequest,
      account: account
    });
    
    console.log('AuthContext - ID token acquired successfully:', !!idToken.accessToken);
    console.log('AuthContext - ID token scopes:', idToken.scopes);
    
    if (idToken && idToken.idTokenClaims) {
      const claims = idToken.idTokenClaims as any;
      console.log('AuthContext - Full ID token claims:', claims);
      console.log('AuthContext - All claim keys:', Object.keys(claims));
      
      // Log all potential email-related fields
      const emailFields = {
        email: claims.email,
        emails: claims.emails,
        upn: claims.upn,
        preferred_username: claims.preferred_username,
        unique_name: claims.unique_name,
        name: claims.name,
        given_name: claims.given_name,
        family_name: claims.family_name,
        sub: claims.sub,
        oid: claims.oid,
        tid: claims.tid,
        aud: claims.aud,
        iss: claims.iss,
        iat: claims.iat,
        exp: claims.exp,
        nbf: claims.nbf,
        ver: claims.ver,
        tfp: claims.tfp,
        auth_time: claims.auth_time,
        nonce: claims.nonce,
        acr: claims.acr,
        amr: claims.amr,
        azp: claims.azp,
        azpacr: claims.azpacr,
        idp: claims.idp,
        idp_access_token: claims.idp_access_token,
        login_hint: claims.login_hint,
        sid: claims.sid,
        utid: claims.utid,
        rh: claims.rh,
        xms_cc: claims.xms_cc,
        xms_tcdt: claims.xms_tcdt,
        xms_tdbr: claims.xms_tdbr,
        xms_tdbt: claims.xms_tdbt,
        xms_tdbu: claims.xms_tdbu,
        xms_tdbv: claims.xms_tdbv,
        xms_tdbx: claims.xms_tdbx,
        xms_tdby: claims.xms_tdby,
        xms_tdbz: claims.xms_tdbz
      };
      
      console.log('AuthContext - Email-related fields in claims:', emailFields);
      
      // Try to extract email from various possible fields
      let email = claims.email || 
                  claims.emails?.[0] || 
                  claims.upn || 
                  claims.preferred_username ||
                  claims.unique_name ||
                  account.username ||
                  '';
      
      // If email is still empty, try to construct it from other fields
      if (!email && claims.given_name && claims.family_name) {
        email = `${claims.given_name.toLowerCase()}.${claims.family_name.toLowerCase()}@proptii.com`;
        console.log('AuthContext - Constructed email from name:', email);
      }
      
      console.log('AuthContext - Final extracted email:', email);
      
      return {
        email: email,
        givenName: claims.given_name || account.name?.split(' ')[0],
        familyName: claims.family_name || account.name?.split(' ').slice(1).join(' '),
        displayName: claims.name || account.name
      };
    } else {
      console.log('AuthContext - No ID token or claims found');
      return null;
    }
  } catch (error) {
    console.error('AuthContext - Error extracting user details from claims:', error);
    console.error('AuthContext - Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack
    });
    return null;
  }
};

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
  roles: string[];
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
    console.log('AuthContext - useEffect triggered');
    console.log('AuthContext - accounts length:', accounts.length);
    console.log('AuthContext - inProgress:', inProgress);
    
    const initializeAuth = async () => {
      try {
        console.log('AuthContext - initializeAuth started');
        // Handle redirect response if any
        await instance.handleRedirectPromise();

        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          console.log('AuthContext - Current account object:', currentAccount);
          console.log('AuthContext - Account username:', currentAccount.username);
          console.log('AuthContext - Account name:', currentAccount.name);
          console.log('AuthContext - Account localAccountId:', currentAccount.localAccountId);
          console.log('AuthContext - Account homeAccountId:', currentAccount.homeAccountId);
          
          // Try to get user details from Microsoft Graph API first
          let userEmail = currentAccount.username;
          let givenName = currentAccount.name?.split(' ')[0];
          let familyName = currentAccount.name?.split(' ').slice(1).join(' ');
          let displayName = currentAccount.name;
          
          console.log('AuthContext - Initial userEmail from username:', userEmail);
          
                                          try {
             console.log('AuthContext - Starting user details retrieval process...');
             console.log('AuthContext - Current account username:', currentAccount.username);
             console.log('AuthContext - Current account name:', currentAccount.name);
             
             // For B2C, the username field often contains the email
             // Let's first check what we have in the account object
             console.log('AuthContext - Account object details:', {
               username: currentAccount.username,
               name: currentAccount.name,
               localAccountId: currentAccount.localAccountId,
               homeAccountId: currentAccount.homeAccountId,
               environment: currentAccount.environment,
               tenantId: currentAccount.tenantId
             });
             
             // Try to get the ID token to see what claims are available
             console.log('AuthContext - Attempting to get ID token from account...');
             const idToken = await instance.acquireTokenSilent({
               ...loginRequest,
               account: currentAccount
             });
             
             console.log('AuthContext - ID token acquired:', !!idToken);
             console.log('AuthContext - ID token scopes:', idToken?.scopes);
             
             if (idToken && idToken.idTokenClaims) {
               const claims = idToken.idTokenClaims as any;
               console.log('AuthContext - Full ID token claims:', claims);
               console.log('AuthContext - All claim keys:', Object.keys(claims));
               
               // For B2C, let's check all possible email fields
               const emailFields = {
                 email: claims.email,
                 emails: claims.emails,
                 upn: claims.upn,
                 preferred_username: claims.preferred_username,
                 unique_name: claims.unique_name,
                 name: claims.name,
                 given_name: claims.given_name,
                 family_name: claims.family_name,
                 // B2C specific fields
                 signInName: claims.signInName,
                 emails_0: claims.emails?.[0],
                 emails_1: claims.emails?.[1],
                 // Additional fields that might contain email
                 sub: claims.sub,
                 oid: claims.oid,
                 tid: claims.tid,
                 tfp: claims.tfp
               };
               
               console.log('AuthContext - Email-related fields in claims:', emailFields);
               
               // For B2C, the username field is often the email
               let email = currentAccount.username || '';
               
               // If username doesn't look like an email, try claims
               if (!email.includes('@')) {
                 email = claims.email || 
                         claims.emails?.[0] || 
                         claims.signInName ||
                         claims.upn || 
                         claims.preferred_username ||
                         claims.unique_name ||
                         '';
               }
               
               console.log('AuthContext - Extracted email from claims:', email);
               
               // If we still don't have a real email, try Microsoft Graph API
               if (!email || !email.includes('@')) {
                 console.log('AuthContext - No email found in claims, trying Microsoft Graph API...');
                 const graphService = GraphService.getInstance();
                 const graphUser = await graphService.getUserDetails(instance, currentAccount);
                 
                 if (graphUser) {
                   console.log('AuthContext - Graph API user data:', graphUser);
                   email = graphUser.mail || graphUser.userPrincipalName || email;
                   console.log('AuthContext - Email from Graph API:', email);
                   
                   // Update other fields from Graph API if available
                   if (graphUser.givenName) givenName = graphUser.givenName;
                   if (graphUser.surname) familyName = graphUser.surname;
                   if (graphUser.displayName) displayName = graphUser.displayName;
                 }
               }
               
               // Only construct email if we couldn't find a real one AND we have name fields
               if (!email && claims.given_name && claims.family_name) {
                 email = `${claims.given_name.toLowerCase()}.${claims.family_name.toLowerCase()}@proptii.com`;
                 console.log('AuthContext - Constructed email from name (fallback):', email);
               }
               
               userEmail = email;
               givenName = claims.given_name || currentAccount.name?.split(' ')[0];
               familyName = claims.family_name || currentAccount.name?.split(' ').slice(1).join(' ');
               displayName = claims.name || currentAccount.name;
               
               console.log('AuthContext - Final user details - Email:', userEmail, 'Name:', displayName);
             } else {
               console.log('AuthContext - No ID token or claims found, trying Microsoft Graph API...');
               
               // Try Microsoft Graph API as fallback
               const graphService = GraphService.getInstance();
               const graphUser = await graphService.getUserDetails(instance, currentAccount);
               
               if (graphUser) {
                 console.log('AuthContext - Graph API user data:', graphUser);
                 userEmail = graphUser.mail || graphUser.userPrincipalName || currentAccount.username || '';
                 givenName = graphUser.givenName || currentAccount.name?.split(' ')[0] || '';
                 familyName = graphUser.surname || currentAccount.name?.split(' ').slice(1).join(' ') || '';
                 displayName = graphUser.displayName || currentAccount.name || '';
               } else {
                 // For B2C, username is often the email
                 userEmail = currentAccount.username || '';
                 givenName = currentAccount.name?.split(' ')[0] || '';
                 familyName = currentAccount.name?.split(' ').slice(1).join(' ') || '';
                 displayName = currentAccount.name || '';
               }
             }
           } catch (error) {
             console.log('AuthContext - Error getting user details, using fallback values:', error);
             console.log('AuthContext - Error details:', {
               name: (error as any).name,
               message: (error as any).message,
               stack: (error as any).stack
             });
             
             // Use account defaults if claims extraction fails
             userEmail = currentAccount.username || '';
             givenName = currentAccount.name?.split(' ')[0] || '';
             familyName = currentAccount.name?.split(' ').slice(1).join(' ') || '';
             displayName = currentAccount.name || '';
           }
          
          console.log('AuthContext - Final user details - Email:', userEmail, 'Name:', displayName);
          setIsAuthenticated(true);
          setUser({
            id: currentAccount.localAccountId || currentAccount.homeAccountId,
            givenName: givenName,
            familyName: familyName,
            email: userEmail,
            name: displayName,
            roles: ['tenant'] // Default role for new users
          });
          console.log('AuthContext - User object set successfully');

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

      if (result && result.account) {
        console.log('AuthContext - Login result account object:', result.account);
        console.log('AuthContext - Login result account username:', result.account.username);
        console.log('AuthContext - Login result account name:', result.account.name);
        
        // Try to get user details from Microsoft Graph API first
        let userEmail = result.account.username || '';
        let givenName = result.account.name?.split(' ')[0];
        let familyName = result.account.name?.split(' ').slice(1).join(' ');
        let displayName = result.account.name;
        
        console.log('AuthContext - Login initial userEmail from username:', userEmail);
        
                 try {
           console.log('AuthContext - Login: Starting user details retrieval process...');
           console.log('AuthContext - Login: Result account username:', result.account.username);
           console.log('AuthContext - Login: Result account name:', result.account.name);
           
           // For B2C, the username field often contains the email
           console.log('AuthContext - Login: Account object details:', {
             username: result.account.username,
             name: result.account.name,
             localAccountId: result.account.localAccountId,
             homeAccountId: result.account.homeAccountId,
             environment: result.account.environment,
             tenantId: result.account.tenantId
           });
           
           // Check if we have ID token claims from the login result
           if (result.idTokenClaims) {
             const claims = result.idTokenClaims as any;
             console.log('AuthContext - Login: Full ID token claims:', claims);
             console.log('AuthContext - Login: All claim keys:', Object.keys(claims));
             
             // For B2C, let's check all possible email fields
             const emailFields = {
               email: claims.email,
               emails: claims.emails,
               upn: claims.upn,
               preferred_username: claims.preferred_username,
               unique_name: claims.unique_name,
               name: claims.name,
               given_name: claims.given_name,
               family_name: claims.family_name,
               // B2C specific fields
               signInName: claims.signInName,
               emails_0: claims.emails?.[0],
               emails_1: claims.emails?.[1],
               // Additional fields that might contain email
               sub: claims.sub,
               oid: claims.oid,
               tid: claims.tid,
               tfp: claims.tfp
             };
             
             console.log('AuthContext - Login: Email-related fields in claims:', emailFields);
             
             // For B2C, the username field is often the email
             let email = result.account.username || '';
             
             // If username doesn't look like an email, try claims
             if (!email.includes('@')) {
               email = claims.email || 
                       claims.emails?.[0] || 
                       claims.signInName ||
                       claims.upn || 
                       claims.preferred_username ||
                       claims.unique_name ||
                       '';
             }
             
                           console.log('AuthContext - Login: Extracted email from claims:', email);
              
              // If we still don't have a real email, try Microsoft Graph API
              if (!email || !email.includes('@')) {
                console.log('AuthContext - Login: No email found in claims, trying Microsoft Graph API...');
                const graphService = GraphService.getInstance();
                const graphUser = await graphService.getUserDetails(instance, result.account);
                
                if (graphUser) {
                  console.log('AuthContext - Login: Graph API user data:', graphUser);
                  email = graphUser.mail || graphUser.userPrincipalName || email;
                  console.log('AuthContext - Login: Email from Graph API:', email);
                  
                  // Update other fields from Graph API if available
                  if (graphUser.givenName) givenName = graphUser.givenName;
                  if (graphUser.surname) familyName = graphUser.surname;
                  if (graphUser.displayName) displayName = graphUser.displayName;
                }
              }
              
              // Only construct email if we couldn't find a real one AND we have name fields
              if (!email && claims.given_name && claims.family_name) {
                email = `${claims.given_name.toLowerCase()}.${claims.family_name.toLowerCase()}@proptii.com`;
                console.log('AuthContext - Login: Constructed email from name (fallback):', email);
              }
             
             userEmail = email;
             givenName = claims.given_name || result.account.name?.split(' ')[0];
             familyName = claims.family_name || result.account.name?.split(' ').slice(1).join(' ');
             displayName = claims.name || result.account.name;
             
             console.log('AuthContext - Login: Final user details - Email:', userEmail, 'Name:', displayName);
           } else {
             console.log('AuthContext - Login: No ID token claims in result, trying to get from account...');
             
             // Try to get the ID token directly from the account
             const idToken = await instance.acquireTokenSilent({
               ...loginRequest,
               account: result.account
             });
             
             if (idToken && idToken.idTokenClaims) {
               const claims = idToken.idTokenClaims as any;
               console.log('AuthContext - Login: ID token claims from account:', claims);
               
               // For B2C, the username field is often the email
               let email = result.account.username || '';
               
               // If username doesn't look like an email, try claims
               if (!email.includes('@')) {
                 email = claims.email || 
                         claims.emails?.[0] || 
                         claims.signInName ||
                         claims.upn || 
                         claims.preferred_username ||
                         claims.unique_name ||
                         '';
               }
               
               if (!email && claims.given_name && claims.family_name) {
                 email = `${claims.given_name.toLowerCase()}.${claims.family_name.toLowerCase()}@proptii.com`;
               }
               
               userEmail = email;
               givenName = claims.given_name || result.account.name?.split(' ')[0];
               familyName = claims.family_name || result.account.name?.split(' ').slice(1).join(' ');
               displayName = claims.name || result.account.name;
             } else {
               console.log('AuthContext - Login: No ID token claims found, using account defaults');
               // For B2C, username is often the email
               userEmail = result.account.username || '';
               givenName = result.account.name?.split(' ')[0] || '';
               familyName = result.account.name?.split(' ').slice(1).join(' ') || '';
               displayName = result.account.name || '';
             }
           }
         } catch (error) {
           console.log('AuthContext - Login: Error getting user details, using fallback values:', error);
           console.log('AuthContext - Login: Error details:', {
             name: (error as any).name,
             message: (error as any).message,
             stack: (error as any).stack
           });
           
           // Use account defaults if claims extraction fails
           userEmail = result.account.username || '';
           givenName = result.account.name?.split(' ')[0] || '';
           familyName = result.account.name?.split(' ').slice(1).join(' ') || '';
           displayName = result.account.name || '';
         }
        
        console.log('AuthContext - Login final user details - Email:', userEmail, 'Name:', displayName);
        
        // Dispatch auth state change event with success status
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: {
            success: true,
            userId: result.account.localAccountId || result.account.homeAccountId
          }
        }));

        setIsAuthenticated(true);
        setUser({
          id: result.account.localAccountId || result.account.homeAccountId || '',
          email: userEmail,
          name: displayName,
          givenName: givenName,
          familyName: familyName,
          roles: ['tenant'] // Default role for new users
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