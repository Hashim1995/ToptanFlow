import { AxiosError, isAxiosError } from 'axios';
import type { ApiErrorKind, MappedApiError } from './api-error.types';
import { isOfflineMutationError } from '../shared/pwa/offline-guard';
import { PWA_LABELS } from '../shared/pwa/labels';

/**
 * Stub mapper: classifies Axios failures and returns Azerbaijani text
 * (ADR-005, ADR-010, ui-requirements). Full status/code catalogs expand
 * with feature screens — do not invent domain messages here.
 */
export function mapApiError(error: unknown): MappedApiError {
  if (isOfflineMutationError(error)) {
    return {
      kind: 'network',
      userMessage: PWA_LABELS.offlineSubmitBlocked,
    };
  }

  if (isAxiosError(error)) {
    return mapAxiosError(error);
  }

  return {
    kind: 'unknown',
    userMessage: 'Gözlənilməz xəta baş verdi. Yenidən cəhd edin.',
  };
}

function mapAxiosError(error: AxiosError): MappedApiError {
  if (!error.response) {
    const kind: ApiErrorKind =
      error.code === 'ERR_NETWORK' || error.message === 'Network Error'
        ? 'network'
        : 'unknown';

    return {
      kind,
      userMessage:
        kind === 'network'
          ? 'Şəbəkə bağlantısı yoxdur. İnternet bağlantınızı yoxlayın.'
          : 'Sorğu tamamlanmadı. Yenidən cəhd edin.',
    };
  }

  const statusCode = error.response.status;
  const data = error.response.data;
  const code =
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    typeof (data as { code?: unknown }).code === 'string'
      ? (data as { code: string }).code
      : undefined;
  const candidates =
    typeof data === 'object' &&
    data !== null &&
    'candidates' in data &&
    Array.isArray((data as { candidates?: unknown }).candidates)
      ? (data as { candidates: unknown[] }).candidates
      : undefined;

  return {
    kind: statusCode === 401 ? 'unauthorized' : 'http',
    statusCode,
    code,
    candidates,
    userMessage: mapHttpStatusToAz(statusCode, code),
  };
}

function mapHttpStatusToAz(statusCode: number, code?: string): string {
  if (code === 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED') {
    return 'Oxşar biznes tərəfdaşları tapıldı. Namizədləri yoxlayın.';
  }
  if (code === 'CASH_INSUFFICIENT_BALANCE') {
    return 'Kassa qalığı yetərsizdir. Mənfi qalıq üçün səbəb yazın və ya məbləği azaldın.';
  }
  if (code === 'CASH_ACCOUNT_INACTIVE') {
    return 'Bu kassa hesabı deaktivdir. Əməliyyat üçün hesabı aktivləşdirin.';
  }
  if (code === 'CASH_ACCOUNT_NOT_FOUND' || code === 'CASH_TRANSACTION_NOT_FOUND') {
    return 'Axtarılan kassa məlumatı tapılmadı.';
  }
  if (code === 'CASH_CANCEL_REASON_REQUIRED') {
    return 'Ləğv səbəbi mütləqdir.';
  }
  if (code === 'CASH_CANNOT_CANCEL_REVERSAL') {
    return 'Ləğv hərəkətini yenidən ləğv etmək olmaz.';
  }
  if (
    code === 'CASH_TRANSACTION_NOT_POSTED' ||
    code === 'CASH_TRANSACTION_ALREADY_CANCELLED'
  ) {
    return 'Bu əməliyyat artıq ləğv edilib və ya ləğvə uyğun deyil.';
  }
  if (code === 'CASH_ACCOUNT_NAME_CONFLICT') {
    return 'Bu adda kassa hesabı artıq mövcuddur. Başqa ad seçin.';
  }
  if (code === 'CASH_ACCOUNT_RESPONSIBLE_USER_CONFLICT') {
    return 'Bu istifadəçiyə artıq başqa kassa hesabı təyin edilib.';
  }
  if (code === 'USER_RESPONSIBLE_FOR_CASH_ACCOUNT') {
    return 'İstifadəçini deaktiv etməzdən əvvəl ona təyin edilmiş kassa hesabını başqa məsul şəxsə keçirin.';
  }
  if (code === 'EXPENSE_CATEGORY_NOT_FOUND') {
    return 'Xərc kateqoriyası tapılmadı.';
  }
  if (code === 'EXPENSE_CATEGORY_INACTIVE') {
    return 'Bu xərc kateqoriyası deaktivdir. Aktiv kateqoriya seçin.';
  }
  if (code === 'EXPENSE_CATEGORY_NAME_CONFLICT') {
    return 'Bu adda xərc kateqoriyası artıq mövcuddur.';
  }
  if (code === 'SALE_HAS_LINKED_POSTED_CASH') {
    return 'Satışı ləğv etməzdən əvvəl əlaqəli tamamlanmış kassa əməliyyatlarını ləğv edin.';
  }
  if (code === 'PURCHASE_HAS_LINKED_POSTED_CASH') {
    return 'Alışı ləğv etməzdən əvvəl əlaqəli tamamlanmış kassa əməliyyatlarını ləğv edin.';
  }
  if (code === 'PURCHASE_CANCEL_INSUFFICIENT_QUANTITY') {
    return 'Alış ləğvi bloklandı: məhsul miqdarı orijinal qəbulu geri qaytarmaq üçün yetərsizdir. Sonrakı satış və ya sərfiyyatı həll edin.';
  }
  if (code === 'CASH_TRANSFER_NOT_POSTED') {
    return 'Bu transfer artıq ləğv edilib və ya ləğvə uyğun deyil.';
  }
  if (code === 'CASH_TRANSFER_NOT_FOUND') {
    return 'Axtarılan transfer tapılmadı.';
  }
  if (code === 'SUPERADMIN_REQUIRED') {
    return 'Bu əməliyyat yalnız Super Admin üçündür.';
  }
  if (code === 'SUPERADMIN_IMMUTABLE' || code === 'LAST_SUPERADMIN') {
    return 'Super Admin deaktiv edilə bilməz.';
  }
  if (statusCode === 400) {
    return 'Göndərilən məlumatlar yanlışdır. Yoxlayıb yenidən cəhd edin.';
  }
  if (statusCode === 401 || statusCode === 403) {
    return 'Bu əməliyyat üçün icazəniz yoxdur.';
  }
  if (statusCode === 404) {
    return 'Axtarılan məlumat tapılmadı.';
  }
  if (statusCode === 409) {
    return 'Əməliyyat konfliktə düşdü. Məlumatları yoxlayın.';
  }
  if (statusCode >= 500) {
    return 'Server xətası baş verdi. Bir az sonra yenidən cəhd edin.';
  }
  return 'Sorğu uğursuz oldu. Yenidən cəhd edin.';
}
