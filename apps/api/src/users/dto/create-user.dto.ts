import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Əli Məmmədov' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  fullName: string;

  @ApiProperty({ example: 'ali' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  username: string;

  @ApiProperty({
    example: 'ChangeMe123!',
    minLength: 8,
    description: 'Plain password; stored as Argon2id hash (ADR-025).',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;
}
