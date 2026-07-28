import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function trimOrNull(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  return value;
}

export class CreateBusinessPartnerDto {
  @ApiProperty({
    example: 'bp-001',
    description: 'Stored uppercase after normalization.',
  })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  code!: string;

  @ApiProperty({ example: 'Nümunə MMC' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @ApiProperty({
    example: true,
    description:
      'Customer role. At least one of isCustomer or isSupplier must be true.',
  })
  @IsBoolean()
  isCustomer!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Supplier role. At least one of isCustomer or isSupplier must be true.',
  })
  @IsBoolean()
  isSupplier!: boolean;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  defaultCurrencyId!: string;

  @ApiPropertyOptional({ example: '+994 50 123 45 67', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'info@example.com',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  email?: string | null;

  @ApiPropertyOptional({ example: '1234567891', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  taxNumber?: string | null;

  @ApiPropertyOptional({ example: 'Bakı, Azərbaycan', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  address?: string | null;

  @ApiPropertyOptional({ example: 'Əsas təchizatçı', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  notes?: string | null;
}
