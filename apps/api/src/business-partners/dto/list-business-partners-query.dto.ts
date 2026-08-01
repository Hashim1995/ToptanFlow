import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SortOrder } from '../../common/sorting/sort-order.enum';

const SORT_BY_FIELDS = [
  'code',
  'name',
  'isCustomer',
  'isSupplier',
  'email',
  'taxNumber',
  'isActive',
  'createdAt',
  'updatedAt',
] as const;
export type BusinessPartnerSortByField = (typeof SORT_BY_FIELDS)[number];

function transformQueryBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class ListBusinessPartnersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Case-insensitive contains match against code, name, phone, email, or taxNumber.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformQueryBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformQueryBoolean(value))
  @IsBoolean()
  isCustomer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformQueryBoolean(value))
  @IsBoolean()
  isSupplier?: boolean;

  @ApiPropertyOptional({ enum: SORT_BY_FIELDS, default: 'code' })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: BusinessPartnerSortByField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
