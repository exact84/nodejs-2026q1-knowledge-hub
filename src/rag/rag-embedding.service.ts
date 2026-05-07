import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class RagEmbeddingService implements OnModuleInit {
  private readonly client: GoogleGenAI;

  public constructor() {
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY ?? '',
    });
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2',
      contents: text,
    });

    return response.embeddings[0].values ?? [];
  }

  public async onModuleInit(): Promise<void> {
    const embedding = await this.generateEmbedding('Hello world');
    console.log(embedding.length);
  }
}
