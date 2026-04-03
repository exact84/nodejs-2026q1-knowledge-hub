import { forwardRef, Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { ArticlesModule } from 'src/articles/articles.module';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
  imports: [forwardRef(() => ArticlesModule)],
  exports: [CommentsService],
})
export class CommentsModule {}
