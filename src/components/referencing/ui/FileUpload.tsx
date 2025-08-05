import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Check, AlertCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
  description?: string;
  selectedFile?: File | null;
  error?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

/**
 * A reusable file upload component with drag & drop, progress tracking, and file management
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg']
  },
  maxSize = 5242880, // 5MB
  label = 'Upload Document',
  description = 'PDF, JPG or PNG (max 5MB)',
  selectedFile,
  error,
  isUploading = false,
  uploadProgress = 0,
  className = ''
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
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
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
            {error ? (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={24} className="text-red-500" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <UploadCloud size={24} className="text-gray-500" />
              </div>
            )}
            
            <p className="text-gray-700 font-medium">
              {error ? 'Error uploading file' : isDragActive ? 'Drop the file here' : label}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {error ? error : isDragActive ? '' : description}
            </p>
          </div>
        )}
        
        {isUploading && (
          <div className="w-full mt-4">
            <ProgressBar progress={uploadProgress} label="Uploading..." />
          </div>
        )}
      </div>

      {selectedFile && onFileRemove && (
        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <UploadCloud className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">{selectedFile.name}</span>
          </div>
          <button
            onClick={onFileRemove}
            className="text-gray-400 hover:text-red-500 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && !selectedFile && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 