import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WarehouseKindApi } from './warehouse-kind.enum';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ example: 'Əsas anbar' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({ enum: WarehouseKindApi })
  @IsOptional()
  @IsEnum(WarehouseKindApi)
  kind?: WarehouseKindApi;

  @ApiPropertyOptional({
    description: 'Set true to reactivate a soft-deactivated warehouse.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
