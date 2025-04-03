import React, { useState, useRef } from 'react';
import { Button, Box, Typography, FormHelperText } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  currentFile?: File | null;
  error?: string;
  maxSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept,
  onChange,
  currentFile,
  error,
  maxSize = 5 * 1024 * 1024 // 5MB default
}) => {
  const [file, setFile] = useState<File | null>(currentFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    
    if (selectedFile) {
      // Check file size
      if (maxSize && selectedFile.size > maxSize) {
        alert(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
        return;
      }
      
      setFile(selectedFile);
      onChange(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-upload-input"
        ref={fileInputRef}
      />
      
      {!file ? (
        <label htmlFor="file-upload-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 1 }}
          >
            {label}
          </Button>
        </label>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InsertDriveFileIcon sx={{ mr: 1 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" noWrap>
              {file.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatFileSize(file.size)}
            </Typography>
          </Box>
          <Button
            size="small"
            color="error"
            onClick={handleRemoveFile}
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        </Box>
      )}
      
      {error && (
        <FormHelperText error>{error}</FormHelperText>
      )}
    </Box>
  );
};

export default FileUpload; 