import { Injectable } from '@nestjs/common';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsRepository {
  private comments: Comment[] = [];

  create(comments: Comment): Comment {
    this.comments.push(comments);
    return comments;
  }

  getAll(): Comment[] {
    return this.comments;
  }

  getOne(id: string): Comment | undefined {
    return this.comments.find((comment) => comment.id === id);
  }

  getByArticleId(articleId: string): Comment[] {
    return this.comments.filter((comment) => comment.articleId === articleId);
  }

  // update(comment: Comment): Comment {
  //   const index = this.comments.findIndex((a) => a.id === comment.id);
  //   this.comments[index] = comment;
  //   return comment;
  // }

  delete(id: string): void {
    this.comments = this.comments.filter((comment) => comment.id !== id);
  }

  deleteByArticleId(articleId: string): void {
    this.comments = this.comments.filter(
      (comment) => comment.articleId !== articleId,
    );
  }

  deleteByAuthorId(authorId: string): void {
    this.comments = this.comments.filter(
      (comment) => comment.authorId !== authorId,
    );
  }
}
