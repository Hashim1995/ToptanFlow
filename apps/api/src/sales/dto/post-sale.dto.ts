import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PostSaleDto {
  @ApiPropertyOptional({
    maxLength: 2000,
    description:
      'Required when posting would drive any product quantity below zero (ADR-025 v1: all users may override).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  negativeQuantityReason?: string;
}
