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
      page.getByText(/dashboard|owner space|tableau de bord|bienvenue|hello|revenus|revenue|bateaux|boats/i).first(),
    ).toBeVisible({ timeout: 8_000 })
  })

  test('liste des bateaux du propriétaire', async ({ page }) => {
    await page.goto('/proprietaire/bateaux')
    await expect(page).toHaveURL('/proprietaire/bateaux')
    await expect(
      page.getByText(/my boats|mes bateaux|add a boat|ajouter|aucun bateau|no boats/i).first(),
    ).toBeVisible({ timeout: 8_000 })
  })

  test('formulaire de création de bateau se charge', async ({ page }) => {
    await page.goto('/proprietaire/bateaux/nouveau')
    await expect(page).toHaveURL('/proprietaire/bateaux/nouveau')
    await expect(page.getByLabel(/nom|name|title|titre/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('page des revenus se charge avec les données', async ({ page }) => {
    await page.goto('/proprietaire/revenus')
    await expect(page).toHaveURL('/proprietaire/revenus')
    await expect(
      page.getByText(/revenu|revenue|total|mois|month|€/i).first(),
    ).toBeVisible({ timeout: 8_000 })
  })

  test('réservations du propriétaire accessibles', async ({ page }) => {
    await page.goto('/proprietaire/reservations')
    await expect(page).toHaveURL('/proprietaire/reservations')
    await expect(
      page.getByText(/booking|réservation|aucune|no booking|pending|history/i).first(),
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
    const apiUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000'

    /** Récupère (ou crée en brouillon) un bateau du propriétaire connecté. */
    async function resolveOwnerBoatId(): Promise<number | null> {
      return page.evaluate(async (base) => {
        const raw = localStorage.getItem('sailingloc-auth')
        if (!raw) return null
        const token = (JSON.parse(raw) as { state?: { accessToken?: string } }).state?.accessToken
        if (!token) return null
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        const listRes = await fetch(`${base}/api/boats/my`, { headers })
        if (listRes.ok) {
          const json = (await listRes.json()) as { data?: Array<{ id: number }> }
          const first = json.data?.[0]?.id
          if (first) return first
        }

        // Compte demo parfois sans bateaux seedés → brouillon minimal
        const createRes = await fetch(`${base}/api/boats`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `[E2E] Dispo ${Date.now()}`,
            type: 'SAILBOAT',
            city: 'Marseille',
            port: 'Vieux-Port',
            country: 'France',
            capacity: 4,
            dailyRate: 100,
            status: 'draft',
          }),
        })
        if (!createRes.ok) return null
        const created = (await createRes.json()) as { id?: number }
        return created.id ?? null
      }, apiUrl)
    }

    await page.goto('/proprietaire/bateaux')
    await expect(
      page.getByRole('heading', { name: /my boats|mes bateaux/i }),
    ).toBeVisible({ timeout: 10_000 })

    // MyBoats utilise un <button> (pas un <a>) — attendre la fin du spinner
    const dispoBtn = page.getByRole('button', {
      name: /disponibilit|availability|calendrier|calendar/i,
    }).first()
    const emptyState = page.getByText(/no boats yet|aucun bateau|no boats/i).first()

    await expect(dispoBtn.or(emptyState).first()).toBeVisible({ timeout: 15_000 })

    if (await dispoBtn.isVisible().catch(() => false)) {
      await dispoBtn.click()
    } else {
      const boatId = await resolveOwnerBoatId()
      expect(boatId, 'Impossible de résoudre un bateau propriétaire pour le test dispo').toBeTruthy()
      await page.goto(`/proprietaire/bateaux/${boatId}/disponibilites`)
    }

    await expect(page).toHaveURL(/\/proprietaire\/bateaux\/\d+\/disponibilites/)
    await expect(
      page.getByText(/disponibilit|availability|gérer/i).first(),
    ).toBeVisible({ timeout: 8_000 })
  })
})
