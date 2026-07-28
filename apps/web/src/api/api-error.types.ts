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
  /**
   * Structured conflict candidates for feature-level handling.
   * They must be rendered behind approved labels, never dumped directly.
   */
  candidates?: unknown[];
};

export type ApiErrorResponse = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  code?: string;
  candidates?: unknown[];
};
