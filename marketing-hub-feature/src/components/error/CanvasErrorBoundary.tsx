// marketing-hub-feature/src/components/error/CanvasErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Save, Download, Trash2 } from 'lucide-react';
import { useCanvasStoreEnhanced } from '../../stores/canvasStoreEnhanced';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  lastKnownState: any;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      lastKnownState: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `canvas_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Canvas ErrorBoundary caught an error:', error, errorInfo);
    
    // Capture the last known canvas state for recovery
    const canvasStore = useCanvasStoreEnhanced.getState();
    const lastKnownState = {
      objects: canvasStore.objects,
      canvasSettings: canvasStore.canvasSettings,
      history: canvasStore.history.slice(-5), // Last 5 states
      timestamp: Date.now()
    };

    this.setState({
      error,
      errorInfo,
      lastKnownState
    });

    this.props.onError?.(error, errorInfo);
    this.logCanvasError(error, errorInfo, lastKnownState);
  }

  private logCanvasError = (error: Error, errorInfo: ErrorInfo, canvasState: any) => {
    try {
      const errorData = {
        errorId: this.state.errorId,
        type: 'canvas_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        canvasState: {
          objectCount: canvasState.objects?.length || 0,
          historyCount: canvasState.history?.length || 0,
          settings: canvasState.canvasSettings
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Canvas error logged:', errorData);
      
      // In a real app, send to error tracking service
      // errorTrackingService.captureCanvasError(errorData);
    } catch (logError) {
      console.error('Failed to log canvas error:', logError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      lastKnownState: null
    });
  };

  private handleRecoverFromLastState = () => {
    try {
      if (this.state.lastKnownState) {
        const canvasStore = useCanvasStoreEnhanced.getState();
        
        // Restore the last known state
        canvasStore.loadCanvas({ objects: this.state.lastKnownState.objects });
        
        // Show success message
        console.log('Canvas state recovered successfully');
        
        // Retry to reload the component
        this.handleRetry();
      }
    } catch (recoveryError) {
      console.error('Failed to recover canvas state:', recoveryError);
      alert('Failed to recover canvas state. Please try again or reload the page.');
    }
  };

  private handleExportCurrentState = () => {
    try {
      if (this.state.lastKnownState) {
        const exportData = {
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          canvasData: this.state.lastKnownState,
          error: {
            message: this.state.error?.message,
            stack: this.state.error?.stack
          }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-recovery-${this.state.errorId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Canvas state exported successfully. You can use this file to recover your work.');
      }
    } catch (exportError) {
      console.error('Failed to export canvas state:', exportError);
      alert('Failed to export canvas state.');
    }
  };

  private handleClearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      try {
        const canvasStore = useCanvasStoreEnhanced.getState();
        canvasStore.clearCanvas();
        this.handleRetry();
      } catch (clearError) {
        console.error('Failed to clear canvas:', clearError);
        alert('Failed to clear canvas. Please reload the page.');
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full bg-lux-cream-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-lg shadow-lg border border-lux-cream-300 p-6">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              {/* Error Title */}
              <h2 className="text-xl font-bold text-lux-blue-900 mb-3">
                Canvas Error
              </h2>

              {/* Error Message */}
              <p className="text-lux-blue-700 mb-4">
                The canvas encountered an error, but your work may still be recoverable.
              </p>

              {/* Error ID */}
              <div className="bg-lux-cream-200 rounded-lg p-2 mb-4">
                <p className="text-sm text-lux-blue-600">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
              </div>

              {/* Recovery Options */}
              <div className="space-y-3">
                {this.state.lastKnownState && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 mb-2">
                      <strong>Good news!</strong> We saved your work before the error occurred.
                    </p>
                    <p className="text-xs text-green-600">
                      Objects: {this.state.lastKnownState.objects?.length || 0} | 
                      History: {this.state.lastKnownState.history?.length || 0} states
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {this.state.lastKnownState && (
                    <>
                      <Button
                        onClick={this.handleRecoverFromLastState}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Recover My Work
                      </Button>

                      <Button
                        onClick={this.handleExportCurrentState}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Canvas State
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="border-lux-blue-300 text-lux-blue-700 hover:bg-lux-blue-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={this.handleClearCanvas}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Canvas & Start Over
                  </Button>
                </div>
              </div>

              {/* Technical Details */}
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-lux-blue-700 mb-2">
                  Technical Details
                </summary>
                <div className="bg-lux-cream-200 rounded-lg p-3">
                  <p className="text-xs text-lux-blue-600 font-mono break-all">
                    {this.state.error?.message}
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;

