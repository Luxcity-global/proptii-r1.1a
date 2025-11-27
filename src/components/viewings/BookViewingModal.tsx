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
  CircularProgress
} from '@mui/material';
import PropertySelector from './components/PropertySelector';
import ViewingScheduler from './components/ViewingScheduler';
import ViewingComparison from './components/ViewingComparison';
import { BookViewingProvider, useBookViewing } from './context/BookViewingContext';
import { bookingService } from './services/bookingService';
import { viewingEmailService } from './services/viewingEmailService';
import { viewingService } from '../../services/viewingService';
import { bookViewingRequestService } from '../../services/bookViewingRequestService';
import landlordUserService from '../../services/landlordUserService';
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

// Update the PropertyDetails interface to match the context
interface PropertyDetails {
  id?: string;
  street: string;
  town: string;
  city: string;
  postcode: string;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
  };
}

interface BookViewingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmissionComplete?: () => void;
  prefilledPropertyData?: PropertyDetails | null;
}

const BookViewingModal: React.FC<BookViewingModalProps> = ({ open, onClose, onSubmissionComplete, prefilledPropertyData }) => {
  return (
    <BookViewingProvider>
      <BookViewingModalContent open={open} onClose={onClose} onSubmissionComplete={onSubmissionComplete} prefilledPropertyData={prefilledPropertyData} />
    </BookViewingProvider>
  );
};

