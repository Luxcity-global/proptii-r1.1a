import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, MsalProvider } from "@azure/msal-react";
import { IPublicClientApplication, InteractionStatus, AccountInfo } from "@azure/msal-browser";
import { loginRequest } from '../config/authConfig';
import { b2cPolicies } from '../config/authConfig';
import { DEV_MODE, MOCK_USER } from '../config/devConfig';

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
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_MODE);
  const [user, setUser] = useState<UserProfile | null>(DEV_MODE ? MOCK_USER : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!DEV_MODE && inProgress === InteractionStatus.None) {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true);
        setUser(extractUserProfile(accounts[0]));
        instance.setActiveAccount(accounts[0]);
      }
    }
  }, [instance, inProgress]);

  const login = async () => {
    if (DEV_MODE) {
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      return;
    }
    try {
      setError(null);
      const result = await instance.loginPopup(loginRequest);
      if (result) {
        setIsAuthenticated(true);
        setUser(extractUserProfile(result.account));
        instance.setActiveAccount(result.account);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = async () => {
    if (DEV_MODE) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
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
    if (DEV_MODE) {
      // In dev mode, just update the mock user
      setUser(MOCK_USER);
      return;
    }
    try {
      const result = await instance.loginPopup({
        authority: b2cPolicies.editProfile,
        scopes: ["openid", "profile"]
      });
      
      if (result) {
        setUser(extractUserProfile(result.account));
      }
    } catch (error: any) {
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