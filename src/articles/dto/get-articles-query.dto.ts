import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ArticleStatus } from '../enums/article-status.enum';
import { ArticleSortBy, SortOrder } from '../enums/article-sorting';
import { Type } from 'class-transformer';

export class GetArticlesQueryDto {
  @ApiProperty({
    required: false,
    enum: ArticleStatus,
    example: ArticleStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: 'nestjs' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ArticleSortBy,
    example: ArticleSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ArticleSortBy)
  sortBy?: ArticleSortBy;

  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;
}
