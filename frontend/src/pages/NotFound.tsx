import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '../hooks/usePageTitle'
import { SEO } from '../components/SEO'

const HERO_IMAGE = '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg'

const NotFound: React.FC = () => {
  const { t } = useTranslation()
  usePageTitle(t('notFound.pageTitle'))

  return (
    <>
      <SEO
        title={`${t('notFound.pageTitle')} | SailingLoc`}
        description={t('notFound.subtitle')}
      />

      <div className="bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 min-h-[calc(100vh-72px-1px)]">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-8 sm:mb-10 overflow-hidden rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <img
              src={HERO_IMAGE}
              alt=""
              className="w-full h-48 sm:h-56 object-cover"
              loading="eager"
            />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-[#003366] dark:text-white leading-tight mb-4">
            {t('notFound.title')}
          </h1>

          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed mb-8 sm:mb-10">
            {t('notFound.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white bg-[#2563FF] hover:bg-[#1D4ED8] rounded-lg transition-colors"
            >
              {t('notFound.backHome')}
            </Link>
            <Link
              to="/bateaux"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#003366] dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 hover:border-[#003366] dark:hover:border-gray-400 rounded-lg transition-colors"
            >
              {t('notFound.seeFleet')}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound
