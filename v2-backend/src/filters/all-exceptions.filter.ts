import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptions');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request as any).correlationId ||
      request.headers['x-correlation-id'] ||
      request.headers['x-request-id'] ||
      'unknown';

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    let message: any;
    let errorType = 'InternalServerError';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || exception.message;
      errorType = (exceptionResponse as any).error || exception.name || errorType;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      message = exception?.message || 'Internal server error';
    }

    // In production, suppress raw 500 error messages that might expose internals
    const isProd = process.env.NODE_ENV === 'production';
    const clientMessage =
      status >= 500 && isProd
        ? 'An unexpected error occurred. Please contact support with this correlation ID.'
        : message;

    // Structured JSON log for observability platforms (Loki, Datadog, CloudWatch)
    this.logger.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        correlationId,
        statusCode: status,
        method: request.method,
        path: request.url,
        ip: request.ip,
        error: exception?.message || message,
        stack: status >= 500 ? exception?.stack : undefined,
      }),
    );

    // Ensure X-Correlation-Id header is present in the response
    if (correlationId && !response.headersSent) {
      response.setHeader('X-Correlation-Id', correlationId);
    }

    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        error: errorType,
        message: clientMessage,
        correlationId,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
