import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

const LEGAL_LINKS = [
  { to: '/mentions-legales', labelKey: 'legal.nav.mentions' },
  { to: '/cgu', labelKey: 'legal.nav.cgu' },
  { to: '/rgpd', labelKey: 'legal.nav.privacy' },
  { to: '/cookies', labelKey: 'legal.nav.cookies' },
] as const

/**
 * Mise en page documentation légale : sidebar + carte de contenu (alignée maquette Informations Légales).
 */
const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <aside className="lg:w-56 flex-shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-4">
              {t('legal.documentation')}
            </p>
            <nav className="space-y-1" aria-label={t('legal.documentation')}>
              {LEGAL_LINKS.map(({ to, labelKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'block py-2.5 pl-4 pr-3 text-sm border-l-[3px] transition-colors',
                      isActive
                        ? 'border-[#1A6FA8] text-[#003366] dark:text-white font-semibold bg-white/60 dark:bg-gray-800/60'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-[#003366] dark:hover:text-gray-200',
                    ].join(' ')
                  }
                >
                  {t(labelKey)}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-6 sm:px-10 py-8 sm:py-10 mb-6">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#003366] dark:text-white leading-tight">
                {title}
              </h1>
              <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">{lastUpdated}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-6 sm:px-10 py-8 sm:py-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LegalPageLayout
