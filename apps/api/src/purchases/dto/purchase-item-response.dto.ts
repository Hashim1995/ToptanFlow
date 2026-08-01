import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseItemResponseDto {
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
  @ApiPropertyOptional({ nullable: true, type: String })
  invoicedQuantity!: string | null;
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
}
