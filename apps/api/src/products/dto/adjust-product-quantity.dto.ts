import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsSignedNonZeroNumericDecimal18_4 } from './quantity-decimal.validator';

export class AdjustProductQuantityDto {
  @ApiProperty({
    example: '-5.0000',
    description:
      'Signed non-zero ADR-023 decimal string. Positive increases quantity; negative decreases.',
  })
  @IsString()
  @IsSignedNonZeroNumericDecimal18_4()
  quantityChange!: string;

  @ApiProperty({
    example: 'Fiziki sayım fərqi',
    description: 'Mandatory reason for manual quantity adjustment (ADR-029).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason!: string;
}

export class ProductQuantityHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({
    example: 'MANUAL_ADJUSTMENT',
  })
  kind!: string;

  @ApiProperty({ example: '-5.0000' })
  quantityChange!: string;

  @ApiProperty({ example: '100.0000' })
  quantityBefore!: string;

  @ApiProperty({ example: '95.0000' })
  quantityAfter!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  saleId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  purchaseId!: string | null;

  @ApiProperty({ format: 'uuid' })
  createdByUserId!: string;

  @ApiProperty()
  createdAt!: Date;
}
