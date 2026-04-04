import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ArticlesService } from '../articles/articles.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { Comment } from './entities/comment.entity';
import { CommentsRepository } from './comments.repository';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { paginate } from '../common/pagination/paginate.util';
import { CommentSortBy } from './enums/comments-sorting.enum';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    @Inject(forwardRef(() => ArticlesService))
    private readonly articlesService: ArticlesService,
  ) {}

  create(dto: CreateCommentDto): Comment {
    const article = this.articlesService.findOneOrNull(dto.articleId);

    if (!article) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} does not exist`,
      );
    }

    const comment: Comment = {
      id: randomUUID(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: Date.now(),
    };

    return this.commentsRepository.create(comment);
  }

  getByArticleId(
    queryDto: GetCommentsQueryDto,
  ): Comment[] | PaginatedResponse<Comment> {
    const comments = [
      ...this.commentsRepository.getByArticleId(queryDto.articleId),
    ];

    const hasPagination =
      queryDto.page !== undefined || queryDto.limit !== undefined;

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 10;
    const sortBy = queryDto.sortBy ?? CommentSortBy.CREATED_AT;
    const order = queryDto.order ?? SortOrder.DESC;

    comments.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case CommentSortBy.CONTENT:
          compareResult = a.content.localeCompare(b.content);
          break;
        case CommentSortBy.ARTICLE_ID:
          compareResult = a.articleId.localeCompare(b.articleId);
          break;
        case CommentSortBy.AUTHOR_ID:
          compareResult = (a.authorId ?? '').localeCompare(b.authorId ?? '');
          break;
        case CommentSortBy.CREATED_AT:
          compareResult = a.createdAt - b.createdAt;
          break;
      }

      return order === SortOrder.ASC ? compareResult : -compareResult;
    });

    return hasPagination ? paginate(comments, page, limit) : comments;
  }

  getOne(id: string): Comment {
    const comment = this.commentsRepository.getOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  delete(id: string): void {
    const comment = this.commentsRepository.getOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    this.commentsRepository.delete(id);
  }

  deleteByArticleId(articleId: string): void {
    this.commentsRepository.deleteByArticleId(articleId);
  }

  deleteByAuthorId(authorId: string): void {
    this.commentsRepository.deleteByAuthorId(authorId);
  }
}
