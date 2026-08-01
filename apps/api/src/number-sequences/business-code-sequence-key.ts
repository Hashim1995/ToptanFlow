/**
 * Application-owned internal sequence keys for automatic codes / document numbers.
 * Never accept these values from HTTP request bodies or query parameters.
 *
 * Source: ADR-024 — Product / BusinessPartner.
 * PURCHASE document numbers: Approved Human Decision EPIC-009 / US-022 (2026-07-31)
 * using the same NumberSequence allocation pattern (document numbering was
 * deliberately excluded from ADR-024’s Product/BusinessPartner scope).
 * Warehouse sequence removed under ADR-029 / CHANGE-002.
 */
export const BusinessCodeSequenceKey = {
  PRODUCT: 'PRODUCT',
  BUSINESS_PARTNER: 'BUSINESS_PARTNER',
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
} as const;

export type BusinessCodeSequenceKey =
  (typeof BusinessCodeSequenceKey)[keyof typeof BusinessCodeSequenceKey];
