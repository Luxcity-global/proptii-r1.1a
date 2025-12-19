import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('🔒 ProtectedRoute: Auth is loading for path:', location.pathname);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontFamily: 'Archivo, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Log authentication state for debugging
  console.log('🔒 ProtectedRoute check:', { 
    path: location.pathname, 
    isAuthenticated, 
    isLoading,
    hasUser: !!user 
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store intended destination in sessionStorage as backup (include full path with search params)
    const fullPath = location.pathname + location.search;
    
    // Check if we're already trying to redirect to prevent loops
    const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
    const lastRedirectPath = sessionStorage.getItem('last_redirect_path');
    
    // If we're already redirecting to the same path, don't do it again (loop prevention)
    if (redirectInProgress === 'true' && lastRedirectPath === fullPath) {
      console.log('🔒 ProtectedRoute: Redirect already in progress, skipping to prevent loop');
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          fontFamily: 'Archivo, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: '#666' }}>Authenticating...</p>
          </div>
        </div>
      );
    }
    
    sessionStorage.setItem('redirectAfterLogin', fullPath);
    sessionStorage.setItem('redirect_in_progress', 'true');
    sessionStorage.setItem('last_redirect_path', fullPath);
    
    // Build login path with redirect parameter
    const loginPath = `/login?redirect=${encodeURIComponent(fullPath)}`;
    
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
    console.log('🔒 Intended path:', fullPath);
    console.log('🔒 Login path:', loginPath);
    
    // Use React Router's Navigate for cleaner state management (no full page reload)
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  
  // Clear redirect flags if we get here (user is authenticated)
  sessionStorage.removeItem('redirect_in_progress');
  sessionStorage.removeItem('last_redirect_path');

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0 && user) {
    // Default to tenant role if no roles are specified
    const userRoles = user.roles || ['tenant'];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      console.log('Access denied. User roles:', userRoles, 'Required roles:', requiredRoles);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}; 