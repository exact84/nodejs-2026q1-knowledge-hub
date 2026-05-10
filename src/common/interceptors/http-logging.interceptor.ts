import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { AppLogger } from '../../logger/logger.service';
import { sanitizeLogData } from '../../logger/sanitize-log-data.util';

type RequestLogDetails = {
  method: string;
  url: string;
  query: unknown;
  body: unknown;
};

type ResponseLogDetails = {
  method: string;
  url: string;
  statusCode: number;
  responseTimeMs: number;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startTime = Date.now();

    this.logger.logWithDetails(
      'log',
      'Incoming request',
      this.createRequestLogDetails(request),
      HttpLoggingInterceptor.name,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          this.logResponse(request, response, startTime);
        },
      }),
      catchError((error: unknown) => {
        const statusCode =
          typeof (error as { getStatus?: () => number })?.getStatus ===
          'function'
            ? (error as { getStatus: () => number }).getStatus()
            : response.statusCode;

        this.logResponse(request, response, startTime, statusCode);
        return throwError(() => error);
      }),
    );
  }

  private logResponse(
    request: Request,
    response: Response,
    startTime: number,
    statusCode = response.statusCode,
  ): void {
    this.logger.logWithDetails(
      'log',
      'Outgoing response',
      this.createResponseLogDetails(request, response, startTime, statusCode),
      HttpLoggingInterceptor.name,
    );
  }

  private createRequestLogDetails(request: Request): RequestLogDetails {
    return {
      method: request.method,
      url: request.originalUrl || request.url,
      query: sanitizeLogData(request.query),
      body: sanitizeLogData(request.body),
    };
  }

  private createResponseLogDetails(
    request: Request,
    response: Response,
    startTime: number,
    statusCode: number,
  ): ResponseLogDetails {
    return {
      method: request.method,
      url: request.originalUrl || request.url,
      statusCode,
      responseTimeMs: Date.now() - startTime,
    };
  }
}
