import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { ArticlesModule } from 'src/articles/articles.module';
import { CommentsModule } from 'src/comments/comments.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  imports: [ArticlesModule, CommentsModule],
})
export class UsersModule {}
