import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class RagSearchRequest {
  @ApiProperty({ example: 'What is NestJS?' })
  @IsString()
  query: string;
  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;
  @ApiProperty({ example: 'published', required: false })
  @IsOptional()
  articleStatus?: 'draft' | 'published' | 'archived';
  @ApiProperty({ example: '123', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;
  @ApiProperty({ example: ['nestjs', 'guide'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class RagSearchResponse {
  results: Array<{
    articleId: string;
    articleTitle: string;
    chunk: string;
    similarity: number;
  }>;
}
