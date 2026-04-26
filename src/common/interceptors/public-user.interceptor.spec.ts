import {
  CallHandler,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { PublicUserInterceptor } from './public-user.interceptor';

describe('PublicUserInterceptor', () => {
  const interceptor = new PublicUserInterceptor();
  const context = new ExecutionContextHost([]);
  context.setType('http');

  it('removes password from a single object', async () => {
    const handler: CallHandler = {
      handle: () =>
        of({
          id: '1',
          login: 'alice',
          password: 'secret',
          role: 'viewer',
        }),
    };

    const result = await firstValueFrom(interceptor.intercept(context, handler));

    expect(result).toEqual({
      id: '1',
      login: 'alice',
      role: 'viewer',
    });
  });

  it('removes password from nested arrays and paginated data', async () => {
    const handler: CallHandler = {
      handle: () =>
        of({
          total: 1,
          page: 1,
          limit: 10,
          data: [
            {
              id: '1',
              login: 'alice',
              password: 'secret',
              role: 'viewer',
            },
          ],
        }),
    };

    const result = await firstValueFrom(interceptor.intercept(context, handler));

    expect(result).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      data: [
        {
          id: '1',
          login: 'alice',
          role: 'viewer',
        },
      ],
    });
  });
});
