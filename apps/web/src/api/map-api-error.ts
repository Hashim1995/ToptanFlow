import { AxiosError, isAxiosError } from 'axios';
import type { ApiErrorKind, MappedApiError } from './api-error.types';

/**
 * Stub mapper: classifies Axios failures and returns Azerbaijani text
 * (ADR-005, ADR-010, ui-requirements). Full status/code catalogs expand
 * with feature screens — do not invent domain messages here.
 */
export function mapApiError(error: unknown): MappedApiError {
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
