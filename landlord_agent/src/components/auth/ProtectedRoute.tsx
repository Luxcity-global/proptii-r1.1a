import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginScreen } from './LoginScreen';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Skip authentication in development mode (Azure AD not configured)
  const isDevelopment = import.meta.env.DEV || 
    !import.meta.env.VITE_AZURE_CLIENT_ID ||
    import.meta.env.VITE_AZURE_CLIENT_ID === 'your-client-id-here';

  if (isDevelopment) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};
