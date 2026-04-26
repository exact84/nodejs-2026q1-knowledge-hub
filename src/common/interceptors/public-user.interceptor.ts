import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type SerializableRecord = Record<string, unknown>;

@Injectable()
export class PublicUserInterceptor
  implements NestInterceptor<unknown, unknown>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(map((value) => this.stripPassword(value)));
  }

  private stripPassword(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.stripPassword(item));
    }

    if (!this.isRecord(value)) {
      return value;
    }

    const sanitized: SerializableRecord = {};

    for (const [key, entry] of Object.entries(value)) {
      if (key === 'password') {
        continue;
      }

      sanitized[key] = this.stripPassword(entry);
    }

    return sanitized;
  }

  private isRecord(value: unknown): value is SerializableRecord {
    return typeof value === 'object' && value !== null;
  }
}
