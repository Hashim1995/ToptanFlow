import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusApi } from './document-status.enum';

export class PurchasePartnerSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  code!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  currentDebtBalance!: string;
  @ApiProperty()
  isSupplier!: boolean;
  @ApiProperty()
  isActive!: boolean;
}

export class PurchaseUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  fullName!: string;
  @ApiProperty()
  username!: string;
}

export class PurchaseListItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  documentNumber!: string;
  @ApiProperty()
  businessDate!: Date;
  @ApiProperty({ enum: DocumentStatusApi })
  status!: DocumentStatusApi;
  @ApiPropertyOptional({ nullable: true, type: String })
  supplierInvoiceNumber!: string | null;
  @ApiProperty()
  subtotalAmount!: string;
  @ApiProperty()
  discountAmount!: string;
  @ApiProperty()
  totalAmount!: string;
  @ApiProperty({ type: PurchasePartnerSummaryDto })
  partner!: PurchasePartnerSummaryDto;
  @ApiProperty({ type: PurchaseUserSummaryDto })
  createdBy!: PurchaseUserSummaryDto;
  @ApiProperty()
  itemCount!: number;

  @ApiProperty({
    description:
      'True when at least one POSTED Cash Transaction is linked (traceability only; not payment completeness).',
  })
  hasLinkedCashOperation!: boolean;

  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
}
