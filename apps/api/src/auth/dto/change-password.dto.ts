import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function Match(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName: String(propertyName),
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'ChangeMe123!', minLength: 1 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  currentPassword!: string;

  @ApiProperty({
    example: 'NewPass123!',
    minLength: 8,
    description: 'New password; stored as Argon2id hash (ADR-025).',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  newPassword!: string;

  @ApiProperty({ example: 'NewPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Match('newPassword', {
    message: 'newPasswordConfirmation must match newPassword',
  })
  newPasswordConfirmation!: string;
}
