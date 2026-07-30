import { ApiProperty } from '@nestjs/swagger';
import { WarehouseKindApi } from './warehouse-kind.enum';

export class WarehouseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '0000001' })
  code!: string;

  @ApiProperty({ example: 'Əsas anbar' })
  name!: string;

  @ApiProperty({ enum: WarehouseKindApi, example: WarehouseKindApi.GENERAL })
  kind!: WarehouseKindApi;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt!: Date;
}
