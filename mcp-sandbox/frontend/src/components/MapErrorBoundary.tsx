import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 [MAP-ERROR-BOUNDARY] Map component error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [MAP-ERROR-BOUNDARY] Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <div style={{ color: '#dc2626', fontSize: '18px', marginBottom: '12px' }}>
            🗺️ Map Component Error
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
            {this.props.fallbackMessage || 'The map component encountered an error and could not be displayed.'}
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center' }}>
            Error: {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
