import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const STORAGE_KEY = 'sailingloc_lang'

const initialLang = localStorage.getItem(STORAGE_KEY) ?? 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

document.documentElement.lang = initialLang.startsWith('en') ? 'en' : 'fr'

// Persist language choice
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
  document.documentElement.lang = lng.startsWith('en') ? 'en' : 'fr'
})

export default i18n
