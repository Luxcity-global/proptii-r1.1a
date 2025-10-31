import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image, File, AlertCircle, Loader } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: number;
    name: string;
    category: string;
    type: string;
    size: number;
    uploadDate: string;
    url?: string;
  } | null;
  onDownload?: (file: any) => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  file, 
  onDownload 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      
      // Simulate loading the file preview
      // In a real implementation, you would fetch the file from the server
      setTimeout(() => {
        setLoading(false);
        // For demo purposes, we'll create a mock preview URL
        if (file.type === 'application/pdf') {
          setPreviewUrl('/api/preview/' + file.id);
        } else if (file.type.startsWith('image/')) {
          setPreviewUrl('/api/preview/' + file.id);
        } else {
          setError('Preview not available for this file type');
        }
      }, 1000);
    }
  }, [isOpen, file]);

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-600" />;
    } else if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-600" />;
    } else {
      return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (file && onDownload) {
      onDownload(file);
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    if (!file) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">No file selected</p>
        </div>
      );
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="h-96">
          <iframe
            src={file.url || previewUrl || ''}
            className="w-full h-full border-0 rounded-lg"
            title={file.name}
          />
        </div>
      );
    } else if (file.type.startsWith('image/')) {
      return (
        <div className="h-96 flex items-center justify-center">
          <img
            src={file.url || previewUrl || ''}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            {getFileIcon(file.type)}
            <p className="text-gray-600 mt-4">Preview not available</p>
            <p className="text-sm text-gray-500">Download the file to view it</p>
          </div>
        </div>
      );
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.type)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.category} • {file.uploadDate}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {file.type} • {formatFileSize(file.size)}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
