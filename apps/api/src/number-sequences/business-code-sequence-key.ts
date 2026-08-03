/**
 * Application-owned internal sequence keys for automatic codes / document numbers.
 * Never accept these values from HTTP request bodies or query parameters.
 *
 * Source: ADR-024 — Product / BusinessPartner.
 * PURCHASE / SALE document numbers: Approved Human Decisions EPIC-009 / EPIC-010.
 * CASH_ACCOUNT / CASH_TRANSACTION / CASH_TRANSFER: CHANGE-004 / EPIC-011.
 * Warehouse sequence removed under ADR-029 / CHANGE-002.
 */
export const BusinessCodeSequenceKey = {
  PRODUCT: 'PRODUCT',
  BUSINESS_PARTNER: 'BUSINESS_PARTNER',
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  CASH_ACCOUNT: 'CASH_ACCOUNT',
  CASH_TRANSACTION: 'CASH_TRANSACTION',
  CASH_TRANSFER: 'CASH_TRANSFER',
} as const;

export type BusinessCodeSequenceKey =
  (typeof BusinessCodeSequenceKey)[keyof typeof BusinessCodeSequenceKey];
