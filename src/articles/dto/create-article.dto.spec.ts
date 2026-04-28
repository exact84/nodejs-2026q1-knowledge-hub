import { ArticleStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateArticleDto } from './create-article.dto';

describe('CreateArticleDto validation', () => {
  it('fails when title is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      content: 'This is an article about NestJS',
    });

    const errors = await validate(dto);
    const hasTitleError = errors.some((error) => error.property === 'title');

    expect(hasTitleError).toBe(true);
  });

  it('fails when content is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'NestJS Guide',
    });

    const errors = await validate(dto);
    const hasContentError = errors.some(
      (error) => error.property === 'content',
    );

    expect(hasContentError).toBe(true);
  });

  it('fails when status enum is invalid', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'NestJS Guide',
      content: 'This is an article about NestJS',
      status: 'unknown_status',
    });

    const errors = await validate(dto);
    const hasStatusError = errors.some((error) => error.property === 'status');

    expect(hasStatusError).toBe(true);
  });

  it('passes for valid payload', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'NestJS Guide',
      content: 'This is an article about NestJS',
      status: ArticleStatus.draft,
      tags: ['nestjs', 'backend'],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
