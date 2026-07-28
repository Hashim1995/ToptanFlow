import axios from 'axios';

/**
 * Shared Axios instance for all frontend→backend HTTP (ADR-010).
 * Transport only — no business rules, no auth (US-019), no automatic retries
 * that could duplicate posts.
 */
const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1';

export const httpClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export { mapApiError } from './map-api-error';
export type { ApiErrorKind, MappedApiError } from './api-error.types';
