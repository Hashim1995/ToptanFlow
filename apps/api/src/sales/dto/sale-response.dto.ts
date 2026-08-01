import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusApi } from './document-status.enum';
import { SaleItemResponseDto } from './sale-item-response.dto';
import {
  SalePartnerSummaryDto,
  SaleUserSummaryDto,
} from './sale-list-item-response.dto';

export class SaleQuantityHistoryResponseDto {
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

export class SaleDebtMovementResponseDto {
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

export class SaleLinkedCashTransactionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  transactionNumber!: string;
  @ApiProperty()
  cashAccountId!: string;
  @ApiProperty()
  cashAccountName!: string;
  @ApiProperty()
  cashAccountCode!: string;
  @ApiProperty()
  direction!: string;
  @ApiProperty()
  type!: string;
  @ApiProperty()
  status!: string;
  @ApiProperty()
  amount!: string;
  @ApiProperty()
  transactionDate!: Date;
}

export class SaleResponseDto {
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
  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  negativeQuantityOverrideReason!: string | null;
  @ApiProperty({ type: SalePartnerSummaryDto })
  partner!: SalePartnerSummaryDto;
  @ApiProperty({ type: SaleUserSummaryDto })
  createdBy!: SaleUserSummaryDto;
  @ApiPropertyOptional({ type: SaleUserSummaryDto, nullable: true })
  postedBy!: SaleUserSummaryDto | null;
  @ApiPropertyOptional({ type: SaleUserSummaryDto, nullable: true })
  cancelledBy!: SaleUserSummaryDto | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  cancelReason!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  postedAt!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  cancelledAt!: Date | null;
  @ApiProperty({ type: [SaleItemResponseDto] })
  items!: SaleItemResponseDto[];
  @ApiProperty({ type: [SaleQuantityHistoryResponseDto] })
  productQuantityHistory!: SaleQuantityHistoryResponseDto[];
  @ApiProperty({ type: [SaleDebtMovementResponseDto] })
  partnerDebtMovements!: SaleDebtMovementResponseDto[];
  @ApiProperty({ type: [SaleLinkedCashTransactionDto] })
  cashTransactions!: SaleLinkedCashTransactionDto[];
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
}
