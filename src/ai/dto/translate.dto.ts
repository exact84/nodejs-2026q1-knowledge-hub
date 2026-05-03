import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateArticleRequest {
  @ApiProperty({ example: 'Russian' })
  @IsString()
  @IsNotEmpty()
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
