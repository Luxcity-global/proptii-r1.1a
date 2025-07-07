import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  siteName: string;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  url,
  siteName
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {siteName} Listings
            </h2>
            <button
              onClick={openInNewTab}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
              Open in new tab
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="relative" style={{ height: 'calc(95vh - 80px)' }}>
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading {siteName} listings...</p>
              </div>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <div className="text-red-500 mb-4">
                  <X size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Unable to load {siteName}
                </h3>
                <p className="text-gray-600 mb-4">
                  This website cannot be displayed in a frame for security reasons.
                </p>
                <button
                  onClick={openInNewTab}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                  <ExternalLink size={16} />
                  Open {siteName} in new tab
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`${siteName} listings`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal; 