import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../common/pagination/base-pagination-query.dto';
import { SortOrder } from '../../common/pagination/sort-order.enum';
import { UserSortBy } from '../enums/user-sorting.enum';

export class GetUsersQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    enum: UserSortBy,
    example: UserSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;
}
