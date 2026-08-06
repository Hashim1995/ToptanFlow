import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum DailyBalanceExportFormat {
  EXCEL = 'EXCEL',
}

export class DailyBalanceExportQueryDto {
  @ApiProperty({ enum: DailyBalanceExportFormat })
  @IsEnum(DailyBalanceExportFormat)
  format!: DailyBalanceExportFormat;
}

export class DailyBalancePartnerRowDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '0000042' })
  code!: string;

  @ApiProperty({ example: 'Şərq Tekstil' })
  name!: string;

  @ApiProperty()
  isCustomer!: boolean;

  @ApiProperty()
  isSupplier!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({
    description:
      'Signed debt balance AZN (ADR-030). Positive = partner owes us; negative = we owe partner.',
    example: '1250.5000',
  })
  currentDebtBalance!: string;

  @ApiProperty({
    example: 'Tərəfdaş bizə borcludur',
    description: 'Azerbaijani meaning of the signed debt balance.',
  })
  debtBalanceLabel!: string;
}

export class DailyBalanceCashAccountRowDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CASH-0001' })
  code!: string;

  @ApiProperty({ example: 'Əsas kassa' })
  name!: string;

  @ApiProperty({ example: 'Əli Məmmədov' })
  responsibleUserName!: string;

  @ApiProperty({ example: '1500.00' })
  currentBalance!: string;
}

export class DailyBalanceReportResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  generatedAt!: Date;

  @ApiProperty({ type: [DailyBalancePartnerRowDto] })
  partners!: DailyBalancePartnerRowDto[];

  @ApiProperty({ example: 12 })
  partnerCount!: number;

  @ApiProperty({
    description: 'Sum of all partner signed debt balances (ADR-030).',
    example: '3200.5000',
  })
  totalPartnerDebtBalance!: string;

  @ApiProperty({
    description:
      'Derived total of positive signed balances (partners owe us / Alacağımız). ADR-030.',
    example: '4500.0000',
  })
  totalPartnerReceivable!: string;

  @ApiProperty({
    description:
      'Derived total of absolute negative signed balances (we owe partners / Borclarımız). ADR-030.',
    example: '1299.5000',
  })
  totalPartnerPayable!: string;

  @ApiProperty({ type: [DailyBalanceCashAccountRowDto] })
  cashAccounts!: DailyBalanceCashAccountRowDto[];

  @ApiProperty({ example: 3 })
  activeCashAccountCount!: number;

  @ApiProperty({
    description: 'Sum of active cash account balances (ADR-032).',
    example: '4500.00',
  })
  totalCompanyCash!: string;
}
