import React, { useState, useEffect } from 'react';
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
  IconButton,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  CircularProgress,
  StepperProps
} from '@mui/material';
import PropertySelector from './components/PropertySelector';
import ViewingScheduler from './components/ViewingScheduler';
import ViewingComparison from './components/ViewingComparison';
import { BookViewingProvider, useBookViewing } from './context/BookViewingContext';
import { bookingService } from './services/bookingService';
import { viewingEmailService } from './services/viewingEmailService';
import { useAuth } from '../../contexts/AuthContext';

import { Home, Event, DoneAll, Close, Warning } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Constants
const BLUE_COLOR = '#136C9E';
const ORANGE_COLOR = '#DC5F12';
const DARK_GREY = '#666666';
const LIGHT_GREY = '#AAAAAA';
const SUCCESS_GREEN = '#45bb58';
const ACTIVE_BLUE = '#d8e6fd';
const MODAL_HEIGHT = '80vh';
const BACKGROUND_BLUE = '#f1f5fa'; // Updated background color
const BORDER_COLOR = '#e0e0e0'; // Color for sidebar border

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxWidth: '1000px',
    width: '100%',
    height: MODAL_HEIGHT,
    margin: theme.spacing(2),
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      height: MODAL_HEIGHT,
    }
  }
}));

const ContentSection = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: BACKGROUND_BLUE,
  position: 'relative',
  overflow: 'hidden',
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
}));

const StickyWarning = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: theme.spacing(3, 3, 0, 3),
  backgroundColor: BACKGROUND_BLUE,
}));

const StepSidebar = styled(Box)(({ theme }) => ({
  width: '280px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fff',
  position: 'relative',
  borderRight: `1px solid ${BORDER_COLOR}`,
}));

const SidebarContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2, 2, 2),
  flex: 1,
  overflow: 'auto',
}));

const SidebarFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: 'auto',
}));

const StepButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isCompleted' && prop !== 'hasContent'
})<{ isActive?: boolean; isCompleted?: boolean; hasContent?: boolean }>(({ theme, isActive, isCompleted, hasContent }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5, 2),
  borderRadius: 8,
  width: '100%',
  fontSize: '1.1rem',
  fontWeight: isActive ? 600 : 400,
  color: isActive ? '#000000' : DARK_GREY,
  backgroundColor: isActive ? ACTIVE_BLUE : 'transparent',
  position: 'relative',
  '&:hover': {
    backgroundColor: isActive ? ACTIVE_BLUE : alpha(DARK_GREY, 0.04)
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1.5),
    color: isActive ? ORANGE_COLOR : DARK_GREY,
    '& svg': {
      fontSize: '1.5rem',
    }
  },
  '& .completion-indicator': {
    position: 'absolute',
    right: theme.spacing(4),
    color: SUCCESS_GREEN,
    fontSize: '1.04rem',
    display: 'flex',
    alignItems: 'center'
  }
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: alpha(BLUE_COLOR, 0.12),
  '& .MuiLinearProgress-bar': {
    backgroundColor: BLUE_COLOR,
  },
}));

const SaveIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: BLUE_COLOR,
  position: 'absolute',
  right: theme.spacing(2),
  top: '50%',
  transform: 'translateY(-50%)',
}));

const SavedIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: BLUE_COLOR,
  marginRight: theme.spacing(2),
}));

// Steps definition with icons
const steps = [
  {
    label: 'Property Details',
    icon: <Home sx={{ color: 'inherit' }} />,
    stepIcon: <Home sx={{ color: 'inherit' }} />
  },
  {
    label: 'Schedule Viewing',
    icon: <Event sx={{ color: 'inherit' }} />,
    stepIcon: <Event sx={{ color: 'inherit' }} />
  },
  {
    label: 'Confirmation',
    icon: <DoneAll sx={{ color: 'inherit' }} />,
    stepIcon: <DoneAll sx={{ color: 'inherit' }} />
  },
];

