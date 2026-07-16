import { test, expect } from './fixtures'
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
    await expect(
      page.getByPlaceholder(/où naviguez|port ou ville|marseille|la rochelle/i).first(),
    ).toBeVisible()
  })

  test('affiche les bateaux disponibles ou le message vide', async ({ page }) => {
    await page.goto('/bateaux')
    await expect(
      page.getByText(/bateau(x)? trouvé|aventures maritimes|aucun bateau/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('recherche par localisation met à jour l\'URL', async ({ page }) => {
    await page.goto('/bateaux')
    const locationInput = page.getByPlaceholder(/où naviguez|port ou ville|marseille/i).first()
    await locationInput.fill('Marseille')
    await locationInput.press('Enter')
    await expect(page).toHaveURL(/location=Marseille/)
  })

  test('la carte est affichée sur la page recherche', async ({ page }) => {
    await page.goto('/bateaux')
    await expect(page.locator('.leaflet-container').first()).toBeVisible({ timeout: 10_000 })
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
