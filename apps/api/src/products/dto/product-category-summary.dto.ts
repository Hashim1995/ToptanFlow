import { ApiProperty } from '@nestjs/swagger';

export class ProductCategorySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Tekstil' })
  name!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
