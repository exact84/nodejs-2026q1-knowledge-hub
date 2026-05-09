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

    const candidates = await this.ragVectorService.search(queryVector, {
      limit: RAG_CONFIG.RERANK_CANDIDATES,
      filter: this.buildFilter(request),
      scoreThreshold: RAG_CONFIG.SCORE_THRESHOLD,
    });

    const reranked = await Promise.all(
      candidates.map(async (r) => {
        const score = await this.ragService.rerank(
          request.query,
          String(r.payload?.content),
        );

        const lexicalScore = this.calculateLexicalScore(
          request.query,
          String(r.payload?.content),
        );

        const mergedScore = score * 0.7 + lexicalScore * 0.3;

        return {
          ...r,
          rerankScore: score,
          lexicalScore,
          mergedScore,
        };
      }),
    );

    reranked.sort((a, b) => b.mergedScore - a.mergedScore);
    const top = reranked.slice(0, limit);

    console.log(
      '[RAG] merged scores:',
      top.map((r) => ({
        semantic: r.score,
        rerank: r.rerankScore,
        lexical: r.lexicalScore,
        merged: r.mergedScore,
      })),
    );

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
