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
  const { login, isAuthenticated, isLoading } = useAuth();

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
      
      console.log('✅ Already authenticated, redirecting to:', from);
      trackEvent('login_success', {
        redirect_to: from,
      });
      
      // Use setTimeout to ensure this happens after current render cycle
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 0);
    }
  }, [isAuthenticated, navigate, from]);

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
              sx={{ mt: 3, mb: 1, backgroundColor: '#136C9E', '&:hover': { backgroundColor: '#0e5278' } }}
              onClick={() => handleLogin('microsoft')}
            >
              Sign In with Microsoft
            </Button>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={() => handleLogin('google')}
            >
              Sign In with Google
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => {
                const search = location.search;
                navigate(`/pricing${search}`);
              }}
            >
              Don't have an account? Sign Up
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 