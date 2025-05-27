import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AppError } from '../middleware/error-handling';
import { createLogger } from '../utils/logging';

export abstract class BaseController {
    protected logger;

    constructor(context: InvocationContext) {
        this.logger = createLogger(context);
    }

    protected success<T>(data: T, status = 200): HttpResponseInit {
        return {
            status,
            jsonBody: {
                success: true,
                data
            }
        };
    }

    protected error(error: Error | AppError): HttpResponseInit {
        const status = error instanceof AppError ? error.statusCode : 500;
        const message = error.message || 'Internal Server Error';
        const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';

        this.logger.error('API Error:', { error, status, code });

        return {
            status,
            jsonBody: {
                success: false,
                error: {
                    message,
                    code
                }
            }
        };
    }

    protected abstract handle(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
} 