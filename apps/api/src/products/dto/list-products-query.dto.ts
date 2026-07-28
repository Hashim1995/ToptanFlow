import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SortOrder } from '../../common/sorting/sort-order.enum';
import { ProductTypeApi } from './product-type.enum';

const SORT_BY_FIELDS = [
  'code',
  'name',
  'type',
  'category',
  'standardSalePrice',
  'latestPurchasePrice',
  'criticalStockThreshold',
  'isActive',
  'createdAt',
  'updatedAt',
] as const;
export type ProductSortByField = (typeof SORT_BY_FIELDS)[number];

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Case-insensitive match against code, name, or category (when not null).',
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

  @ApiPropertyOptional({ enum: ProductTypeApi })
  @IsOptional()
  @IsEnum(ProductTypeApi)
  type?: ProductTypeApi;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive exact match on category.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  category?: string;

  @ApiPropertyOptional({ enum: SORT_BY_FIELDS, default: 'code' })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: ProductSortByField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
