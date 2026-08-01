import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsNumericDecimal18_4 } from '../../products/dto/decimal-string.validator';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partnerId!: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  businessDate!: string;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;

  @ApiPropertyOptional({ example: '1.0000' })
  @IsOptional()
  @IsString()
  @IsNumericDecimal18_4()
  discountAmount?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];
}
