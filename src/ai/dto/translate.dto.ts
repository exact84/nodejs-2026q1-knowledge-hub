import { IsOptional, IsString } from 'class-validator';

export class TranslateArticleRequest {
  @IsString()
  targetLanguage: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}

export class TranslateArticleResponse {
  articleId: string;
  translatedText: string;
  detectedLanguage: string;
}
