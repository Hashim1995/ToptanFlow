import { generateRefreshToken, hashRefreshToken } from './refresh-token.util';

describe('refresh-token.util', () => {
  it('generates opaque tokens and stable hashes', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
    expect(hashRefreshToken(a)).toBe(hashRefreshToken(a));
    expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
  });
});
