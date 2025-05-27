import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = async (
    error: unknown,
    context: InvocationContext,
): Promise<HttpResponseInit> => {
    context.error('Error occurred:', error);

    if (error instanceof AppError) {
        return {
            status: error.statusCode,
            jsonBody: {
                error: {
                    message: error.message,
                    code: error.code,
                },
            },
        };
    }

    if (error instanceof ZodError) {
        return {
            status: 400,
            jsonBody: {
                error: {
                    message: 'Validation error',
                    details: error.errors,
                },
            },
        };
    }

    // Default error response
    return {
        status: 500,
        jsonBody: {
            error: {
                message: 'Internal server error',
            },
        },
    };
};

export const withErrorHandler = (
    handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>,
) => {
    return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            return await handler(request, context);
        } catch (error) {
            return errorHandler(error, context);
        }
    };
}; 