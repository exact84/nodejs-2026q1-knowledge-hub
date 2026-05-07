import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { RagVectorService } from './rag-vector.service';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagChunkingService } from './rag-chunking.service';
import { RagSearchService } from './rag-search.service';
import { RagIndexService } from './rag-index.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [
    RagService,
    RagVectorService,
    RagEmbeddingService,
    RagChunkingService,
    RagSearchService,
    RagIndexService,
  ],
  exports: [RagVectorService, RagEmbeddingService],
})
export class RagModule {}
