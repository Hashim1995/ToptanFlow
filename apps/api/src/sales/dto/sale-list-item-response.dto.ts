import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatusApi } from './document-status.enum';

export class SalePartnerSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  code!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  currentDebtBalance!: string;
  @ApiProperty()
  isCustomer!: boolean;
  @ApiProperty()
  isActive!: boolean;
}

export class SaleUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  fullName!: string;
  @ApiProperty()
  username!: string;
}

export class SaleListItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  documentNumber!: string;
  @ApiProperty()
  businessDate!: Date;
  @ApiProperty({ enum: DocumentStatusApi })
  status!: DocumentStatusApi;
  @ApiProperty()
  subtotalAmount!: string;
  @ApiProperty()
  discountAmount!: string;
  @ApiProperty()
  totalAmount!: string;
  @ApiProperty({ type: SalePartnerSummaryDto })
  partner!: SalePartnerSummaryDto;
  @ApiProperty({ type: SaleUserSummaryDto })
  createdBy!: SaleUserSummaryDto;
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
