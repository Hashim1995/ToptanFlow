import { createHash, randomBytes } from 'node:crypto';

/** Opaque refresh token (cookie value). High entropy; hashed before storage. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/** SHA-256 hex hash of an opaque refresh token (ADR-025 server-side store). */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
