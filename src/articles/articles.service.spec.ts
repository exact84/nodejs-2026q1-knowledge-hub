import { ArticlesService } from './articles.service';
import { ArticleSortBy } from './enums/article-sorting.enum';
import { Article } from './entities/article.entity';
import { ArticleStatus } from '@prisma/client';
import { ArticlesRepository } from './articles.repository';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../common/errors/not-found.error';

const makeArticle = (overrides?: Partial<Article>): Article => ({
  id: '1',
  title: 'Title',
  status: ArticleStatus.draft,
  createdAt: 1,
  updatedAt: 1,
  categoryId: 'cat',
  tags: [],
  content: '',
  authorId: '',
  ...overrides,
});

const createRepo = () => ({
  getAll: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repo: ReturnType<typeof createRepo>;

  beforeEach(() => {
    repo = createRepo();
    service = new ArticlesService(repo as unknown as ArticlesRepository);
  });

  describe('getAll', () => {
    it('sorts by title ASC', async () => {
      repo.getAll.mockResolvedValue([
        makeArticle({ title: 'C' }),
        makeArticle({ title: 'A' }),
        makeArticle({ title: 'B' }),
      ]);

      const result = await service.getAll({
        sortBy: ArticleSortBy.TITLE,
        order: SortOrder.ASC,
      });

      if (!Array.isArray(result)) throw new Error();

      expect(result.map((a) => a.title)).toEqual(['A', 'B', 'C']);
    });

    it('sorts by status', async () => {
      repo.getAll.mockResolvedValue([
        makeArticle({ status: ArticleStatus.published }),
        makeArticle({ status: ArticleStatus.archived }),
        makeArticle({ status: ArticleStatus.draft }),
      ]);

      const result = await service.getAll({
        sortBy: ArticleSortBy.STATUS,
        order: SortOrder.ASC,
      });

      if (!Array.isArray(result)) throw new Error();

      expect(result.map((a) => a.status)).toEqual([
        ArticleStatus.archived,
        ArticleStatus.draft,
        ArticleStatus.published,
      ]);
    });

    it('returns paginated result', async () => {
      repo.getAll.mockResolvedValue([
        makeArticle({ id: '1' }),
        makeArticle({ id: '2' }),
        makeArticle({ id: '3' }),
      ]);

      const result = await service.getAll({ page: 1, limit: 2 });

      if (Array.isArray(result)) throw new Error();

      expect(result.total).toBe(3);
      expect(result.data.length).toBe(2);
    });

    it('filters by status', async () => {
      repo.getAll.mockResolvedValue([
        makeArticle({ status: ArticleStatus.draft }),
        makeArticle({ status: ArticleStatus.published }),
      ]);

      const result = await service.getAll({
        status: ArticleStatus.published,
      });

      if (!Array.isArray(result)) throw new Error();

      expect(result).toHaveLength(1);
    });

    it('filters by categoryId', async () => {
      repo.getAll.mockResolvedValue([
        makeArticle({ categoryId: 'cat-1' }),
        makeArticle({ categoryId: 'cat-2' }),
      ]);

      const result = await service.getAll({
        categoryId: 'cat-1',
      });

      if (!Array.isArray(result)) throw new Error();

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('cat-1');
    });

    it('filters by tag', async () => {
      repo.getAll.mockResolvedValue([
        makeArticle({ tags: ['nestjs'] }),
        makeArticle({ tags: ['node'] }),
      ]);

      const result = await service.getAll({
        tag: 'nestjs',
      });

      if (!Array.isArray(result)) throw new Error();

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('nestjs');
    });
  });

  describe('create', () => {
    it('creates article with defaults', async () => {
      repo.create.mockResolvedValue(makeArticle());

      await service.create({
        title: 'New Article',
        content: 'Content',
      });

      expect(repo.create).toHaveBeenCalledWith({
        title: 'New Article',
        content: 'Content',
        status: ArticleStatus.draft,
        authorId: null,
        categoryId: null,
        tags: [],
      });
    });
  });

  describe('update', () => {
    it('updates article', async () => {
      repo.getOne.mockResolvedValue(makeArticle({ id: '1' }));
      repo.update.mockResolvedValue(makeArticle({ title: 'Updated' }));

      await service.update('1', { title: 'Updated' });

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated' }),
      );
    });

    it('throws if article not found', async () => {
      repo.getOne.mockResolvedValue(null);

      await expect(service.update('x', { title: 'test' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('getOne', () => {
    it('returns article', async () => {
      repo.getOne.mockResolvedValue(makeArticle({ id: '1' }));

      const result = await service.getOne('1');

      expect(result.id).toBe('1');
    });

    it('throws if not found', async () => {
      repo.getOne.mockResolvedValue(null);

      await expect(service.getOne('x')).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deletes article', async () => {
      repo.getOne.mockResolvedValue(makeArticle({ id: '1' }));

      await service.delete('1');

      expect(repo.delete).toHaveBeenCalledWith('1');
    });

    it('throws if not found', async () => {
      repo.getOne.mockResolvedValue(null);

      await expect(service.delete('x')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findOneOrNull', () => {
    it('returns null if not found', async () => {
      repo.getOne.mockResolvedValue(null);

      const result = await service.findOneOrNull('x');

      expect(result).toBeNull();
    });
  });
});
