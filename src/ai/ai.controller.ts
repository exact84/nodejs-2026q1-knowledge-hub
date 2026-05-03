import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { SummarizeArticleRequest } from './dto/summarize.dto';
import { Public } from 'src/auth/public.decorator';
import { RateLimitGuard } from 'src/ai/rate-limit-guard/rate-limit.guard';

@UseGuards(RateLimitGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
    return this.aiService.summarize(articleId, dto);
  }
}
