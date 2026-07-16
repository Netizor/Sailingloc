import { type Page, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

/**
 * Comptes de démonstration créés par `npm run db:seed` (backend).
 */
export const DEMO_ACCOUNTS = {
  renter: { email: 'renter@demo.fr',       password: 'Renter@Sail2026!' },
  owner:  { email: 'owner@demo.fr',        password: 'Owner@Sail2026!'  },
  admin:  { email: 'admin@sailingloc.fr',  password: 'Admin@Sail2026!'  },
} as const

const AUTH_DIR = path.join(__dirname, '../.auth')

/**
 * Connecte l'utilisateur pour le rôle donné.
 *
 * Stratégie :
 * 1. Si `.auth/{role}.json` existe et contient un état valide (créé par
 *    auth.setup.ts au démarrage), injecte l'état dans localStorage et
 *    navigue directement vers le tableau de bord → rapide, pas d'API call.
 *
 * 2. Sinon, fallback sur la connexion formulaire réelle (nécessite le backend).
 */
export async function loginAs(page: Page, role: keyof typeof DEMO_ACCOUNTS): Promise<void> {
  const authFile = path.join(AUTH_DIR, `${role}.json`)

  if (fs.existsSync(authFile)) {
    const state = JSON.parse(fs.readFileSync(authFile, 'utf-8')) as {
      origins?: Array<{
        origin: string
        localStorage: Array<{ name: string; value: string }>
        sessionStorage?: Array<{ name: string; value: string }>
      }>
    }

    const origin = state.origins?.find((o) => o.origin.includes('localhost'))
    const authItem = origin?.localStorage?.find((item) => item.name === 'sailingloc-auth')
    const tokenItem = origin?.sessionStorage?.find((item) => item.name === '__pw_accessToken')

    if (authItem) {
      // Vérifie que l'état n'est pas vide (backend était down au setup)
      const parsed = JSON.parse(authItem.value) as {
        state?: { isAuthenticated?: boolean; accessToken?: string }
      }
      if (parsed.state?.isAuthenticated) {
        // Injecte l'état auth dans la page avant de naviguer.
        // Le accessToken est inclus dans le state → Zustand l'hydrate → les appels API fonctionnent.
        await page.goto('/')
        await page.evaluate((authValue) => {
          localStorage.setItem('sailingloc-auth', authValue)
        }, authItem.value)
        // Navigue vers le tableau de bord approprié selon le rôle
        const destination = role === 'admin' ? '/admin' : role === 'owner' ? '/proprietaire' : '/mon-espace'
        await page.goto(destination)
        return
      }
    }
  }

  // ── Fallback : connexion formulaire (nécessite le backend) ───────────────
  const { email, password } = DEMO_ACCOUNTS[role]
  await page.goto('/connexion')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/(mon-espace|proprietaire|admin)/, { timeout: 15_000 })
}

/**
 * Retourne true si le backend était disponible au setup et que le role
 * a un état d'authentification valide sauvegardé dans .auth/{role}.json.
 *
 * Usage dans les tests :
 *   test.beforeEach(({ page }, testInfo) => {
 *     if (!isAuthAvailable('admin')) testInfo.skip()
 *   })
 */
export function isAuthAvailable(role: keyof typeof DEMO_ACCOUNTS): boolean {
  const authFile = path.join(AUTH_DIR, `${role}.json`)
  if (!fs.existsSync(authFile)) return false
  try {
    const state = JSON.parse(fs.readFileSync(authFile, 'utf-8')) as {
      state?: { isAuthenticated?: boolean }
      origins?: Array<{
        localStorage?: Array<{ name: string; value: string }>
      }>
    }
    if (state.state?.isAuthenticated) return true
    const authItem = state.origins
      ?.flatMap((o) => o.localStorage ?? [])
      .find((item) => item.name === 'sailingloc-auth')
    if (!authItem) return false
    const parsed = JSON.parse(authItem.value) as {
      state?: { isAuthenticated?: boolean }
    }
    return !!parsed.state?.isAuthenticated
  } catch {
    return false
  }
}

/**
 * Vérifie qu'un texte est visible sur la page avec un fallback gracieux.
 * Retourne `false` au lieu de faire échouer le test si le texte n'est pas trouvé.
 */
export async function isVisible(page: Page, regex: RegExp, timeout = 5_000): Promise<boolean> {
  try {
    await expect(page.getByText(regex).first()).toBeVisible({ timeout })
    return true
  } catch {
    return false
  }
}
