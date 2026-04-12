import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticlesRepository } from './articles.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticlesRepository],
  imports: [PrismaModule],
  exports: [ArticlesService],
})
export class ArticlesModule {}
