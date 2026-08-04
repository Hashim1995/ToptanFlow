import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Fail production builds early when the API base URL is missing, so a
  // deployed bundle cannot silently target localhost.
  if (
    command === 'build' &&
    mode === 'production' &&
    !env.VITE_API_BASE_URL?.trim()
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be set for production builds (apps/web/.env.production or Vercel env, typically /api/v1). Local `yarn workspace web dev` does not require it.',
    );
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: [
          'toptanflow-logo.png',
          'apple-touch-icon.png',
          'pwa-192.png',
          'pwa-512.png',
          'pwa-maskable-512.png',
          'icons.svg',
        ],
        manifest: {
          name: 'TOPTANFLOW',
          short_name: 'TOPTANFLOW',
          description: 'TOPTANFLOW — topdan satış və əməliyyat sistemi',
          theme_color: '#1677ff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          lang: 'az',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache hashed frontend assets + shell. Never cache API responses.
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}',
          ],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          // No runtimeCaching — API is cross-origin and must never be cached.
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      proxy: {
        // Avoid browser CORS in local dev: web (5173) → api (3000) via same origin.
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
