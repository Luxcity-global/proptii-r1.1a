import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest, graphConfig } from '../config/azureConfig';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Azure AD account to our UserProfile format
  const convertAzureUserToProfile = async (azureAccount: any): Promise<UserProfile> => {
    try {
      // Get additional user info from Microsoft Graph if needed
      const response = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          Authorization: `Bearer ${azureAccount.accessToken}`,
        },
      });

      if (response.ok) {
        const graphUser = await response.json();
        return {
          name: graphUser.displayName || azureAccount.name || 'User',
          email: graphUser.mail || graphUser.userPrincipalName || azureAccount.username,
          phone: graphUser.mobilePhone || '',
          companyName: graphUser.companyName || '',
          // Azure AD doesn't provide logo directly, but we can use the photo endpoint
          logo: graphUser.photo ? `${graphConfig.graphPhotoEndpoint}` : undefined,
        };
      }
    } catch (error) {
      console.warn('Could not fetch additional user info from Microsoft Graph:', error);
    }

    // Fallback to basic account info
    return {
      name: azureAccount.name || 'User',
      email: azureAccount.username || '',
      phone: '',
      companyName: '',
    };
  };

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async () => {
      if (isAuthenticated && accounts.length > 0) {
        setIsLoading(true);
        setError(null);
        
        try {
          const userProfile = await convertAzureUserToProfile(accounts[0]);
          setUser(userProfile);
        } catch (err) {
          setError('Failed to load user profile');
          console.error('Error converting Azure user to profile:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    };

    handleAuthStateChange();
  }, [isAuthenticated, accounts]);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await instance.loginPopup(loginRequest);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    error,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
