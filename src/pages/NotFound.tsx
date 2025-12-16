import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper
} from '@mui/material';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Check if this is a protected route that should redirect to login
  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Check if this path looks like a protected route
    const protectedPaths = [
      '/dashboard',
      '/landlord',
      '/agent',
      '/contracts'
    ];

    const isProtectedPath = protectedPaths.some(path => location.pathname.startsWith(path));

    // If it's a protected path and user is not authenticated, redirect to login
    if (isProtectedPath && !isAuthenticated) {
      const fullPath = location.pathname + location.search;
      sessionStorage.setItem('redirectAfterLogin', fullPath);
      const loginPath = `/login?redirect=${encodeURIComponent(fullPath)}`;
      
      console.log('🔒 NotFoundPage: Protected path detected, redirecting to login');
      console.log('🔒 Intended path:', fullPath);
      console.log('🔒 Login path:', loginPath);
      
      // Use window.location for more reliable redirect
      window.location.href = loginPath;
      return;
    }
  }, [location.pathname, isAuthenticated, isLoading]);

  // Don't show 404 page while checking auth or redirecting
  if (isLoading) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant="body1">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for doesn't exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Go to Homepage
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}; 