import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  label?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  acceptedFileTypes = ['application/pdf', 'image/png', 'image/jpeg'],
  maxFileSize = 5242880, // 5MB
  label = 'Upload Document',
  error
}) => {
  // Convert acceptedFileTypes array to accept format for react-dropzone
  const accept = acceptedFileTypes.reduce((acc, type) => {
    if (type === 'application/pdf') {
      acc['application/pdf'] = ['.pdf'];
    } else if (type.startsWith('image/')) {
      if (!acc['image/*']) acc['image/*'] = [];
      const ext = type.split('/')[1];
      acc['image/*'].push(`.${ext}`);
    }
    return acc;
  }, {} as Record<string, string[]>);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxFileSize,
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
    </div>
  );
};

export default FileUpload; 