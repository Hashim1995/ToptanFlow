/**
 * The consistent shape returned for every error response produced by the
 * backend, regardless of whether it originated from a known `HttpException`
 * (e.g. validation, not-found) or an unexpected failure. Kept intentionally
 * small and generic — it carries no business meaning of its own.
 *
 * Optional `code` / `candidates` are reserved for structured business
 * conflicts that the client must handle (e.g. US-016 soft duplicate flag).
 * They are never used for unexpected 500 responses.
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  /** Stable machine-readable conflict/business code when applicable. */
  code?: string;
  /** Soft-duplicate candidate list (US-016); omit when not applicable. */
  candidates?: unknown[];
}
