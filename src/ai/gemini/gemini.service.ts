import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AppLogger } from 'src/logger/logger.service';

type GeminiRawResponse = {
  text: string;
  raw: any;
};

@Injectable()
export class GeminiService {
  constructor(
    private readonly http: HttpService,
    private readonly logger: AppLogger,
  ) {}

  async generate(prompt: string): Promise<GeminiRawResponse> {
    return this.withRetry(() => this.callGemini(prompt));
  }

  private async callGemini(prompt: string): Promise<GeminiRawResponse> {
    const url = `${process.env.GEMINI_API_BASE_URL}/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await lastValueFrom(
      this.http.post(url, body, {
        params: {
          key: process.env.GEMINI_API_KEY,
        },
        timeout: 5000,
      }),
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      text,
      raw: response.data,
    };
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const maxRetries = 3;
    const baseDelay = 300;

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        return await fn();
      } catch (error: any) {
        const details = this.extractSafeErrorDetails(error);
        const isLastAttempt = attempt === maxRetries - 1;

        if (!this.shouldRetry(error) || isLastAttempt) {
          this.mapError(error);
        }

        this.logger.logWithDetails(
          'warn',
          'Gemini request failed, retrying',
          {
            ...details,
            attempt: attempt + 1,
            maxRetries,
          },
          GeminiService.name,
        );

        const delay = baseDelay * 2 ** attempt;
        await this.sleep(delay);
      }
    }

    throw new Error('Unreachable');
  }

  private shouldRetry(error: any): boolean {
    if (error.code === 'ECONNABORTED') {
      return true;
    }

    const status = error.response?.status;

    if (status === 429) {
      return true;
    }

    if (!status) {
      return true;
    }

    return false;
  }

  private mapError(error: any): never {
    const details = this.extractSafeErrorDetails(error);

    if (error.code === 'ECONNABORTED') {
      this.logger.logWithDetails(
        'warn',
        'Gemini timeout',
        details,
        GeminiService.name,
      );
      throw new ServiceUnavailableException('AI timeout');
    }

    const status = error.response?.status;

    if (status === 429) {
      this.logger.logWithDetails(
        'warn',
        'Gemini upstream rate limit',
        details,
        GeminiService.name,
      );
      throw new ServiceUnavailableException('AI rate limit');
    }

    if (status === 401) {
      this.logger.logWithDetails(
        'error',
        'Gemini auth error',
        details,
        GeminiService.name,
      );
      throw new InternalServerErrorException('AI auth error');
    }

    this.logger.logWithDetails(
      'error',
      'Gemini unavailable',
      details,
      GeminiService.name,
    );

    throw new ServiceUnavailableException('AI unavailable');
  }

  private extractSafeErrorDetails(error: any): {
    code?: string;
    status?: number;
    message?: string;
  } {
    return {
      code: error?.code,
      status: error?.response?.status,
      message:
        typeof error?.message === 'string'
          ? error.message
          : 'Unknown upstream error',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
