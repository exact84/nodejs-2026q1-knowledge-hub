import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AiService } from './ai.service';
import { SummarizeArticleRequest } from './dto/summarize.dto';
import { Public } from 'src/auth/public.decorator';
import { RateLimitService } from 'src/ai/rate-limit/rate-limit.service';

@Controller('ai')
// @Throttle
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Public()
  @Post('articles/:articleId/summarize')
  summarize(
    @Param('articleId') articleId: string,
    @Body() dto: SummarizeArticleRequest,
  ) {
    // this.rateLimit.check();
    return this.aiService.summarize(articleId, dto);
  }
}
