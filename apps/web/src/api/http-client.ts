import axios from 'axios';

/**
 * Shared Axios instance for all frontend→backend HTTP (ADR-010).
 * Transport only — no business rules, no auth (US-019), no automatic retries
 * that could duplicate posts.
 *
 * Local Vite uses a same-origin `/api` proxy (see vite.config.ts) so the
 * browser does not need CORS. Override with VITE_API_BASE_URL when needed.
 */
const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? '/api/v1' : 'http://localhost:3000/api/v1');

export const httpClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export { mapApiError } from './map-api-error';
export type {
  ApiErrorKind,
  ApiErrorResponse,
  MappedApiError,
} from './api-error.types';
