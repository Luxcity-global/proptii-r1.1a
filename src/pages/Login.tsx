import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../utils/analytics';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    sessionStorage.removeItem('redirect_in_progress');
    sessionStorage.removeItem('last_redirect_path');
  }, []);
  const [error, setError] = useState('');
  const [autoLoginTriggered, setAutoLoginTriggered] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Memoize the redirect path to prevent recalculation on every render
  const from = useMemo(() => {
    const statePath = (location.state as any)?.from?.pathname;
    const storedPath = sessionStorage.getItem('redirectAfterLogin');
    const queryRedirect = new URLSearchParams(location.search).get('redirect');
    
    // Priority: query param > state > sessionStorage > default
    const redirectPath = queryRedirect || statePath || storedPath || '/';
    console.log('📍 Calculated redirect path:', redirectPath);
    return redirectPath;
  }, [location.state, location.search]); // Only recalculate when location changes

  // Clear auto-login flag immediately if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.removeItem('autoLoginAttempted');
    }
  }, [isAuthenticated]);

  // Redirect if already authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && !hasRedirectedRef.current) {
      // Wait for the background role resolution to complete
      if (!user?.roleResolved) return;

      hasRedirectedRef.current = true;
      
      // Clear all redirect-related flags
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('autoLoginAttempted');
      sessionStorage.removeItem('redirect_in_progress');
      sessionStorage.removeItem('last_redirect_path');

      // If new user has no assigned role, direct them to role selection screen
      const hasRole = user?.roles && user.roles.length > 0;
      const targetPath = hasRole ? from : '/select-role';
      
      console.log('✅ Already authenticated, redirecting to:', targetPath);
      trackEvent('login_success', {
        redirect_to: targetPath,
      });
      
      // Use setTimeout to ensure this happens after current render cycle
      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 0);
    }
  }, [isAuthenticated, user?.roles, user?.roleResolved, navigate, from]);

  // Store the target redirect path when landing on login page
  useEffect(() => {
    const queryRedirect = new URLSearchParams(window.location.search).get('redirect');
    if (queryRedirect) {
      sessionStorage.setItem('redirectAfterLogin', queryRedirect);
    }
  }, []);

  // Listen for auth state changes (for MSAL popup login) as a backup
  // The main redirect is handled by the useEffect above that watches isAuthenticated
  useEffect(() => {
    const handleAuthStateChange = () => {
      // Clear the auto-login flag when auth completes
      sessionStorage.removeItem('autoLoginAttempted');
      
      // Small delay to allow auth context to update
      setTimeout(() => {
        // The isAuthenticated useEffect above will handle the redirect
        // This is just a backup trigger
      }, 100);
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  const handleLogin = async () => {
    try {
      setError('');
      trackEvent('login_started', {
        redirect_to: from,
        has_redirect_param: new URLSearchParams(location.search).has('redirect'),
      });
      await login();
      // Note: MSAL popup login will trigger auth-state-changed event
      // The useEffect above will handle the redirect
    } catch (error: any) {
      setError(error?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#136C9E]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E65D24]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 m-4 relative z-10 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white">
        <div className="text-center mb-10">
          <div className="mx-auto flex items-center justify-center mb-6">
            <img src="/images/proptii-logo.png" alt="Proptii Logo" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-archive font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 font-nunito">Sign in to continue to your dashboard</p>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-700 px-4 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-200 transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z" />
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => {
                const search = location.search;
                navigate(`/pricing${search}`);
              }}
              className="text-[#DC5F12] font-bold hover:underline transition-all"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}; 