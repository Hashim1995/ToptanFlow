import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for apps/web (ADR-018).
 * Unit helpers run in node; *.tsx smoke tests use jsdom + Testing Library.
 * Vitest 3.x chosen for Yarn workspace stability on this environment.
 *
 * React plugin deliberately omitted — vitest.config is separate from
 * vite.config; JSX uses the automatic runtime (react-jsx).
 */
export default defineConfig({
  root,
  resolve: {
    alias: {
      'virtual:pwa-register': path.resolve(
        root,
        'src/test/mocks/virtual-pwa-register.ts',
      ),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    testTimeout: 15_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.{test,spec}.ts'],
        },
      },
      {
        extends: true,
        esbuild: {
          jsx: 'automatic',
        },
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
