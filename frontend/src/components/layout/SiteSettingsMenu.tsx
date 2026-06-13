import React from 'react'
import { Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { usePreferencesStore } from '../../store/preferences.store'

interface SiteSettingsMenuProps {
  variant?: 'header' | 'mobile'
}

const SiteSettingsMenu: React.FC<SiteSettingsMenuProps> = ({ variant = 'header' }) => {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme, colorBlindMode, toggleColorBlind } = usePreferencesStore()

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'fr'
  const isYellowMode = colorBlindMode === 'yellow'

  const switchLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang)
  }

  const colorBlindButtonClass = cn(
    'p-2 rounded-lg transition-colors',
    isYellowMode
      ? 'text-black bg-[#FFFF00] ring-2 ring-black'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
  )

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            {t('nav.language')}
          </p>
          <div className="flex gap-2">
            <LangButton lang="fr" current={currentLang} onClick={() => switchLanguage('fr')} label={t('accessibility.french')} />
            <LangButton lang="en" current={currentLang} onClick={() => switchLanguage('en')} label={t('accessibility.english')} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
          </button>

          <button
            type="button"
            onClick={toggleColorBlind}
            aria-label={isYellowMode ? t('accessibility.colorBlindOff') : t('accessibility.colorBlindOn')}
            aria-pressed={isYellowMode}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isYellowMode
                ? 'bg-[#FFFF00] text-black font-semibold ring-2 ring-black'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            {isYellowMode ? <Eye size={18} /> : <EyeOff size={18} />}
            {isYellowMode ? t('accessibility.colorBlindOff') : t('accessibility.colorBlindOn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div
        className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
        role="group"
        aria-label={t('nav.language')}
      >
        <button
          type="button"
          onClick={() => switchLanguage('fr')}
          className={cn(
            'px-2.5 py-1.5 text-xs font-bold transition-colors',
            currentLang === 'fr'
              ? 'bg-[#2563FF] text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
          aria-pressed={currentLang === 'fr'}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => switchLanguage('en')}
          className={cn(
            'px-2.5 py-1.5 text-xs font-bold transition-colors',
            currentLang === 'en'
              ? 'bg-[#2563FF] text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
          aria-pressed={currentLang === 'en'}
        >
          EN
        </button>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button
        type="button"
        onClick={toggleColorBlind}
        aria-label={isYellowMode ? t('accessibility.colorBlindOff') : t('accessibility.colorBlindOn')}
        aria-pressed={isYellowMode}
        className={colorBlindButtonClass}
      >
        {isYellowMode ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  )
}

interface LangButtonProps {
  lang: 'fr' | 'en'
  current: string
  onClick: () => void
  label: string
}

const LangButton: React.FC<LangButtonProps> = ({ lang, current, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      current === lang
        ? 'bg-[#2563FF] text-white'
        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
    )}
    aria-pressed={current === lang}
  >
    {label}
  </button>
)

export default SiteSettingsMenu
