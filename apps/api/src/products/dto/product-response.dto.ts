import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeApi } from './product-type.enum';
import { ProductUnitResponseDto } from './product-unit-response.dto';

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'TX-001' })
  code: string;

  @ApiProperty({ example: 'Parça məhsul' })
  name: string;

  @ApiProperty({ enum: ProductTypeApi, example: ProductTypeApi.FINISHED_GOOD })
  type: ProductTypeApi;

  @ApiPropertyOptional({
    example: 'Tekstil',
    nullable: true,
    type: String,
  })
  category: string | null;

  @ApiProperty({ format: 'uuid' })
  unitId: string;

  @ApiProperty({ type: ProductUnitResponseDto })
  unit: ProductUnitResponseDto;

  @ApiPropertyOptional({
    example: '12.5000',
    nullable: true,
    type: String,
    description:
      'Informational default sale price (NUMERIC 18,4) as decimal string.',
  })
  standardSalePrice: string | null;

  @ApiPropertyOptional({
    example: '10.0000',
    nullable: true,
    type: String,
    description:
      'Informational default purchase price (NUMERIC 18,4) as decimal string.',
  })
  latestPurchasePrice: string | null;

  @ApiPropertyOptional({
    example: '5.0000',
    nullable: true,
    type: String,
    description: 'Company-total critical stock threshold as decimal string.',
  })
  criticalStockThreshold: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  updatedAt: Date;
}
