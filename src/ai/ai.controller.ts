import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { SummarizeArticleRequest } from './dto/summarize.dto';
import { Public } from 'src/auth/public.decorator';
import { RateLimitGuard } from 'src/ai/rate-limit-guard/rate-limit.guard';
import { UsageService } from './usage/usage.service';
import { TranslateArticleRequest } from './dto/translate.dto';
import { AnalyzeArticleRequest } from './dto/analyze.dto';
import { GenerateRequest } from './dto/generate.dto';

@Public()
@UseGuards(RateLimitGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly usage: UsageService,
  ) {}

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Get('stats')
  getStats() {
    return this.usage.getStats();
  }

  @Post('articles/:articleId/summarize')
  summarize(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: SummarizeArticleRequest,
  ) {
    return this.aiService.summarize(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  analyze(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: AnalyzeArticleRequest,
  ) {
    return this.aiService.analyze(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  translate(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: TranslateArticleRequest,
  ) {
    return this.aiService.translate(articleId, dto);
  }

  @Post('generate')
  generate(@Body() dto: GenerateRequest) {
    return this.aiService.generate(dto);
  }
}
