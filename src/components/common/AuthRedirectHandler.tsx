import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component to handle global redirects for protected routes.
 * This acts as a safety net in case the Router fails to match a protected route
 * and falls through to 404, or to handle redirects before route matching completes.
 */
export const AuthRedirectHandler: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (isLoading) return;

    // Define protected path prefixes
    const protectedPrefixes = [
      '/dashboard',
      '/landlord',
      '/agent',
      '/contracts',
      '/listings/new'
    ];

    const currentPath = location.pathname;
    
    // Check if the current path is protected
    const isProtected = protectedPrefixes.some(prefix => currentPath.startsWith(prefix));

    if (isProtected && !isAuthenticated) {
      console.log('🔒 AuthRedirectHandler: Protected path detected, redirecting to login');
      
      const fullPath = location.pathname + location.search;
      
      // Store redirect path
      sessionStorage.setItem('redirectAfterLogin', fullPath);
      
      // Construct login URL
      const loginPath = `/login?redirect=${encodeURIComponent(fullPath)}`;
      
      // Use window.location for hard redirect to ensure clean state
      // But only if we're not already redirecting
      if (!window.location.href.includes('/login')) {
        window.location.href = loginPath;
      }
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  return null;
};








