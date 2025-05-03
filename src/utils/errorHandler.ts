import { captureException, init } from '@sentry/react';

// Initialize Sentry for error tracking
init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.VITE_ENVIRONMENT,
    tracesSampleRate: 1.0,
});

// Error handler function
export const handleError = (error: Error, context?: string) => {
    console.error(`Error occurred${context ? ` in ${context}` : ''}:`, error);

    // Capture the error with Sentry
    captureException(error);

    // Additional logging or handling can be added here
};

// Example usage in a React component
export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    return (
        <ErrorBoundary
      fallbackRender= {({ error }) => (
    <div>
    <h2>Something went wrong.</h2>
        < pre > { error.message } </pre>
        </div>
      )}
onError = {(error, componentStack) => {
    handleError(error, componentStack);
}}
    >
    { children }
    </ErrorBoundary>
  );
}; 