import { ArticleStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RagSearchRequest {
  @ApiProperty({ example: 'What is NestJS?' })
  @IsString()
  query: string;
  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiProperty({
    enum: ArticleStatus,
    example: 'published',
    required: false,
  })
  @IsEnum(ArticleStatus)
  @IsOptional()
  articleStatus?: ArticleStatus;
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

export class RagSearchResultDto {
  @ApiProperty()
  articleId: string;

  @ApiProperty()
  articleTitle: string;

  @ApiProperty()
  chunk: string;

  @ApiProperty()
  similarity: number;
}

export class RagSearchResponse {
  @ApiProperty({
    type: [RagSearchResultDto],
  })
  results: RagSearchResultDto[];
}
