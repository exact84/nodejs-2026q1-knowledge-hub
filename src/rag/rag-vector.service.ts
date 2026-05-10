import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantPoint } from './types/qdrant-point';
import { RAG_CONFIG } from './rag-config';
import { RagServiceUnavailableException } from './rag-service-unavailable.exception';
import { QdrantFilter } from './types/qdrant-filter';

@Injectable()
export class RagVectorService implements OnModuleInit {
  private readonly client: QdrantClient;
  private readonly collectionName = process.env.RAG_VECTOR_COLLECTION!;

  public constructor() {
    this.client = new QdrantClient({
      url: process.env.RAG_VECTOR_DB_URL,
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  public async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();

    const exists = collections.collections.some(
      (c) => c.name === this.collectionName,
    );

    if (exists) {
      console.log(`[QDRANT] collection already exists: ${this.collectionName}`);
      return;
    }

    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: Number(process.env.RAG_EMBEDDING_SIZE ?? 3072),
        distance: 'Cosine',
      },
    });

    console.log(`[QDRANT] collection created: ${this.collectionName}`);
  }

  public async upsertPoints(points: QdrantPoint[]): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      });
    } catch (error) {
      console.error('[RAG] Qdrant search failed', error);

      throw new RagServiceUnavailableException('Vector database unavailable');
    }
  }

  public async search(
    vector: number[],
    options: {
      limit: number;
      filter?: QdrantFilter;
      scoreThreshold?: number;
    },
  ) {
    try {
      return await this.client.search(this.collectionName, {
        vector,
        limit: options.limit ?? RAG_CONFIG.SEARCH_LIMIT,
        with_payload: true,
        filter: options.filter as never,
        score_threshold: options.scoreThreshold ?? RAG_CONFIG.SCORE_THRESHOLD,
      });
    } catch (error) {
      console.error('[RAG] Qdrant search failed', error);

      throw new RagServiceUnavailableException('Vector database unavailable');
    }
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'articleId',
              match: {
                value: articleId,
              },
            },
          ],
        },
        wait: true,
      });
    } catch (error) {
      console.error('[RAG] Qdrant search failed', error);

      throw new RagServiceUnavailableException('Vector database unavailable');
    }
  }

  public async getArticleIndexMetadata(articleId: string) {
    const result = await this.client.scroll(
      process.env.RAG_VECTOR_COLLECTION!,
      {
        limit: 1,
        with_payload: true,
        filter: {
          must: [
            {
              key: 'articleId',
              match: {
                value: articleId,
              },
            },
          ],
        },
      },
    );

    return result.points[0];
  }

  public async listIndexedArticleIds(): Promise<string[]> {
    try {
      const articleIds = new Set<string>();
      let offset: string | number | Record<string, unknown> | undefined;

      do {
        const result = await this.client.scroll(this.collectionName, {
          limit: 200,
          with_payload: ['articleId'],
          with_vector: false,
          offset,
        });

        for (const point of result.points) {
          const articleId = point.payload?.articleId;
          if (typeof articleId === 'string' && articleId.length > 0) {
            articleIds.add(articleId);
          }
        }

        offset = result.next_page_offset ?? undefined;
      } while (offset !== undefined);

      return [...articleIds];
    } catch (error) {
      console.error('[RAG] Qdrant listIndexedArticleIds failed', error);
      throw new RagServiceUnavailableException('Vector database unavailable');
    }
  }
}
