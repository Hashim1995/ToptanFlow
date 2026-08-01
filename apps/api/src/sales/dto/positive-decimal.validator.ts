import { registerDecorator, ValidationOptions } from 'class-validator';
import { isNumericDecimal18_4 } from '../../products/dto/decimal-string.validator';

export function IsPositiveDecimal18_4(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isPositiveDecimal18_4',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' &&
            isNumericDecimal18_4(value) &&
            Number(value) > 0
          );
        },
      },
    });
  };
}
