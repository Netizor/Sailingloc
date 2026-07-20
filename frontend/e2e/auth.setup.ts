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
 * Prérequis : backend Node/Express (port 3000) + comptes demo seedés.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const API_URL  = process.env.PLAYWRIGHT_API_URL  ?? 'http://127.0.0.1:3000'

const ACCOUNTS = {
  renter: { email: 'renter@demo.fr',       password: 'Renter@Sail2026!' },
  owner:  { email: 'owner@demo.fr',        password: 'Owner@Sail2026!'  },
  admin:  { email: 'admin@sailingloc.fr',  password: 'Admin@Sail2026!'  },
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
      `Lancez le backend avec : cd backend && npm run dev\n`,
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
      const { user, accessToken, refreshToken } = json

      // ── 3. Injecte l'état dans localStorage via un contexte navigateur ──
      const context = await browser.newContext()
      const page    = await context.newPage()

      await page.addInitScript(
        ({ user, accessToken, refreshToken }) => {
          localStorage.setItem(
            'sailingloc-cookie-consent',
            JSON.stringify({
              version: '2',
              essential: true,
              analytical: false,
              marketing: false,
              date: new Date().toISOString(),
            }),
          )
          // Requis pour initSessionGuard() : sinon logout immédiat au montage.
          localStorage.setItem('sailingloc-remember-me', 'true')
          sessionStorage.setItem('sailingloc-session-active', '1')
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

      await page.goto(BASE_URL)

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
