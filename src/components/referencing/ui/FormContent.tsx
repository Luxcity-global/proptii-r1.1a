import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { FormSection } from '../../../types/referencing';
import { useReferencing } from '../context/ReferencingContext';
import ReferencingForm from './ReferencingForm';

interface FormContentProps {
  steps: { label: string; section: FormSection }[];
}

/**
 * FormContent component for displaying the current form section in the referencing process.
 * 
 * @param steps - Array of step objects with label and section properties
 */
const FormContent: React.FC<FormContentProps> = ({ steps }) => {
  const { state } = useReferencing();
  
  // Convert currentStep from number to FormSection if needed
  const currentSection: FormSection = typeof state.currentStep === 'number'
    ? ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'][state.currentStep] as FormSection
    : state.currentStep as FormSection;
  
  const currentStepIndex = steps.findIndex(step => step.section === currentSection);
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Handle case when section is not found
  if (currentStepIndex === -1) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Unknown section
        </Alert>
        <Typography>
          The requested section could not be found. Please try selecting a different section from the sidebar.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <ReferencingForm
        section={currentSection}
        submitButtonText={isLastStep ? 'Submit Application' : 'Next'}
      />
    </Box>
  );
};

export default FormContent; 