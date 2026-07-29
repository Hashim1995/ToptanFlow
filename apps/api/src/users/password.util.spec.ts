import { hashPassword, verifyPassword } from './password.util';

describe('password.util', () => {
  it('hashes with Argon2id and verifies the same plain password', async () => {
    const hash = await hashPassword('ChangeMe123!');
    expect(hash).not.toBe('ChangeMe123!');
    expect(await verifyPassword(hash, 'ChangeMe123!')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  }, 30_000);
});
