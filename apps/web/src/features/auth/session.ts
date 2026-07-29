import type { AuthUser } from './api/auth.api';

/**
 * In-memory access token only (ADR-025). Refresh stays in httpOnly cookie.
 * Not persisted to localStorage/sessionStorage.
 */
let accessToken: string | null = null;
let currentUser: AuthUser | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getAuthUser(): AuthUser | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return Boolean(accessToken);
}

export function setSession(token: string, user: AuthUser): void {
  accessToken = token;
  currentUser = user;
  notify();
}

export function clearSession(): void {
  accessToken = null;
  currentUser = null;
  notify();
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
