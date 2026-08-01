import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategorySummaryDto } from './product-category-summary.dto';
import { ProductTypeApi } from './product-type.enum';
import { ProductUnitResponseDto } from './product-unit-response.dto';

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: '0000001',
    description:
      'Backend-generated immutable business code (ADR-024). Not accepted on create/update.',
  })
  code!: string;

  @ApiProperty({ example: 'Parça məhsul' })
  name!: string;

  @ApiProperty({ enum: ProductTypeApi, example: ProductTypeApi.FINISHED_GOOD })
  type!: ProductTypeApi;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    type: String,
  })
  categoryId!: string | null;

  @ApiPropertyOptional({
    type: ProductCategorySummaryDto,
    nullable: true,
  })
  category!: ProductCategorySummaryDto | null;

  @ApiProperty({ format: 'uuid' })
  unitId!: string;

  @ApiProperty({ type: ProductUnitResponseDto })
  unit!: ProductUnitResponseDto;

  @ApiPropertyOptional({
    example: '12.5000',
    nullable: true,
    type: String,
    description:
      'Informational default sale price (NUMERIC 18,4) as decimal string.',
  })
  standardSalePrice!: string | null;

  @ApiPropertyOptional({
    example: '10.0000',
    nullable: true,
    type: String,
    description:
      'Informational default purchase price (NUMERIC 18,4) as decimal string.',
  })
  latestPurchasePrice!: string | null;

  @ApiPropertyOptional({
    example: '100.0000',
    type: String,
    description:
      'Company-wide current quantity (ADR-029). Read-only on create/update; changed only via quantity history posts.',
  })
  currentQuantity!: string;

  @ApiPropertyOptional({
    example: '5.0000',
    nullable: true,
    type: String,
    description: 'Minimum quantity alert threshold as decimal string.',
  })
  criticalStockThreshold!: string | null;

  @ApiPropertyOptional({
    example: '1234567890123',
    nullable: true,
    type: String,
  })
  barcode!: string | null;

  @ApiPropertyOptional({
    example: 'Qeyd',
    nullable: true,
    type: String,
  })
  notes!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  updatedAt!: Date;
}
