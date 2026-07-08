import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Response } from 'express';

interface ErrorBody {
  error?: string;
  message?: string | string[];
  details?: Array<{ field: string | null; issue: string }>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: Array<{ field: string | null; issue: string }> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'object' && exResponse !== null) {
        const body = exResponse as ErrorBody;
        error = body.error ?? HttpStatus[statusCode] ?? error;
        message = (body.message as string) ?? message;
        details = body.details;
      } else {
        message = String(exResponse);
        error = HttpStatus[statusCode] ?? error;
      }
    }

    if (statusCode === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      details = message.map((issue) => ({ field: null, issue }));
      message = 'Validation failed';
      error = 'VALIDATION_ERROR';
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      if (exception instanceof Error) {
        Sentry.captureException(exception);
      } else {
        Sentry.captureMessage('Unknown server error', 'error');
      }

      this.logger.error(
        exception instanceof Error ? exception.message : 'Unknown error',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      ...(details ? { details } : {}),
    });
  }
}
