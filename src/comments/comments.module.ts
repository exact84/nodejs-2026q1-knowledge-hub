import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { ArticlesModule } from '../articles/articles.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
  imports: [ArticlesModule, PrismaModule],
  exports: [CommentsService],
})
export class CommentsModule {}
