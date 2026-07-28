import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
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
  name!: string;

  @ApiProperty({
    enum: ProductTypeApi,
    example: ProductTypeApi.FINISHED_GOOD,
  })
  @IsEnum(ProductTypeApi)
  type!: ProductTypeApi;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    type: String,
    description: 'Optional active ProductCategory id (CHANGE-001).',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId!: string;

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
