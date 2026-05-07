import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { RagVectorService } from './rag-vector.service';

@Module({
  controllers: [RagController],
  providers: [RagService, RagVectorService],
  exports: [RagVectorService],
})
export class RagModule {}
