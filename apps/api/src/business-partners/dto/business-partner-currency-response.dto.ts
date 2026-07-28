import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BusinessPartnerCurrencyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'USD' })
  code!: string;

  @ApiProperty({ example: 'ABŞ dolları' })
  name!: string;

  @ApiPropertyOptional({
    example: '$',
    nullable: true,
    type: String,
  })
  symbol!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
