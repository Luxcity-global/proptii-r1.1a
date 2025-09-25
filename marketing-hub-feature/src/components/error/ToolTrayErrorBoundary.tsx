import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
  toolTrayName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ToolTrayErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ToolTray Error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="w-12 h-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load {this.props.toolTrayName || 'tool tray'}
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4 max-w-xs">
            Something went wrong while loading this tool tray. Please try again.
          </p>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs max-w-md">
              <summary className="cursor-pointer text-red-700 font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ToolTrayErrorBoundary;
