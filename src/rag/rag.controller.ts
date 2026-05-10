import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { RagSearchRequest, RagSearchResponse } from './dto/search.dto';
import { RagSearchService } from './rag-search.service';
import { Public } from 'src/auth/public.decorator';
import { RagChatRequest, RagChatResponse } from './dto/chat.dto';
import { RagChatService } from './rag-chat.service';
import { RagIndexService } from './rag-index.service';

@Public()
@Controller('ai/rag')
export class RagController {
  constructor(
    private readonly ragSearchService: RagSearchService,
    private readonly ragChatService: RagChatService,
    private readonly ragIndexService: RagIndexService,
  ) {}

  @Post('search')
  public async search(
    @Body() body: RagSearchRequest,
  ): Promise<RagSearchResponse> {
    if (!body.query) {
      throw new BadRequestException('query is required');
    }

    return this.ragSearchService.search(body);
  }

  @Post('chat')
  public async chat(@Body() body: RagChatRequest): Promise<RagChatResponse> {
    if (!body.question) {
      throw new BadRequestException('question is required');
    }

    return this.ragChatService.chat(body);
  }

  @Post('index')
  @HttpCode(HttpStatus.ACCEPTED)
  public async indexArticles(): Promise<void> {
    await this.ragIndexService.indexPublishedArticles();
  }

  @Delete('index/articles/:articleId')
  public async deleteArticleIndex(
    @Param('articleId') articleId: string,
  ): Promise<void> {
    await this.ragIndexService.deleteArticleIndex(articleId);
  }
}
