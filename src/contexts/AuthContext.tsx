import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, MsalProvider } from "@azure/msal-react";
import { IPublicClientApplication, InteractionStatus, AccountInfo } from "@azure/msal-browser";
import { loginRequest } from '../config/authConfig';
import { b2cPolicies } from '../config/authConfig';

interface UserProfile {
  email?: string;
  name?: string;
  username?: string;
  givenName?: string;
  familyName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  editProfile: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const extractUserProfile = (account: AccountInfo): UserProfile => {
  const idTokenClaims = account.idTokenClaims as {
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
  } | null;

  return {
    email: account.username || idTokenClaims?.email,
    name: account.name || idTokenClaims?.name,
    username: account.username,
    givenName: idTokenClaims?.given_name,
    familyName: idTokenClaims?.family_name,
  };
};

export const AuthProvider: React.FC<{ pca: IPublicClientApplication; children: React.ReactNode }> = ({ 
  pca,
  children 
}) => {
  const { instance, inProgress } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true);
        setUser(extractUserProfile(accounts[0]));
        instance.setActiveAccount(accounts[0]);
      }
    }
  }, [instance, inProgress]);

  const login = async () => {
    try {
      setError(null);
      console.log('Login attempt started');
      const result = await instance.loginPopup(loginRequest);
      if (result) {
        console.log('Login successful, updating state');
        setIsAuthenticated(true);
        setUser(extractUserProfile(result.account));
        instance.setActiveAccount(result.account);
        
        // Force a re-render after successful login
        setTimeout(() => {
          console.log('Dispatching auth state change event');
          window.dispatchEvent(new CustomEvent('auth-state-changed'));
        }, 100);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      });
      setIsAuthenticated(false);
      setUser(null);
    } catch (error: any) {
      console.error('Logout failed:', error);
      setError(error.message || 'Logout failed. Please try again.');
    }
  };

  const editProfile = async () => {
    try {
      const result = await instance.loginPopup({
        authority: b2cPolicies.editProfile,
        scopes: ["openid", "profile"]
      });
      
      if (result) {
        // Update the user profile after editing
        setUser(extractUserProfile(result.account));
      }
    } catch (error: any) {
      // Ignore the error if user cancels the profile editing
      if (error.errorCode !== "user_cancelled") {
        console.error('Profile editing failed:', error);
        setError(error.message || 'Profile editing failed. Please try again.');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, editProfile, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const MsalAuthProvider: React.FC<{ instance: IPublicClientApplication; children: React.ReactNode }> = ({ 
  instance, 
  children 
}) => {
  return (
    <MsalProvider instance={instance}>
      <AuthProvider pca={instance}>
        {children}
      </AuthProvider>
    </MsalProvider>
  );
}; 