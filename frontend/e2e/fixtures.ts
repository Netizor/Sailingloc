import { test as base } from '@playwright/test'

/** Injecte le consentement cookies avant toute navigation (évite le modal bloquant). */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      // Doit matcher CONSENT_VERSION dans CookieBanner.tsx (sinon le modal reste ouvert)
      const consent = JSON.stringify({
        version: '3',
        essential: true,
        analytical: false,
        marketing: false,
        date: new Date().toISOString(),
      })
      localStorage.setItem('sailingloc-cookie-consent', consent)
      document.cookie = `sailingloc_consent=${encodeURIComponent(consent)};path=/;SameSite=Lax`

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
