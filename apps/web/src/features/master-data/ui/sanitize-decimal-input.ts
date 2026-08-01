/**
 * Keeps ADR-023 decimal strings string-safe while blocking non-numeric typing.
 * Allows digits and at most one `.`, with a configurable fractional limit
 * (default 4 for quantity; money screens pass 2).
 */
export function sanitizeDecimalInput(
  raw: string,
  maxFractionDigits = 4,
): string {
  const withoutInvalid = raw.replace(/[^\d.]/g, '');
  const firstDot = withoutInvalid.indexOf('.');
  const cleaned =
    firstDot === -1
      ? withoutInvalid
      : `${withoutInvalid.slice(0, firstDot + 1)}${withoutInvalid
          .slice(firstDot + 1)
          .replace(/\./g, '')}`;

  const [integerPart = '', fractionalPart] = cleaned.split('.');
  if (fractionalPart === undefined) {
    return integerPart;
  }
  const limit = Math.max(0, maxFractionDigits);
  return `${integerPart}.${fractionalPart.slice(0, limit)}`;
}
