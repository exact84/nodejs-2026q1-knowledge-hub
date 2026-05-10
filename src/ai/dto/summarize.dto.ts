import { IsIn, IsOptional } from 'class-validator';

export class SummarizeArticleRequest {
  @IsOptional()
  @IsIn(['short', 'medium', 'detailed'])
  maxLength?: 'short' | 'medium' | 'detailed';
}

export class SummarizeArticleResponse {
  articleId: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
}
