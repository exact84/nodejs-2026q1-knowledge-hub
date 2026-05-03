import { Injectable } from '@nestjs/common';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CacheKeyParams = {
  articleId: string;
  updatedAt: Date;
  type: 'summarize' | 'translate' | 'analyze';
  options: unknown;
};

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  buildCacheKey(params: {
    articleId: string;
    updatedAt: string;
    type: string;
    options: unknown;
  }): string {
    return JSON.stringify({
      articleId: params.articleId,
      updatedAt: params.updatedAt.toString(),
      type: params.type,
      options: params.options,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // TTL check
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    // TTL check

    this.store.set(key, {
      value,
      expiresAt: Date.now(),
    });
  }
}
