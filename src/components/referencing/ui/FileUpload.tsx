<<<<<<< HEAD
import React, { useRef, useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label: string;
  description?: string;
  selectedFile?: File | null;
  error?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

/**
 * A reusable file upload component
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = 'application/pdf,image/jpeg,image/png',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label,
  description = 'PDF, JPG or PNG (max 5MB)',
  selectedFile,
  error,
  isUploading = false,
  uploadProgress = 0,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };
  
  const validateAndSelectFile = (file: File) => {
    setLocalError(null);
    
    // Check file size
    if (file.size > maxSize) {
      setLocalError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return;
    }
    
    // Check file type
    const fileType = file.type;
    const acceptedTypes = accept.split(',');
    if (!acceptedTypes.some(type => fileType.match(type))) {
      setLocalError('File type not supported.');
      return;
    }
    
    // File is valid, call the callback
    onFileSelect(file);
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive ? 'border-primary bg-blue-50' : 'border-gray-300'
        } ${error || localError ? 'border-red-300 bg-red-50' : ''}`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        
        {selectedFile && !isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Check size={24} className="text-green-500" />
            </div>
            <p className="text-gray-700 font-medium">{selectedFile.name}</p>
            <p className="text-gray-500 text-sm mt-1">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {error || localError ? (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={24} className="text-red-500" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Upload size={24} className="text-gray-500" />
              </div>
            )}
            
            <p className="text-gray-700 font-medium">
              {error || localError ? 'Error uploading file' : label}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {error || localError ? error || localError : description}
            </p>
          </div>
        )}
        
        {isUploading && (
          <div className="w-full mt-4">
            <ProgressBar progress={uploadProgress} label="Uploading..." />
          </div>
        )}
      </div>
=======
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg']
  },
  maxSize = 5242880, // 5MB
  label = 'Upload Document',
  error
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the file here'
            : 'Drag and drop a file here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, PNG, JPG (max 5MB)
        </p>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <UploadCloud className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">{selectedFile.name}</span>
          </div>
          <button
            onClick={onFileRemove}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
>>>>>>> upstream/feature/ai-search-listings-agents
    </div>
  );
};

export default FileUpload; 