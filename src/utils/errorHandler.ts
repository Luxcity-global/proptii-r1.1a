import React from 'react';
import { captureException, init } from '@sentry/react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AppError, ErrorContext, ErrorResponse } from '../types/error';

const REDACT = '[redacted]';

function redactString(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACT)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, `Bearer ${REDACT}`)
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+/g, REDACT); // JWT-shaped
}

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (
        key.includes('email') ||
        key.includes('token') ||
        key.includes('authorization') ||
        key.includes('password') ||
        key.includes('address') ||
        key.includes('postcode')
      ) {
        out[k] = REDACT;
      } else {
        out[k] = scrub(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

// Initialize Sentry for error tracking with PII scrubbing
init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (import.meta.env.DEV) {
      return null;
    }
    try {
      if (event.request) {
        event.request = scrub(event.request) as typeof event.request;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['authorization'];
          delete event.request.headers['Cookie'];
          delete event.request.headers['cookie'];
        }
      }
      if (event.user) {
        event.user = { id: event.user.id };
      }
      if (event.extra) {
        event.extra = scrub(event.extra) as typeof event.extra;
      }
      if (event.exception?.values) {
        for (const item of event.exception.values) {
          if (item.value) item.value = redactString(item.value);
        }
      }
    } catch {
      // Never block send on scrubber bugs; better a raw event than a crashed handler.
    }
    return event;
  },
});

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