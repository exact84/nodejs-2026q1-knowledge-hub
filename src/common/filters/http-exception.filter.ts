import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponseBody = {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.getMessage(exception);

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private getMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
