import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusApi } from './document-status.enum';
import { PurchaseItemResponseDto } from './purchase-item-response.dto';
import {
  PurchasePartnerSummaryDto,
  PurchaseUserSummaryDto,
} from './purchase-list-item-response.dto';

export class PurchaseQuantityHistoryResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  productId!: string;
  @ApiProperty()
  kind!: string;
  @ApiProperty()
  quantityChange!: string;
  @ApiProperty()
  quantityBefore!: string;
  @ApiProperty()
  quantityAfter!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  reason!: string | null;
  @ApiProperty()
  createdAt!: Date;
}

export class PurchaseDebtMovementResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  kind!: string;
  @ApiProperty()
  signedAmount!: string;
  @ApiProperty()
  balanceBefore!: string;
  @ApiProperty()
  balanceAfter!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  reason!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  reversalOfId!: string | null;
  @ApiProperty()
  createdAt!: Date;
}

export class PurchaseResponseDto {
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
  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;
  @ApiProperty({ type: PurchasePartnerSummaryDto })
  partner!: PurchasePartnerSummaryDto;
  @ApiProperty({ type: PurchaseUserSummaryDto })
  createdBy!: PurchaseUserSummaryDto;
  @ApiPropertyOptional({ type: PurchaseUserSummaryDto, nullable: true })
  postedBy!: PurchaseUserSummaryDto | null;
  @ApiPropertyOptional({ type: PurchaseUserSummaryDto, nullable: true })
  cancelledBy!: PurchaseUserSummaryDto | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  cancelReason!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  postedAt!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  cancelledAt!: Date | null;
  @ApiProperty({ type: [PurchaseItemResponseDto] })
  items!: PurchaseItemResponseDto[];
  @ApiProperty({ type: [PurchaseQuantityHistoryResponseDto] })
  productQuantityHistory!: PurchaseQuantityHistoryResponseDto[];
  @ApiProperty({ type: [PurchaseDebtMovementResponseDto] })
  partnerDebtMovements!: PurchaseDebtMovementResponseDto[];
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
}
