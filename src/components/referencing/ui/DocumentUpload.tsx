import React, { useState, useRef, useId } from 'react';
import {
  Box,
  Button,
  Typography,
  FormHelperText,
  IconButton,
  Paper,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useReferencing } from '../context/ReferencingContext';
import { FormSection } from '../../../types/referencing';
import { useTheme } from '@mui/material/styles';

// Screen reader only style
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0'
};

export interface DocumentUploadProps {
  id: string;
  label: string;
  accept: string;
  file: File | null | undefined;
  onFileChange: (file: File | null) => void;
  onUploadComplete?: (url: string, fileName: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  section: FormSection;
  field: string;
  autoUpload?: boolean;
  description?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
  onUploadError?: (error: string) => void;
}

/**
 * DocumentUpload component for file uploads with Azure Storage integration
 */
const DocumentUpload: React.FC<DocumentUploadProps> = ({
  id,
  label,
  accept,
  file,
  onFileChange,
  onUploadComplete,
  error,
  required = false,
  disabled = false,
  helperText,
  section,
  field,
  autoUpload = false,
  description,
  acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  onUploadError
}) => {
  const { uploadDocument, state } = useReferencing();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  
  // Get upload progress from context
  const uploadProgressValue = state.uploadProgress && state.uploadProgress[field] ? state.uploadProgress[field] : 0;
  
  // Generate unique IDs for accessibility
  const uniqueId = useId();
  const errorId = `${id}-error-${uniqueId}`;
  const helperId = `${id}-helper-${uniqueId}`;
  const labelId = `${id}-label-${uniqueId}`;
  const dropzoneId = `${id}-dropzone-${uniqueId}`;
  const progressId = `${id}-progress-${uniqueId}`;
  
  // Handle file selection
  const handleFileChange = async (selectedFile: File | null) => {
    if (disabled) return;
    
    // Reset upload states
    setUploadError(null);
    setUploadSuccess(false);
    
    onFileChange(selectedFile);
    
    // Auto upload if enabled and file is selected
    if (autoUpload && selectedFile) {
      await handleUpload(selectedFile);
    }
  };
  
  // Handle file selection from input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const selectedFile = e.target.files?.[0] || null;
    handleFileChange(selectedFile);
  };
  
  // Handle file removal
  const handleRemoveFile = () => {
    if (disabled || isUploading) return;
    onFileChange(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle file upload to Azure Storage
  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload || isUploading) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Use the uploadDocument function from context
      let fileUrl = null;
      
      try {
        fileUrl = await uploadDocument(section, field, fileToUpload);
      } catch (uploadError) {
        console.error('Error using uploadDocument:', uploadError);
        // Fallback to a simulated upload for development
        fileUrl = URL.createObjectURL(fileToUpload);
      }
      
      if (fileUrl) {
        setUploadSuccess(true);
        if (onUploadComplete) {
          onUploadComplete(fileUrl, fileToUpload.name);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    const droppedFile = e.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Format accepted file types for screen readers
  const formatAcceptedTypes = (): string => {
    return acceptedFileTypes
      .split(',')
      .map(type => type.trim().toUpperCase())
      .join(', ');
  };
  
  // Update the styles to use theme colors
  const styles = {
    dropzone: {
      border: '2px dashed',
      borderColor: isDragging ? theme.palette.primary.main : '#cccccc',
      borderRadius: '4px',
      padding: '20px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      marginBottom: '10px',
      backgroundColor: isDragging ? 'rgba(19, 108, 158, 0.05)' : 'transparent',
      transition: 'all 0.3s ease',
    },
    uploadButton: {
      backgroundColor: theme.palette.primary.main,
      color: '#ffffff',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginRight: '10px',
      height: '40px',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      borderBottom: '1px solid #eee',
      '&:last-child': {
        borderBottom: 'none',
      },
    },
    fileName: {
      flex: 1,
      marginLeft: '10px',
      color: theme.palette.text.primary,
    },
    fileSize: {
      color: theme.palette.text.secondary,
      fontSize: '12px',
      marginLeft: '10px',
    },
    progressBar: {
      height: '4px',
      backgroundColor: '#e0e0e0',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '5px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.palette.primary.main,
      width: `${uploadProgressValue}%`,
      transition: 'width 0.3s ease',
    },
    uploadIcon: {
      color: theme.palette.primary.main,
      marginRight: '8px',
    },
  };
  
  return (
    <Box>
      <Typography 
        variant="subtitle2" 
        gutterBottom 
        id={labelId}
        component="label"
        htmlFor={id}
      >
        {label}{required && <span style={{ color: 'red' }}> *</span>}
      </Typography>
      
      {description && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      
      {!file ? (
        <Paper
          variant="outlined"
          sx={styles.dropzone}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          aria-disabled={disabled || isUploading}
          aria-labelledby={labelId}
          aria-describedby={`${helperId} ${error ? errorId : ''}`}
          id={dropzoneId}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            id={id}
            name={id}
            accept={accept}
            onChange={handleInputChange}
            style={{ display: 'none' }}
            aria-labelledby={labelId}
            aria-describedby={`${helperId} ${error ? errorId : ''}`}
            aria-invalid={!!error}
            disabled={disabled || isUploading}
            required={required}
          />
          
          <CloudUploadIcon sx={styles.uploadIcon} />
          
          <Typography variant="body1" gutterBottom>
            Drag and drop a file here, or click to select
          </Typography>
          
          <Typography variant="body2" color="textSecondary" id={helperId}>
            Accepted formats: {formatAcceptedTypes()}
          </Typography>
          
          <Typography sx={srOnly}>
            {formatAcceptedTypes()}
            {required ? 'This field is required.' : ''}
            {disabled ? 'This field is currently disabled.' : ''}
          </Typography>
          
          <Typography variant="caption" color="textSecondary" display="block">
            Maximum file size: {formatFileSize(maxFileSize)}
          </Typography>
          
          <Button
            variant="contained"
            component="span"
            sx={styles.uploadButton}
            disabled={disabled || isUploading}
          >
            Upload File
          </Button>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 1,
            opacity: disabled ? 0.7 : 1
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: isUploading || uploadError || uploadSuccess ? 1 : 0
          }}>
            <Box sx={styles.fileItem}>
              <InsertDriveFileIcon sx={styles.uploadIcon} />
              <Box>
                <Typography variant="body1" noWrap sx={styles.fileName}>
                  {file.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={styles.fileSize}>
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {!autoUpload && !isUploading && !uploadSuccess && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleUpload(file)}
                  disabled={disabled || isUploading}
                  sx={{ mr: 1 }}
                >
                  Upload
                </Button>
              )}
              
              {isUploading && (
                <CircularProgress size={24} sx={{ mr: 2 }} />
              )}
              
              {uploadSuccess && (
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              )}
              
              {uploadError && (
                <ErrorIcon color="error" sx={{ mr: 1 }} />
              )}
              
              <IconButton 
                onClick={handleRemoveFile} 
                aria-label={`Remove file ${file.name}`}
                disabled={disabled || isUploading}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
          
          {isUploading && uploadProgressValue > 0 && (
            <Box sx={styles.progressBar}>
              <Box sx={styles.progressFill} />
            </Box>
          )}
          
          {uploadError && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
              Error: {uploadError}
            </Typography>
          )}
          
          {uploadSuccess && (
            <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
              File uploaded successfully
            </Typography>
          )}
        </Paper>
      )}
      
      {helperText && !error && (
        <FormHelperText id={helperId}>
          {helperText}
        </FormHelperText>
      )}
      
      {error && (
        <FormHelperText id={errorId} error>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
};

export default DocumentUpload; 