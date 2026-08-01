import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCashAccountDto {
  @ApiPropertyOptional({ example: 'Ofis kassası' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsUUID()
  responsibleUserId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string | null;
}
