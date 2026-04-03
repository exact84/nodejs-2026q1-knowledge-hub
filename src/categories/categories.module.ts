import { forwardRef, Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { ArticlesModule } from 'src/articles/articles.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  // imports: [forwardRef(() => ArticlesModule)],
  imports: [ArticlesModule],
})
export class CategoriesModule {}
