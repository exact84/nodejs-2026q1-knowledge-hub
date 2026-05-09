import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantPoint } from './types/qdrant-point';
import { RAG_CONFIG } from './rag-config';
import { RagServiceUnavailableException } from './rag-service-unavailable.exception';

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
}
