import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class RagVectorService implements OnModuleInit {
  private readonly client: QdrantClient;

  public constructor() {
    this.client = new QdrantClient({
      url: process.env.RAG_VECTOR_DB_URL,
    });
  }

  public async onModuleInit(): Promise<void> {
    try {
      const collections = await this.client.getCollections();

      console.log('[QDRANT] connected:', collections);
    } catch (error: unknown) {
      console.error('[QDRANT] connection failed:', error);
    }
  }
}
