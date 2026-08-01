import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BusinessPartnerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: '0000001',
    description:
      'Backend-generated immutable business code (ADR-024). Not accepted on create.',
  })
  code!: string;

  @ApiProperty({ example: 'Nümunə MMC' })
  name!: string;

  @ApiProperty({ example: true })
  isCustomer!: boolean;

  @ApiProperty({ example: false })
  isSupplier!: boolean;

  @ApiPropertyOptional({
    example: '+994 50 123 45 67',
    nullable: true,
    type: String,
  })
  phone!: string | null;

  @ApiPropertyOptional({
    example: 'info@example.com',
    nullable: true,
    type: String,
  })
  email!: string | null;

  @ApiPropertyOptional({
    example: '1234567891',
    nullable: true,
    type: String,
  })
  taxNumber!: string | null;

  @ApiPropertyOptional({
    example: 'Bakı, Azərbaycan',
    nullable: true,
    type: String,
  })
  address!: string | null;

  @ApiPropertyOptional({
    example: 'Əsas təchizatçı',
    nullable: true,
    type: String,
  })
  notes!: string | null;

  @ApiProperty({
    example: '0.0000',
    description:
      'Signed debt balance (ADR-030). Positive: partner owes us; negative: we owe partner; zero: no debt. Decimal string with 4 places.',
  })
  currentDebtBalance!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  updatedAt!: Date;
}
