import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  private hits = 0;
  private misses = 0;

  constructor(private readonly usage: UsageService) {}

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
    const start = Date.now();

    const entry = this.store.get(key);

    if (!entry) {
      this.misses += 1;
      this.usage.trackCacheMiss();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      this.usage.trackCacheMiss();
      return null;
    }

    this.hits += 1;
    this.usage.trackCacheHit();

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    const ttlMs = this.getTtlMs();

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private getTtlMs(): number {
    const ttlSec = Number(process.env.AI_CACHE_TTL_SEC ?? 300);
    return ttlSec * 1000;
  }

  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses === 0
          ? 0
          : this.hits / (this.hits + this.misses),
    };
  }
}
