import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { ArticlesService } from 'src/articles/articles.service';
import { CommentsService } from 'src/comments/comments.service';
import { IS_PUBLIC_KEY } from './public.decorator';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    login: string;
    role: UserRole;
  };
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly articlesService: ArticlesService,
    private readonly commentsService: CommentsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.role === UserRole.admin) {
      return true;
    }

    if (this.isLogoutRoute(request.path)) {
      return true;
    }

    if (request.method === 'GET') {
      return true;
    }

    if (user.role === UserRole.viewer) {
      throw new ForbiddenException(
        'You are not allowed to perform this action',
      );
    }

    if (user.role === UserRole.editor) {
      return this.handleEditorAccess(request, user.userId);
    }

    throw new ForbiddenException('You are not allowed to perform this action');
  }

  private async handleEditorAccess(
    request: AuthenticatedRequest,
    userId: string,
  ): Promise<boolean> {
    if (this.isArticleRoute(request.path)) {
      return this.handleArticleAccess(request, userId);
    }

    if (this.isCommentRoute(request.path)) {
      return this.handleCommentAccess(request, userId);
    }

    throw new ForbiddenException('You are not allowed to perform this action');
  }

  private async handleArticleAccess(
    request: AuthenticatedRequest,
    userId: string,
  ): Promise<boolean> {
    if (request.method === 'POST') {
      request.body.authorId = userId;
      return true;
    }

    if (request.method === 'PUT') {
      const articleId = request.params.id;
      const article = await this.articlesService.findOneOrNull(articleId);

      if (article?.authorId === userId) {
        request.body.authorId = userId;
        return true;
      }
    }

    throw new ForbiddenException('You are not allowed to perform this action');
  }

  private async handleCommentAccess(
    request: AuthenticatedRequest,
    userId: string,
  ): Promise<boolean> {
    if (request.method === 'POST') {
      request.body.authorId = userId;
      return true;
    }

    if (request.method === 'PUT') {
      const commentId = request.params.id;
      const comment = await this.commentsService.findOneOrNull(commentId);

      if (comment?.authorId === userId) {
        request.body.authorId = userId;
        return true;
      }
    }

    throw new ForbiddenException('You are not allowed to perform this action');
  }

  private isArticleRoute(path: string): boolean {
    return path.startsWith('/article');
  }

  private isCommentRoute(path: string): boolean {
    return path.startsWith('/comment');
  }

  private isLogoutRoute(path: string): boolean {
    return path === '/auth/logout';
  }
}
