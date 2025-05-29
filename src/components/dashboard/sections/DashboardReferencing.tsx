import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';

const DashboardReferencing: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Referencing Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Referencing Applications
            </Typography>
            {/* Add your referencing applications list here */}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardReferencing; 