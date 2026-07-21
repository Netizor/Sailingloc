import { test, expect } from './fixtures'
import { loginAs, isAuthAvailable } from './helpers'

/**
 * G5 — Tests E2E : Recherche et flux de réservation
 *
 * Couvre : page de recherche, affichage des bateaux, fiche bateau,
 * et déclenchement du formulaire de réservation.
 * Note : le paiement Stripe réel n'est pas testé ici (nécessite des webhooks).
 */

async function waitForBoatCard(page: import('@playwright/test').Page) {
  // Cartes listing (lien /bateaux/:id avec contenu) — attendre la fin du chargement API
  const card = page.locator('a[href^="/bateaux/"]').filter({
    has: page.locator('img'),
  }).first()
  await expect(
    page.getByRole('heading', {
      name: /maritime adventures?|boats? (found|in)|bateau|aventures maritimes|no boats|aucun bateau/i,
    }).or(card).first(),
  ).toBeVisible({ timeout: 20_000 })
  return card
}

test.describe('Recherche de bateaux', () => {
  test('la page /bateaux se charge correctement', async ({ page }) => {
    await page.goto('/bateaux')
    await expect(
      page.getByPlaceholder(
        /where are you sailing|où naviguez|port or city|port ou ville|marseille|la rochelle/i,
      ).first(),
    ).toBeVisible()
  })

  test('affiche les bateaux disponibles ou le message vide', async ({ page }) => {
    await page.goto('/bateaux')
    const heading = page.getByRole('heading', {
      name: /maritime adventures? available|boats? (found|in)|bateau(x)? trouvé|aventures maritimes|no boats found|aucun bateau/i,
    })
    const boatCard = page.locator('a[href^="/bateaux/"]').first()
    const empty = page.getByText(/no boats found|aucun bateau|discover the best rentals|découvrez les meilleures/i)
    await expect(heading.or(boatCard).or(empty).first()).toBeVisible({ timeout: 20_000 })
  })

  test('recherche par localisation met à jour l\'URL', async ({ page }) => {
    await page.goto('/bateaux')
    const locationInput = page.getByPlaceholder(
      /where are you sailing|où naviguez|port or city|port ou ville|marseille/i,
    ).first()
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
    const firstBoat = await waitForBoatCard(page)
    const hasBoat = await firstBoat.isVisible().catch(() => false)
    if (!hasBoat) {
      test.skip(true, 'Aucun bateau en base pour ce parcours')
      return
    }

    await firstBoat.click()
    await expect(page).toHaveURL(/\/bateaux\/\d+/)
    await expect(page.getByText(/€|par jour|\/ ?day|per day|\/jour/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('formulaire de réservation inaccessible sans connexion → redirige', async ({ page }) => {
    await page.goto('/bateaux')
    const firstBoat = await waitForBoatCard(page)
    const hasBoat = await firstBoat.isVisible().catch(() => false)
    if (!hasBoat) {
      test.skip(true, 'Aucun bateau en base pour ce parcours')
      return
    }

    await firstBoat.click()
    await expect(page).toHaveURL(/\/bateaux\/\d+/)

    const reserveBtn = page.getByRole('button', { name: /book now|book & pay|réserver|louer/i }).first()
    await expect(reserveBtn).toBeVisible({ timeout: 10_000 })
    await reserveBtn.click()
    await expect(page).toHaveURL(/connexion/)
  })

  test('utilisateur connecté peut voir le formulaire de réservation', async ({ page }, testInfo) => {
    if (!isAuthAvailable('renter')) { testInfo.skip(); return }
    await loginAs(page, 'renter')
    await page.goto('/bateaux')

    const firstBoat = await waitForBoatCard(page)
    const hasBoat = await firstBoat.isVisible().catch(() => false)
    if (!hasBoat) {
      test.skip(true, 'Aucun bateau en base pour ce parcours')
      return
    }

    await firstBoat.click()
    await expect(page).toHaveURL(/\/bateaux\/\d+/)
    await expect(
      page.getByRole('button', { name: /book now|book & pay|réserver|louer/i }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Mes réservations', () => {
  test('le locataire peut voir la liste de ses réservations', async ({ page }, testInfo) => {
    if (!isAuthAvailable('renter')) { testInfo.skip(); return }
    await loginAs(page, 'renter')
    await page.goto('/mon-espace/reservations')
    await expect(page).toHaveURL('/mon-espace/reservations')
    await expect(
      page.getByText(/my bookings|réservation|booking|aucune réservation|no booking|getaway/i).first(),
    ).toBeVisible({ timeout: 8_000 })
  })
})
