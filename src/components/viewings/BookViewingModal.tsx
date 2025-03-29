import React, { useState } from 'react';
import { Check } from '@mui/icons-material';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  styled,
  alpha,
  IconButton
} from '@mui/material';
import PropertySelector from './components/PropertySelector';
import ViewingScheduler from './components/ViewingScheduler';
import RequirementsChecker from './components/RequirementsChecker';
import ViewingComparison from './components/ViewingComparison';
import { BookViewingProvider, useBookViewing } from './context/BookViewingContext';

import { Home, Event, CheckCircle, DoneAll } from '@mui/icons-material';
import { Close } from '@mui/icons-material'; // Import the Close icon
import MenuIcon from '@mui/icons-material/Menu'; // Import the hamburger menu icon

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


const ContentSection = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
}));

const StepSidebar = styled(Box)(({ theme }) => ({
  width: '240px',
  borderRight: `1px solid #E7F2FF`, // Updated outline color
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

// Step button styling
const StepButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5, 2),
  borderRadius: 8,
  color: isActive ? BLUE_COLOR : DARK_GREY,
  backgroundColor: isActive ? alpha(BLUE_COLOR, 0.08) : 'transparent',
  '&:hover': {
    backgroundColor: isActive ? alpha(BLUE_COLOR, 0.12) : alpha(DARK_GREY, 0.04)
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1.5)
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: `1px solid #E7F2FF`, // Updated outline color
  '& .MuiTypography-root': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: DARK_GREY,
  },
}));

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  display: 'flex',
  minHeight: '500px',
});

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid #E7F2FF`, // Updated outline color
  gap: theme.spacing(1),
}));

// Removed unused StepContent to resolve the compile error.

// Steps definition
const steps = [
  { label: 'Select Property', icon: <Home /> },
  { label: 'Schedule Viewing', icon: <Event /> },
  { label: 'Requirements Check', icon: <CheckCircle /> },
  { label: 'Confirmation', icon: <DoneAll /> },
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
  useBookViewing();
  const [activeStep, setActiveStep] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to toggle sidebar

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <Box display="flex" flex={1} minHeight="500px">
        {/* Sidebar Navigation */}
        {isSidebarOpen && (
          <StepSidebar
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            {/* Hamburger Menu Icon */}
            <IconButton
              onClick={toggleSidebar}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16, // Align to the top-right of the Sidebar
                zIndex: 20,
                color: DARK_GREY,
                backgroundColor: '#EDF3FA',
                '&:hover': {
                  backgroundColor: alpha('#EDF3FA', 0.8),
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Sidebar Title */}
            <Typography
              variant="h6"
              sx={{
                color: '#DC5F12',
                fontWeight: 'bold',
                marginBottom: 3,
              }}
            >
              Steps
            </Typography>

            {/* Sidebar Text */}
            <Typography
              variant="body2"
              sx={{
                color: '#6B7280',
                marginBottom: 3,
              }}
            >
              Follow the steps to book your property viewing.
            </Typography>

            {/* Steps */}
            {steps.map((step, index) => (
              <StepButton
                key={step.label}
                isActive={activeStep === index}
                onClick={() => index <= activeStep && setActiveStep(index)}
                startIcon={
                  index < activeStep ? (
                    <Check style={{ color: BLUE_COLOR }} />
                  ) : (
                    step.icon
                  )
                }
                fullWidth
              >
                {step.label}
              </StepButton>
            ))}
          </StepSidebar>
        )}

        {/* Main Content */}
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          sx={{
            marginLeft: isSidebarOpen ? '240px' : '0', // Adjust content based on sidebar state
            transition: 'margin-left 0.3s ease-in-out',
          }}
        >
          {/* Header */}
          <StyledDialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              {/* Title */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.4rem',
                  fontWeight: 'regular',
                  color: '#6B7280',
                }}
              >
                Book a Property Viewing
              </Typography>

              {/* Cancel Icon */}
              <IconButton
                onClick={onClose}
                sx={{
                  color: DARK_GREY,
                  backgroundColor: '#EDF3FA',
                  '&:hover': {
                    backgroundColor: alpha('#EDF3FA', 0.8),
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </StyledDialogTitle>

          {/* Step Content */}
          <StyledDialogContent
            sx={{
              backgroundColor: '#EDF3FA',
              pb: 3,
              flex: 1, // Ensure content takes up available space
            }}
          >
            <ContentSection>
              {activeStep === 0 && <PropertySelector />}
              {activeStep === 1 && <ViewingScheduler />}
              {activeStep === 2 && <RequirementsChecker />}
              {activeStep === 3 && <ViewingComparison />}
            </ContentSection>
          </StyledDialogContent>

          {/* Footer */}
          <StyledDialogActions
            sx={{
              marginLeft: isSidebarOpen ? '240px' : '0', // Align footer with sidebar
              transition: 'margin-left 0.3s ease-in-out',
            }}
          >
            <Button
              onClick={onClose}
              sx={{
                color: DARK_GREY,
                '&:hover': {
                  backgroundColor: alpha(DARK_GREY, 0.04),
                },
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
                    backgroundColor: alpha(BLUE_COLOR, 0.04),
                  },
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
                  opacity: 0.9,
                },
              }}
            >
              {activeStep === steps.length - 1 ? 'Confirm' : 'Next'}
            </Button>
          </StyledDialogActions>
        </Box>
      </Box>
    </StyledDialog>
  );
};

export default BookViewingModal;