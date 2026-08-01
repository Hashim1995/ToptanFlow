import { registerDecorator, ValidationOptions } from 'class-validator';

/** Non-negative money string, max 2 fractional digits (ADR-023). */
export function isMoneyDecimal18_2(value: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return false;
  }
  const [whole] = value.split('.');
  return whole.length <= 16;
}

export function IsMoneyDecimal18_2(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isMoneyDecimal18_2',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isMoneyDecimal18_2(value);
        },
      },
    });
  };
}

export function IsPositiveMoneyDecimal18_2(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isPositiveMoneyDecimal18_2',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' &&
            isMoneyDecimal18_2(value) &&
            Number(value) > 0
          );
        },
      },
    });
  };
}
