import { Injectable } from '@nestjs/common';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticlesRepository {
  private articles: Article[] = [];

  create(article: Article): Article {
    this.articles.push(article);
    return article;
  }

  getAll(): Article[] {
    return this.articles;
  }

  getOne(id: string): Article | undefined {
    return this.articles.find((article) => article.id === id);
  }

  update(article: Article): Article {
    const index = this.articles.findIndex((a) => a.id === article.id);
    this.articles[index] = article;
    return article;
  }

  delete(id: string): void {
    this.articles = this.articles.filter((article) => article.id !== id);
  }

  clearCategoryId(categoryId: string): void {
    this.articles = this.articles.map((article) =>
      article.categoryId === categoryId
        ? { ...article, categoryId: null, updatedAt: Date.now() }
        : article,
    );
  }

  clearAuthorId(authorId: string): void {
    this.articles = this.articles.map((article) =>
      article.authorId === authorId
        ? { ...article, authorId: null, updatedAt: Date.now() }
        : article,
    );
  }
}
