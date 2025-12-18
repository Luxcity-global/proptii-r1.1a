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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();
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
      
      // Clear stored redirect path and auto-login flag
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('autoLoginAttempted');
      
      console.log('✅ Already authenticated, redirecting to:', from);
      
      // Use setTimeout to ensure this happens after current render cycle
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 0);
    }
  }, [isAuthenticated, navigate, from]);

  // Auto-trigger login when landing on this page with a redirect parameter
  // This skips the intermediate "Sign in with Microsoft" button and goes straight to Azure B2C
  // Only runs ONCE when component mounts
  useEffect(() => {
    console.log('🔍 Auto-login check:', { isLoading, isAuthenticated, autoLoginTriggered, hasRedirected: hasRedirectedRef.current });
    
    // Don't do anything while auth is loading
    if (isLoading) {
      console.log('⏳ Auth is loading, waiting...');
      return;
    }

    // If already authenticated, don't trigger auto-login
    if (isAuthenticated) {
      console.log('✅ Already authenticated, skipping auto-login');
      return;
    }

    // If we've already redirected, don't do anything
    if (hasRedirectedRef.current) {
      console.log('✅ Already redirected, skipping auto-login');
      return;
    }

    // Only auto-login if we haven't triggered it yet in this session
    const shouldAutoLogin = new URLSearchParams(window.location.search).get('redirect');
    const hasAutoLoginRun = sessionStorage.getItem('autoLoginAttempted');
    
    if (shouldAutoLogin && !autoLoginTriggered && !hasAutoLoginRun) {
      console.log('🔐 Auto-triggering login for redirect:', shouldAutoLogin);
      setAutoLoginTriggered(true);
      sessionStorage.setItem('autoLoginAttempted', 'true');
      
      // Small delay to ensure the page is fully loaded
      setTimeout(() => {
        handleLogin();
      }, 500);
    } else {
      console.log('⏭️ Skipping auto-login:', { shouldAutoLogin, autoLoginTriggered, hasAutoLoginRun });
    }
  }, [isLoading, isAuthenticated, autoLoginTriggered]); // Only re-run when loading state or auth state changes

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
      await login();
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
              sx={{ mt: 3, mb: 2 }}
              onClick={handleLogin}
            >
              Sign In with Microsoft
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                const search = location.search;
                navigate(`/register${search}`);
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