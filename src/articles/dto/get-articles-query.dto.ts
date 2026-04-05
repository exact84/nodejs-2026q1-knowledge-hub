import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ArticleStatus } from '../enums/article-status.enum';
import { ArticleSortBy } from '../enums/article-sorting.enum';
import { BasePaginationQueryDto } from '../../common/pagination/base-pagination-query.dto';
import { SortOrder } from '../../common/pagination/sort-order.enum';

export class GetArticlesQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    enum: ArticleStatus,
    example: ArticleStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString()
  tag?: string;

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
