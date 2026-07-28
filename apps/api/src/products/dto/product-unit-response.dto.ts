import { ApiProperty } from '@nestjs/swagger';

export class ProductUnitResponseDto {
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
}
