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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store intended destination in sessionStorage as backup (include full path with search params)
    const fullPath = location.pathname + location.search;
    sessionStorage.setItem('redirectAfterLogin', fullPath);
    
    // Build login path with redirect parameter
    // Always use ?redirect= (not &redirect=) since we're going to /login
    const loginPath = `/login?redirect=${encodeURIComponent(fullPath)}`;
    
    // Use window.location for more reliable redirect (especially for email links)
    // This ensures the redirect happens even if React Router hasn't fully initialized
    // Only redirect if we're not already on the login page
    if (window.location.pathname !== '/login') {
      console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
      console.log('🔒 Intended path:', fullPath);
      console.log('🔒 Login path:', loginPath);
      
      // Use setTimeout to ensure this happens after render
      setTimeout(() => {
        window.location.href = loginPath;
      }, 0);
      
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
            <p style={{ color: '#666' }}>Redirecting to login...</p>
          </div>
        </div>
      );
    }
    
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

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