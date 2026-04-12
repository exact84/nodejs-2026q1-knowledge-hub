import { Injectable } from '@nestjs/common';
import { Category } from './entities/categories.entity';

@Injectable()
export class CategoriesRepository {
  private categories: Category[] = [];

  create(category: Category): Category {
    this.categories.push(category);
    return category;
  }

  getAll(): Category[] {
    return this.categories;
  }

  getOne(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  update(category: Category): Category {
    const index = this.categories.findIndex((c) => c.id === category.id);
    this.categories[index] = category;
    return category;
  }

  delete(id: string): void {
    this.categories = this.categories.filter((c) => c.id !== id);
  }
}
