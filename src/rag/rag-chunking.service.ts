import { Injectable } from '@nestjs/common';

export interface RagChunk {
  index: number;
  text: string;
}

@Injectable()
export class RagChunkingService {
  public chunkText(text: string): RagChunk[] {
    const chunkSize = Number(process.env.RAG_CHUNK_SIZE ?? 800);
    const overlap = Number(process.env.RAG_CHUNK_OVERLAP ?? 200);
    const normalizedText = this.normalizeText(text);
    const chunks: RagChunk[] = [];

    let start = 0;
    let index = 0;

    while (start < normalizedText.length) {
      const end = start + chunkSize;
      const chunk = normalizedText.slice(start, end).trim();

      if (chunk.length > 0) {
        chunks.push({
          index,
          text: chunk,
        });
      }

      start += chunkSize - overlap;
      index += 1;
    }

    return chunks;
  }

  private normalizeText(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  }
}
