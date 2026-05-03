import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from './entities/categories.entity';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async getAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async getOne(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async update(category: Category): Promise<Category> {
    return this.prisma.category.update({
      where: { id: category.id },
      data: {
        name: category.name,
        description: category.description,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
