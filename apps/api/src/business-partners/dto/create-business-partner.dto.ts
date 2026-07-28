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

/**
 * BusinessPartner.code is backend-generated (ADR-024). Clients must not
 * supply `code`; forbidNonWhitelisted rejects it with 400.
 *
 * BusinessPartner.code is immutable after creation (ADR-024 / US-015).
 * Updates must use UpdateBusinessPartnerDto, which omits `code`.
 */
export class CreateBusinessPartnerDto {
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

  @ApiPropertyOptional({
    example: false,
    description:
      'US-016 soft duplicate acknowledge. When possible duplicates match on ' +
      'normalized name/phone/taxNumber, create returns 409 unless this is true. ' +
      'Does not affect uuid/code uniqueness (ADR-024).',
  })
  @IsOptional()
  @IsBoolean()
  acknowledgeDuplicate?: boolean;
}
