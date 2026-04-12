import { ArticlesService } from './articles.service';
import { ArticleSortBy } from './enums/article-sorting.enum';
import { Article } from './entities/article.entity';
import { ArticleStatus } from './enums/article-status.enum';
import { CommentsService } from '../comments/comments.service';
import { ArticlesRepository } from './articles.repository';
import { SortOrder } from '../common/pagination/sort-order.enum';

class FakeArticlesRepository implements Pick<ArticlesRepository, 'getAll'> {
  private articles: Article[] = [
    {
      id: '1',
      title: 'C article',
      status: ArticleStatus.DRAFT,
      createdAt: 300,
      categoryId: 'cat-1',
      tags: ['nestjs'],
      content: '',
      authorId: '',
      updatedAt: 0,
    },
    {
      id: '2',
      title: 'A article',
      status: ArticleStatus.PUBLISHED,
      createdAt: 100,
      categoryId: 'cat-1',
      tags: ['node'],
      content: '',
      authorId: '',
      updatedAt: 0,
    },
    {
      id: '3',
      title: 'B article',
      status: ArticleStatus.ARCHIVED,
      createdAt: 200,
      categoryId: 'cat-2',
      tags: ['ts'],
      content: '',
      authorId: '',
      updatedAt: 0,
    },
  ];

  getAll(): Article[] {
    return this.articles;
  }
}

class FakeCommentsService {}

describe('ArticlesService', () => {
  let service: ArticlesService;

  beforeEach(() => {
    service = new ArticlesService(
      new FakeArticlesRepository() as unknown as ArticlesRepository,
      new FakeCommentsService() as CommentsService,
    );
  });

  it('should sort articles by title ascending', () => {
    const result = service.getAll({
      sortBy: ArticleSortBy.TITLE,
      order: SortOrder.ASC,
    });

    if (!Array.isArray(result)) {
      throw new Error('Expected array');
    }

    expect(result.map((a) => a.title)).toEqual([
      'A article',
      'B article',
      'C article',
    ]);
  });

  it('should return paginated result', () => {
    const result = service.getAll({
      page: 1,
      limit: 2,
    });

    if (Array.isArray(result)) {
      throw new Error('Expected paginated response');
    }

    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.data.length).toBe(2);
  });

  it('should sort before pagination', () => {
    const result = service.getAll({
      sortBy: ArticleSortBy.TITLE,
      order: SortOrder.ASC,
      page: 1,
      limit: 2,
    });

    if (Array.isArray(result)) {
      throw new Error('Expected paginated response');
    }

    expect(result.data.map((a) => a.title)).toEqual(['A article', 'B article']);
  });

  it('should return second page correctly', () => {
    const result = service.getAll({
      page: 2,
      limit: 2,
    });

    if (Array.isArray(result)) {
      throw new Error('Expected paginated response');
    }

    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe('2');
  });
});
