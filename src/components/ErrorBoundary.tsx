import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the full error object — toString() catches non-Error throws (e.g. strings, plain objects)
    console.error('[ErrorBoundary] Uncaught error:', String(error), error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      const err = this.state.error;
      // Derive the best available message — covers Error objects, strings thrown directly,
      // and non-Error objects (e.g. MSAL BrowserConfigurationAuthError with no .message).
      const message =
        (err && typeof err === 'object' && 'message' in err && err.message)
          ? err.message
          : (err ? String(err) : 'An unexpected error occurred');
      const errorCode =
        err && typeof err === 'object' && 'errorCode' in err
          ? String((err as any).errorCode)
          : null;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {errorCode && (
              <p className="text-xs text-gray-400 font-mono mb-4">Error code: {errorCode}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
