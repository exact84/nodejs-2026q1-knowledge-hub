import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SummarizeArticleRequest,
  SummarizeArticleResponse,
} from './dto/summarize.dto';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { ArticlesService } from 'src/articles/articles.service';
import { GeminiService } from './gemini/gemini.service';
import { CacheService } from './cache/cache.service';

@Injectable()
export class AiService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly gemini: GeminiService,
    private readonly cache: CacheService,
  ) {}

  async summarize(articleId: string, dto: SummarizeArticleRequest) {
    const article = await this.articlesService.getOne(articleId);

    if (!article) {
      throw new NotFoundException();
    }

    const maxLength = dto.maxLength ?? 'medium';

    const cacheKey = this.cache.buildCacheKey({
      type: 'summarize',
      articleId,
      updatedAt: article.updatedAt.toString(),
      options: { maxLength },
    });

    const cached = this.cache.get<SummarizeArticleResponse>(cacheKey);
    if (cached) return cached;

    const prompt = buildSummarizePrompt(article.content, maxLength);

    const result = await this.gemini.generate(prompt);

    const response: SummarizeArticleResponse = {
      articleId,
      summary: result,
      originalLength: article.content.length,
      summaryLength: result.length,
    };

    this.cache.set(cacheKey, response);

    // this.usage.track('summarize');

    return response;
  }
}
