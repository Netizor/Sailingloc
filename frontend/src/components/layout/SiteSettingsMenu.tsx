import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { usePreferencesStore } from '../../store/preferences.store'
import FlagIcon from '../ui/FlagIcon'

interface SiteSettingsMenuProps {
  variant?: 'header' | 'mobile'
}

const LANG_FLAG_CODE = {
  fr: 'fr',
  en: 'gb',
} as const

const SiteSettingsMenu: React.FC<SiteSettingsMenuProps> = ({ variant = 'header' }) => {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = usePreferencesStore()

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'fr'

  const switchLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang)
  }

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            {t('nav.language')}
          </p>
          <div className="flex gap-2">
            <LangFlagButton
              lang="fr"
              current={currentLang}
              onClick={() => switchLanguage('fr')}
              label={t('accessibility.french')}
              showLabel
            />
            <LangFlagButton
              lang="en"
              current={currentLang}
              onClick={() => switchLanguage('en')}
              label={t('accessibility.english')}
              showLabel
            />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
      <div
        className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5"
        role="group"
        aria-label={t('nav.language')}
      >
        <LangFlagButton
          lang="fr"
          current={currentLang}
          onClick={() => switchLanguage('fr')}
          label={t('accessibility.french')}
        />
        <LangFlagButton
          lang="en"
          current={currentLang}
          onClick={() => switchLanguage('en')}
          label={t('accessibility.english')}
        />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  )
}

interface LangFlagButtonProps {
  lang: 'fr' | 'en'
  current: string
  onClick: () => void
  label: string
  showLabel?: boolean
}

const LangFlagButton: React.FC<LangFlagButtonProps> = ({
  lang,
  current,
  onClick,
  label,
  showLabel = false,
}) => {
  const isActive = current === lang
  const flagCode = LANG_FLAG_CODE[lang]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all rounded-md',
        showLabel
          ? cn(
              'flex-1 px-3 py-2 text-sm font-medium',
              isActive
                ? 'bg-brand-blue text-white'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
            )
          : cn(
              'p-1.5',
              isActive
                ? 'bg-brand-blue/15 ring-2 ring-brand-blue'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 opacity-70 hover:opacity-100',
            ),
      )}
    >
      <FlagIcon code={flagCode} className={cn(showLabel ? 'h-4 w-6' : 'h-3.5 w-5')} />
      {showLabel && <span>{label}</span>}
    </button>
  )
}

export default SiteSettingsMenu
