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

  getByArticleId(queryDto: GetCommentsQueryDto): Comment[] {
    return this.commentsRepository.getByArticleId(queryDto.articleId);
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
