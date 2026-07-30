import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SortOrder } from '../../common/sorting/sort-order.enum';
import { WarehouseKindApi } from './warehouse-kind.enum';

const SORT_BY_FIELDS = [
  'code',
  'name',
  'kind',
  'createdAt',
  'updatedAt',
] as const;
export type WarehouseSortByField = (typeof SORT_BY_FIELDS)[number];

export class ListWarehousesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive match against name or code.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: WarehouseKindApi })
  @IsOptional()
  @IsEnum(WarehouseKindApi)
  kind?: WarehouseKindApi;

  @ApiPropertyOptional({ enum: SORT_BY_FIELDS })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: WarehouseSortByField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