// Update the PropertyDetails interface to include id
interface PropertyDetails {
  id: string;
  street: string;
  city: string;
  postcode: string;
  agent?: {
    name: string;
    email: string;
  };
}

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { state, dispatch } = useBookViewing();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Validation function for final submission
  const isAllDataComplete = () => {
    const property = state.selectedProperty;
    const viewing = state.viewingDetails;
    const userDetails = viewing?.userDetails;

    return property?.street &&
      property?.city &&
      property?.postcode &&
      property?.agent?.name &&
      property?.agent?.email &&
      viewing?.date &&
      viewing?.time &&
      viewing?.preference &&
      userDetails?.fullName &&
      userDetails?.email &&
      userDetails?.phoneNumber;
  };

  // Add these validation functions after the isAllDataComplete function
  const isPropertyDetailsComplete = () => {
    const property = state.selectedProperty;
    return !!(
      property?.street &&
      property?.city &&
      property?.postcode &&
      property?.agent?.name &&
      property?.agent?.email
    );
  };

  const isSchedulingDetailsComplete = () => {
    const viewing = state.viewingDetails;
    const userDetails = viewing?.userDetails;
    return !!(
      viewing?.date &&
      viewing?.time &&
      viewing?.preference &&
      userDetails?.fullName &&
      userDetails?.email &&
      userDetails?.phoneNumber
    );
  };

  const getIncompleteFieldsMessage = () => {
    const messages = [];

    if (!isPropertyDetailsComplete()) {
      const property = state.selectedProperty;
      if (!property?.street || !property?.city || !property?.postcode) {
        messages.push("Property address details");
      }
      if (!property?.agent?.name || !property?.agent?.email) {
        messages.push("Agent contact information");
      }
    }

    if (!isSchedulingDetailsComplete()) {
      const viewing = state.viewingDetails;
      const userDetails = viewing?.userDetails;

      if (!viewing?.date || !viewing?.time || !viewing?.preference) {
        messages.push("Viewing date and time preferences");
      }
      if (!userDetails?.fullName || !userDetails?.email || !userDetails?.phoneNumber) {
        messages.push("Your contact details");
      }
    }

    return messages;
  };

  // Check if a section has content
  const hasSectionContent = (section: number) => {
    const property = state.selectedProperty;
    const viewing = state.viewingDetails;

    switch (section) {
      case 0: // Property Details
        return !!(property?.street ||
          property?.city ||
          property?.postcode ||
          property?.agent?.name ||
          property?.agent?.email);
      case 1: // Schedule Viewing
        return !!(viewing?.date ||
          viewing?.time ||
          viewing?.preference);
      case 2: // Confirmation
        return false; // Confirmation doesn't need a completion indicator
      default:
        return false;
    }
  };

  const handleNext = async () => {
    // If we're on the confirmation step, check if all data is complete
    if (activeStep === steps.length - 1 && !isAllDataComplete()) {
      return; // Don't proceed if data is incomplete
    }

    try {
      setIsSaving(true);

      if (activeStep === steps.length - 1) {
        // Submit the viewing request to the backend
        const property = state.selectedProperty;
        const viewing = state.viewingDetails;

        if (!property || !viewing) {
          throw new Error('Missing property or viewing details');
        }

        // Save to database
        await bookingService.scheduleViewing(property, viewing);

        // Send emails
        const emailResult = await viewingEmailService.sendViewingEmails({
          property,
          viewing,
          user: {
            name: viewing.userDetails?.fullName,
            email: viewing.userDetails?.email
          }
        });

        if (emailResult.error) {
          console.error('Error sending emails:', emailResult.error);
          // Continue with success flow even if emails fail
          // You might want to show a warning to the user
        }

        setSaveComplete(true);
        setShowSavedIndicator(true);
        setTimeout(() => {
          setSaveComplete(false);
          setIsSaving(false);
          setShowSuccess(true);
        }, 500);
      } else {
        // Just move to next step
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaveComplete(true);
        setShowSavedIndicator(true);
        setTimeout(() => {
          setSaveComplete(false);
          setIsSaving(false);
          setActiveStep((prevStep) => prevStep + 1);
        }, 500);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      setIsSaving(false);
      // Show error message to user
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to save viewing request'
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    dispatch({ type: 'RESET_STATE' });
    setActiveStep(0);
    onClose();
  };

  const getStepWarningMessage = (step: number) => {
    const messages = [];

    switch (step) {
      case 0: // Property Details
        const property = state.selectedProperty;
        if (!property?.street || !property?.city || !property?.postcode) {
          messages.push("Property address details");
        }
        if (!property?.agent?.name || !property?.agent?.email) {
          messages.push("Agent contact information");
        }
        break;

      case 1: // Schedule Viewing
        const viewing = state.viewingDetails;
        const userDetails = viewing?.userDetails;
        if (!viewing?.date || !viewing?.time || !viewing?.preference) {
          messages.push("Viewing date and time preferences");
        }
        if (!userDetails?.fullName || !userDetails?.email || !userDetails?.phoneNumber) {
          messages.push("Your contact details");
        }
        break;

      case 2: // Confirmation
        return getIncompleteFieldsMessage();
    }

    return messages;
  };

  const WarningMessage = ({ messages }: { messages: string[] }) => {
    if (messages.length === 0) return null;

    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: alpha('#DC5F12', 0.1),
        color: '#DC5F12',
        p: theme.spacing(2),
        borderRadius: 1,
        mb: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        [theme.breakpoints.down('sm')]: {
          p: theme.spacing(1.5),
          mb: 1,
          gap: 0.5
        }
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          [theme.breakpoints.down('sm')]: {
            gap: 0.5
          }
        }}>
          <Warning sx={{
            [theme.breakpoints.down('sm')]: {
              fontSize: '1.2rem'
            }
          }} />
          <Typography fontWeight="bold" sx={{
            [theme.breakpoints.down('sm')]: {
              fontSize: '0.9rem'
            }
          }}>
            Please complete the following information:
          </Typography>
        </Box>
        <ul style={{
          marginLeft: '28px',
          marginBottom: 0,
          [theme.breakpoints.down('sm')]: {
            marginLeft: '24px',
            marginTop: '4px'
          }
        }}>
          {messages.map((message, index) => (
            <li key={index}>
              <Typography sx={{
                [theme.breakpoints.down('sm')]: {
                  fontSize: '0.85rem'
                }
              }}>{message}</Typography>
            </li>
          ))}
        </ul>
      </Box>
    );
  };

  const renderStepContent = () => {
    const warningMessages = getStepWarningMessage(activeStep);

    return (
      <>
        {warningMessages.length > 0 && (
          <StickyWarning>
            <WarningMessage messages={warningMessages} />
          </StickyWarning>
        )}
        <ScrollableContent>
          {activeStep === 0 && <PropertySelector />}
          {activeStep === 1 && <ViewingScheduler />}
          {activeStep === 2 && <ViewingComparison />}
        </ScrollableContent>
      </>
    );
  };

  // Reset saved indicator when changing steps
  useEffect(() => {
    setShowSavedIndicator(false);
  }, [activeStep]);

  return (
    <>
      <StyledDialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Book a Viewing</Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', p: 0, height: `calc(${MODAL_HEIGHT} - 64px)` }}>
          {!isMobile && (
            <StepSidebar>
              <SidebarContent>
                <Typography
                  variant="h6"
                  sx={{
                    color: ORANGE_COLOR,
                    fontWeight: 'bold',
                    mb: 1,
                    fontSize: '1.3rem' // Increased font size
                  }}
                >
                  Steps
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: DARK_GREY,
                    mb: 2,
                    fontSize: '1rem' // Increased font size
                  }}
                >
                  Follow the steps to book your property viewing.
                </Typography>
                {steps.map((step, index) => {
                  const isActive = activeStep === index;
                  const hasContent = hasSectionContent(index);

                  return (
                    <StepButton
                      key={step.label}
                      isActive={isActive}
                      isCompleted={index < activeStep}
                      hasContent={hasContent}
                      onClick={() => setActiveStep(index)}
                      startIcon={step.stepIcon}
                    >
                      {step.label}
                      {hasContent && (
                        <FiberManualRecordIcon className="completion-indicator" />
                      )}
                    </StepButton>
                  );
                })}
              </SidebarContent>
              <SidebarFooter>
                <Typography
                  variant="body2"
                  sx={{
                    color: DARK_GREY,
                    mb: 1,
                    fontSize: '1rem' // Increased font size
                  }}
                >
                  Step {activeStep + 1} of {steps.length}
                </Typography>
                <StyledLinearProgress variant="determinate" value={(activeStep + 1) * (100 / steps.length)} />
              </SidebarFooter>
            </StepSidebar>
          )}

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {isMobile && (
              <Stepper activeStep={activeStep} alternativeLabel sx={{ px: 2, py: 3 }}>
                {steps.map((step) => (
                  <Step key={step.label}>
                    <StepLabel StepIconComponent={() => step.stepIcon}>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            <ContentSection>
              {renderStepContent()}
            </ContentSection>

            <DialogActions sx={{
              position: 'relative',
              borderTop: `1px solid ${alpha(BLUE_COLOR, 0.12)}`,
              p: 2,
              mt: 'auto',
              backgroundColor: '#fff',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {showSavedIndicator && (
                  <SavedIndicator>
                    <CheckIcon fontSize="small" />
                    <Typography variant="body2">Saved</Typography>
                  </SavedIndicator>
                )}
                {isSaving && (
                  <SavedIndicator>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Saving...</Typography>
                  </SavedIndicator>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {activeStep > 0 && (
                  <Button
                    onClick={handleBack}
                    sx={{ color: DARK_GREY }}
                  >
                    Previous
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSaving || (activeStep === steps.length - 1 && !isAllDataComplete())}
                  sx={{
                    bgcolor: BLUE_COLOR,
                    '&:hover': {
                      bgcolor: BLUE_COLOR,
                      opacity: 0.9
                    }
                  }}
                >
                  {activeStep === steps.length - 1 ? 'Submit' : 'Continue'}
                </Button>
              </Box>
            </DialogActions>
          </Box>
        </DialogContent>
      </StyledDialog>

      <Dialog
        open={showSuccess}
        onClose={handleSuccessClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Viewing Request Submitted</Typography>
            <IconButton onClick={handleSuccessClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Your viewing request has been submitted successfully. The estate agent will contact you shortly to confirm the viewing.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSuccessClose}
            variant="contained"
            sx={{
              bgcolor: BLUE_COLOR,
              '&:hover': {
                bgcolor: BLUE_COLOR,
                opacity: 0.9
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookViewingModal;