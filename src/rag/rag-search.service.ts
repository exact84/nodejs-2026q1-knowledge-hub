import { Injectable } from '@nestjs/common';
import { RagSearchRequest, RagSearchResponse } from './dto/search.dto';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagVectorService } from './rag-vector.service';

@Injectable()
export class RagSearchService {
  public constructor(
    private readonly ragEmbeddingService: RagEmbeddingService,
    private readonly ragVectorService: RagVectorService,
  ) {}

  public async search(request: RagSearchRequest): Promise<RagSearchResponse> {
    const limit = request.limit ?? 5;

    const queryVector = await this.ragEmbeddingService.generateEmbedding(
      request.query,
    );

    const results = await this.ragVectorService.search(queryVector, {
      limit,
      filter: this.buildFilter(request),
    });

    return {
      results: results.map((r) => ({
        articleId: String(r.payload?.articleId),
        articleTitle: String(r.payload?.articleTitle),
        chunk: String(r.payload?.content),
        similarity: r.score,
      })),
    };
  }

  private buildFilter(request: RagSearchRequest) {
    const must: unknown[] = [];

    if (request.articleStatus) {
      must.push({
        key: 'articleStatus',
        match: { value: request.articleStatus },
      });
    }

    return must.length ? { must } : undefined;
  }
}
