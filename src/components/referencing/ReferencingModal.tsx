import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box, 
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogContentText,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useReferencing } from './context/ReferencingContext';
import ReferencingSidebar from './ui/ReferencingSidebar';
import MobileStepper from './ui/MobileStepper';
import FormContent from './ui/FormContent';
import { FormSection } from '../../types/referencing';
import { isAzureConfigured } from '../../config/azure';
import { useAuth } from '../../context/AuthContext';
import EmploymentSection from './sections/EmploymentSection';
import IdentitySection from './sections/IdentitySection';
import ResidentialSection from './sections/ResidentialSection';
import FinancialSection from './sections/FinancialSection';
import GuarantorSection from './sections/GuarantorSection';
import { CreditCheckSection } from './sections/CreditCheckSection';

// Define color constants
const BLUE_COLOR = '#136C9E';
const ORANGE_COLOR = '#DC5F12';
const LIGHT_GREY = '#AAAAAA';

interface ReferencingModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  applicationId?: string;
}

const steps = [
  'Identity',
  'Employment',
  'Residential',
  'Financial',
  'Guarantor',
  'Credit Check'
];

/**
 * ReferencingModal component for the tenant referencing application process.
 * This is the main container component that manages the modal dialog and layout.
 * Enhanced with backend integration and improved UI.
 */
const ReferencingModal: React.FC<ReferencingModalProps> = ({
  open,
  onClose,
  propertyId,
  applicationId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const {
    currentStep,
    setCurrentStep,
    validateSection,
    formData,
    errors,
    submitApplication
  } = useReferencing();

  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch('/api/health');
        setIsApiAvailable(response.ok);
      } catch (error) {
        setIsApiAvailable(false);
      }
    };

    if (open) {
      checkApiAvailability();
    }
  }, [open]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleNext = async () => {
    const isValid = await validateSection(steps[currentStep - 1].toLowerCase().replace(' ', '') as any);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitApplication();
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <IdentitySection />;
      case 2:
        return <EmploymentSection />;
      case 3:
        return <ResidentialSection />;
      case 4:
        return <FinancialSection />;
      case 5:
        return <GuarantorSection />;
      case 6:
        return <CreditCheckSection />;
      default:
        return null;
    }
  };

  if (!isApiAvailable) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Service Unavailable</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            We're currently experiencing technical difficulties. Please try again later.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAzureConfigured()) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Configuration Error</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            The application is not properly configured. Please contact support.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Tenant Referencing Application</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stepper activeStep={currentStep - 1} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ flex: 1, mt: 3 }}>
            {renderStepContent()}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 1}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              onClick={currentStep === steps.length ? handleSubmit : handleNext}
              variant="contained"
              disabled={isSubmitting}
            >
              {currentStep === steps.length ? 'Submit' : 'Next'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReferencingModal;