/**
 * Shared decimal typing helpers for mobile-friendly comma/dot input.
 * Canonical form always uses `.` as the decimal separator.
 * Money finalization uses exactly 2 fraction digits (`12.50`).
 */

export function normalizeDecimalInput(
  raw: string,
  maxFractionDigits = 4,
): string {
  const filtered = raw.replace(/[^\d.,]/g, '');
  if (!filtered) return '';

  const separatorIndex = filtered.search(/[.,]/);
  if (separatorIndex === -1) {
    return filtered;
  }

  const integerPart = filtered.slice(0, separatorIndex).replace(/\D/g, '');
  const fractionalRaw = filtered.slice(separatorIndex + 1).replace(/[^\d]/g, '');
  const limit = Math.max(0, maxFractionDigits);
  const fractionalPart = fractionalRaw.slice(0, limit);

  // Preserve an in-progress trailing separator (`12,` / `12.` → `12.`).
  if (fractionalPart.length === 0) {
    return `${integerPart}.`;
  }

  return `${integerPart}.${fractionalPart}`;
}

/**
 * Parses a typed decimal (comma or dot) into a finite number.
 * Returns null for empty, incomplete trailing separators, or malformed input.
 */
export function parseDecimalInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Reject letters / unsupported symbols early.
  if (/[^\d.,\s]/.test(trimmed)) return null;

  const compact = trimmed.replace(/\s/g, '');
  const separators = compact.match(/[.,]/g) ?? [];
  if (separators.length > 1) return null;

  // Incomplete in-progress values such as `12,` or `12.`
  if (/[.,]$/.test(compact) && separators.length === 1) {
    const withoutSep = compact.slice(0, -1);
    if (!withoutSep || !/^\d+$/.test(withoutSep)) return null;
    // Trailing separator alone is not a finalized number for parse,
    // but integer-before-sep is valid when formatting on blur.
    const asNumber = Number(withoutSep);
    return Number.isFinite(asNumber) ? asNumber : null;
  }

  if (separators.length === 1) {
    const sepIndex = compact.search(/[.,]/);
    const integerPart = compact.slice(0, sepIndex);
    const fractionalPart = compact.slice(sepIndex + 1);
    if (!integerPart || !/^\d+$/.test(integerPart)) return null;
    if (!fractionalPart || !/^\d+$/.test(fractionalPart)) return null;
    const asNumber = Number(`${integerPart}.${fractionalPart}`);
    return Number.isFinite(asNumber) ? asNumber : null;
  }

  if (!/^\d+$/.test(compact)) return null;
  const asNumber = Number(compact);
  return Number.isFinite(asNumber) ? asNumber : null;
}

/**
 * Final money input string: always dot-decimal with exactly 2 places.
 * Examples: `12` → `12.00`, `12,5` → `12.50`.
 */
export function formatMoneyInput(raw: string): string {
  const parsed = parseDecimalInput(raw);
  if (parsed === null) return '';
  return parsed.toFixed(2);
}

/** @deprecated Prefer normalizeDecimalInput — kept for existing imports. */
export function sanitizeDecimalInput(
  raw: string,
  maxFractionDigits = 4,
): string {
  return normalizeDecimalInput(raw, maxFractionDigits);
}
