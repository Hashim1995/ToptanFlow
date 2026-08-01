/**
 * Shared display formatting for dense ERP tables and cards.
 */

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('az-AZ');
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('az-AZ');
}

export function formatQuantity(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(numeric);
}

export function emptyDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}
