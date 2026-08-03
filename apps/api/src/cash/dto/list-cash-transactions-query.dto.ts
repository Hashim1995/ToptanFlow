import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  transformFilterDateStart,
  transformToUtcDateEnd,
} from '../../common/datetime/index.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SortOrder } from '../../common/sorting/sort-order.enum';

export enum CashTransactionSortByField {
  transactionDate = 'transactionDate',
  createdAt = 'createdAt',
  amount = 'amount',
}

export class ListCashTransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  type?: string;

  @ApiPropertyOptional({ enum: ['IN', 'OUT'] })
  @IsOptional()
  @IsString()
  direction?: 'IN' | 'OUT';

  @ApiPropertyOptional({ enum: ['POSTED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: 'POSTED' | 'CANCELLED';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  expenseCategoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  saleId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @ApiPropertyOptional({ example: '10.00' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  amountMin?: string;

  @ApiPropertyOptional({ example: '500.00' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  amountMax?: string;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Inclusive from date (YYYY-MM-DD, Asia/Baku).',
  })
  @IsOptional()
  @Transform(transformFilterDateStart)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Inclusive to date (YYYY-MM-DD, Asia/Baku end of day).',
  })
  @IsOptional()
  @Transform(transformToUtcDateEnd)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  transactionNumber?: string;

  @ApiPropertyOptional({ enum: CashTransactionSortByField })
  @IsOptional()
  @IsEnum(CashTransactionSortByField)
  sortBy?: CashTransactionSortByField =
    CashTransactionSortByField.transactionDate;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class CashTransactionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  transactionNumber!: string;

  @ApiProperty()
  cashAccountId!: string;

  @ApiPropertyOptional()
  cashAccountName!: string | null;

  @ApiProperty()
  direction!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  balanceBefore!: string;

  @ApiProperty()
  balanceAfter!: string;

  @ApiProperty()
  transactionDate!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  negativeBalanceOverrideReason!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  cancelReason!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  expenseCategoryId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  expenseCategoryName!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  partnerId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  partnerName!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  saleId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  purchaseId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  cashTransferId!: string | null;

  @ApiProperty()
  createdByUserId!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  createdByName!: string | null;

  @ApiProperty()
  createdAt!: string;
}
