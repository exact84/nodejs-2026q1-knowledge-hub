import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Category } from './entities/categories.entity';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ArticlesService } from 'src/articles/articles.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly articlesService: ArticlesService,
  ) {}

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
    };

    return this.categoriesRepository.create(category);
  }

  getAll(): Category[] {
    return this.categoriesRepository.getAll();
  }

  getOne(id: string): Category {
    const category = this.categoriesRepository.getOne(id);

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const category = this.categoriesRepository.getOne(id);

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const updated: Category = {
      ...category,
      name: dto.name,
      description: dto.description,
    };

    return this.categoriesRepository.update(updated);
  }

  delete(id: string): void {
    const category = this.categoriesRepository.getOne(id);

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    this.articlesService.clearCategoryId(id);
    this.categoriesRepository.delete(id);
  }
}
