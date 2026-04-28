import { ArticleStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { GetArticlesQueryDto } from './articles/dto/get-articles-query.dto';
import { UpdateArticleDto } from './articles/dto/update-article.dto';
import { LoginDto } from './auth/login/dto/login.dto';
import { LogoutDto } from './auth/logout/dto/logout.dto';
import { RefreshDto } from './auth/refresh/dto/refresh.dto';
import { SignupDto } from './auth/signup/dto/signup.dto';
import { GetCategoriesQueryDto } from './categories/dto/get-categories-query.dto';
import { UpdateCategoryDto } from './categories/dto/update-category.dto';
import { CreateCommentDto } from './comments/dto/create-comment.dto';
import { GetCommentsQueryDto } from './comments/dto/get-comments-query.dto';
import { UpdateCommentDto } from './comments/dto/update-comment.dto';
import { BasePaginationQueryDto } from './common/pagination/base-pagination-query.dto';
import { SortOrder } from './common/pagination/sort-order.enum';
import { CategorySortBy } from './categories/enums/category-sort-by.enum';
import { CommentSortBy } from './comments/enums/comments-sorting.enum';
import { ArticleSortBy } from './articles/enums/article-sorting.enum';
import { GetUsersQueryDto } from './users/dto/get-users-query.dto';
import { UpdatePasswordDto } from './users/dto/update-password.dto';
import { UserSortBy } from './users/enums/user-sorting.enum';

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((error) => error.property === property);

describe('DTO validation (class-validator direct tests)', () => {
  describe('Auth DTOs', () => {
    it('LoginDto fails when login is missing', async () => {
      const dto = plainToInstance(LoginDto, {
        password: 'secret',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'login')).toBe(true);
    });

    it('SignupDto fails when password is missing', async () => {
      const dto = plainToInstance(SignupDto, {
        login: 'alice',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'password')).toBe(true);
    });

    it('LogoutDto accepts payload with refreshToken', async () => {
      const dto = plainToInstance(LogoutDto, {
        refreshToken: 'token',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('RefreshDto accepts payload with refreshToken', async () => {
      const dto = plainToInstance(RefreshDto, {
        refreshToken: 'token',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Categories DTOs', () => {
    it('UpdateCategoryDto fails when name is missing', async () => {
      const dto = plainToInstance(UpdateCategoryDto, {
        description: 'desc',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'name')).toBe(true);
    });

    it('GetCategoriesQueryDto fails for invalid sortBy enum', async () => {
      const dto = plainToInstance(GetCategoriesQueryDto, {
        sortBy: 'invalid_sort',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'sortBy')).toBe(true);
    });

    it('GetCategoriesQueryDto passes for valid payload', async () => {
      const dto = plainToInstance(GetCategoriesQueryDto, {
        sortBy: CategorySortBy.NAME,
        order: SortOrder.ASC,
        page: 1,
        limit: 10,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Comments DTOs', () => {
    it('CreateCommentDto fails when content is missing', async () => {
      const dto = plainToInstance(CreateCommentDto, {
        articleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'content')).toBe(true);
    });

    it('CreateCommentDto fails for invalid articleId', async () => {
      const dto = plainToInstance(CreateCommentDto, {
        content: 'Great article',
        articleId: 'not-a-uuid',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'articleId')).toBe(true);
    });

    it('UpdateCommentDto passes for empty payload', async () => {
      const dto = plainToInstance(UpdateCommentDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('GetCommentsQueryDto fails for invalid sortBy enum', async () => {
      const dto = plainToInstance(GetCommentsQueryDto, {
        articleId: '550e8400-e29b-41d4-a716-446655440000',
        sortBy: 'invalid_sort',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'sortBy')).toBe(true);
    });

    it('GetCommentsQueryDto passes for valid payload', async () => {
      const dto = plainToInstance(GetCommentsQueryDto, {
        articleId: '550e8400-e29b-41d4-a716-446655440000',
        sortBy: CommentSortBy.CREATED_AT,
        order: SortOrder.DESC,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Articles DTOs', () => {
    it('UpdateArticleDto fails for invalid status enum', async () => {
      const dto = plainToInstance(UpdateArticleDto, {
        status: 'wrong_status',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'status')).toBe(true);
    });

    it('UpdateArticleDto passes for valid payload', async () => {
      const dto = plainToInstance(UpdateArticleDto, {
        title: 'NestJS Guide',
        status: ArticleStatus.draft,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('GetArticlesQueryDto fails for invalid status enum', async () => {
      const dto = plainToInstance(GetArticlesQueryDto, {
        status: 'invalid_status',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'status')).toBe(true);
    });

    it('GetArticlesQueryDto fails for invalid sortBy enum', async () => {
      const dto = plainToInstance(GetArticlesQueryDto, {
        sortBy: 'wrong_sort',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'sortBy')).toBe(true);
    });

    it('GetArticlesQueryDto passes for valid payload', async () => {
      const dto = plainToInstance(GetArticlesQueryDto, {
        status: ArticleStatus.published,
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        sortBy: ArticleSortBy.CREATED_AT,
        order: SortOrder.DESC,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Users DTOs', () => {
    it('GetUsersQueryDto fails for invalid sortBy enum', async () => {
      const dto = plainToInstance(GetUsersQueryDto, {
        sortBy: 'bad_sort',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'sortBy')).toBe(true);
    });

    it('GetUsersQueryDto passes for valid payload', async () => {
      const dto = plainToInstance(GetUsersQueryDto, {
        sortBy: UserSortBy.CREATED_AT,
        order: SortOrder.DESC,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('UpdatePasswordDto fails when oldPassword is missing', async () => {
      const dto = plainToInstance(UpdatePasswordDto, {
        newPassword: 'new-secret',
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'oldPassword')).toBe(true);
    });

    it('UpdatePasswordDto passes for valid payload', async () => {
      const dto = plainToInstance(UpdatePasswordDto, {
        oldPassword: 'old-secret',
        newPassword: 'new-secret',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('BasePaginationQueryDto', () => {
    it('fails when page is below minimum', async () => {
      const dto = plainToInstance(BasePaginationQueryDto, {
        page: 0,
      });

      const errors = await validate(dto);

      expect(hasError(errors, 'page')).toBe(true);
    });

    it('passes for valid payload', async () => {
      const dto = plainToInstance(BasePaginationQueryDto, {
        page: 1,
        limit: 20,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
