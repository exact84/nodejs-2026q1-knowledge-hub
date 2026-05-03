import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SummarizeArticleRequest,
  SummarizeArticleResponse,
} from './dto/summarize.dto';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { ArticlesService } from 'src/articles/articles.service';
import { GeminiService } from './gemini/gemini.service';
import { CacheService } from './cache/cache.service';
import { UsageService } from './usage/usage.service';
import {
  AnalyzeArticleRequest,
  AnalyzeArticleResponse,
} from './dto/analyze.dto';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';
import {
  TranslateArticleRequest,
  TranslateArticleResponse,
} from './dto/translate.dto';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { GenerateRequest, GenerateResponse } from './dto/generate.dto';
import { GenerateService } from './generate/generate.service';

@Injectable()
export class AiService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly gemini: GeminiService,
    private readonly usage: UsageService,
    private readonly cache: CacheService,
    private readonly generateService: GenerateService,
  ) {}

  async summarize(
    articleId: string,
    dto: SummarizeArticleRequest,
  ): Promise<SummarizeArticleResponse> {
    const article = await this.articlesService.getOne(articleId);

    if (!article) {
      throw new NotFoundException();
    }

    this.usage.trackRequest('summarize');

    const maxLength = dto.maxLength ?? 'medium';

    const cacheKey = this.cache.buildCacheKey({
      type: 'summarize',
      articleId,
      updatedAt: article.updatedAt.toString(),
      options: { maxLength },
    });

    const prompt = buildSummarizePrompt(article.content, maxLength);

    return this.runAiRequest({
      cacheKey,
      prompt,
      mapResult: (text) => ({
        articleId,
        summary: text,
        originalLength: article.content.length,
        summaryLength: text.length,
      }),
    });
  }

  async analyze(
    articleId: string,
    dto: AnalyzeArticleRequest,
  ): Promise<AnalyzeArticleResponse> {
    const article = await this.articlesService.getOne(articleId);

    if (!article) {
      throw new NotFoundException();
    }

    this.usage.trackRequest('analyze');

    const task = dto.task ?? 'review';

    const cacheKey = this.cache.buildCacheKey({
      type: 'analyze',
      articleId,
      updatedAt: article.updatedAt.toString(),
      options: { task },
    });

    const prompt = buildAnalyzePrompt(article.content, task);

    return this.runAiRequest({
      cacheKey,
      prompt,
      mapResult: (text) => {
        const parsed = this.parseAnalyzeResult(text);

        return {
          articleId,
          analysis: parsed.analysis,
          suggestions: parsed.suggestions,
          severity: parsed.severity,
        };
      },
    });
  }

  private parseAnalyzeResult(text: string): {
    analysis: string;
    suggestions: string[];
    severity: 'info' | 'warning' | 'error';
  } {
    try {
      const parsed = JSON.parse(text);

      return {
        analysis: parsed.analysis ?? '',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        severity:
          parsed.severity === 'warning' || parsed.severity === 'error'
            ? parsed.severity
            : 'info',
      };
    } catch {
      return {
        analysis: text,
        suggestions: [],
        severity: 'info',
      };
    }
  }

  async translate(
    articleId: string,
    dto: TranslateArticleRequest,
  ): Promise<TranslateArticleResponse> {
    const article = await this.articlesService.getOne(articleId);

    if (!article) {
      throw new NotFoundException();
    }

    this.usage.trackRequest('translate');

    const cacheKey = this.cache.buildCacheKey({
      type: 'translate',
      articleId,
      updatedAt: article.updatedAt.toString(),
      options: {
        targetLanguage: dto.targetLanguage,
        sourceLanguage: dto.sourceLanguage,
      },
    });

    const prompt = buildTranslatePrompt(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    return this.runAiRequest({
      cacheKey,
      prompt,
      mapResult: (text) => ({
        articleId,
        translatedText: text,
        detectedLanguage: dto.sourceLanguage ?? 'auto',
      }),
    });
  }

  private async runAiRequest<T>({
    cacheKey,
    prompt,
    mapResult,
  }: {
    cacheKey: string;
    prompt: string;
    mapResult: (text: string) => T;
  }): Promise<T> {
    const cached = this.cache.get<T>(cacheKey);
    if (cached) return cached;

    const start = Date.now();
    const result = await this.gemini.generate(prompt);
    this.usage.trackLatency(Date.now() - start);

    const tokens = result.raw?.usageMetadata?.totalTokenCount;
    if (tokens) {
      this.usage.trackTokens(tokens);
    }

    const response = mapResult(result.text);

    this.cache.set(cacheKey, response);

    return response;
  }

  async generate(dto: GenerateRequest): Promise<GenerateResponse> {
    this.usage.trackRequest('generate');

    const context = this.generateService.buildContext(dto.sessionId);

    const prompt = context ? `${context}\nuser: ${dto.prompt}` : dto.prompt;

    const result = await this.gemini.generate(prompt);

    const tokens = result.raw?.usageMetadata?.totalTokenCount;
    if (tokens) {
      this.usage.trackTokens(tokens);
    }

    this.generateService.addMessage(dto.sessionId, {
      role: 'user',
      content: dto.prompt,
    });

    this.generateService.addMessage(dto.sessionId, {
      role: 'assistant',
      content: result.text,
    });
    return {
      result: result.text,
    };
  }
}
