import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../../logger/logger.service';
import { AppError } from '../errors/app.error';

type ErrorResponseBody = {
  statusCode: number;
  error: string;
  message: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const error = this.getErrorName(exception, status);

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
    };

    const baseMessage = `HTTP ${status} for ${request.method} ${request.originalUrl || request.url}`;

    if (status >= 500) {
      this.logger.error(
        baseMessage,
        exception instanceof Error ? exception.stack : undefined,
        HttpExceptionFilter.name,
      );
    } else {
      this.logger.warn(baseMessage, HttpExceptionFilter.name);
    }

    response.status(status).json(body);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof AppError) {
      return exception.statusCode;
    }

    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string | string[] {
    if (exception instanceof AppError) {
      return exception.message;
    }

    if (!(exception instanceof HttpException)) {
      return 'An unexpected error occurred';
    }

    const errorResponse = exception.getResponse();

    if (typeof errorResponse === 'string') {
      return errorResponse;
    }

    if (
      this.isRecord(errorResponse) &&
      'message' in errorResponse &&
      (typeof errorResponse.message === 'string' ||
        Array.isArray(errorResponse.message))
    ) {
      return errorResponse.message;
    }

    return exception.message;
  }

  private getErrorName(exception: unknown, status: number): string {
    if (exception instanceof AppError) {
      return this.getHttpErrorTitle(exception.statusCode);
    }

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();

      if (
        this.isRecord(errorResponse) &&
        'error' in errorResponse &&
        typeof errorResponse.error === 'string'
      ) {
        return errorResponse.error;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal Server Error';
    }

    return this.getHttpErrorTitle(status);
  }

  private getHttpErrorTitle(status: number): string {
    const title = Object.entries(HttpStatus).find(
      ([key, value]) => typeof key === 'string' && value === status,
    )?.[0];

    if (!title) {
      return 'Error';
    }

    return title
      .split('_')
      .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
      .join(' ');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
