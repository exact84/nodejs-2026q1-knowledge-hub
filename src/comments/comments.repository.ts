import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(comment: {
    id: string;
    content: string;
    articleId: string;
    authorId: string | null;
    createdAt: Date;
  }): Comment {
    return {
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt.getTime(),
    };
  }

  async create(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const createdComment = await this.prisma.comment.create({
      data: {
        content: comment.content,
        articleId: comment.articleId,
        authorId: comment.authorId,
      },
    });

    return this.mapToEntity(createdComment);
  }

  async getAll(): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany();
    return comments.map((comment) => this.mapToEntity(comment));
  }

  async getOne(id: string): Promise<Comment | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    return comment ? this.mapToEntity(comment) : null;
  }

  async getByArticleId(articleId: string): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
    });

    return comments.map((comment) => this.mapToEntity(comment));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }
}
