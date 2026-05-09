import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagChunkingService } from './rag-chunking.service';
import { RagVectorService } from './rag-vector.service';
import { QdrantPoint } from './types/qdrant-point';
import { v5 as uuidv5 } from 'uuid';
import { RagService } from './rag.service';

@Injectable()
export class RagIndexService implements OnModuleInit {
  private static readonly NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
  private readonly logger = new Logger(RagIndexService.name);

  public constructor(
    private readonly prismaService: PrismaService,
    private readonly ragChunkingService: RagChunkingService,
    private readonly ragService: RagService,
    private readonly ragVectorService: RagVectorService,
  ) {}

  public async onModuleInit(): Promise<void> {
    // await new Promise((r) => setTimeout(r, 1000)); // wait for other services to initialize
    await this.indexPublishedArticles();
  }

  public async indexPublishedArticles(): Promise<void> {
    const articles = await this.prismaService.article.findMany({
      where: {
        status: 'published',
      },
      include: { tags: true },
    });

    let indexedChunks = 0;

    for (const article of articles) {
      const existing = await this.ragVectorService.getArticleIndexMetadata(
        article.id,
      );
      const indexedAt = existing?.payload?.indexedAt as string | undefined;

      if (indexedAt && new Date(indexedAt) >= article.updatedAt) {
        this.logger.log(`Skipping unchanged article: ${article.title}`);
        continue;
      }

      await this.ragVectorService.deleteByArticleId(article.id);

      const content = this.stripHtml(article.content);
      const chunks = this.ragChunkingService.chunkText(content);
      const embeddings = await Promise.all(
        chunks.map((chunk) => this.ragService.generateEmbedding(chunk.text)),
      );
      const points: QdrantPoint[] = chunks.map((chunk, index) => ({
        id: uuidv5(`${article.id}:${chunk.index}`, RagIndexService.NAMESPACE),
        vector: embeddings[index],
        payload: {
          articleId: article.id,
          articleTitle: article.title,
          articleStatus: article.status,
          categoryId: article.categoryId,
          tags: article.tags.map((tag) => tag.name),
          chunkIndex: chunk.index,
          content: chunk.text,
          indexedAt: new Date().toISOString(),
        },
      }));

      indexedChunks += points.length;

      if (points.length > 0) {
        await this.ragVectorService.upsertPoints(points);
      }
    }

    this.logger.log(`Indexed chunks: ${indexedChunks}`);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ');
  }
}
