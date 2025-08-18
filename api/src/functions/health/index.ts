import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export const healthCheckHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            })
        };
    } catch (error) {
        context.error('Health check failed:', error);
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'unhealthy',
                error: 'Health check failed',
                timestamp: new Date().toISOString()
            })
        };
    }
};

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheckHandler
}); 