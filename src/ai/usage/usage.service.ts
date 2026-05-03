import { Injectable } from '@nestjs/common';

type Endpoint = 'summarize' | 'translate' | 'analyze' | 'generate';

@Injectable()
export class UsageService {
  private totalRequests = 0;

  private requestsByEndpoint: Record<Endpoint, number> = {
    summarize: 0,
    translate: 0,
    analyze: 0,
    generate: 0,
  };

  private totalTokens = 0;

  private totalLatencyMs = 0;
  private latencyCount = 0;
  private minLatencyMs = Infinity;
  private maxLatencyMs = 0;

  trackRequest(endpoint: Endpoint): void {
    this.totalRequests += 1;
    this.requestsByEndpoint[endpoint] += 1;
  }

  trackTokens(count: number): void {
    this.totalTokens += count;
  }

  trackLatency(ms: number): void {
    this.totalLatencyMs += ms;
    this.latencyCount += 1;
    if (ms < this.minLatencyMs) this.minLatencyMs = ms;
    if (ms > this.maxLatencyMs) this.maxLatencyMs = ms;
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      requestsByEndpoint: this.requestsByEndpoint,
      totalTokens: this.totalTokens,
      latency: {
        avgMs:
          this.latencyCount === 0
            ? 0
            : Math.round(this.totalLatencyMs / this.latencyCount),
        minMs: this.latencyCount === 0 ? 0 : this.minLatencyMs,
        maxMs: this.maxLatencyMs,
        samples: this.latencyCount,
      },
    };
  }

  reset(): void {
    this.totalRequests = 0;

    this.requestsByEndpoint = {
      summarize: 0,
      translate: 0,
      analyze: 0,
      generate: 0,
    };

    this.totalTokens = 0;
    this.totalLatencyMs = 0;
    this.latencyCount = 0;
    this.minLatencyMs = Infinity;
    this.maxLatencyMs = 0;
  }
}
