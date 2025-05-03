import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withErrorHandler } from '@/shared/middleware/error-handling';
import { createLogger } from '@/shared/utils/logging';

export const healthCheckHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const logger = createLogger(context);
    logger.info('Health check request received');

    return {
        jsonBody: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        }
    };
};

export const healthCheck = withErrorHandler(healthCheckHandler);

app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheck
}); 