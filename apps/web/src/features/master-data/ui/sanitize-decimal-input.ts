/**
 * Keeps ADR-023 decimal strings string-safe while blocking non-numeric typing.
 * Allows digits and at most one `.`, with max 4 fractional digits.
 */
export function sanitizeDecimalInput(raw: string): string {
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
  return `${integerPart}.${fractionalPart.slice(0, 4)}`;
}
