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
  }, [isAuthenticated, user?.roles, navigate, from]);

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

  const handleLogin = async (providerType?: 'microsoft' | 'google') => {
    try {
      setError('');
      trackEvent('login_started', {
        redirect_to: from,
        has_redirect_param: new URLSearchParams(location.search).has('redirect'),
      });
      await login(providerType);
      // Note: MSAL popup login will trigger auth-state-changed event
      // The useEffect above will handle the redirect
    } catch (error: any) {
      setError(error?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign in
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 1 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.4,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                backgroundColor: '#136C9E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                boxShadow: '0 4px 12px rgba(19, 108, 158, 0.25)',
                '&:hover': {
                  backgroundColor: '#0e5278',
                  boxShadow: '0 6px 16px rgba(19, 108, 158, 0.35)',
                },
              }}
              onClick={() => handleLogin('google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c0-.4 0-.8 0-1.4z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              fullWidth
              variant="text"
              sx={{ textTransform: 'none', color: '#6b7280' }}
              onClick={() => {
                const search = location.search;
                navigate(`/pricing${search}`);
              }}
            >
              Don't have an account? <span style={{ color: '#DC5F12', fontWeight: 600, marginLeft: 4 }}>Sign Up</span>
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 