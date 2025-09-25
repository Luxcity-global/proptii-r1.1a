// marketing-hub-feature/src/components/error/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to external service (if available)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, you would send this to your error tracking service
      const errorData = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Example: Send to error tracking service
      // errorTrackingService.captureException(errorData);
      
      console.log('Error logged:', errorData);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard');
      })
      .catch(() => {
        console.log('Error details:', errorDetails);
        alert('Error details logged to console');
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-lux-cream-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-lux-cream-300 p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-lux-blue-900 mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-lux-blue-700 mb-6">
                We encountered an unexpected error. Don't worry, your work is safe and we're here to help.
              </p>

              {/* Error ID */}
              <div className="bg-lux-cream-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-lux-blue-600">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p className="text-xs text-lux-blue-500 mt-1">
                  Please include this ID when contacting support
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="bg-lux-blue-600 hover:bg-lux-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-lux-blue-300 text-lux-blue-700 hover:bg-lux-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-lux-blue-300 text-lux-blue-700 hover:bg-lux-blue-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Error Details (if enabled) */}
              {this.props.showDetails && this.state.error && (
                <div className="mt-8 text-left">
                  <details className="bg-lux-cream-200 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-lux-blue-700 mb-2">
                      Technical Details
                    </summary>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-sm text-lux-blue-700">Error Message:</strong>
                        <p className="text-xs text-lux-blue-600 font-mono bg-white p-2 rounded border">
                          {this.state.error.message}
                        </p>
                      </div>
                      
                      {this.state.error.stack && (
                        <div>
                          <strong className="text-sm text-lux-blue-700">Stack Trace:</strong>
                          <pre className="text-xs text-lux-blue-600 font-mono bg-white p-2 rounded border overflow-auto max-h-32">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-sm text-lux-blue-700">Component Stack:</strong>
                          <pre className="text-xs text-lux-blue-600 font-mono bg-white p-2 rounded border overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      <Button
                        onClick={this.copyErrorDetails}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Bug className="w-3 h-3 mr-1" />
                        Copy Error Details
                      </Button>
                    </div>
                  </details>
                </div>
              )}

              {/* Support Information */}
              <div className="mt-8 pt-6 border-t border-lux-cream-300">
                <p className="text-sm text-lux-blue-600">
                  If this problem persists, please contact our support team with the error ID above.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

