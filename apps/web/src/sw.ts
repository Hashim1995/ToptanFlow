/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.skipWaiting();
clientsClaim();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api/],
  }),
);

type PushPayload = {
  title?: unknown;
  body?: unknown;
  tag?: unknown;
};

function readPushPayload(event: PushEvent): { title: string; body: string; tag?: string } {
  const fallback = {
    title: 'TOPTANFLOW',
    body: 'Yeni bildiriş',
  };

  if (!event.data) {
    return fallback;
  }

  try {
    const raw = event.data.json() as PushPayload;
    const title =
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : fallback.title;
    const body =
      typeof raw.body === 'string' && raw.body.trim()
        ? raw.body.trim()
        : fallback.body;
    const tag =
      typeof raw.tag === 'string' && raw.tag.trim() ? raw.tag.trim() : undefined;
    return { title, body, tag };
  } catch {
    const text = event.data.text();
    return text.trim() ? { ...fallback, body: text.trim() } : fallback;
  }
}

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: payload.tag,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // No deep-link navigation — browser/PWA default open behavior only.
});
