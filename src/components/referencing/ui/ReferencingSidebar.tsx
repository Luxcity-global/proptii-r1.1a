import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Box,
  Typography,
  Divider,
  Badge,
  Tooltip,
  alpha,
  LinearProgress,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useReferencing } from '../context/ReferencingContext';
import { FormSection } from '../../../types/referencing';

// Define color constants
const BLUE_COLOR = '#136C9E';
const DARK_GREY = '#555555';
const LIGHT_GREY = '#AAAAAA';

interface ReferencingSidebarProps {
  steps: { label: string; section: FormSection }[];
  onStepClick?: (index: number) => void;
  activeStepIndex?: number;
  completedSteps?: number[];
}

/**
 * Sidebar component for the referencing form with navigation
 * Enhanced with Mac/Swift-inspired UI and improved progress indicators
 */
const ReferencingSidebar: React.FC<ReferencingSidebarProps> = ({ 
  steps,
  onStepClick,
  activeStepIndex,
  completedSteps = []
}) => {
  const { state, setCurrentStep } = useReferencing();
  
  // Get icon for each step with enhanced styling
  const getStepIcon = (section: FormSection, isCompleted: boolean, isActive: boolean) => {
    let icon;
    
    switch (section) {
      case 'identity':
        icon = <PersonIcon fontSize="small" />;
        break;
      case 'employment':
        icon = <WorkIcon fontSize="small" />;
        break;
      case 'residential':
        icon = <HomeIcon fontSize="small" />;
        break;
      case 'financial':
        icon = <AccountBalanceIcon fontSize="small" />;
        break;
      case 'guarantor':
        icon = <SupervisorAccountIcon fontSize="small" />;
        break;
      case 'creditCheck':
        icon = <VerifiedUserIcon fontSize="small" />;
        break;
      default:
        icon = <PersonIcon fontSize="small" />;
    }
    
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          isCompleted ? (
            <CheckCircleIcon 
              color="success" 
              sx={{ 
                fontSize: 14,
                backgroundColor: 'white',
                borderRadius: '50%'
              }} 
            />
          ) : null
        }
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: isActive 
              ? BLUE_COLOR 
              : alpha(BLUE_COLOR, 0.1),
            color: isActive 
              ? 'white' 
              : isCompleted 
                ? BLUE_COLOR
                : DARK_GREY,
            transition: 'all 0.2s ease-in-out',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {icon}
        </Box>
      </Badge>
    );
  };
  
  // Check if a step is completed
  const isStepCompleted = (section: FormSection, index: number) => {
    // If completedSteps is provided, use it
    if (completedSteps.length > 0) {
      return completedSteps.includes(index);
    }
    
    // Otherwise use the context
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
  
  // Handle step click - now enabled for all sections
  const handleStepClick = (section: FormSection, index: number) => {
    // If onStepClick is provided, use it
    if (onStepClick) {
      onStepClick(index);
    } else {
      // Otherwise use the context
      setCurrentStep(section);
    }
  };
  
  // Determine if a step is active
  const isStepActive = (section: FormSection, index: number) => {
    // If activeStepIndex is provided, use it
    if (activeStepIndex !== undefined) {
      return activeStepIndex === index;
    }
    
    // Otherwise use the context
    // Convert currentStep from number to FormSection if needed
    if (typeof state.currentStep === 'number') {
      const sections: FormSection[] = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck'];
      return sections[state.currentStep] === section;
    }
    
    return state.currentStep === section;
  };
  
  // Get step status for tooltip
  const getStepStatus = (section: FormSection, index: number) => {
    const isCompleted = isStepCompleted(section, index);
    const isActive = isStepActive(section, index);
    if (isCompleted) return "Completed";
    if (isActive) return "In progress";
    if (isStepLocked(section, index)) return "Locked";
    return "Available";
  };
  
  // Check if a step is locked
  const isStepLocked = (section: FormSection, index: number): boolean => {
    // In this implementation, all steps are navigable
    // This function can be modified to implement locking logic if needed
    return false;
  };
  
  // Calculate the maximum completed step index
  const maxCompletedIndex = completedSteps.length > 0 
    ? Math.max(...completedSteps.map(step => Number(step)), -1) 
    : -1;
    
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
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 500, 
            color: LIGHT_GREY,
            mb: 1
          }}
        >
          The referencing process verifies renter or buyer identity, financial status, and rental history.
        </Typography>
      </Box>
      
      <List sx={{ width: '100%', p: 1, pl: 2, pr: 2, pt: 9, flexGrow: 1 }}>
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(step.section, index);
          const isActive = isStepActive(step.section, index);
          const stepStatus = getStepStatus(step.section, index);
          
          return (
            <ListItem 
              key={step.section} 
              disablePadding 
              sx={{ mb: 0.5 }}
            >
              <Tooltip title={stepStatus} placement="right">
                <ListItemButton
                  onClick={() => handleStepClick(step.section, index)}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: alpha(BLUE_COLOR, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(BLUE_COLOR, 0.15),
                      }
                    },
                    '&:hover': {
                      backgroundColor: alpha(BLUE_COLOR, 0.05),
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getStepIcon(step.section, isCompleted, isActive)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={step.label} 
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? BLUE_COLOR : 'text.primary'
                    }}
                  />
                  {isStepLocked(step.section, index) ? (
                    <LockIcon 
                      fontSize="small" 
                      color="action" 
                      sx={{ ml: 1, opacity: 0.5 }} 
                    />
                  ) : isActive ? (
                    <ArrowForwardIosIcon fontSize="small" sx={{ ml: 1, fontSize: 14, color: BLUE_COLOR }} />
                  ) : null}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              Step {typeof state.currentStep === 'number' ? state.currentStep + 1 : 
                ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck']
                  .indexOf(state.currentStep as string) + 1} of {steps.length}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: alpha(BLUE_COLOR, 0.1),
              '& .MuiLinearProgress-bar': {
                backgroundColor: BLUE_COLOR,
              }
            }} 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" align="center">
          {progress === 100 ? 
            "Ready to submit your application" : 
            "Complete all sections to submit"}
        </Typography>
      </Box>
    </Box>
  );
};

export default ReferencingSidebar; 