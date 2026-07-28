/**
 * Technical classification of transport failures (ADR-010).
 * Not a business decision — feeds Azerbaijani presentation only.
 */
export type ApiErrorKind = 'network' | 'http' | 'unknown';

export type MappedApiError = {
  kind: ApiErrorKind;
  /** Azerbaijani user-facing text (ADR-005). Never a raw backend dump. */
  userMessage: string;
  /** HTTP status when kind === 'http'. */
  statusCode?: number;
  /** Optional machine code from backend (e.g. soft-duplicate). */
  code?: string;
};
