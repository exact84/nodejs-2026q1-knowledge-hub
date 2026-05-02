import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../common/pagination/base-pagination-query.dto';
import { CategorySortBy } from '../enums/category-sort-by.enum';
import { SortOrder } from '../../common/pagination/sort-order.enum';

export class GetCategoriesQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    enum: CategorySortBy,
    example: CategorySortBy.NAME,
  })
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;
}
