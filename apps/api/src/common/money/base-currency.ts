/**
 * Static base currency for all current-domain monetary amounts (ADR-031).
 * Not a Currency CRUD entity. Multi-currency belongs to future Cash only.
 */
export const BASE_CURRENCY = 'AZN' as const;

export type BaseCurrencyCode = typeof BASE_CURRENCY;
