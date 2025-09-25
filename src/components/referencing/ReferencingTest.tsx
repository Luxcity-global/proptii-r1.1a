import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Button, Grid } from '@mui/material';
import { ReferencingProvider } from './context/ReferencingContext';
import ReferencingForm from './ui/ReferencingForm';
import ReferencingSidebar from './ui/ReferencingSidebar';
import { FormSection } from '../../types/referencing';

// Define the steps for the referencing process
const steps: { label: string; section: FormSection }[] = [
  { label: 'Identity', section: 'identity' },
  { label: 'Employment', section: 'employment' },
  { label: 'Residential', section: 'residential' },
  { label: 'Financial', section: 'financial' },
  { label: 'Guarantor', section: 'guarantor' },
  { label: 'Credit Check', section: 'creditCheck' }
];

/**
 * ReferencingTest component for testing the referencing form implementation
 * Enhanced with Mac/Swift-inspired UI and improved navigation
 */
const ReferencingTest: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Handle form submission
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    
    // Mark current step as completed
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps(prev => [...prev, activeStep]);
    }
    
    if (activeStep === steps.length - 1) {
      setCompleted(true);
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    setActiveStep(prevStep => Math.max(0, prevStep - 1));
  };
  
  // Handle reset button click
  const handleReset = () => {
    setActiveStep(0);
    setCompleted(false);
    setCompletedSteps([]);
  };
  
  // Handle step click from sidebar - now allows navigation to any step
  const handleStepClick = (index: number) => {
    // Allow navigation to any step
    setActiveStep(index);
  };
  
  return (
    <ReferencingProvider propertyId="test-property-123">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 0, 
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            align="center" 
            sx={{ 
              p: 3, 
              borderBottom: '1px solid',
              borderColor: 'grey.200',
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Referencing Form
          </Typography>
          
          {completed ? (
            <Box sx={{ textAlign: 'center', my: 4, p: 3 }}>
              <Typography variant="h5" gutterBottom>
                All steps completed!
              </Typography>
              <Typography variant="body1" paragraph>
                Thank you for completing the referencing form.
              </Typography>
              <Button variant="contained" onClick={handleReset}>
                Start Over
              </Button>
            </Box>
          ) : (
            <Grid container>
              {/* Sidebar */}
              <Grid 
                item 
                xs={12} 
                md={3} 
                sx={{ 
                  borderRight: '1px solid',
                  borderColor: 'grey.200',
                  height: '100%', 
                  minHeight: '600px',
                  p: 2
                }}
              >
                <ReferencingSidebar 
                  steps={steps} 
                  onStepClick={handleStepClick}
                  activeStepIndex={activeStep}
                  completedSteps={completedSteps}
                />
              </Grid>
              
              {/* Form Content */}
              <Grid item xs={12} md={9} sx={{ p: 3 }}>
                <ReferencingForm
                  section={steps[activeStep].section}
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  showBackButton={activeStep > 0}
                  submitButtonText={activeStep === steps.length - 1 ? 'Submit' : 'Next'}
                />
              </Grid>
            </Grid>
          )}
        </Paper>
      </Container>
    </ReferencingProvider>
  );
};

export default ReferencingTest; 