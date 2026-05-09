import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RagService {
  private readonly client: GoogleGenAI;

  public constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  public async generateText(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: prompt,
    });

    return response.text ?? '';
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2',

      contents: text,
    });

    return response.embeddings?.[0]?.values ?? [];
  }
}
