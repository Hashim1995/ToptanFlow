import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { transformCashTransactionDate } from '../../common/datetime/index.js';
import { IsPositiveMoneyDecimal18_2 } from './money-decimal.validator';

/**
 * Primary Cash In (ADR-038): money from a Business Partner.
 * Persists as CUSTOMER_RECEIPT for debt wiring; UI label is Cash In.
 */
export class CreateCashInDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cashAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerId!: string;

  @ApiProperty({ example: '100.00' })
  @IsString()
  @IsPositiveMoneyDecimal18_2()
  amount!: string;

  @ApiProperty({
    example: '2026-08-01',
    description:
      'Calendar date (YYYY-MM-DD). Stored with the current Asia/Baku clock time so lists show real HH:mm.',
  })
  @Transform(transformCashTransactionDate)
  @IsDate()
  transactionDate!: Date;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional Sale link (traceability only; ADR-028).',
  })
  @IsOptional()
  @IsUUID()
  saleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}

/**
 * Primary Cash Out (ADR-038): money paid to a Business Partner.
 * Persists as SUPPLIER_PAYMENT for debt wiring; UI label is Cash Out.
 */
export class CreateCashOutDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cashAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerId!: string;

  @ApiProperty({ example: '80.00' })
  @IsString()
  @IsPositiveMoneyDecimal18_2()
  amount!: string;

  @ApiProperty({
    example: '2026-08-01',
    description:
      'Calendar date (YYYY-MM-DD). Stored with the current Asia/Baku clock time so lists show real HH:mm.',
  })
  @Transform(transformCashTransactionDate)
  @IsDate()
  transactionDate!: Date;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional Purchase link (traceability only; ADR-028).',
  })
  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;

  @ApiPropertyOptional({
    description: 'Required when cash balance would become negative (ADR-037).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  negativeBalanceOverrideReason?: string;
}

/** @deprecated Prefer CreateCashInDto — kept as alias for OpenAPI / older clients. */
export class CreateCustomerReceiptDto extends CreateCashInDto {}

/** @deprecated Prefer CreateCashOutDto — kept as alias for OpenAPI / older clients. */
export class CreateSupplierPaymentDto extends CreateCashOutDto {}

export class CreateExpenseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cashAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  expenseCategoryId!: string;

  @ApiProperty({ example: '25.00' })
  @IsString()
  @IsPositiveMoneyDecimal18_2()
  amount!: string;

  @ApiProperty({
    example: '2026-08-01',
    description:
      'Calendar date (YYYY-MM-DD). Stored with the current Asia/Baku clock time so lists show real HH:mm.',
  })
  @Transform(transformCashTransactionDate)
  @IsDate()
  transactionDate!: Date;

  @ApiProperty({
    description: 'Required expense description (ADR-038).',
    example: 'Ofis icarə haqqı',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes!: string;

  @ApiPropertyOptional({
    description: 'Required when balance would become negative (ADR-037).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  negativeBalanceOverrideReason?: string;
}

export class CreateCashTransferDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceCashAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  destinationCashAccountId!: string;

  @ApiProperty({ example: '100.00' })
  @IsString()
  @IsPositiveMoneyDecimal18_2()
  amount!: string;

  @ApiProperty({
    example: '2026-08-01',
    description:
      'Calendar date (YYYY-MM-DD). Stored with the current Asia/Baku clock time so lists show real HH:mm.',
  })
  @Transform(transformCashTransactionDate)
  @IsDate()
  transactionDate!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Required when source balance would become negative (ADR-037).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  negativeBalanceOverrideReason?: string;
}

export class CancelCashTransactionDto {
  @ApiProperty({ example: 'Səhv məbləğ daxil edilib' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason!: string;
}

export class CancelCashTransferDto {
  @ApiProperty({ example: 'Səhv hesab seçilib' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason!: string;
}
