import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SortOrder } from '../../common/sorting/sort-order.enum';
import { IsNumericDecimal18_4 } from '../../products/dto/decimal-string.validator';
import { DocumentStatusApi } from './document-status.enum';

const PURCHASE_SORT_FIELDS = [
  'documentNumber',
  'businessDate',
  'status',
  'totalAmount',
  'createdAt',
] as const;
export type PurchaseSortByField = (typeof PURCHASE_SORT_FIELDS)[number];

export class ListPurchasesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  documentNumber?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ enum: DocumentStatusApi })
  @IsOptional()
  @IsEnum(DocumentStatusApi)
  status?: DocumentStatusApi;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  businessDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  businessDateTo?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  minTotal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  maxTotal?: string;

  @ApiPropertyOptional({ enum: PURCHASE_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(PURCHASE_SORT_FIELDS)
  sortBy?: PurchaseSortByField = 'createdAt';

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
