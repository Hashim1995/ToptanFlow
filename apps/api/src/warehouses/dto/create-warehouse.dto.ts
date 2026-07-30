import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { WarehouseKindApi } from './warehouse-kind.enum';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Əsas anbar' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @ApiProperty({ enum: WarehouseKindApi, example: WarehouseKindApi.GENERAL })
  @IsEnum(WarehouseKindApi)
  kind!: WarehouseKindApi;
}
