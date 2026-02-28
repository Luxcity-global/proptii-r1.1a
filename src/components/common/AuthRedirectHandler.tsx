import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Handles redirect after login when user returns from auth (e.g. Azure B2C redirect).
 * When user completes sign-in/sign-up and redirectAfterLogin is set (e.g. from
 * SignUpPromptModal when clicking Publish Property), navigates them back to that page.
 */
export const AuthRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirectedRef = useRef(false);

  // Reset redirect flag when user logs out so next login can redirect
  useEffect(() => {
    if (!isAuthenticated) hasRedirectedRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (hasRedirectedRef.current) return;

    const storedPath = sessionStorage.getItem('redirectAfterLogin');
    if (!storedPath) return;

    const currentPath = location.pathname + location.search;
    if (currentPath === storedPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      return;
    }

    hasRedirectedRef.current = true;
    sessionStorage.removeItem('redirectAfterLogin');
    navigate(storedPath, { replace: true });
  }, [isAuthenticated, isLoading, navigate, location.pathname, location.search]);

  return null;
};
