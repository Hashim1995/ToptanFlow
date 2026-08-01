import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty({ format: 'uuid' })
  productId!: string;
  @ApiProperty({ format: 'uuid' })
  unitId!: string;
  @ApiProperty()
  productCodeSnapshot!: string;
  @ApiProperty()
  productNameSnapshot!: string;
  @ApiProperty()
  unitNameSnapshot!: string;
  @ApiProperty()
  quantity!: string;
  @ApiProperty()
  unitPrice!: string;
  @ApiProperty()
  discountAmount!: string;
  @ApiProperty()
  lineSubtotal!: string;
  @ApiProperty()
  lineTotal!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  costAtPosting!: string | null;
}
