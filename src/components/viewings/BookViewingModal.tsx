import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  styled,
  alpha
} from '@mui/material';
import PropertySelector from './components/PropertySelector';
import ViewingScheduler from './components/ViewingScheduler';
import RequirementsChecker from './components/RequirementsChecker';
import ViewingComparison from './components/ViewingComparison';
import { BookViewingProvider, useBookViewing } from './context/BookViewingContext';

// Constants
const BLUE_COLOR = '#136C9E';
const DARK_GREY = '#333333';

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxWidth: '800px',
    width: '100%',
    margin: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      height: '100%',
      maxHeight: '100%'
    }
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTypography-root': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: DARK_GREY
  }
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(1)
}));

const StepContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 0)
}));

// Steps definition
const steps = [
  'Select Property',
  'Schedule Viewing',
  'Requirements Check',
  'Confirmation'
];

interface BookViewingModalProps {
  open: boolean;
  onClose: () => void;
}

const BookViewingModal: React.FC<BookViewingModalProps> = ({ open, onClose }) => {
  return (
    <BookViewingProvider>
      <BookViewingModalContent open={open} onClose={onClose} />
    </BookViewingProvider>
  );
};

const BookViewingModalContent: React.FC<BookViewingModalProps> = ({ open, onClose }) => {
  const { state, dispatch } = useBookViewing();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <StyledDialogTitle>
        Book a Property Viewing
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Progress Stepper */}
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{ mb: 3 }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <StepContent>
          {activeStep === 0 && (
            <PropertySelector />
          )}
          {activeStep === 1 && (
            <ViewingScheduler />
          )}
          {activeStep === 2 && (
            <RequirementsChecker />
          )}
          {activeStep === 3 && (
            <ViewingComparison />
          )}
        </StepContent>
      </StyledDialogContent>

      <StyledDialogActions>
        <Button 
          onClick={onClose}
          sx={{ 
            color: DARK_GREY,
            '&:hover': {
              backgroundColor: alpha(DARK_GREY, 0.04)
            }
          }}
        >
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button 
            onClick={handleBack}
            variant="outlined"
            sx={{ 
              borderColor: BLUE_COLOR,
              color: BLUE_COLOR,
              '&:hover': {
                borderColor: BLUE_COLOR,
                backgroundColor: alpha(BLUE_COLOR, 0.04)
              }
            }}
          >
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext}
          variant="contained"
          sx={{ 
            bgcolor: BLUE_COLOR,
            '&:hover': {
              bgcolor: BLUE_COLOR,
              opacity: 0.9
            }
          }}
        >
          {activeStep === steps.length - 1 ? 'Confirm' : 'Next'}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default BookViewingModal; 