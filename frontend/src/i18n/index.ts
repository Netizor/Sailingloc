import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const STORAGE_KEY = 'sailingloc_lang'

/** Normalise une valeur stockée / navigateur vers `fr` | `en`. */
function normalizeLang(value: string | null | undefined): 'fr' | 'en' | null {
  if (!value) return null
  if (value === 'fr' || value.startsWith('fr')) return 'fr'
  if (value === 'en' || value.startsWith('en')) return 'en'
  return null
}

/** Langue initiale : préférence utilisateur, sinon français (site FR). */
function resolveInitialLang(): 'fr' | 'en' {
  return (
    normalizeLang(localStorage.getItem(STORAGE_KEY)) ??
    normalizeLang(typeof navigator !== 'undefined' ? navigator.language : null) ??
    'fr'
  )
}

const initialLang = resolveInitialLang()

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: initialLang,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

document.documentElement.lang = initialLang

i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLang(lng) ?? 'fr'
  localStorage.setItem(STORAGE_KEY, normalized)
  document.documentElement.lang = normalized
})

export default i18n
