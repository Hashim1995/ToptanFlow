import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsNumericDecimal18_4 } from './decimal-string.validator';
import { ProductTypeApi } from './product-type.enum';

/**
 * Product.code is backend-generated and immutable (ADR-024).
 * A PATCH body containing `code` is rejected by the global ValidationPipe
 * (forbidNonWhitelisted), not silently ignored.
 */
export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Parça məhsul',
    description: 'Cannot be null.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({
    enum: ProductTypeApi,
    description: 'Cannot be null.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ProductTypeApi)
  type?: ProductTypeApi;

  @ApiPropertyOptional({
    example: 'Tekstil',
    nullable: true,
    type: String,
    description: 'Send null to clear. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
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

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cannot be null. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({
    example: '12.5000',
    nullable: true,
    type: String,
    description:
      'Non-negative decimal string, max 4 fractional digits. Send null to clear.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @IsNumericDecimal18_4()
  standardSalePrice?: string | null;

  @ApiPropertyOptional({
    example: '10.0000',
    nullable: true,
    type: String,
    description:
      'Non-negative decimal string, max 4 fractional digits. Send null to clear.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @IsNumericDecimal18_4()
  latestPurchasePrice?: string | null;

  @ApiPropertyOptional({
    example: '5.0000',
    nullable: true,
    type: String,
    description:
      'Non-negative decimal string, max 4 fractional digits. Send null to clear.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @IsNumericDecimal18_4()
  criticalStockThreshold?: string | null;
}
