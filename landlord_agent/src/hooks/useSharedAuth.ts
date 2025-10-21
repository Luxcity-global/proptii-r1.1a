import { useState, useEffect } from 'react';
import { sharedAuthService } from '../services/SharedAuthService';

interface SharedUser {
  id: string;
  name: string;
  email: string;
  givenName?: string;
  familyName?: string;
}

interface UseSharedAuthReturn {
  user: SharedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const useSharedAuth = (): UseSharedAuthReturn => {
  const [user, setUser] = useState<SharedUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        const authenticated = await sharedAuthService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          // Get current user
          const currentUser = await sharedAuthService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError('Failed to initialize authentication');
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for authentication state changes
    const handleAuthStateChange = () => {
      initializeAuth();
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await sharedAuthService.login();
      if (result) {
        setUser(result);
        setIsAuthenticated(true);
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { success: true, userId: result.id }
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
      
      // Dispatch auth state change event with failure
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { success: false }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await sharedAuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { success: true, logout: true }
      }));
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
  };
};
