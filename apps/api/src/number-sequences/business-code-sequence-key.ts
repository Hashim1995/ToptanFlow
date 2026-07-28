/**
 * Application-owned internal sequence keys for automatic business codes.
 * Never accept these values from HTTP request bodies or query parameters.
 *
 * Source: ADR-024 — automatic Product / BusinessPartner business codes.
 */
export const BusinessCodeSequenceKey = {
  PRODUCT: 'PRODUCT',
  BUSINESS_PARTNER: 'BUSINESS_PARTNER',
} as const;

export type BusinessCodeSequenceKey =
  (typeof BusinessCodeSequenceKey)[keyof typeof BusinessCodeSequenceKey];
