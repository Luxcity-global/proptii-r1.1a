import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock user data
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'tenant' | 'agent' | 'admin';
  isAuthenticated: boolean;
}

// Create the context
interface MockAuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

// Mock development user
const developmentUser: MockUser = {
  id: 'dev-user-123',
  name: 'Development User',
  email: 'dev@proptii.com',
  role: 'agent',
  isAuthenticated: true,
};

// Provider component
export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Simulate authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set the development user
        setUser(developmentUser);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Authentication failed'));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mock login function
  const login = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set the development user
      setUser(developmentUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Mock logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear the user
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};

// Custom hook to use the mock auth context
export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}; 