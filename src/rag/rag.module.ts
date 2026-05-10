import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { RagVectorService } from './rag-vector.service';
import { RagChunkingService } from './rag-chunking.service';
import { RagSearchService } from './rag-search.service';
import { RagIndexService } from './rag-index.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RagChatService } from './rag-chat.service';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [
    RagService,
    RagVectorService,
    RagChunkingService,
    RagSearchService,
    RagIndexService,
    RagChatService,
  ],
  exports: [RagVectorService],
})
export class RagModule {}
