import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article } from './entities/article.entity';
import { ArticleStatus } from './enums/article-status.enum';
import { ArticlesRepository } from './articles.repository';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CommentsService } from 'src/comments/comments.service';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly articlesRepository: ArticlesRepository,
    @Inject(forwardRef(() => CommentsService))
    private readonly commentsService: CommentsService,
  ) {}

  create(dto: CreateArticleDto): Article {
    const timestamp = Date.now();

    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.articlesRepository.create(article);
  }

  getAll(queryDto: GetArticlesQueryDto): Article[] {
    let articles = this.articlesRepository.getAll();

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

    return articles;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const article = this.articlesRepository.getOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    const updated: Article = {
      ...article,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.authorId !== undefined && { authorId: dto.authorId }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      updatedAt: Date.now(),
    };

    return this.articlesRepository.update(updated);
  }

  getOne(id: string): Article {
    const article = this.articlesRepository.getOne(id);

    if (!article) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return article;
  }

  delete(id: string): void {
    const article = this.articlesRepository.getOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    this.commentsService.deleteByArticleId(id);
    this.articlesRepository.delete(id);
  }

  findOneOrNull(id: string): Article | null {
    return this.articlesRepository.getOne(id) ?? null;
  }

  clearCategoryId(categoryId: string): void {
    this.articlesRepository.clearCategoryId(categoryId);
  }

  clearAuthorId(authorId: string): void {
    this.articlesRepository.clearAuthorId(authorId);
  }
}
