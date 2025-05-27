import React from 'react';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  StepButton, 
  Box, 
  Typography, 
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { FormSection } from '../../../types/referencing';
import { useReferencing } from '../context/ReferencingContext';

// Define color constants
const BLUE_COLOR = '#136C9E';
const DARK_GREY = '#555555';
const LIGHT_GREY = '#AAAAAA';

interface MobileStepperProps {
  steps: { label: string; section: FormSection }[];
}

/**
 * MobileStepper component for displaying the current step in the referencing process on mobile devices.
 * Enhanced with better visual indicators and interactive step buttons.
 * 
 * @param steps - Array of step objects with label and section properties
 */
const MobileStepper: React.FC<MobileStepperProps> = ({ steps }) => {
  const { state, setCurrentStep } = useReferencing();
  const theme = useTheme();
  
  // Convert currentStep from number to FormSection if needed
  const currentSection: FormSection = typeof state.currentStep === 'number'
    ? ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'][state.currentStep] as FormSection
    : state.currentStep as FormSection;
  
  const activeStep = steps.findIndex(step => step.section === currentSection);
  
  // Check if a step is completed
  const isStepCompleted = (section: FormSection) => {
    const sectionData = state.formData[section];
    
    // Check if the section has data
    if (!sectionData) return false;
    
    // For each section, define required fields to consider it completed
    switch (section) {
      case 'identity':
        return !!(sectionData as any).firstName && !!(sectionData as any).lastName && !!(sectionData as any).email;
      case 'employment':
        return !!(sectionData as any).employmentStatus;
      case 'residential':
        return !!(sectionData as any).currentAddress;
      case 'financial':
        return true; // Consider financial always completed for now
      case 'guarantor':
        return true; // Consider guarantor always completed for now
      case 'creditCheck':
        return !!(sectionData as any).hasAgreedToCheck;
      default:
        return Object.keys(sectionData).length > 0;
    }
  };
  
  // Calculate progress percentage based on current step
  const calculateProgress = () => {
    // Get the current step index
    const currentStepIndex = typeof state.currentStep === 'number' 
      ? state.currentStep 
      : ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'].indexOf(state.currentStep as string);
    
    // Calculate progress as a percentage of total steps (increments by 1/6 for each step)
    return ((currentStepIndex + 1) / steps.length) * 100;
  };
  
  const progress = calculateProgress();
  
  // Handle step click
  const handleStepClick = (section: FormSection) => {
    setCurrentStep(section);
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel
        nonLinear
        sx={{ 
          overflowX: 'auto',
          '& .MuiStepLabel-label': {
            fontSize: '0.75rem',
            mt: 0.5
          }
        }}
      >
        {steps.map((step, index) => {
          const completed = isStepCompleted(step.section);
          
          return (
            <Step key={step.section} completed={completed}>
              <StepButton 
                onClick={() => handleStepClick(step.section)}
                optional={completed ? <CheckCircleIcon color="success" sx={{ fontSize: 14 }} /> : null}
                sx={{
                  '& .MuiStepLabel-iconContainer': {
                    '& .MuiStepIcon-root': {
                      color: index === activeStep ? BLUE_COLOR : completed ? '#34C759' : DARK_GREY,
                    },
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: index === activeStep ? 600 : 400,
                    color: index === activeStep ? BLUE_COLOR : 'text.primary'
                  }}
                >
                  {step.label}
                </Typography>
              </StepButton>
            </Step>
          );
        })}
      </Stepper>
      
      <Box sx={{ px: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color={LIGHT_GREY}>
            Progress
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            backgroundColor: alpha(BLUE_COLOR, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress === 100 ? '#34C759' : BLUE_COLOR,
            }
          }} 
        />
      </Box>
    </Box>
  );
};

export default MobileStepper; 