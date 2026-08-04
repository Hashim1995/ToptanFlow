import axios from 'axios';
import {
  getAccessToken,
  setSession,
  clearSession,
} from '../features/auth/session';
import type { AuthTokensResponse } from '../features/auth/api/auth.api';

/**
 * Shared Axios instance for all frontend→backend HTTP (ADR-010 / ADR-025).
 * Access token is attached from memory; refresh uses httpOnly cookie.
 *
 * Local Vite (`import.meta.env.DEV`) uses a same-origin `/api` proxy
 * (see vite.config.ts) when `VITE_API_BASE_URL` is unset.
 * Production builds must set `VITE_API_BASE_URL` (e.g. on Vercel) and never
 * fall back to localhost.
 */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured;
  }
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  throw new Error(
    'VITE_API_BASE_URL must be set for production builds (Vercel env).',
  );
}

const baseURL = resolveApiBaseUrl();

export const httpClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<AuthTokensResponse>(
      `${baseURL}/auth/refresh`,
      undefined,
      { withCredentials: true },
    );
    setSession(data.accessToken, data.user);
    return data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      throw error;
    }

    const status = error.response?.status;
    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };
    const url = original.url ?? '';

    if (
      status !== 401 ||
      original._retry ||
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/change-password')
    ) {
      throw error;
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      throw error;
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return httpClient.request(original);
  },
);

export { mapApiError } from './map-api-error';
export type {
  ApiErrorKind,
  ApiErrorResponse,
  MappedApiError,
} from './api-error.types';
