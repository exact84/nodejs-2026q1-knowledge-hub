import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini/gemini.service';
import { CacheService } from './cache/cache.service';
import { UsageService } from './usage/usage.service';
import { HttpModule } from '@nestjs/axios';
import { ArticlesModule } from 'src/articles/articles.module';
import { GenerateService } from './generate/generate.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    CacheService,
    UsageService,
    GenerateService,
  ],
  imports: [HttpModule, ArticlesModule],
  exports: [UsageService],
})
export class AiModule {}
