/**
 * Application-owned internal sequence keys for automatic business codes.
 * Never accept these values from HTTP request bodies or query parameters.
 *
 * Source: ADR-024 — Product / BusinessPartner; ADR-026 — Warehouse.
 */
export const BusinessCodeSequenceKey = {
  PRODUCT: 'PRODUCT',
  BUSINESS_PARTNER: 'BUSINESS_PARTNER',
  WAREHOUSE: 'WAREHOUSE',
} as const;

export type BusinessCodeSequenceKey =
  (typeof BusinessCodeSequenceKey)[keyof typeof BusinessCodeSequenceKey];
