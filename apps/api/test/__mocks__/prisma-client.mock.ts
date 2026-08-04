/**
 * Test-only stand-in for the generated Prisma client
 * (`apps/api/generated/prisma/client.ts`).
 *
 * Technical note (not a Prisma schema/domain-model change): Prisma's
 * "prisma-client" generator (configured in `apps/api/prisma/schema.prisma`,
 * unchanged by this task) emits ESM-only output (`import.meta.url`,
 * extension-qualified `.js` imports) intended for a real Node ESM/bundler
 * runtime. Jest's classic CommonJS test runtime (this project's approved
 * testing stack, ADR-018) cannot parse `import.meta` at all, so any test
 * that transitively imports the real generated client fails at Jest's
 * module-load step, before any test code runs — independent of database
 * availability.
 *
 * This file, together with the `moduleNameMapper` entries in
 * `apps/api/package.json` ("jest") and `apps/api/test/jest-e2e.json`,
 * substitutes this minimal class for the real generated client during test
 * runs only. It changes no production code path: `nest build` and `tsc`
 * still compile `src/prisma/prisma.service.ts` against the real generated
 * types, and the real generated client is what actually runs outside Jest.
 *
 * If the Prisma generator or Jest's module system changes in a future task,
 * this file (and the two `moduleNameMapper` entries) can likely be removed.
 */
export class PrismaClient {
  $connect(): Promise<void> {
    return Promise.resolve();
  }

  $disconnect(): Promise<void> {
    return Promise.resolve();
  }
}


export class PrismaClientKnownRequestError extends Error {
  code: string;
  clientVersion: string;
  constructor(
    message: string,
    options: { code: string; clientVersion: string },
  ) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = options.code;
    this.clientVersion = options.clientVersion;
  }
}

export const Prisma = {
  PrismaClientKnownRequestError,
};
