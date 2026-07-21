import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck,
  ConciergeBell,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

const STATS = [
  { value: '150+', labelKey: 'becomeOwnerPage.stats.boats' },
  { value: '4.9/5', labelKey: 'becomeOwnerPage.stats.rating' },
  { value: '€12M', labelKey: 'becomeOwnerPage.stats.revenue' },
  { value: '24h', labelKey: 'becomeOwnerPage.stats.support' },
]

const STEPS = [
  {
    number: 1,
    titleKey: 'becomeOwnerPage.steps.1.title',
    descKey: 'becomeOwnerPage.steps.1.desc',
  },
  {
    number: 2,
    titleKey: 'becomeOwnerPage.steps.2.title',
    descKey: 'becomeOwnerPage.steps.2.desc',
  },
  {
    number: 3,
    titleKey: 'becomeOwnerPage.steps.3.title',
    descKey: 'becomeOwnerPage.steps.3.desc',
  },
]

const DevenirProprietaire: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  usePageTitle(t('becomeOwnerPage.pageTitle'))

  const goToAuth = () => navigate('/devenir-proprietaire/commencer')

  return (
    <div className="bg-white dark:bg-gray-900 text-brand-navy dark:text-gray-100">
      {/* Hero */}
      <section className="relative min-h-[520px] sm:min-h-[600px] flex items-center">
        <img
          src="/view-luxurious-yacht-water.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/80 via-brand-navy/55 to-brand-navy/30" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <span className="inline-block text-[11px] font-bold tracking-widest text-brand-blue bg-white/95 dark:bg-gray-900/90 px-3 py-1 rounded-full uppercase mb-5">
            {t('becomeOwnerPage.heroBadge')}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-2xl leading-tight mb-4">
            {t('becomeOwnerPage.heroTitle')}
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            {t('becomeOwnerPage.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={goToAuth}
              className="px-8 py-3.5 text-sm font-semibold text-white bg-brand-blue hover:bg-ocean-600 rounded-full transition-colors"
            >
              {t('becomeOwnerPage.heroCtaStart')}
            </button>
            <Link
              to="/guide-proprietaire"
              className="px-8 py-3.5 text-sm font-semibold text-white border-2 border-white/50 hover:bg-white/10 rounded-full transition-colors text-center"
            >
              {t('becomeOwnerPage.heroCtaGuide')}
            </Link>
          </div>
        </div>
      </section>

      {/* Why SailingLoc */}
      <section id="pourquoi" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-brand-blue text-sm font-medium mb-3">{t('becomeOwnerPage.whyLabel')}</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white mb-4">
              {t('becomeOwnerPage.whyTitle')}
            </h2>
            <p className="text-brand-slate dark:text-gray-400 text-sm sm:text-base leading-relaxed">
              {t('becomeOwnerPage.whySubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="relative rounded-2xl overflow-hidden min-h-[320px] group">
              <img
                src="/view-luxurious-cruise-ship.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-8 text-white">
                <TrendingUp size={28} className="mb-3 text-brand-blue" />
                <h3 className="text-xl font-bold mb-2">{t('becomeOwnerPage.why.income.title')}</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {t('becomeOwnerPage.why.income.desc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="bg-ocean-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 flex-1">
                <ShieldCheck size={28} className="text-brand-navy dark:text-brand-blue mb-4" />
                <h3 className="text-lg font-bold text-brand-navy dark:text-white mb-2">{t('becomeOwnerPage.why.secure.title')}</h3>
                <p className="text-brand-slate dark:text-gray-400 text-sm leading-relaxed">
                  {t('becomeOwnerPage.why.secure.desc')}
                </p>
              </div>
              <div className="bg-brand-navy rounded-2xl p-8 flex-1 text-white">
                <ConciergeBell size={28} className="mb-4 text-brand-blue" />
                <h3 className="text-lg font-bold mb-2">{t('becomeOwnerPage.why.concierge.title')}</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {t('becomeOwnerPage.why.concierge.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-brand-navy py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {STATS.map((stat) => (
            <div key={stat.labelKey}>
              <p className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-white/70">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Journey */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-[#f8f9fa] dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white text-center mb-12">
            {t('becomeOwnerPage.journeyTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 text-center"
              >
                <div className="h-12 w-12 rounded-full bg-brand-navy text-white text-lg font-bold flex items-center justify-center mx-auto mb-5">
                  {step.number}
                </div>
                <h3 className="font-bold text-brand-navy dark:text-white mb-2">{t(step.titleKey)}</h3>
                <p className="text-brand-slate dark:text-gray-400 text-sm leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto bg-brand-navy text-white rounded-2xl shadow-2xl px-8 sm:px-10 py-12 text-center relative overflow-hidden">
          <ConciergeBell size={100} className="absolute right-6 top-4 text-white/10 pointer-events-none" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold relative z-10">
            {t('becomeOwnerPage.ctaTitle')}
          </h2>
          <p className="mt-4 text-white/75 max-w-lg mx-auto relative z-10 text-sm sm:text-base">
            {t('becomeOwnerPage.ctaSubtitle')}
          </p>
          <button
            type="button"
            onClick={goToAuth}
            className="mt-8 inline-flex items-center gap-2 px-10 py-4 text-sm font-semibold text-white bg-brand-blue hover:bg-ocean-600 rounded-full transition-colors relative z-10"
          >
            {t('becomeOwnerPage.ctaButton')}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  )
}

export default DevenirProprietaire
