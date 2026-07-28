import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IsNumericDecimal18_4 } from './decimal-string.validator';
import { ProductTypeApi } from './product-type.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'Parça məhsul' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @ApiProperty({
    enum: ProductTypeApi,
    example: ProductTypeApi.FINISHED_GOOD,
  })
  @IsEnum(ProductTypeApi)
  type: ProductTypeApi;

  @ApiPropertyOptional({
    example: 'Tekstil',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    }
    return value;
  })
  category?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId: string;

  @ApiPropertyOptional({
    example: '12.5000',
    description:
      'Non-negative decimal string, max 4 fractional digits (NUMERIC 18,4).',
  })
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  standardSalePrice?: string;

  @ApiPropertyOptional({
    example: '10.0000',
    description:
      'Non-negative decimal string, max 4 fractional digits (NUMERIC 18,4).',
  })
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  latestPurchasePrice?: string;

  @ApiPropertyOptional({
    example: '5.0000',
    description:
      'Non-negative decimal string, max 4 fractional digits (NUMERIC 18,4).',
  })
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  criticalStockThreshold?: string;
}
