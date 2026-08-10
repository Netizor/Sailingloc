import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // D5 — injectManifest permet d'ajouter un gestionnaire push custom dans sw.ts
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      // Met à jour le SW automatiquement en arrière-plan (sans popup "nouvelle version")
      registerType: 'autoUpdate',

      // Active le SW en mode dev pour que navigator.serviceWorker.ready se résolve
      devOptions: {
        enabled: true,
        type: 'module',
      },

      // Fichiers pré-cachés au build (shell applicatif)
      includeAssets: ['logo.png', 'logo-dark.png', 'logo_mobile.png'],

      manifest: {
        name: 'SailingLoc',
        short_name: 'SailingLoc',
        description: 'Location de bateaux entre particuliers',
        theme_color: '#2563FF',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'fr',
        icons: [
          {
            src: '/logo_mobile.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo_mobile.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // injectManifest utilise workbox au lieu de workbox directement
      injectManifest: {
        // Fichiers pré-cachés injectés dans __WB_MANIFEST dans sw.ts
        globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],
      },

      workbox: {
        // Cache les pages HTML, JS, CSS et les images de l'app
        globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],

        // Stratégie Network First pour les appels API (pas de cache API)
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images Cloudinary — Cache First (les images ne changent pas)
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tuiles OpenStreetMap — Stale While Revalidate
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    // Même origine en dev : le navigateur appelle /api sur :5173, Vite relaie vers le backend Node (:3000) → pas de CORS
    proxy: {
      '/api': {
        // Windows: "localhost" peut résoudre en IPv6 (::1) et provoquer ECONNREFUSED si le backend écoute en IPv4.
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
