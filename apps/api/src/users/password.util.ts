import * as argon2 from 'argon2';

/** Argon2id hash for user passwords (ADR-025). */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

/** Verify a plain password against a stored Argon2id hash (ADR-025). */
export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  return argon2.verify(hash, plain);
}
