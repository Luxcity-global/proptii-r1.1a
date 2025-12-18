import React, { useState, useEffect } from 'react';
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
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');

  // Get the intended destination from location state (set by ProtectedRoute) or sessionStorage
  const getRedirectPath = () => {
    const statePath = (location.state as any)?.from?.pathname;
    const storedPath = sessionStorage.getItem('redirectAfterLogin');
    const queryRedirect = new URLSearchParams(window.location.search).get('redirect');
    
    // Priority: query param > state > sessionStorage > default
    return queryRedirect || statePath || storedPath || '/';
  };
  
  const from = getRedirectPath();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Clear stored redirect path and auto-login flag
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('autoLoginAttempted');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Auto-trigger login when landing on this page with a redirect parameter
  // This skips the intermediate "Sign in with Microsoft" button and goes straight to Azure B2C
  useEffect(() => {
    const shouldAutoLogin = new URLSearchParams(window.location.search).get('redirect');
    const hasAutoLoginRun = sessionStorage.getItem('autoLoginAttempted');
    
    if (shouldAutoLogin && !isAuthenticated && !hasAutoLoginRun) {
      console.log('🔐 Auto-triggering login for redirect:', shouldAutoLogin);
      sessionStorage.setItem('autoLoginAttempted', 'true');
      
      // Small delay to ensure the page is fully loaded
      setTimeout(() => {
        handleLogin();
      }, 500);
    }
  }, [isAuthenticated]);

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