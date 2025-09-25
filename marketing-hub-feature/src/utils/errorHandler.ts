// marketing-hub-feature/src/utils/errorHandler.ts

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  canvasState?: any;
  timestamp?: string;
}

export interface ErrorReport {
  id: string;
  type: 'canvas' | 'api' | 'component' | 'global';
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userAgent: string;
  url: string;
}

class ErrorHandler {
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = true;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'global',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        context: { action: 'unhandled_promise_rejection' },
        severity: 'medium'
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'global',
        message: event.message || 'Unknown Error',
        stack: event.error?.stack,
        context: { 
          component: event.filename,
          action: 'global_error'
        },
        severity: 'medium'
      });
    });
  }

  private setupNetworkMonitoring() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.retryAttempts = 0;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public handleError(errorData: Partial<ErrorReport>) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: errorData.type || 'global',
      message: errorData.message || 'Unknown Error',
      stack: errorData.stack,
      context: errorData.context || {},
      severity: errorData.severity || 'medium',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Report:', errorReport);
    }

    // Add to queue
    this.errorQueue.push(errorReport);

    // Try to send immediately if online
    if (this.isOnline) {
      this.sendErrorReport(errorReport);
    }

    // Store in localStorage as backup
    this.storeErrorLocally(errorReport);
  }

  public handleCanvasError(error: Error, context: ErrorContext = {}) {
    this.handleError({
      type: 'canvas',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        component: 'Canvas',
        action: 'canvas_operation'
      },
      severity: 'high'
    });
  }

  public handleAPIError(error: Error, endpoint: string, context: ErrorContext = {}) {
    this.handleError({
      type: 'api',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        component: 'API',
        action: 'api_request',
        endpoint
      },
      severity: 'medium'
    });
  }

  public handleComponentError(error: Error, componentName: string, context: ErrorContext = {}) {
    this.handleError({
      type: 'component',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        component: componentName,
        action: 'component_render'
      },
      severity: 'medium'
    });
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<boolean> {
    try {
      // In a real app, send to your error tracking service
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      });

      if (response.ok) {
        // Remove from queue on successful send
        this.errorQueue = this.errorQueue.filter(err => err.id !== errorReport.id);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to send error report:', error);
      
      // Retry logic
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        setTimeout(() => {
          this.sendErrorReport(errorReport);
        }, Math.pow(2, this.retryAttempts) * 1000); // Exponential backoff
      }
      
      return false;
    }
  }

  private storeErrorLocally(errorReport: ErrorReport) {
    try {
      const storedErrors = this.getStoredErrors();
      storedErrors.push(errorReport);
      
      // Keep only last 50 errors
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50);
      }
      
      localStorage.setItem('error_reports', JSON.stringify(storedErrors));
    } catch (error) {
      console.warn('Failed to store error locally:', error);
    }
  }

  private getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored errors:', error);
      return [];
    }
  }

  private async flushErrorQueue() {
    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    for (const errorReport of errorsToSend) {
      await this.sendErrorReport(errorReport);
    }
  }


  public clearStoredErrors() {
    try {
      localStorage.removeItem('error_reports');
    } catch (error) {
      console.warn('Failed to clear stored errors:', error);
    }
  }

  public getErrorStats() {
    const storedErrors = this.getStoredErrors();
    
    return {
      total: storedErrors.length,
      byType: storedErrors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: storedErrors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: storedErrors.slice(-10)
    };
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export const handleError = (errorData: Partial<ErrorReport>) => errorHandler.handleError(errorData);
export const handleCanvasError = (error: Error, context?: ErrorContext) => errorHandler.handleCanvasError(error, context);
export const handleAPIError = (error: Error, endpoint: string, context?: ErrorContext) => errorHandler.handleAPIError(error, endpoint, context);
export const handleComponentError = (error: Error, componentName: string, context?: ErrorContext) => errorHandler.handleComponentError(error, componentName, context);

export default errorHandler;
