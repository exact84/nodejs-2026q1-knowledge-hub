import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article } from './entities/article.entity';
import { ArticleStatus } from '@prisma/client';
import { ArticlesRepository } from './articles.repository';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleSortBy } from './enums/article-sorting.enum';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';
import { paginate } from '../common/pagination/paginate.util';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { NotFoundError } from '../common/errors/not-found.error';

@Injectable()
export class ArticlesService {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  async create(dto: CreateArticleDto): Promise<Article> {
    return this.articlesRepository.create({
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.draft,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
    });
  }

  async getAll(
    queryDto: GetArticlesQueryDto,
  ): Promise<Article[] | PaginatedResponse<Article>> {
    let articles = await this.articlesRepository.getAll();

    if (queryDto.status) {
      articles = articles.filter(
        (article) => article.status === queryDto.status,
      );
    }

    if (queryDto.categoryId) {
      articles = articles.filter(
        (article) => article.categoryId === queryDto.categoryId,
      );
    }

    if (queryDto.tag) {
      const { tag } = queryDto;
      articles = articles.filter((article) => article.tags.includes(tag));
    }

    const hasPagination =
      queryDto.page !== undefined || queryDto.limit !== undefined;

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 10;
    const sortBy = queryDto.sortBy ?? ArticleSortBy.CREATED_AT;
    const order = queryDto.order ?? SortOrder.DESC;

    articles.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case ArticleSortBy.CREATED_AT:
          compareResult = a.createdAt - b.createdAt;
          break;
        case ArticleSortBy.TITLE:
          compareResult = a.title.localeCompare(b.title);
          break;
        case ArticleSortBy.STATUS:
          compareResult = a.status.localeCompare(b.status);
          break;
      }

      return order === SortOrder.ASC ? compareResult : -compareResult;
    });

    return hasPagination ? paginate(articles, page, limit) : articles;
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.articlesRepository.getOne(id);

    if (!article) {
      throw new NotFoundError(`Article with id ${id} not found`);
    }

    const updatedArticle: Article = {
      ...article,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.authorId !== undefined && { authorId: dto.authorId }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
    };

    return this.articlesRepository.update(updatedArticle);
  }

  async getOne(id: string): Promise<Article> {
    const article = await this.articlesRepository.getOne(id);

    if (!article) {
      throw new NotFoundError(`Article with id ${id} not found`);
    }

    return article;
  }

  async delete(id: string): Promise<void> {
    const article = await this.articlesRepository.getOne(id);

    if (!article) {
      throw new NotFoundError(`Article with id ${id} not found`);
    }

    await this.articlesRepository.delete(id);
  }

  async findOneOrNull(id: string): Promise<Article | null> {
    return this.articlesRepository.getOne(id);
  }
}
