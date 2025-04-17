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
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReferencingProvider, useReferencing } from './context/ReferencingContext';
import ReferencingSidebar from './ui/ReferencingSidebar';
import MobileStepper from './ui/MobileStepper';
import FormContent from './ui/FormContent';
import { FormSection } from '../../types/referencing';
import { isAzureConfigured } from '../../config/azure';

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

// Define the steps for the referencing process
const STEPS: { label: string; section: FormSection }[] = [
  { label: 'Identity', section: 'identity' },
  { label: 'Employment', section: 'employment' },
  { label: 'Residential', section: 'residential' },
  { label: 'Financial', section: 'financial' },
  { label: 'Guarantor', section: 'guarantor' },
  { label: 'Credit Check', section: 'creditCheck' }
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  
  // Check if Azure is configured
  const azureConfigured = isAzureConfigured();
  
  // Check if API is available
  useEffect(() => {
    if (!open) return; // Only check when modal is open
    
    const checkApiAvailability = async () => {
      try {
        // Try to fetch from the API
        const response = await fetch(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api', {
          method: 'HEAD',
          // Add a timeout to avoid long waits
          signal: AbortSignal.timeout(5000)
        });
        setApiAvailable(response.ok);
      } catch (error) {
        console.warn('API not available:', error);
        setApiAvailable(false);
      }
    };
    
    checkApiAvailability();
  }, [open]);
  
  // Handle close with confirmation if there are unsaved changes
  const handleClose = () => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = localStorage.getItem(`proptii_property_${propertyId}_draft`) !== null;
    
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };
  
  // Handle confirm dialog actions
  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };
  
  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close on escape key
      if (event.key === 'Escape' && open) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <ReferencingProvider initialApplicationId={applicationId} propertyId={propertyId}>
      <ReferencingInitializer />
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby="referencing-modal-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 1,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle id="referencing-modal-title" sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: ORANGE_COLOR,
                fontSize: {
                  xs: '1rem',  // Smaller on mobile
                  sm: '1.25rem', // Medium on tablet
                  md: '1.5rem'     // Larger on desktop
                }
              }}
            >
              Tenant Referencing Application
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: BLUE_COLOR,
                  bgcolor: 'action.hover'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {!azureConfigured && (
          <Alert severity="warning" sx={{ mx: 2 }}>
            Azure configuration is incomplete. Some features may not work properly.
          </Alert>
        )}
        
        {apiAvailable === false && (
          <Alert severity="info" sx={{ mx: 2, mt: azureConfigured ? 0 : 2 }}>
            API is not available. Running in simulation mode.
          </Alert>
        )}
        
        <DialogContent dividers sx={{ p: 0 }}>
          <Grid container>
            {/* Sidebar for navigation */}
            {!isMobile && (
              <Grid item xs={12} md={3} sx={{ 
                borderRight: 1, 
                borderColor: 'divider',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
              }}>
                <ReferencingSidebar steps={STEPS} />
              </Grid>
            )}
            
            {/* Mobile stepper */}
            {isMobile && (
              <Grid item xs={12} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <MobileStepper steps={STEPS} />
              </Grid>
            )}
            
            {/* Main content area */}
            <Grid item xs={12} md={9} sx={{ p: 3 }}>
              <FormContent steps={STEPS} />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation dialog for unsaved changes */}
      <MuiDialog
        open={showConfirmDialog}
        onClose={handleCancelClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600, color: ORANGE_COLOR }}>
          Unsaved Changes
        </DialogTitle>
        <MuiDialogContent>
          <DialogContentText id="alert-dialog-description">
            You have unsaved changes. Are you sure you want to close the form? Your changes will be lost.
          </DialogContentText>
        </MuiDialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancelClose} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              borderColor: BLUE_COLOR,
              color: BLUE_COLOR,
              '&:hover': {
                borderColor: BLUE_COLOR,
                backgroundColor: 'rgba(19, 108, 158, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmClose} 
            variant="contained" 
            sx={{ 
              borderRadius: 2,
              backgroundColor: BLUE_COLOR,
              '&:hover': {
                backgroundColor: 'rgba(19, 108, 158, 0.9)'
              }
            }}
            autoFocus
          >
            Close Anyway
          </Button>
        </DialogActions>
      </MuiDialog>
    </ReferencingProvider>
  );
};

/**
 * Helper component to initialize the referencing state
 */
const ReferencingInitializer: React.FC = () => {
  const { state, setCurrentStep } = useReferencing();
  
  // Set initial step to 'identity' if not already set
  useEffect(() => {
    if (typeof state.currentStep === 'number' && state.currentStep === 0) {
      setCurrentStep('identity');
    }
  }, [state.currentStep, setCurrentStep]);
  
  return null;
};

export default ReferencingModal; 