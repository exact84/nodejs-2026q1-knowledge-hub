import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class AnalyzeArticleRequest {
  @IsOptional()
  @IsIn(['review', 'bugs', 'optimize', 'explain'])
  task?: 'review' | 'bugs' | 'optimize' | 'explain';
}

export class AnalyzeArticleResponse {
  @IsString()
  articleId: string;

  @IsString()
  analysis: string;

  @IsArray()
  @IsString({ each: true })
  suggestions: string[];

  @IsEnum(['info', 'warning', 'error'])
  severity: 'info' | 'warning' | 'error';
}
