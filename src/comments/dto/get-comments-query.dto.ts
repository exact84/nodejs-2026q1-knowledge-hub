import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SortOrder } from '../../common/pagination/sort-order.enum';
import { CommentSortBy } from '../enums/comments-sorting.enum';
import { BasePaginationQueryDto } from '../../common/pagination/base-pagination-query.dto';

export class GetCommentsQueryDto extends BasePaginationQueryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  articleId: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    enum: CommentSortBy,
    example: CommentSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(CommentSortBy)
  sortBy?: CommentSortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;
}
