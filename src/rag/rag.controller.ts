import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { RagSearchRequest, RagSearchResponse } from './dto/search.dto';
import { RagSearchService } from './rag-search.service';
import { Public } from 'src/auth/public.decorator';

@Public()
@Controller('rag')
export class RagController {
  constructor(private readonly ragSearchService: RagSearchService) {}

  @Post('search')
  public async search(
    @Body() body: RagSearchRequest,
  ): Promise<RagSearchResponse> {
    if (!body.query) {
      throw new BadRequestException('query is required');
    }

    return this.ragSearchService.search(body);
  }
}
