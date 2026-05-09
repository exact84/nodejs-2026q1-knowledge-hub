import { Injectable } from '@nestjs/common';
import { RagSearchRequest, RagSearchResponse } from './dto/search.dto';
import { RagVectorService } from './rag-vector.service';
import { RagService } from './rag.service';
import { RAG_CONFIG } from './rag-config';

@Injectable()
export class RagSearchService {
  public constructor(
    private readonly ragService: RagService,
    private readonly ragVectorService: RagVectorService,
  ) {}

  public async search(request: RagSearchRequest): Promise<RagSearchResponse> {
    const limit = request.limit ?? RAG_CONFIG.SEARCH_LIMIT;

    const queryVector = await this.ragService.generateEmbedding(request.query);

    console.log('[RAG] query:', request.query);
    console.log('[RAG] vector dim:', queryVector.length);
    console.log('[RAG] filter:', JSON.stringify(this.buildFilter(request)));

    const results = await this.ragVectorService.search(queryVector, {
      limit,
      filter: this.buildFilter(request),
      scoreThreshold: RAG_CONFIG.SCORE_THRESHOLD,
    });
    results.sort((a, b) => b.score - a.score);

    console.log(
      '[RAG] results scores:',
      results.map((r) => r.score),
    );

    return {
      results: results.map((r) => ({
        articleId: String(r.payload?.articleId),
        articleTitle: String(r.payload?.articleTitle),
        chunk: String(r.payload?.content),
        similarity: r.score,
      })),
    };
  }

  private buildFilter(request: RagSearchRequest): QdrantFilter | undefined {
    const must: QdrantFilter['must'] = [];

    if (request.articleStatus) {
      must.push({
        key: 'articleStatus',
        match: { value: request.articleStatus },
      });
    }

    if (request.categoryId) {
      must.push({
        key: 'categoryId',
        match: {
          value: request.categoryId,
        },
      });
    }

    if (request.tags?.length) {
      must.push({
        key: 'tags',
        match: {
          any: request.tags,
        } as never,
      });
    }

    return must.length ? { must } : undefined;
  }
}
