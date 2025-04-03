import React, { useState } from 'react';
import { Container, Typography, Button, Box, Paper, Grid, Alert } from '@mui/material';
import ReferencingModal from '../components/referencing/ReferencingModal';

/**
 * ReferencingTest page for testing the ReferencingModal component
 */
const ReferencingTest: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState('test-property-123');
  const [applicationId, setApplicationId] = useState<string | undefined>(undefined);
  
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Referencing Modal Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test the Referencing Modal
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This page is used to test the ReferencingModal component with the updated UI and backend integration.
        </Alert>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={handleOpen}
              sx={{ mb: 2 }}
            >
              Open Referencing Modal
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <ReferencingModal
        open={open}
        onClose={handleClose}
        propertyId={propertyId}
        applicationId={applicationId}
      />
    </Container>
  );
};

export default ReferencingTest; 