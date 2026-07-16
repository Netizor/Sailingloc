import { test, expect } from './fixtures'
import { loginAs, isAuthAvailable } from './helpers'

/**
 * G5 — Tests E2E : Espace propriétaire
 *
 * Couvre : accès au dashboard, liste des bateaux, formulaire de création,
 * gestion des disponibilités et des revenus.
 */
test.describe('Dashboard propriétaire', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!isAuthAvailable('owner')) {
      testInfo.skip()
      return
    }
    await loginAs(page, 'owner')
  })

  test('accès au dashboard propriétaire', async ({ page }) => {
    await page.goto('/proprietaire')
    await expect(page).toHaveURL('/proprietaire')
    await expect(
      page.getByText(/tableau de bord|bienvenue|revenus|bateaux/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('liste des bateaux du propriétaire', async ({ page }) => {
    await page.goto('/proprietaire/bateaux')
    await expect(page).toHaveURL('/proprietaire/bateaux')
    await expect(
      page.getByText(/mes bateaux|ajouter|aucun bateau/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('formulaire de création de bateau se charge', async ({ page }) => {
    await page.goto('/proprietaire/bateaux/nouveau')
    await expect(page).toHaveURL('/proprietaire/bateaux/nouveau')
    // Le formulaire doit avoir des champs nom et prix
    await expect(page.getByLabel(/nom|name/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('page des revenus se charge avec les données', async ({ page }) => {
    await page.goto('/proprietaire/revenus')
    await expect(page).toHaveURL('/proprietaire/revenus')
    await expect(
      page.getByText(/revenu|total|mois|€/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('réservations du propriétaire accessibles', async ({ page }) => {
    await page.goto('/proprietaire/reservations')
    await expect(page).toHaveURL('/proprietaire/reservations')
    await expect(
      page.getByText(/réservation|aucune/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Gestion des disponibilités', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!isAuthAvailable('owner')) {
      testInfo.skip()
      return
    }
    await loginAs(page, 'owner')
  })

  test('accès à la page des disponibilités d\'un bateau existant', async ({ page }) => {
    // Navigue d'abord vers la liste des bateaux pour récupérer un ID
    await page.goto('/proprietaire/bateaux')
    const dispoLink = page.getByRole('link', { name: /disponibilité|calendrier/i }).first()

    const hasLink = await dispoLink.isVisible({ timeout: 5_000 }).catch(() => false)
    if (!hasLink) {
      test.skip()
      return
    }

    await dispoLink.click()
    await expect(page).toHaveURL(/\/proprietaire\/bateaux\/\d+\/disponibilites/)
  })
})
