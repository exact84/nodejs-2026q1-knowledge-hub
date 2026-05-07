import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantPoint } from './types/qdrant-point';

@Injectable()
export class RagVectorService implements OnModuleInit {
  private readonly client: QdrantClient;

  public constructor() {
    this.client = new QdrantClient({
      url: process.env.RAG_VECTOR_DB_URL,
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  public async ensureCollection(): Promise<void> {
    const collectionName = process.env.RAG_VECTOR_COLLECTION!;

    const collections = await this.client.getCollections();

    const exists = collections.collections.some(
      (c) => c.name === collectionName,
    );

    if (exists) {
      console.log(`[QDRANT] collection already exists: ${collectionName}`);
      return;
    }

    await this.client.createCollection(collectionName, {
      vectors: {
        size: Number(process.env.RAG_EMBEDDING_SIZE ?? 3072),
        distance: 'Cosine',
      },
    });

    console.log(`[QDRANT] collection created: ${collectionName}`);
  }

  public async upsertPoints(points: QdrantPoint[]): Promise<void> {
    await this.client.upsert(process.env.RAG_VECTOR_COLLECTION!, {
      wait: true,
      points,
    });
  }

  public async search(
    vector: number[],
    options: {
      limit: number;
      filter?: unknown;
    },
  ) {
    return this.client.search(process.env.RAG_VECTOR_COLLECTION!, {
      vector,
      limit: options.limit,
      with_payload: true,
      filter: options.filter as never,
    });
  }
}
