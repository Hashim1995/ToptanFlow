/**
 * Shared display formatting for dense ERP tables and cards.
 * Date/time display is fixed to Asia/Baku via `../datetime`.
 */
export {
  formatDate,
  formatDateTime,
  DATE_DISPLAY_FORMAT,
  DATETIME_DISPLAY_FORMAT,
  APP_TIMEZONE,
} from '../datetime';

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
