/**
 * The consistent shape returned for every error response produced by the
 * backend, regardless of whether it originated from a known `HttpException`
 * (e.g. validation, not-found) or an unexpected failure. Kept intentionally
 * small and generic — it carries no business meaning of its own.
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}
