import { defineConfig, devices } from '@playwright/test'

/**
 * G5 — Configuration Playwright pour les tests End-to-End SailingLoc.
 *
 * Prérequis : le backend Node/Express (port 3000) doit être démarré manuellement.
 * Le serveur Vite (port 5173) est démarré automatiquement par webServer ci-dessous.
 *
 * Commandes :
 *   npm run test:e2e          — exécute tous les tests en mode headless
 *   npm run test:e2e:ui       — ouvre l'interface interactive Playwright
 *   npm run test:e2e:report   — affiche le rapport HTML du dernier run
 *
 * Variables d'environnement :
 *   PLAYWRIGHT_BASE_URL       — override l'URL cible (ex. URL Railway de staging)
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/auth.setup',

  // Les tests partagent la base de données — exécution séquentielle pour éviter les conflits
  fullyParallel: false,
  workers: 1,

  // Bloque le commit si des tests sont marqués .only (protection CI)
  forbidOnly: !!process.env.CI,

  // 1 retry en CI pour absorber les flakiness réseau ponctuels
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Délai raisonnable pour les appels API backend locaux
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Démarre Vite automatiquement si PLAYWRIGHT_BASE_URL n'est pas fourni
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        // Réutilise le serveur déjà démarré en développement local
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
})
