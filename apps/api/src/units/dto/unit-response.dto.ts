import { ApiProperty } from '@nestjs/swagger';

export class UnitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'KG' })
  code: string;

  @ApiProperty({ example: 'Kiloqram' })
  name: string;

  @ApiProperty({ example: true })
  allowsFractionalQuantity: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  updatedAt: Date;
}
