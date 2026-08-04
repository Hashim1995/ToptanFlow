import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsMoneyDecimal18_2 } from './money-decimal.validator';

export class UpdateCashAccountDto {
  @ApiPropertyOptional({ example: 'Ofis kassası' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Super Admin-only responsible-user reassignment.',
  })
  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @ApiPropertyOptional({
    example: '1000.00',
    description:
      'Super Admin-only opening balance correction (AZN, non-negative). Cancels the active OPENING_BALANCE via reversal when present, then posts a new OPENING_BALANCE when > 0 (CHANGE-028 / ADR-033). Empty, NaN, and negative values are rejected.',
  })
  @IsOptional()
  @IsString()
  @IsMoneyDecimal18_2()
  openingBalance?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string | null;
}
