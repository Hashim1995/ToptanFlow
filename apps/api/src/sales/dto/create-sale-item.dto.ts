import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsNumericDecimal18_4 } from '../../products/dto/decimal-string.validator';
import { IsPositiveDecimal18_4 } from './positive-decimal.validator';

export class CreateSaleItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '10.0000' })
  @IsString()
  @IsPositiveDecimal18_4()
  quantity!: string;

  @ApiProperty({ example: '4.5000' })
  @IsString()
  @IsNumericDecimal18_4()
  unitPrice!: string;

  @ApiPropertyOptional({ example: '0.5000' })
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  discountAmount?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}
