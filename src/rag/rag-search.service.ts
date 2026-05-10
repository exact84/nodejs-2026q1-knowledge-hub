import { Injectable } from '@nestjs/common';
import { RagSearchRequest, RagSearchResponse } from './dto/search.dto';
import { RagVectorService } from './rag-vector.service';
import { RagService } from './rag.service';
import { RAG_CONFIG } from './rag-config';
import { QdrantFilter } from './types/qdrant-filter';
import { RagServiceUnavailableException } from './rag-service-unavailable.exception';

@Injectable()
export class RagSearchService {
  public constructor(
    private readonly ragService: RagService,
    private readonly ragVectorService: RagVectorService,
  ) {}

  public async search(
    request: RagSearchRequest,
    options?: {
      useAiRerank?: boolean;
    },
  ): Promise<RagSearchResponse> {
    const limit = request.limit ?? RAG_CONFIG.SEARCH_LIMIT;
    const filter = this.buildFilter(request);
    const useAiRerank = options?.useAiRerank ?? true;

    const queryVector = await this.ragService.generateEmbedding(request.query);

    console.log('[RAG] query:', request.query);
    console.log('[RAG] vector dim:', queryVector.length);
    console.log('[RAG] filter:', JSON.stringify(filter));

    const candidates = await this.ragVectorService.search(queryVector, {
      limit: RAG_CONFIG.RERANK_CANDIDATES,
      filter,
      scoreThreshold: RAG_CONFIG.SCORE_THRESHOLD,
    });

    const reranked = [];
    let aiRerankAvailable = true;

    for (const [index, candidate] of candidates.entries()) {
      const lexicalScore = this.calculateLexicalScore(
        request.query,
        String(candidate.payload?.content),
      );

      let rerankScore = candidate.score;

      if (
        useAiRerank &&
        aiRerankAvailable &&
        index < RAG_CONFIG.AI_RERANK_LIMIT
      ) {
        try {
          rerankScore = await this.ragService.rerank(
            request.query,
            String(candidate.payload?.content),
          );
        } catch (error) {
          if (error instanceof RagServiceUnavailableException) {
            aiRerankAvailable = false;
            rerankScore = candidate.score;
          } else {
            throw error;
          }
        }
      }

      const mergedScore = rerankScore * 0.7 + lexicalScore * 0.3;

      reranked.push({
        ...candidate,
        rerankScore,
        lexicalScore,
        mergedScore,
      });
    }

    reranked.sort((a, b) => b.mergedScore - a.mergedScore);
    const top = reranked.slice(0, limit);

    return {
      results: top.map((r) => ({
        articleId: String(r.payload?.articleId),
        articleTitle: String(r.payload?.articleTitle),
        chunk: String(r.payload?.content),
        similarity: r.rerankScore,
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

  private calculateLexicalScore(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const contentLower = content.toLowerCase();

    let matches = 0;

    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        matches += 1;
      }
    }

    return matches / queryTerms.length;
  }
}
