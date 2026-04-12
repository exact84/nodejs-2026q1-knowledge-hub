import { Injectable } from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticlesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(article: {
    id: string;
    title: string;
    content: string;
    status: ArticleStatus;
    authorId: string | null;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: Array<{ name: string }>;
  }): Article {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      authorId: article.authorId,
      categoryId: article.categoryId,
      tags: article.tags.map((tag) => tag.name),
      createdAt: article.createdAt.getTime(),
      updatedAt: article.updatedAt.getTime(),
    };
  }

  async create(
    article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Article> {
    const createdArticle = await this.prisma.article.create({
      data: {
        title: article.title,
        content: article.content,
        status: article.status,
        authorId: article.authorId,
        categoryId: article.categoryId,
        tags: {
          connectOrCreate: article.tags.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return this.mapToEntity(createdArticle);
  }

  async getAll(): Promise<Article[]> {
    const articles = await this.prisma.article.findMany({
      include: {
        tags: true,
      },
    });

    return articles.map((article) => this.mapToEntity(article));
  }

  async getOne(id: string): Promise<Article | null> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    return article ? this.mapToEntity(article) : null;
  }

  async update(article: Article): Promise<Article> {
    const updatedArticle = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        title: article.title,
        content: article.content,
        status: article.status,
        authorId: article.authorId,
        categoryId: article.categoryId,
        tags: {
          set: [],
          connectOrCreate: article.tags.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    return this.mapToEntity(updatedArticle);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const articleWithTags = await tx.article.findUnique({
        where: { id },
        select: {
          tags: {
            select: { id: true },
          },
        },
      });

      const tagIds = articleWithTags?.tags.map((tag) => tag.id) ?? [];

      await tx.article.delete({
        where: { id },
      });

      if (tagIds.length > 0) {
        await tx.tag.deleteMany({
          where: {
            id: {
              in: tagIds,
            },
            articles: {
              none: {},
            },
          },
        });
      }
    });
  }
}
