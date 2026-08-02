import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsMoneyDecimal18_2 } from './money-decimal.validator';

export class CreateCashAccountDto {
  @ApiProperty({ example: 'Ofis kassası' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Required responsible user. Super Admin selects the owner.',
  })
  @IsUUID()
  responsibleUserId!: string;

  @ApiPropertyOptional({ example: 'Əsas ofis kassası' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;

  @ApiPropertyOptional({
    example: '1000.00',
    description:
      'Optional opening balance (AZN). Creates OPENING_BALANCE movement when > 0.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @IsMoneyDecimal18_2()
  openingBalance?: string;
}
