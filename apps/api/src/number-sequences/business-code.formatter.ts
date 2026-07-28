/**
 * Formats an allocated sequence value as a decimal business-code string.
 * Uses string-based BigInt formatting only — never Number(bigint) / parseInt.
 *
 * Padding is a minimum width (default 7). Values whose decimal length already
 * meets or exceeds padding are returned without truncation.
 *
 * Source: ADR-024.
 */
export function formatBusinessCode(value: bigint, padding: number): string {
  if (padding < 0) {
    throw new Error('Business code padding must be non-negative');
  }

  const decimal = value.toString();

  if (decimal.startsWith('-')) {
    throw new Error('Business code value must be non-negative');
  }

  if (decimal.length >= padding) {
    return decimal;
  }

  return decimal.padStart(padding, '0');
}
