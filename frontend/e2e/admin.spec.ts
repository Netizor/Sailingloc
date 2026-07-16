import { test, expect } from './fixtures'
import { loginAs, isAuthAvailable } from './helpers'

/**
 * G5 — Tests E2E : Interface admin
 *
 * Couvre : accès au dashboard admin, gestion des utilisateurs et bateaux,
 * et protection des routes (utilisateur non-admin refusé).
 */
test.describe('Dashboard admin', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!isAuthAvailable('admin')) {
      testInfo.skip()
      return
    }
    await loginAs(page, 'admin')
  })

  test('accès au dashboard admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
    await expect(
      page.getByText(/dashboard|tableau de bord|statistiques|utilisateurs/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('liste des utilisateurs', async ({ page }) => {
    await page.goto('/admin/utilisateurs')
    await expect(page).toHaveURL('/admin/utilisateurs')
    // Attend la liste ou le message vide
    await expect(
      page.getByText(/utilisateur|email|rôle/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('liste des bateaux admin', async ({ page }) => {
    await page.goto('/admin/bateaux')
    await expect(page).toHaveURL('/admin/bateaux')
    await expect(
      page.getByText(/bateau|propriétaire|statut/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('liste des réservations admin', async ({ page }) => {
    await page.goto('/admin/reservations')
    await expect(page).toHaveURL('/admin/reservations')
    await expect(
      page.getByText(/réservation|locataire|montant/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('page des signalements accessible', async ({ page }) => {
    await page.goto('/admin/signalements')
    await expect(page).toHaveURL('/admin/signalements')
    await expect(
      page.getByText(/signalement|rapport|aucun/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Protection des routes admin', () => {
  test('un locataire ne peut pas accéder au dashboard admin', async ({ page }, testInfo) => {
    if (!isAuthAvailable('renter')) { testInfo.skip(); return }
    await loginAs(page, 'renter')
    await page.goto('/admin')
    // Doit être redirigé — pas resté sur /admin
    await expect(page).not.toHaveURL('/admin')
  })

  test('un propriétaire ne peut pas accéder au dashboard admin', async ({ page }, testInfo) => {
    if (!isAuthAvailable('owner')) { testInfo.skip(); return }
    await loginAs(page, 'owner')
    await page.goto('/admin')
    await expect(page).not.toHaveURL('/admin')
  })

  test('un visiteur non connecté est redirigé vers /connexion', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/connexion/)
  })
})

test.describe('Actions admin', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!isAuthAvailable('admin')) {
      testInfo.skip()
      return
    }
    await loginAs(page, 'admin')
  })

  test('le dashboard affiche des KPIs numériques', async ({ page }) => {
    await page.goto('/admin')
    // Les KPIs doivent afficher des chiffres (même à 0)
    await expect(page.locator('text=/\\d+/').first()).toBeVisible({ timeout: 8_000 })
  })

  test('la gestion des avis est accessible', async ({ page }) => {
    await page.goto('/admin/avis')
    await expect(page).toHaveURL('/admin/avis')
    await expect(
      page.getByText(/avis|note|modération|aucun/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })
})
