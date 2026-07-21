import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const STORAGE_KEY = 'sailingloc_lang'

const stored = localStorage.getItem(STORAGE_KEY)
const initialLang = stored === 'fr' || stored === 'en' ? stored : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

document.documentElement.lang = initialLang

i18n.on('languageChanged', (lng) => {
  const normalized = lng.startsWith('en') ? 'en' : 'fr'
  localStorage.setItem(STORAGE_KEY, normalized)
  document.documentElement.lang = normalized
})

export default i18n
