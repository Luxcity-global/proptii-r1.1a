import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../utils/app-error';

@Catch()
export class GuestEnquiryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GuestEnquiryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof AppError) {
      this.logger.warn(`AppError [${exception.statusCode}] - Code [${exception.code}]: ${exception.message}`);
      return response.status(exception.statusCode).json({
        error: {
          message: exception.message,
          code: exception.code,
        },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      this.logger.warn(`HttpException [${status}]: ${exception.message}`);
      return response.status(status).json({
        error: {
          message: exception.message,
          details: responseBody,
        },
      });
    }

    // Default unhandled error
    this.logger.error('Unhandled exception caught in GuestEnquiry:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
