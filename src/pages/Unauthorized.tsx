import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();
  const isLandlord = user?.roles?.includes('landlord') || user?.roles?.includes('agent');
  const dashboardTarget = isLandlord ? '/landlord' : '/dashboard';

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
          >
            Go to Home
          </Button>
          <Button
            component={Link}
            to={dashboardTarget}
            variant="outlined"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
}; 