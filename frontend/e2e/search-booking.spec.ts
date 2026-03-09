import { test, expect } from '@playwright/test'
import { loginAs, isAuthAvailable } from './helpers'

/**
 * G5 — Tests E2E : Recherche et flux de réservation
 *
 * Couvre : page de recherche, affichage des bateaux, fiche bateau,
 * et déclenchement du formulaire de réservation.
 * Note : le paiement Stripe réel n'est pas testé ici (nécessite des webhooks).
 */
test.describe('Recherche de bateaux', () => {
  test('la page /bateaux se charge correctement', async ({ page }) => {
    await page.goto('/bateaux')
    // La barre de recherche est visible
    await expect(page.getByPlaceholder(/port|destination|location/i).first()).toBeVisible()
  })

  test('affiche les bateaux disponibles ou le message vide', async ({ page }) => {
    await page.goto('/bateaux')
    // Attend la fin du chargement (squelette → résultats ou message vide)
    await expect(
      page.getByText(/bateau(x)? trouvé|aucun résultat|aucun bateau/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('recherche par localisation met à jour l\'URL', async ({ page }) => {
    await page.goto('/bateaux')
    const locationInput = page.getByPlaceholder(/port|destination|location/i).first()
    await locationInput.fill('Marseille')
    // Soumet la recherche (Entrée ou bouton rechercher)
    await locationInput.press('Enter')
    await expect(page).toHaveURL(/location=Marseille/)
  })

  test('toggle vue carte est fonctionnel', async ({ page }) => {
    await page.goto('/bateaux')
    const carteBtn = page.getByRole('button', { name: /carte/i })
    await expect(carteBtn).toBeVisible()
    await carteBtn.click()
    // La vue carte doit être active (aria-pressed="true")
    await expect(carteBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Fiche bateau et réservation', () => {
  test('cliquer sur un bateau navigue vers sa fiche', async ({ page }) => {
    await page.goto('/bateaux')
    // Attend au moins un bateau (skip si pas de données seed)
    const firstBoat = page.locator('a[href^="/bateaux/"]').first()
    const hasBoat = await firstBoat.isVisible({ timeout: 8_000 }).catch(() => false)

    if (!hasBoat) {
      test.skip()
      return
    }

    await firstBoat.click()
    await expect(page).toHaveURL(/\/bateaux\/\d+/)
    // La fiche contient des infos essentielles
    await expect(page.getByText(/€|par jour|\/jour/i).first()).toBeVisible()
  })

  test('formulaire de réservation inaccessible sans connexion → redirige', async ({ page }) => {
    await page.goto('/bateaux')
    const firstBoat = page.locator('a[href^="/bateaux/"]').first()
    const hasBoat = await firstBoat.isVisible({ timeout: 8_000 }).catch(() => false)

    if (!hasBoat) {
      test.skip()
      return
    }

    await firstBoat.click()
    // Cherche un bouton de réservation
    const reserveBtn = page.getByRole('button', { name: /réserver|louer/i })
    if (await reserveBtn.isVisible()) {
      await reserveBtn.click()
      // Doit rediriger vers la connexion si non authentifié
      await expect(page).toHaveURL(/connexion/)
    }
  })

  test('utilisateur connecté peut voir le formulaire de réservation', async ({ page }, testInfo) => {
    if (!isAuthAvailable('renter')) { testInfo.skip(); return }
    await loginAs(page, 'renter')
    await page.goto('/bateaux')

    const firstBoat = page.locator('a[href^="/bateaux/"]').first()
    const hasBoat = await firstBoat.isVisible({ timeout: 8_000 }).catch(() => false)

    if (!hasBoat) {
      test.skip()
      return
    }

    await firstBoat.click()
    await expect(page).toHaveURL(/\/bateaux\/\d+/)
    // Le formulaire de réservation (date picker ou bouton Réserver) est visible
    const reserveEl = page.getByRole('button', { name: /réserver|louer/i })
    await expect(reserveEl).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Mes réservations', () => {
  test('le locataire peut voir la liste de ses réservations', async ({ page }, testInfo) => {
    if (!isAuthAvailable('renter')) { testInfo.skip(); return }
    await loginAs(page, 'renter')
    await page.goto('/mon-espace/reservations')
    // La page charge sans erreur
    await expect(page).toHaveURL('/mon-espace/reservations')
    await expect(
      page.getByText(/réservation|aucune réservation/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })
})
