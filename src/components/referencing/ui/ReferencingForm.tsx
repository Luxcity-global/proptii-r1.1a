import React from 'react';
import { FormSection } from '../../../types/referencing';
import { useReferencing } from '../context/ReferencingContext';
import { 
  Button, 
  Box, 
  Typography, 
  Alert, 
  Divider, 
  Paper, 
  alpha,
  CircularProgress,
  Tooltip,
  Stack
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import IdentityForm from '../sections/IdentityForm';
import EmploymentForm from '../sections/EmploymentForm';
import ResidentialForm from '../sections/ResidentialForm';
import FinancialForm from '../sections/FinancialForm';
import GuarantorForm from '../sections/GuarantorForm';
import CreditCheckForm from '../sections/CreditCheckForm';
import DraftManager from './DraftManager';

// Define color constants
const BLUE_COLOR = '#136C9E';

interface ReferencingFormProps {
  section: FormSection;
  onSubmit?: (data: any) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  submitButtonText?: string;
}

/**
 * ReferencingForm component that renders the appropriate form section
 * and handles navigation between sections.
 * Enhanced with Mac/Swift-inspired UI
 */
const ReferencingForm: React.FC<ReferencingFormProps> = ({
  section,
  onSubmit,
  onBack,
  showBackButton = true,
  submitButtonText = 'Next'
}) => {
  const { state, prevStep, saveCurrentStep } = useReferencing();
  
  // Determine if the form is submitting or saving
  const isSubmitting = state.isSaving || state.isSubmitting;
  
  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      prevStep();
    }
  };

  // Handle save button click
  const handleSave = async () => {
    await saveCurrentStep();
  };

  // Render the appropriate form based on the section
  const renderForm = () => {
    switch (section) {
      case 'identity':
        return <IdentityForm />;
      case 'employment':
        return <EmploymentForm />;
      case 'residential':
        return <ResidentialForm />;
      case 'financial':
        return <FinancialForm />;
      case 'guarantor':
        return <GuarantorForm />;
      case 'creditCheck':
        return <CreditCheckForm />;
      default:
        return <Typography>Unknown section</Typography>;
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* Draft Manager */}
      {state.propertyId && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: alpha(BLUE_COLOR, 0.05),
            border: '1px solid',
            borderColor: alpha(BLUE_COLOR, 0.1)
          }}
        >
          <DraftManager propertyId={state.propertyId} />
        </Paper>
      )}
      
      {/* Error Alert */}
      {state.errors && state.errors[section] && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {state.errors[section]}
        </Alert>
      )}

      {/* Form Content */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        {renderForm()}
      </Paper>

      {/* Navigation Buttons */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {showBackButton && (
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={isSubmitting}
              startIcon={<ArrowBackIosNewIcon fontSize="small" />}
              sx={{
                borderRadius: 2,
                px: 3,
                height: 44,
                borderColor: BLUE_COLOR,
                color: BLUE_COLOR,
                '&:hover': {
                  borderColor: BLUE_COLOR,
                  backgroundColor: alpha(BLUE_COLOR, 0.05)
                }
              }}
            >
              Back
            </Button>
          )}
          
          <Tooltip title="Save current progress">
            <Button
              variant="outlined"
              onClick={handleSave}
              disabled={isSubmitting}
              startIcon={<SaveIcon fontSize="small" />}
              sx={{
                borderRadius: 2,
                px: 3,
                height: 44,
                borderColor: BLUE_COLOR,
                color: BLUE_COLOR,
                '&:hover': {
                  borderColor: BLUE_COLOR,
                  backgroundColor: alpha(BLUE_COLOR, 0.05)
                }
              }}
            >
              Save
            </Button>
          </Tooltip>
          
          {state.lastSaved && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              Saved
            </Typography>
          )}
        </Stack>
        
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          endIcon={isSubmitting ? 
            <CircularProgress size={16} color="inherit" /> : 
            submitButtonText === 'Submit Application' ? 
              <CheckCircleIcon fontSize="small" /> : 
              <ArrowForwardIosIcon fontSize="small" />
          }
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1.5,
            boxShadow: 2,
            height: 44,
            minWidth: submitButtonText === 'Submit Application' ? 200 : 120,
            backgroundColor: BLUE_COLOR,
            '&:hover': {
              backgroundColor: alpha(BLUE_COLOR, 0.9)
            }
          }}
          form={`${section}-form`} // Connect to the form ID
        >
          {isSubmitting ? 'Saving...' : submitButtonText}
        </Button>
      </Box>
    </Box>
  );
};

export default ReferencingForm; 