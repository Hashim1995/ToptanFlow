import { JwtService } from '@nestjs/jwt';
import type { SuperTest, Test } from 'supertest';

export const E2E_AUTH_USER = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  username: 'e2e-user',
  fullName: 'E2E User',
  isActive: true,
  passwordHash: 'not-used-in-jwt-path',
} as const;

/**
 * Signs a short-lived access JWT matching ADR-025 / env defaults for e2e.
 */
export function signE2eAccessToken(
  overrides?: Partial<{ sub: string; username: string }>,
): string {
  const secret =
    process.env.JWT_ACCESS_SECRET ?? 'dev-only-jwt-access-secret-change-me';
  const jwt = new JwtService({ secret });
  return jwt.sign({
    sub: overrides?.sub ?? E2E_AUTH_USER.id,
    username: overrides?.username ?? E2E_AUTH_USER.username,
  });
}

type AuthedAgent = {
  get: (url: string) => Test;
  post: (url: string) => Test;
  patch: (url: string) => Test;
  put: (url: string) => Test;
  delete: (url: string) => Test;
};

/**
 * Wrap a Supertest agent so every verb attaches a valid Bearer access JWT.
 * Usage: `withAuth(request(app.getHttpServer())).get('/api/v1/...')`
 */
export function withAuth(agent: SuperTest<Test>): AuthedAgent {
  const authorization = `Bearer ${signE2eAccessToken()}`;
  return {
    get: (url) => agent.get(url).set('Authorization', authorization),
    post: (url) => agent.post(url).set('Authorization', authorization),
    patch: (url) => agent.patch(url).set('Authorization', authorization),
    put: (url) => agent.put(url).set('Authorization', authorization),
    delete: (url) => agent.delete(url).set('Authorization', authorization),
  };
}

type FindUniqueArgs = {
  where?: { id?: string; username?: string };
};

type PrismaUserMockHost = {
  user?: {
    findUnique?: jest.Mock;
    [key: string]: unknown;
  };
};

/**
 * Ensures JwtStrategy's user lookup succeeds under mocked Prisma.
 * Prefer {@link mockUserFindUniqueResolved} / {@link mockUserFindUniqueImpl}
 * afterwards so domain stubs never wipe the auth user.
 */
export function attachAuthUserMock(prisma: PrismaUserMockHost): void {
  mockUserFindUniqueImpl(prisma, () => null);
}

/**
 * Domain-level findUnique stub that always resolves the JWT auth user for
 * `E2E_AUTH_USER.id` (JwtStrategy), then applies `value` for other lookups.
 */
export function mockUserFindUniqueResolved(
  prisma: PrismaUserMockHost,
  value: unknown,
): void {
  mockUserFindUniqueImpl(prisma, () => value);
}

export function mockUserFindUniqueImpl(
  prisma: PrismaUserMockHost,
  implementation: (args: FindUniqueArgs) => unknown,
): void {
  if (!prisma.user) {
    prisma.user = {};
  }
  prisma.user.findUnique = jest.fn((args: FindUniqueArgs) => {
    if (args?.where?.id === E2E_AUTH_USER.id) {
      return Promise.resolve({ ...E2E_AUTH_USER });
    }
    return Promise.resolve(implementation(args));
  });
}
