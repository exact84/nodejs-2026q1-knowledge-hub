import { forwardRef, Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticlesRepository } from './articles.repository';
import { CommentsModule } from '../comments/comments.module';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticlesRepository],
  imports: [forwardRef(() => CommentsModule)],
  exports: [ArticlesService],
})
export class ArticlesModule {}
