import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagChunkingService } from './rag-chunking.service';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagVectorService } from './rag-vector.service';
import { QdrantPoint } from './types/qdrant-point';
import { v5 as uuidv5 } from 'uuid';

@Injectable()
export class RagIndexService implements OnModuleInit {
  private static readonly NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
  private readonly logger = new Logger(RagIndexService.name);

  public constructor(
    private readonly prismaService: PrismaService,
    private readonly ragChunkingService: RagChunkingService,
    private readonly ragEmbeddingService: RagEmbeddingService,
    private readonly ragVectorService: RagVectorService,
  ) {}

  public async onModuleInit(): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000)); // wait for other services to initialize
    await this.indexPublishedArticles();
  }

  public async indexPublishedArticles(): Promise<void> {
    const articles = await this.prismaService.article.findMany({
      where: {
        status: 'published',
      },
    });

    let indexedChunks = 0;

    for (const article of articles) {
      const content = this.stripHtml(article.content);

      const chunks = this.ragChunkingService.chunkText(content);

      const points: QdrantPoint[] = [];

      for (const chunk of chunks) {
        const embedding = await this.ragEmbeddingService.generateEmbedding(
          chunk.text,
        );

        points.push({
          // id: `${article.id}_${chunk.index}`,
          id: uuidv5(`${article.id}:${chunk.index}`, RagIndexService.NAMESPACE),

          vector: embedding,
          payload: {
            articleId: article.id,
            articleTitle: article.title,
            articleStatus: article.status,
            chunkIndex: chunk.index,
            content: chunk.text,
          },
        });

        indexedChunks += 1;
      }

      if (points.length > 0) {
        await this.ragVectorService.upsertPoints(points);
      }
    }

    this.logger.log(`Indexed articles: ${articles.length}`);

    this.logger.log(`Indexed chunks: ${indexedChunks}`);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ');
  }
}
