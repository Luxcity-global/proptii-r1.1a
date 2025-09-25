import React from 'react';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface CanvasLoadingIndicatorProps {
  loading: boolean;
  error?: string | null;
  success?: string | null;
  progress?: number;
  message?: string;
  className?: string;
}

export const CanvasLoadingIndicator: React.FC<CanvasLoadingIndicatorProps> = ({
  loading,
  error,
  success,
  progress = 0,
  message = 'Loading...',
  className = ''
}) => {
  if (!loading && !error && !success) {
    return null;
  }

  const getIcon = () => {
    if (error) return <XCircle className="w-5 h-5 text-red-500" />;
    if (success) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <Loader2 className="w-5 h-5 text-lux-blue-600 animate-spin" />;
  };

  const getBackgroundColor = () => {
    if (error) return 'bg-red-50 border-red-200';
    if (success) return 'bg-green-50 border-green-200';
    return 'bg-white border-lux-cream-300';
  };

  const getTextColor = () => {
    if (error) return 'text-red-700';
    if (success) return 'text-green-700';
    return 'text-lux-blue-700';
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className={`${getBackgroundColor()} rounded-lg shadow-lg border p-6 max-w-sm w-full mx-4`}>
        <div className="flex items-center space-x-3 mb-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${getTextColor()}`}>
              {error ? 'Error' : success ? 'Success' : 'Loading'}
            </h3>
            <p className={`text-sm ${getTextColor()} opacity-75`}>
              {error || success || message}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && progress > 0 && (
          <div className="w-full bg-lux-cream-200 rounded-full h-2 mb-4">
            <div 
              className="bg-lux-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Spinner for loading without progress */}
        {loading && progress === 0 && (
          <div className="flex justify-center mb-4">
            <Loader2 className="w-8 h-8 text-lux-blue-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// Canvas-specific loading states
export const CanvasSaveIndicator: React.FC<{
  saving: boolean;
  error?: string | null;
  success?: string | null;
}> = ({ saving, error, success }) => {
  return (
    <CanvasLoadingIndicator
      loading={saving}
      error={error}
      success={success}
      message={saving ? 'Saving canvas...' : undefined}
    />
  );
};

export const CanvasExportIndicator: React.FC<{
  exporting: boolean;
  error?: string | null;
  progress?: number;
}> = ({ exporting, error, progress }) => {
  return (
    <CanvasLoadingIndicator
      loading={exporting}
      error={error}
      progress={progress}
      message="Exporting canvas..."
    />
  );
};

export const CanvasLoadIndicator: React.FC<{
  loading: boolean;
  error?: string | null;
  progress?: number;
}> = ({ loading, error, progress }) => {
  return (
    <CanvasLoadingIndicator
      loading={loading}
      error={error}
      progress={progress}
      message="Loading canvas..."
    />
  );
};

// Toast-style notifications
export const CanvasNotification: React.FC<{
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
  duration?: number;
  className?: string;
}> = ({ type, message, onClose, duration = 3000, className = '' }) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-lux-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-lux-blue-50 border-lux-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-lux-blue-700';
    }
  };

  return (
    <div className={`fixed top-4 right-4 ${getBackgroundColor()} border rounded-lg shadow-lg p-4 max-w-sm z-50 ${className}`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${getTextColor()} opacity-50 hover:opacity-75`}
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CanvasLoadingIndicator;

