import { test as base } from '@playwright/test'

/** Injecte le consentement cookies avant toute navigation (évite le modal bloquant). */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
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
      // Évite que initSessionGuard() invalide une session injectée par loginAs()
      if (localStorage.getItem('sailingloc-auth')) {
        localStorage.setItem('sailingloc-remember-me', 'true')
        sessionStorage.setItem('sailingloc-session-active', '1')
      }
    })
    await use(page)
  },
})

export { expect } from '@playwright/test'
