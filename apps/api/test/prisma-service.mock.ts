import { PrismaService } from '../src/prisma/prisma.service';

/**
 * A minimal `PrismaService` stand-in for e2e tests that boot the full
 * `AppModule` (and therefore the globally-registered `PrismaModule`)
 * without a real PostgreSQL instance available. No test in this task
 * exercises actual data access, so only the lifecycle hooks Nest calls
 * during `app.init()` / `app.close()` need to exist.
 */
export function createPrismaServiceMock(): Pick<
  PrismaService,
  'onModuleInit' | 'onModuleDestroy'
> {
  return {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
  };
}
