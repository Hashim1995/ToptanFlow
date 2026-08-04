import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import {
  transformFilterDateStart,
  transformToUtcDateEnd,
} from '../../common/datetime/index.js';

/** Date-range query for cash statement / period summary (US-049). */
export class CashReportDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Inclusive start (YYYY-MM-DD, Asia/Baku day start)',
    example: '2026-08-01',
  })
  @IsOptional()
  @Transform(transformFilterDateStart)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Inclusive end (YYYY-MM-DD, Asia/Baku day end)',
    example: '2026-08-31',
  })
  @IsOptional()
  @Transform(transformToUtcDateEnd)
  @IsDate()
  dateTo?: Date;
}

export class CashPeriodSummaryQueryDto extends CashReportDateRangeQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional single Cash Account filter',
  })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;
}

export class CashStatementLineDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  transactionNumber!: string;

  @ApiProperty()
  transactionDate!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ enum: ['IN', 'OUT'] })
  direction!: string;

  @ApiProperty({ enum: ['POSTED', 'CANCELLED'] })
  status!: string;

  @ApiProperty({ description: 'Absolute amount (AZN)' })
  amount!: string;

  @ApiProperty({
    description:
      'Signed balance effect for this row (IN positive, OUT negative). Cancelled originals still show their original effect; Reversal offsets them.',
  })
  signedEffect!: string;

  @ApiProperty({
    description: 'Running balance after this row (all applied movements)',
  })
  runningBalance!: string;

  @ApiPropertyOptional({ nullable: true })
  partnerName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expenseCategoryName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancelReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  saleId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  purchaseId!: string | null;
}

export class CashAccountStatementResponseDto {
  @ApiProperty()
  cashAccountId!: string;

  @ApiProperty()
  cashAccountName!: string;

  @ApiProperty()
  cashAccountCode!: string;

  @ApiProperty({ nullable: true })
  dateFrom!: string | null;

  @ApiProperty({ nullable: true })
  dateTo!: string | null;

  @ApiProperty({ description: 'Balance before the first movement in range' })
  openingBalance!: string;

  @ApiProperty({
    description: 'Balance after the last Posted movement in range',
  })
  closingBalance!: string;

  @ApiProperty({
    description: 'Live account balance (may differ if range ends before now)',
  })
  currentBalance!: string;

  @ApiProperty({ type: [CashStatementLineDto] })
  lines!: CashStatementLineDto[];
}

export class ExpenseCategoryTotalDto {
  @ApiProperty({ nullable: true })
  expenseCategoryId!: string | null;

  @ApiProperty()
  expenseCategoryName!: string;

  @ApiProperty()
  total!: string;
}

export class CashPeriodSummaryResponseDto {
  @ApiProperty({ nullable: true })
  dateFrom!: string | null;

  @ApiProperty({ nullable: true })
  dateTo!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cashAccountId!: string | null;

  @ApiProperty({ description: 'Sum of active account balances (ADR-032)' })
  totalCompanyCash!: string;

  @ApiProperty()
  activeAccountCount!: number;

  @ApiProperty({ description: 'Accounts with currentBalance < 0' })
  negativeAccountCount!: number;

  @ApiProperty({
    description:
      'Posted Cash In turnover (CUSTOMER_RECEIPT + OTHER_INCOME + OWNER_DEPOSIT); excludes Reversal/Transfer',
  })
  cashInTotal!: string;

  @ApiProperty({
    description:
      'Posted Cash Out turnover (SUPPLIER_PAYMENT + OWNER_WITHDRAWAL); excludes Reversal/Transfer/Expense',
  })
  cashOutTotal!: string;

  @ApiProperty({ description: 'Posted Expense total; excludes Reversal' })
  expenseTotal!: string;

  @ApiProperty({ type: [ExpenseCategoryTotalDto] })
  expensesByCategory!: ExpenseCategoryTotalDto[];

  @ApiProperty({
    description: 'Posted partner Cash In (CUSTOMER_RECEIPT only)',
  })
  partnerCashInTotal!: string;

  @ApiProperty({
    description: 'Posted partner Cash Out (SUPPLIER_PAYMENT only)',
  })
  partnerCashOutTotal!: string;

  @ApiProperty({
    description:
      'Transfer volume (TRANSFER_OUT amounts only — not income/expense)',
  })
  transferTotal!: string;

  @ApiProperty({ description: 'Count of CANCELLED originals in the period' })
  cancelledCount!: number;

  @ApiProperty({ description: 'Count of REVERSAL rows in the period' })
  reversalCount!: number;
}