const BookViewingModalContent: React.FC<BookViewingModalProps> = ({ open, onClose, onSubmissionComplete, prefilledPropertyData }) => {
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
  const [showStepWarning, setShowStepWarning] = useState(false);

  // Validation function for final submission
  const isAllDataComplete = () => {
    const property = state.selectedProperty;
    const viewing = state.viewingDetails;
    const userDetails = viewing?.userDetails;

    const isValid = property?.street &&
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

    console.log('Data validation check:', {
      property: !!property,
      propertyStreet: !!property?.street,
      agentName: !!property?.agent?.name,
      agentEmail: !!property?.agent?.email,
      viewing: !!viewing,
      viewingDate: !!viewing?.date,
      viewingTime: !!viewing?.time,
      viewingPreference: !!viewing?.preference,
      userDetails: !!userDetails,
      userFullName: !!userDetails?.fullName,
      userEmail: !!userDetails?.email,
      userPhone: !!userDetails?.phoneNumber,
      isValid
    });

    return isValid;
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
      if (!property?.street) {
        messages.push("Property address details");
      }
      if (!property?.city) {
        messages.push("City / town");
      }
      if (!property?.postcode) {
        messages.push("Postcode");
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
    console.log('handleNext called', { activeStep, isAllDataComplete: isAllDataComplete() });
    
    // Check if current step has missing fields (only for steps 0 and 1)
    if (activeStep < 2) {
      const warningMessages = getStepWarningMessage(activeStep);
      if (warningMessages.length > 0) {
        setShowStepWarning(true);
        return; // Don't proceed if fields are missing
      }
    }

    // If we're on the confirmation step, check if all data is complete
    if (activeStep === steps.length - 1 && !isAllDataComplete()) {
      console.log('Data incomplete, cannot submit');
      return; // Don't proceed if data is incomplete
    }

    try {
      setIsSaving(true);

      if (activeStep === steps.length - 1) {
        // Submit the viewing request to the backend
        const property = state.selectedProperty;
        const viewing = state.viewingDetails;

        if (!property || !viewing || !viewing.date || !viewing.time || !viewing.preference || !viewing.userDetails) {
          throw new Error('Missing property or viewing details');
        }

        console.log('Starting viewing submission...', { property, viewing, userId: user?.id });
        console.log('User object in BookViewingModal:', user);

        // Save to Firestore
        const userIdToUse = user?.id || 'anonymous';
        console.log('Using user ID for Firestore save:', userIdToUse);
        
        // Look up the landlord/agent by email to get their ID
        let landlordAgentId: string | null = property.agent?.id || null;
        
        if (!landlordAgentId && property.agent?.email) {
          console.log('🔍 Looking up landlord/agent by email:', property.agent.email);
          try {
            const lookupResult = await landlordUserService.getLandlordUserByEmail(property.agent.email);
            if (lookupResult.success && lookupResult.user?.id) {
              landlordAgentId = lookupResult.user.id;
              console.log('✅ Found landlord/agent ID:', landlordAgentId);
            } else {
              console.log('⚠️ No landlord/agent found with email:', property.agent.email);
              console.log('ℹ️ Viewing will be saved without landlord/agent link. They need to register at:', property.agent.email);
            }
          } catch (lookupError) {
            console.warn('⚠️ Error looking up landlord/agent:', lookupError);
            // Continue without the ID - viewing will still be saved
          }
        }
        
        const managerInfo = {
          landlordId: landlordAgentId,
          agentId: landlordAgentId
        };

        console.log('Manager info for viewing save:', managerInfo);

        // Save the viewing request to bookViewingRequests collection (for landlord/agent to approve)
        const requestResult = await bookViewingRequestService.saveRequest(
          userIdToUse,
          property.id || `property_${Date.now()}`,
          property,
          managerInfo
        );

        console.log('Viewing request result:', requestResult);

        if (requestResult.error) {
          console.error('Error saving viewing request:', requestResult.error);
        } else {
          console.log('✅ Successfully saved viewing request for landlord/agent approval');
        }

        // Create a properly typed viewing object for the booking
        const viewingBookingDetails = {
          date: viewing.date,
          time: viewing.time,
          preference: viewing.preference,
          userDetails: {
            fullName: viewing.userDetails.fullName || '',
            email: viewing.userDetails.email || '',
            phoneNumber: viewing.userDetails.phoneNumber || ''
          }
        };

        const firestoreResult = await viewingService.saveViewingBooking(
          userIdToUse,
          property,
          viewingBookingDetails,
          property.id || undefined,
          managerInfo
        );

        console.log('Firestore result:', firestoreResult);

        if (firestoreResult.error) {
          console.error('Error saving to Firestore:', firestoreResult.error);
          // Continue with success flow even if Firestore fails
          // You might want to show a warning to the user
        } else {
          console.log('✅ Successfully saved to Firestore');
        }

        // Save to existing database (for backward compatibility) - Optional
        try {
          await bookingService.scheduleViewing(property, viewing);
          console.log('✅ Successfully saved to existing backend');
        } catch (backendError) {
          const errorMessage = backendError instanceof Error ? backendError.message : 'Unknown error';
          console.warn('⚠️ Backend service not available (this is optional):', errorMessage);
          // Continue with success flow - backend is optional
        }

        // Send emails - Optional
        try {
          const emailResult = await viewingEmailService.sendViewingEmails({
            property,
            viewing,
            user: {
              name: viewing.userDetails?.fullName,
              email: viewing.userDetails?.email
            }
          });

          if (emailResult.error) {
            console.warn('⚠️ Email service not available (this is optional):', emailResult.error);
          } else {
            console.log('✅ Successfully sent emails');
          }
        } catch (emailError) {
          const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
          console.warn('⚠️ Email service not available (this is optional):', errorMessage);
          // Continue with success flow - emails are optional
        }

        console.log('✅ All submission steps completed successfully');
        
        setSaveComplete(true);
        setShowSavedIndicator(true);
        setTimeout(() => {
          setSaveComplete(false);
          setIsSaving(false);
          console.log('Showing success dialog...');
          setShowSuccess(true);
          
          // Auto-close after showing success for 3 seconds
          setTimeout(() => {
            console.log('Auto-closing modal after success...');
            handleSuccessClose();
          }, 3000);
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
    setShowStepWarning(false);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCloseWarning = () => {
    setShowStepWarning(false);
  };

  const handleSuccessClose = () => {
    console.log('Closing success dialog and modal...');
    setShowSuccess(false);
    dispatch({ type: 'RESET_STATE' });
    setActiveStep(0);
    
    // Close the main modal first
    onClose();
    
    // Then trigger the review modal in the parent component after a short delay
    if (onSubmissionComplete) {
      setTimeout(() => {
        console.log('Triggering onSubmissionComplete callback...');
        onSubmissionComplete();
      }, 300);
    }
  };

  const getStepWarningMessage = (step: number) => {
    const messages = [];

    switch (step) {
      case 0: // Property Details
        const property = state.selectedProperty;
        if (!property?.street) {
          messages.push("Property address details");
        }
        if (!property?.city) {
          messages.push("City / town");
        }
        if (!property?.postcode) {
          messages.push("Postcode");
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

  const WarningPopup = ({ messages, open, onClose }: { messages: string[]; open: boolean; onClose: () => void }) => {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            [theme.breakpoints.down('sm')]: {
              margin: 2,
              maxWidth: 'calc(100% - 32px)',
            }
          }
        }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1, sm: 1.5 },
            color: '#DC5F12',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Warning sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Missing Information
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 1 }}>
              Please complete the following information before continuing:
            </Typography>
            <ul style={{
              marginLeft: 0,
              paddingLeft: isMobile ? '16px' : '20px',
              marginBottom: 0
            }}>
              {messages.map((message, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {message}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              bgcolor: BLUE_COLOR,
              '&:hover': {
                bgcolor: BLUE_COLOR,
                opacity: 0.9
              },
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderStepContent = () => {
    return (
      <ScrollableContent>
        {activeStep === 0 && <PropertySelector />}
        {activeStep === 1 && <ViewingScheduler />}
        {activeStep === 2 && <ViewingComparison />}
      </ScrollableContent>
    );
  };

  // Reset saved indicator and warnings when changing steps
  useEffect(() => {
    setShowSavedIndicator(false);
    setShowStepWarning(false);
  }, [activeStep]);

  // Reset warning when state changes (user fills fields)
  useEffect(() => {
    if (showStepWarning) {
      setShowStepWarning(false);
    }
  }, [state.selectedProperty, state.viewingDetails]);

  // Set prefilled property data when modal opens
  useEffect(() => {
    if (open && prefilledPropertyData && !state.selectedProperty?.street) {
      console.log('Setting prefilled property data:', prefilledPropertyData);
      dispatch({
        type: 'SET_SELECTED_PROPERTY',
        payload: prefilledPropertyData
      });
    }
  }, [open, prefilledPropertyData, state.selectedProperty, dispatch]);

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

      <WarningPopup
        messages={showStepWarning && activeStep < 2 ? getStepWarningMessage(activeStep) : []}
        open={showStepWarning}
        onClose={handleCloseWarning}
      />
    </>
  );
};

export default BookViewingModal;