/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

// ─── Pré-cache (injecté par vite-plugin-pwa au build) ────────────────────────
precacheAndRoute(self.__WB_MANIFEST)

// ─── Stratégies de cache runtime ─────────────────────────────────────────────

// API : Network First (pas de cache de données métier)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
)

// Images Cloudinary : Cache First (immuables)
registerRoute(
  ({ url }) => url.hostname === 'res.cloudinary.com',
  new CacheFirst({
    cacheName: 'cloudinary-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

// Tuiles OSM : Stale While Revalidate
registerRoute(
  ({ url }) => /^[abc]\.tile\.openstreetmap\.org$/.test(url.hostname),
  new StaleWhileRevalidate({
    cacheName: 'osm-tiles',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

// ─── Notifications push (D5) ──────────────────────────────────────────────────

interface PushPayload {
  title: string
  body: string
  url?: string
}

/** Affiche la notification native au reçu d'un push. */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: PushPayload
  try {
    payload = event.data.json() as PushPayload
  } catch {
    payload = { title: 'SailingLoc', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo_mobile.png',
      badge: '/logo_mobile.png',
      tag: 'sailingloc-push',
      data: { url: payload.url ?? '/' },
    } as NotificationOptions),
  )
})

/** Ouvre (ou focus) l'URL cible au clic sur la notification. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === url && 'focus' in c)
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      }),
  )
})
