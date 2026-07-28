import { ApiProperty } from '@nestjs/swagger';

export class CurrencyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'USD' })
  code: string;

  @ApiProperty({ example: 'ABŞ dolları' })
  name: string;

  @ApiProperty({
    example: '$',
    nullable: true,
    type: String,
    description: 'Display symbol; null when unset.',
  })
  symbol: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  updatedAt: Date;
}
