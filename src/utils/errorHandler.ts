import React from 'react';
import { captureException, init } from '@sentry/react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AppError, ErrorContext, ErrorResponse } from '../types/error';

// Initialize Sentry for error tracking only if DSN is provided
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && sentryDsn !== '[DEVELOPMENT_SENTRY_DSN]' && sentryDsn !== '[PRODUCTION_SENTRY_DSN]') {
    init({
        dsn: sentryDsn,
        environment: import.meta.env.VITE_ENVIRONMENT,
        tracesSampleRate: 1.0,
        beforeSend(event) {
            // Don't send events in development
            if (import.meta.env.DEV) {
                return null;
            }
            return event;
        },
    });
} else {
    console.log('Sentry disabled - no valid DSN provided');
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Error handler function with retry logic
export const handleError = async (
    error: Error | AppError,
    context?: ErrorContext,
    retryCount: number = 0
): Promise<ErrorResponse> => {
    const errorContext = {
        ...context,
        timestamp: new Date(),
    };

    console.error(`Error occurred${context?.location ? ` in ${context.location}` : ''}:`, error);

    // Capture the error with Sentry
    captureException(error, {
        extra: errorContext,
    });

    // Handle retry logic for network errors
    if (error instanceof AppError && error.code === 'NETWORK_ERROR' && retryCount < MAX_RETRIES) {
        console.log(`Retrying operation (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return handleError(error, context, retryCount + 1);
    }

    // Format error response
    const errorResponse: ErrorResponse = {
        message: error.message,
        code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
        status: error instanceof AppError ? error.status : 500,
        details: error instanceof AppError ? error.details : undefined,
    };

    return errorResponse;
};

export { ErrorBoundary }; 