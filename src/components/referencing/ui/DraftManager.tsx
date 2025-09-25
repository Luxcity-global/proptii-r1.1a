import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import { useReferencing } from '../context/ReferencingContext';
import { getDrafts, deleteDraft } from '../../../utils/localStorage';
import { FormData } from '../../../types/referencing';
import * as referencingService from '../../../services/referencingService';
import { isAzureConfigured } from '../../../config/azure';

interface Draft {
  id: string;
  name: string;
  data: FormData;
  timestamp: number;
  createdAt?: string;
}

interface DraftManagerProps {
  propertyId: string;
}

/**
 * DraftManager component for saving and loading form drafts
 * Supports both local storage and API-based drafts
 */
const DraftManager: React.FC<DraftManagerProps> = ({ propertyId }) => {
  const { saveAsDraft, state, dispatch } = useReferencing();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [lastSavedFormatted, setLastSavedFormatted] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Determine if we should use API or localStorage
  const useApi = isAzureConfigured();
  
  // Load drafts on mount
  useEffect(() => {
    if (propertyId) {
      loadDrafts();
    }
  }, [propertyId]);
  
  // Format last saved timestamp
  useEffect(() => {
    if (state.lastSaved) {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setLastSavedFormatted(formatter.format(state.lastSaved));
    } else {
      setLastSavedFormatted(null);
    }
  }, [state.lastSaved]);
  
  // Load drafts from localStorage or API
  const loadDrafts = async () => {
    try {
      // Check if API is configured
      if (isAzureConfigured() && state.applicationId) {
        // Try to load drafts from API
        try {
          const response = await referencingService.getDrafts(state.applicationId);
          if (response.success && response.data) {
            // Convert API response to Draft format
            const apiDrafts = response.data.map((draft: any) => ({
              id: draft.id,
              name: draft.name,
              data: draft.data as FormData,
              timestamp: new Date(draft.createdAt).getTime(),
              createdAt: draft.createdAt
            }));
            setDrafts(apiDrafts);
            return;
          }
        } catch (error) {
          console.error('Error loading drafts from API:', error);
          // Fall back to localStorage
        }
      }
      
      // Load from localStorage
      const localDrafts = getDraftsFromLocalStorage(propertyId);
      setDrafts(localDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      setDrafts([]);
      // Show error message
      setSnackbarMessage('Failed to load drafts. Please try again.');
      setSnackbarOpen(true);
      setSnackbarSeverity('error');
    }
  };
  
  // Handle saving a draft
  const handleSaveDraft = async () => {
    if (!draftName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (useApi) {
        // Save to API
        const response = await referencingService.saveDraft(
          propertyId,
          draftName,
          convertFormDataForApi(state.formData)
        );
        
        if (response.success) {
          setSuccessMessage('Draft saved successfully');
          await loadDrafts(); // Reload drafts after saving
        } else {
          throw new Error(response.error || 'Failed to save draft');
        }
      } else {
        // Save to localStorage
        saveAsDraft(draftName);
        setSuccessMessage('Draft saved successfully');
        loadDrafts(); // Reload drafts after saving
      }
      
      setShowSaveDialog(false);
      setDraftName('');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle loading a draft
  const handleLoadDraft = async (draft: Draft) => {
    if (window.confirm('Loading this draft will replace your current progress. Are you sure?')) {
      setIsLoading(true);
      setError(null);
      
      try {
        if (useApi && !draft.data.identity) {
          // Load full draft data from API
          const response = await referencingService.loadDraft(propertyId, draft.id);
          
          if (response.success && response.data) {
            // Convert API data to FormData format
            const formData = convertApiDataToFormData(response.data);
            dispatch({ type: 'SET_FORM_DATA', payload: formData });
            setSuccessMessage('Draft loaded successfully');
          } else {
            throw new Error(response.error || 'Failed to load draft');
          }
        } else {
          // Use local data
          dispatch({ type: 'SET_FORM_DATA', payload: draft.data });
          setSuccessMessage('Draft loaded successfully');
        }
        
        setShowLoadDialog(false);
      } catch (err) {
        console.error('Error loading draft:', err);
        setError('Failed to load draft. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle deleting a draft
  const handleDeleteDraft = async (draftId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent triggering the load action
    
    if (window.confirm('Are you sure you want to delete this draft?')) {
      setIsLoading(true);
      setError(null);
      
      try {
        if (useApi) {
          // Delete from API
          const response = await referencingService.deleteDraft(propertyId, draftId);
          
          if (response.success) {
            setSuccessMessage('Draft deleted successfully');
            await loadDrafts(); // Reload drafts after deleting
          } else {
            throw new Error(response.error || 'Failed to delete draft');
          }
        } else {
          // Delete from localStorage
          deleteDraft(`property_${propertyId}`, draftId);
          setSuccessMessage('Draft deleted successfully');
          loadDrafts(); // Reload drafts after deleting
        }
      } catch (err) {
        console.error('Error deleting draft:', err);
        setError('Failed to delete draft. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Helper function to get drafts from localStorage
  const getDraftsFromLocalStorage = (propertyId: string): Draft[] => {
    try {
      return getDrafts<FormData>(propertyId) as Draft[];
    } catch (error) {
      console.error('Error loading drafts from localStorage:', error);
      return [];
    }
  };
  
  // Helper function to delete draft from localStorage
  const deleteDraftFromLocalStorage = (key: string, draftId: string): void => {
    try {
      const drafts = getDraftsFromLocalStorage(key);
      const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
      localStorage.setItem(`drafts_${key}`, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error deleting draft from localStorage:', error);
    }
  };
  
  // Helper function to convert FormData to API format
  const convertFormDataForApi = (formData: FormData) => {
    // Create a deep copy to avoid modifying the original
    const apiData = JSON.parse(JSON.stringify(formData));
    
    // Convert File objects to null as they can't be serialized
    // The actual files should be uploaded separately
    Object.keys(apiData).forEach(section => {
      if (apiData[section]) {
        Object.keys(apiData[section]).forEach(field => {
          if (apiData[section][field] instanceof File) {
            apiData[section][field] = null;
          }
        });
      }
    });
    
    return {
      propertyId,
      ...apiData
    };
  };
  
  // Helper function to convert API data to FormData format
  const convertApiDataToFormData = (apiData: any): FormData => {
    const formData: FormData = {
      identity: apiData.identity || {},
      employment: apiData.employment || {},
      residential: apiData.residential || {},
      financial: apiData.financial || {},
      guarantor: apiData.guarantor || {},
      creditCheck: apiData.creditCheck || {}
    };
    
    return formData;
  };
  
  return (
    <Box>
      {/* Last saved indicator */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          {lastSavedFormatted && (
            <Typography variant="caption" color="textSecondary">
              Last saved: {lastSavedFormatted}
            </Typography>
          )}
        </Box>
        
        <Box>
          <Tooltip title="Save as draft">
            <IconButton 
              color="primary" 
              onClick={() => setShowSaveDialog(true)}
              size="small"
              aria-label="save as draft"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Load draft">
            <IconButton 
              color="primary" 
              onClick={() => {
                loadDrafts();
                setShowLoadDialog(true);
              }}
              size="small"
              aria-label="load draft"
              disabled={isLoading || drafts.length === 0}
            >
              <FolderOpenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Save Draft Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Draft</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Draft Name"
            fullWidth
            value={draftName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
            placeholder="Enter a name for this draft"
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)} disabled={isLoading}>Cancel</Button>
          <Button 
            onClick={handleSaveDraft} 
            color="primary" 
            disabled={!draftName.trim() || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Load Draft Dialog */}
      <Dialog 
        open={showLoadDialog} 
        onClose={() => setShowLoadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Load Draft</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : drafts.length === 0 ? (
            <Typography>No saved drafts found.</Typography>
          ) : (
            <List>
              {drafts.map((draft) => (
                <React.Fragment key={draft.id}>
                  <ListItem 
                    onClick={() => handleLoadDraft(draft)}
                    sx={{ cursor: 'pointer' }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={(e: MouseEvent<HTMLButtonElement>) => handleDeleteDraft(draft.id, e)}
                        disabled={isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={draft.name}
                      secondary={`Saved on ${formatTimestamp(draft.timestamp)}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadDialog(false)} disabled={isLoading}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Success message snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Snackbar for loading errors */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DraftManager; 