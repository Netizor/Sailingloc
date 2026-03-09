import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

/**
 * Global setup Playwright — connexion préalable pour chaque rôle.
 *
 * Ce fichier s'exécute UNE SEULE FOIS avant tous les tests.
 * Il appelle l'API backend directement pour obtenir les tokens,
 * injecte l'état dans localStorage, puis sauvegarde le contexte
 * (storageState) dans .auth/{role}.json.
 *
 * Les tests utilisent ensuite ces fichiers via loginAs() sans
 * refaire de vraie connexion formulaire.
 *
 * Prérequis : backend Symfony + fixtures chargées (doctrine:fixtures:load).
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const API_URL  = process.env.PLAYWRIGHT_API_URL  ?? 'http://localhost:8000'

const ACCOUNTS = {
  renter: { email: 'renter@demo.fr',       password: 'Renter123!' },
  owner:  { email: 'owner@demo.fr',        password: 'Owner123!'  },
  admin:  { email: 'admin@sailingloc.fr',  password: 'Admin123!'  },
} as const

const AUTH_DIR = path.join(__dirname, '../.auth')

async function globalSetup() {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  // ── 1. Vérifie que le backend est joignable ──────────────────────────────
  let backendOk = false
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(5_000),
    })
    backendOk = res.ok
  } catch { /* backend non démarré */ }

  if (!backendOk) {
    console.warn(
      `\n⚠️  Backend non joignable (${API_URL}). ` +
      `Les tests nécessitant l'authentification seront ignorés.\n` +
      `Lancez le backend avec : cd backend && symfony serve\n`,
    )
    // Sauvegarde des états vides pour que les tests puissent démarrer
    for (const role of Object.keys(ACCOUNTS)) {
      fs.writeFileSync(
        path.join(AUTH_DIR, `${role}.json`),
        JSON.stringify({ cookies: [], origins: [] }),
      )
    }
    return
  }

  // ── 2. Connexion API pour chaque rôle ───────────────────────────────────
  const browser = await chromium.launch()

  for (const [role, { email, password }] of Object.entries(ACCOUNTS)) {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        console.warn(`[auth.setup] Échec connexion ${role} (HTTP ${res.status}) — fixtures chargées ?`)
        fs.writeFileSync(path.join(AUTH_DIR, `${role}.json`), JSON.stringify({ cookies: [], origins: [] }))
        continue
      }

      const json = await res.json()
      // L'enveloppe Symfony renvoie { success, data: { user, accessToken, refreshToken } }
      const { user, accessToken, refreshToken } = json.data ?? json

      // ── 3. Injecte l'état dans localStorage via un contexte navigateur ──
      const context = await browser.newContext()
      const page    = await context.newPage()

      await page.goto(BASE_URL)

      await page.evaluate(
        ({ user, accessToken, refreshToken }) => {
          // Zustand charge TOUS les champs du state stocké au démarrage,
          // même ceux absents de partialize (comme accessToken).
          // Cela évite la boucle 401 → refresh au premier appel API.
          localStorage.setItem(
            'sailingloc-auth',
            JSON.stringify({
              state: { user, accessToken, refreshToken, isAuthenticated: true },
              version: 0,
            }),
          )
        },
        { user, accessToken, refreshToken },
      )

      // ── 4. Sauvegarde le storageState ────────────────────────────────────
      await context.storageState({ path: path.join(AUTH_DIR, `${role}.json`) })
      await context.close()

      console.log(`[auth.setup] ✓ État auth sauvegardé pour : ${role}`)
    } catch (err) {
      console.warn(`[auth.setup] Erreur pour ${role} :`, err)
      fs.writeFileSync(path.join(AUTH_DIR, `${role}.json`), JSON.stringify({ cookies: [], origins: [] }))
    }
  }

  await browser.close()
}

export default globalSetup
