import { test, expect } from '@playwright/test'
import { loginAs, DEMO_ACCOUNTS } from './helpers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

/**
 * G5 — Tests E2E : Authentification
 *
 * Couvre : connexion valide, erreur d'identifiants, protection des routes,
 * redirection post-login, et déconnexion.
 *
 * Les tests "connexion valide" nécessitent le backend + fixtures chargées.
 * Si le fichier .auth/renter.json est vide (backend indisponible au setup),
 * ces tests sont automatiquement ignorés.
 */

function isBackendAvailable(role: 'renter' | 'owner' | 'admin'): boolean {
  const authFile = path.join(__dirname, `../.auth/${role}.json`)
  if (!fs.existsSync(authFile)) return false
  const state = JSON.parse(fs.readFileSync(authFile, 'utf-8')) as {
    state?: { isAuthenticated?: boolean }
  }
  return !!state.state?.isAuthenticated
}

test.describe('Authentification', () => {
  test('connexion valide → redirige vers /mon-espace', async ({ page }) => {
    if (!isBackendAvailable('renter')) {
      test.skip(true, 'Backend non disponible — connexion impossible')
    }
    await loginAs(page, 'renter')
    await expect(page).toHaveURL('/mon-espace')
  })

  test('identifiants invalides → affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/connexion')
    await page.locator('input[type="email"]').fill('mauvais@email.fr')
    await page.locator('input[type="password"]').fill('mauvaismdp123')
    await page.locator('button[type="submit"]').click()

    // Le message d'erreur global apparaît dans le div[role="alert"]
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5_000 })
    // Reste sur la page de connexion
    await expect(page).toHaveURL('/connexion')
  })

  test('accès à une route protégée sans être connecté → redirige vers /connexion', async ({ page }) => {
    await page.goto('/mon-espace')
    await expect(page).toHaveURL(/connexion/)
  })

  test('accès à la route admin sans droits → redirige', async ({ page }) => {
    if (!isBackendAvailable('renter')) {
      test.skip(true, 'Backend non disponible')
    }
    // Un locataire ne doit pas accéder à /admin
    await loginAs(page, 'renter')
    await page.goto('/admin')
    // Redirigé vers le tableau de bord ou vers l'accueil
    await expect(page).not.toHaveURL('/admin')
  })

  test('connexion en tant que propriétaire → accès à /proprietaire', async ({ page }) => {
    if (!isBackendAvailable('owner')) {
      test.skip(true, 'Backend non disponible')
    }
    await loginAs(page, 'owner')
    await page.goto('/proprietaire')
    await expect(page).toHaveURL('/proprietaire')
    await expect(page.getByText(/tableau de bord|mes bateaux|revenus/i).first()).toBeVisible()
  })

  test('connexion en tant qu\'admin → accès à /admin', async ({ page }) => {
    if (!isBackendAvailable('admin')) {
      test.skip(true, 'Backend non disponible')
    }
    await loginAs(page, 'admin')
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
    await expect(page.getByText(/dashboard|tableau de bord|utilisateurs/i).first()).toBeVisible()
  })

  test('page de connexion affiche un lien vers l\'inscription', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page.getByRole('link', { name: /inscription|créer|s'inscrire/i })).toBeVisible()
  })

  test('champ email vide → validation côté client', async ({ page }) => {
    await page.goto('/connexion')
    // Soumet sans remplir le formulaire
    await page.locator('button[type="submit"]').click()
    // Attend un message de validation (erreur champ email ou alerte globale)
    const hasError = await page.locator('[role="alert"], .text-red-600, .text-red-500').first().isVisible()
    expect(hasError).toBe(true)
  })
})
