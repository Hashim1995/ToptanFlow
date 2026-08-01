import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
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
 * BusinessPartner.code is backend-generated and immutable (ADR-024).
 * A PATCH body containing `code` is rejected by the global ValidationPipe
 * (forbidNonWhitelisted), not silently ignored.
 *
 * isActive may be set via PATCH to reactivate (or deactivate). DELETE remains
 * the dedicated soft-deactivate shortcut (owner decision 2026-07-29).
 */
export class UpdateBusinessPartnerDto {
  @ApiPropertyOptional({
    example: 'Nümunə MMC',
    description: 'Cannot be null.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Customer role. After update, at least one of isCustomer or isSupplier must remain true.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isCustomer?: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'Supplier role. After update, at least one of isCustomer or isSupplier must remain true.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isSupplier?: boolean;

  @ApiPropertyOptional({
    example: '+994 50 123 45 67',
    nullable: true,
    type: String,
    description: 'Send null to clear. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'info@example.com',
    nullable: true,
    type: String,
    description: 'Send null to clear. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  email?: string | null;

  @ApiPropertyOptional({
    example: '1234567891',
    nullable: true,
    type: String,
    description: 'Send null to clear. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  taxNumber?: string | null;

  @ApiPropertyOptional({
    example: 'Bakı, Azərbaycan',
    nullable: true,
    type: String,
    description: 'Send null to clear. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  address?: string | null;

  @ApiPropertyOptional({
    example: 'Əsas təchizatçı',
    nullable: true,
    type: String,
    description: 'Send null to clear. Omit to leave unchanged.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(4000)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  notes?: string | null;

  @ApiPropertyOptional({
    example: true,
    description:
      'Set true to reactivate an inactive partner. Set false to deactivate (DELETE also deactivates).',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'US-016 soft duplicate acknowledge. When name/phone/taxNumber change and ' +
      'possible duplicates match, update returns 409 unless this is true.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  acknowledgeDuplicate?: boolean;
}
