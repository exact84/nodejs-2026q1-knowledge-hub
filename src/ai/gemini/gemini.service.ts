import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import { HttpService } from '@nestjs/axios';

@Injectable()
export class GeminiService {
  constructor(private readonly http: HttpService) {}

  async generate(prompt: string): Promise<string> {
    const url = `${process.env.GEMINI_API_BASE_URL}/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    try {
      const response = await lastValueFrom(
        this.http.post(url, body, {
          params: {
            key: process.env.GEMINI_API_KEY,
          },
          timeout: 5000,
        }),
      );

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new ServiceUnavailableException('AI timeout');
      }

      if (error.response?.status === 429) {
        throw new ServiceUnavailableException('AI rate limit');
      }

      if (error.response?.status === 401) {
        throw new InternalServerErrorException('AI auth error');
      }

      throw new ServiceUnavailableException('AI unavailable');
    }
  }
}
