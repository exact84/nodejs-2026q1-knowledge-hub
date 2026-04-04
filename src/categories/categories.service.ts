import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Category } from './entities/categories.entity';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ArticlesService } from '../articles/articles.service';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';
import { paginate } from '../common/pagination/paginate.util';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { GetCategoriesQueryDto } from './dto/get-categories-query.dto';
import { CategorySortBy } from './enums/category-sort-by.enum';

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

  getAll(
    queryDto: GetCategoriesQueryDto,
  ): Category[] | PaginatedResponse<Category> {
    const categories = [...this.categoriesRepository.getAll()];

    const hasPagination =
      queryDto.page !== undefined || queryDto.limit !== undefined;

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 10;
    const sortBy = queryDto.sortBy ?? CategorySortBy.NAME;
    const order = queryDto.order ?? SortOrder.ASC;

    categories.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case CategorySortBy.NAME:
          compareResult = a.name.localeCompare(b.name);
          break;
        case CategorySortBy.DESCRIPTION:
          compareResult = (a.description ?? '').localeCompare(b.description);
          break;
      }

      return order === SortOrder.ASC ? compareResult : -compareResult;
    });

    return hasPagination ? paginate(categories, page, limit) : categories;
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
