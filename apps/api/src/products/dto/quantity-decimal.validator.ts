import { registerDecorator, ValidationOptions } from 'class-validator';

/** Signed ADR-023 NUMERIC(18, 4) string; may be negative; must be non-zero. */
export function isSignedNonZeroNumericDecimal18_4(value: string): boolean {
  if (/[eE]/.test(value)) {
    return false;
  }
  if (!/^-?\d+(\.\d+)?$/.test(value)) {
    return false;
  }
  const unsigned = value.startsWith('-') ? value.slice(1) : value;
  const [integerPart, fractionalPart = ''] = unsigned.split('.');
  if (integerPart.length > 14) {
    return false;
  }
  if (fractionalPart.length > 4) {
    return false;
  }
  if (integerPart.length + fractionalPart.length > 18) {
    return false;
  }
  const asNumber = Number(value);
  return Number.isFinite(asNumber) && asNumber !== 0;
}

export function IsSignedNonZeroNumericDecimal18_4(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isSignedNonZeroNumericDecimal18_4',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }
          return isSignedNonZeroNumericDecimal18_4(value);
        },
      },
    });
  };
}
