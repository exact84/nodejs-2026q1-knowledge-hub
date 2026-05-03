import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();

  private readonly limit = Number(process.env.AI_RATE_LIMIT_RPM ?? 20);
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const key = this.buildKey(request);

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (now - entry.windowStart > this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= this.limit) {
      const retryAfterSec = Math.ceil(
        (entry.windowStart + this.windowMs - now) / 1000,
      );

      response.setHeader('Retry-After', retryAfterSec.toString());

      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;

    return true;
  }

  private buildKey(request: Request): string {
    const user = request['user'] as { userId: string } | undefined;

    if (user?.userId) {
      return `user:${user.userId}`;
    }

    return `ip:${request.ip}`;
  }
}
