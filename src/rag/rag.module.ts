import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { RagVectorService } from './rag-vector.service';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagChunkingService } from './rag-chunking.service';

@Module({
  controllers: [RagController],
  providers: [
    RagService,
    RagVectorService,
    RagEmbeddingService,
    RagChunkingService,
  ],
  exports: [RagVectorService, RagEmbeddingService, RagChunkingService],
})
export class RagModule {}
