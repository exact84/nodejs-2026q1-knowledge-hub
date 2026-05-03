import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { HttpExceptionFilter } from './http-exception.filter';
import { AppLogger } from '../../logger/logger.service';
import { ValidationError } from '../errors/validation.error';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { ForbiddenError } from '../errors/forbidden.error';
import { NotFoundError } from '../errors/not-found.error';

type ErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
};

class TestResponse {
  public statusCode = 200;
  public body: ErrorBody | null = null;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(payload: ErrorBody): this {
    this.body = payload;
    return this;
  }
}

function createHost(requestUrl: string, response: TestResponse): ArgumentsHost {
  const host = new ExecutionContextHost([{ url: requestUrl }, response, null]);
  host.setType('http');
  return host;
}

describe('HttpExceptionFilter', () => {
  const loggerStub = new AppLogger();
  const filter = new HttpExceptionFilter(loggerStub);

  it('returns expected shape for HttpException', () => {
    const response = new TestResponse();
    const host = createHost('/user', response);

    filter.catch(new BadRequestException('Validation failed'), host);

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toBeNull();
    expect(response.body?.statusCode).toBe(400);
    expect(response.body?.error).toBe('Bad Request');
    expect(response.body?.message).toBe('Validation failed');
  });

  it('returns 500 shape for unknown error', () => {
    const response = new TestResponse();
    const host = createHost('/auth/login', response);

    filter.catch(new Error('unexpected'), host);

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toBeNull();
    expect(response.body?.statusCode).toBe(500);
    expect(response.body?.error).toBe('Internal Server Error');
    expect(response.body?.message).toBe('An unexpected error occurred');
  });

  it('returns string[] message from HttpException response object', () => {
    const response = new TestResponse();
    const host = createHost('/user', response);
    const exception = new HttpException({ message: ['field is invalid'] }, 400);

    filter.catch(exception, host);

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toBeNull();
    expect(response.body?.message).toEqual(['field is invalid']);
    expect(response.body?.error).toBe('Bad Request');
  });

  it('falls back to exception.message when response object has no message', () => {
    const response = new TestResponse();
    const host = createHost('/user', response);
    const exception = new HttpException({ error: 'payload' }, 422);

    filter.catch(exception, host);

    expect(response.statusCode).toBe(422);
    expect(response.body).not.toBeNull();
    expect(response.body?.message).toBe('Http Exception');
    expect(response.body?.error).toBe('payload');
  });

  it('returns string message when HttpException response is string', () => {
    const response = new TestResponse();
    const host = createHost('/comments', response);
    const exception = new HttpException('Plain error', 409);

    filter.catch(exception, host);

    expect(response.statusCode).toBe(409);
    expect(response.body).not.toBeNull();
    expect(response.body?.message).toBe('Plain error');
    expect(response.body?.error).toBe('Conflict');
  });

  it('returns 400 for ValidationError', () => {
    const response = new TestResponse();
    const host = createHost('/user', response);

    filter.catch(new ValidationError('Invalid payload'), host);

    expect(response.statusCode).toBe(400);
    expect(response.body).not.toBeNull();
    expect(response.body?.statusCode).toBe(400);
    expect(response.body?.error).toBe('Bad Request');
    expect(response.body?.message).toBe('Invalid payload');
  });

  it('returns 401 for UnauthorizedError', () => {
    const response = new TestResponse();
    const host = createHost('/auth/login', response);

    filter.catch(new UnauthorizedError('Missing token'), host);

    expect(response.statusCode).toBe(401);
    expect(response.body).not.toBeNull();
    expect(response.body?.statusCode).toBe(401);
    expect(response.body?.error).toBe('Unauthorized');
    expect(response.body?.message).toBe('Missing token');
  });

  it('returns 403 for ForbiddenError', () => {
    const response = new TestResponse();
    const host = createHost('/admin', response);

    filter.catch(new ForbiddenError('Access denied'), host);

    expect(response.statusCode).toBe(403);
    expect(response.body).not.toBeNull();
    expect(response.body?.statusCode).toBe(403);
    expect(response.body?.error).toBe('Forbidden');
    expect(response.body?.message).toBe('Access denied');
  });

  it('returns 404 for NotFoundError', () => {
    const response = new TestResponse();
    const host = createHost('/articles/unknown', response);

    filter.catch(new NotFoundError('Article not found'), host);

    expect(response.statusCode).toBe(404);
    expect(response.body).not.toBeNull();
    expect(response.body?.statusCode).toBe(404);
    expect(response.body?.error).toBe('Not Found');
    expect(response.body?.message).toBe('Article not found');
  });
});
