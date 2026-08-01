/**
 * Static base currency for display (ADR-031). Currency master data is reserved
 * for future Cash; current domains use AZN only.
 */
export const BASE_CURRENCY = 'AZN';

/**
 * Formats a money amount for UI display (2 fraction digits + AZN).
 * API decimal strings may use 4 places (ADR-023); display prefers 2.
 */
export function formatMoney(amount: string | number): string {
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    return `0.00 ${BASE_CURRENCY}`;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
  return `${formatted} ${BASE_CURRENCY}`;
}
