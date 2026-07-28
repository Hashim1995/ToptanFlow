import { registerDecorator, ValidationOptions } from 'class-validator';

/** Matches ADR-023 NUMERIC(18, 4): non-negative, max 4 fractional digits. */
export function isNumericDecimal18_4(value: string): boolean {
  if (/[eE+-]/.test(value)) {
    return false;
  }
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return false;
  }
  const [integerPart, fractionalPart = ''] = value.split('.');
  if (integerPart.length > 14) {
    return false;
  }
  if (fractionalPart.length > 4) {
    return false;
  }
  if (integerPart.length + fractionalPart.length > 18) {
    return false;
  }
  return true;
}

export function IsNumericDecimal18_4(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isNumericDecimal18_4',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === undefined || value === null) {
            return true;
          }
          if (typeof value !== 'string') {
            return false;
          }
          return isNumericDecimal18_4(value);
        },
      },
    });
  };
}
