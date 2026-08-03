import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsPositiveMoneyDecimal18_2 } from '../../cash/dto/money-decimal.validator';

/** Optional separate Cash In/Out created atomically with document post (US-048 / ADR-028). */
export class ImmediatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cashAccountId!: string;

  @ApiProperty({
    example: '100.00',
    description:
      'Partial or over-document amounts allowed; updates partner signed debt by this amount once.',
  })
  @IsString()
  @IsPositiveMoneyDecimal18_2()
  amount!: string;

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
      'Required when supplier payment would make cash negative (ADR-037).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  negativeBalanceOverrideReason?: string;
}

export class PostSaleDto {
  @ApiPropertyOptional({
    maxLength: 2000,
    description:
      'Required when posting would drive any product quantity below zero (ADR-025 v1: all users may override).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  negativeQuantityReason?: string;

  @ApiPropertyOptional({ type: ImmediatePaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImmediatePaymentDto)
  immediatePayment?: ImmediatePaymentDto;
}
