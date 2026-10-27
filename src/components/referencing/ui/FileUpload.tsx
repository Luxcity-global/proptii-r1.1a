import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: any;
  acceptedFileTypes?: string[];
  accept?: Record<string, string[]> | string;
  maxFileSize?: number;
  maxSize?: number;
  label?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  acceptedFileTypes = ['application/pdf', 'image/png', 'image/jpeg'],
  accept: acceptProp,
  maxFileSize = 5242880, // 5MB
  maxSize,
  label = 'Upload Document',
  error
}) => {
  const effectiveMaxSize = maxSize || maxFileSize || 5242880;

  // Compute accept object for dropzone
  const accept = React.useMemo(() => {
    if (acceptProp && typeof acceptProp === 'object') {
      return acceptProp;
    }
    if (typeof acceptProp === 'string') {
      const parts = acceptProp.split(',').map((p) => p.trim());
      const acc: Record<string, string[]> = {};
      parts.forEach((part) => {
        if (part === 'application/pdf') {
          acc['application/pdf'] = ['.pdf'];
        } else if (part.startsWith('image/')) {
          acc['image/*'] = ['.png', '.jpg', '.jpeg'];
        } else if (part.startsWith('.')) {
          acc['application/octet-stream'] = [part];
        }
      });
      return acc;
    }
    return acceptedFileTypes.reduce((acc, type) => {
      if (type === 'application/pdf') {
        acc['application/pdf'] = ['.pdf'];
      } else if (type.startsWith('image/')) {
        if (!acc['image/*']) acc['image/*'] = [];
        const ext = type.split('/')[1] || 'png';
        acc['image/*'].push(`.${ext}`);
      }
      return acc;
    }, {} as Record<string, string[]>);
  }, [acceptProp, acceptedFileTypes]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: effectiveMaxSize,
    multiple: false
  });

  // Determine if a valid file or document reference is present
  const isPresent = Boolean(
    selectedFile &&
    (selectedFile instanceof File ||
      (typeof selectedFile === 'string' && selectedFile.trim().length > 0) ||
      (typeof selectedFile === 'object' &&
        Boolean(
          selectedFile.name ||
          selectedFile.fileName ||
          selectedFile.url ||
          selectedFile.dataUrl ||
          selectedFile.storagePath
        )))
  );

  const displayName = isPresent
    ? selectedFile instanceof File
      ? selectedFile.name
      : selectedFile.name ||
        selectedFile.fileName ||
        (typeof selectedFile === 'string'
          ? selectedFile.split('/').pop()?.split('?')[0]
          : 'Uploaded Document')
    : '';

  const fileUrl = isPresent
    ? typeof selectedFile === 'string'
      ? selectedFile
      : selectedFile.url || selectedFile.dataUrl || null
    : null;

  const isUploading = isPresent && Boolean(selectedFile?.isUploading);

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
          Supported formats: PDF, PNG, JPG (max {Math.round(effectiveMaxSize / (1024 * 1024))}MB)
        </p>
      </div>

      {isPresent && (
        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate block">
                {displayName}
              </span>
              {isUploading && (
                <span className="text-xs text-blue-600 block">Uploading document...</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {fileUrl && !isUploading && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                title="View uploaded document"
              >
                <span>View</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
            <button
              type="button"
              onClick={onFileRemove}
              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
              title="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 