import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini/gemini.service';
import { CacheService } from './cache/cache.service';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { UsageService } from './usage/usage.service';
import { HttpModule } from '@nestjs/axios';
import { ArticlesRepository } from 'src/articles/articles.repository';
import { ArticlesModule } from 'src/articles/articles.module';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    CacheService,
    RateLimitService,
    UsageService,
  ],
  imports: [HttpModule, ArticlesModule],
})
export class AiModule {}
