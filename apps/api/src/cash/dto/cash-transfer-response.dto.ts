import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CashTransferResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  transferNumber!: string;

  @ApiProperty()
  sourceCashAccountId!: string;

  @ApiProperty()
  sourceCashAccountName!: string;

  @ApiProperty()
  destinationCashAccountId!: string;

  @ApiProperty()
  destinationCashAccountName!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  transactionDate!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  negativeBalanceOverrideReason!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  cancelReason!: string | null;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  outTransactionId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  inTransactionId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  sourceBalanceBefore!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  sourceBalanceAfter!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  destinationBalanceBefore!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  destinationBalanceAfter!: string | null;
}
