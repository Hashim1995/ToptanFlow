import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivateCashAccountDto {
  @ApiPropertyOptional({ example: 'İstifadə olunmur' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason?: string;
}

export class CashAccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ example: '1500.00' })
  currentBalance!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  responsibleUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  responsibleUserName!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ nullable: true, type: String })
  deactivatedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  deactivationReason!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  createdByUserId!: string;
}

export class TotalCompanyCashResponseDto {
  @ApiProperty({
    example: '6500.00',
    description:
      'Sum of currentBalance for all active Cash Accounts (ADR-032).',
  })
  totalCompanyCash!: string;

  @ApiProperty({ example: 3 })
  activeAccountCount!: number;
}

export class CashAccountRecentActivityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  transactionNumber!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  direction!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  transactionDate!: string;
}

export class CashAccountWorkspaceCardDto extends CashAccountResponseDto {
  @ApiProperty({ example: '120.00' })
  todayCashIn!: string;

  @ApiProperty({ example: '40.00' })
  todayCashOut!: string;

  @ApiProperty({ example: '15.00' })
  todayExpenses!: string;

  @ApiProperty({ type: [CashAccountRecentActivityDto] })
  recentActivity!: CashAccountRecentActivityDto[];
}

export class CashWorkspaceOverviewResponseDto {
  @ApiProperty({ example: '6500.00' })
  totalCompanyCash!: string;

  @ApiProperty({ example: 3 })
  activeAccountCount!: number;

  @ApiProperty({ type: [CashAccountWorkspaceCardDto] })
  accounts!: CashAccountWorkspaceCardDto[];
}
