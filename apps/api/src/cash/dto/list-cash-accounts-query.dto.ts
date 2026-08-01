import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SortOrder } from '../../common/sorting/sort-order.enum';

export enum CashAccountSortByField {
  name = 'name',
  code = 'code',
  currentBalance = 'currentBalance',
  createdAt = 'createdAt',
}

export class ListCashAccountsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @ApiPropertyOptional({ enum: CashAccountSortByField })
  @IsOptional()
  @IsEnum(CashAccountSortByField)
  sortBy?: CashAccountSortByField = CashAccountSortByField.createdAt;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
