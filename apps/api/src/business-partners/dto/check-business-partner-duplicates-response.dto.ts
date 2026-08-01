import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type BusinessPartnerDuplicateMatchedField =
  'name' | 'phone' | 'taxNumber';

export class BusinessPartnerDuplicateCandidateDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '0000001' })
  code!: string;

  @ApiProperty({ example: 'Nümunə MMC' })
  name!: string;

  @ApiPropertyOptional({
    example: '+994 50 123 45 67',
    nullable: true,
    type: String,
  })
  phone!: string | null;

  @ApiPropertyOptional({
    example: '1234567891',
    nullable: true,
    type: String,
  })
  taxNumber!: string | null;

  @ApiProperty({ example: true })
  isCustomer!: boolean;

  @ApiProperty({ example: false })
  isSupplier!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    isArray: true,
    enum: ['name', 'phone', 'taxNumber'],
    example: ['name', 'phone'],
  })
  matchedFields!: BusinessPartnerDuplicateMatchedField[];
}

export class CheckBusinessPartnerDuplicatesResponseDto {
  @ApiProperty({ type: [BusinessPartnerDuplicateCandidateDto] })
  candidates!: BusinessPartnerDuplicateCandidateDto[];
}
