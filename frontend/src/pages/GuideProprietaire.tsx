import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Anchor,
  Camera,
  CalendarDays,
  Star,
  CheckCircle,
  FileText,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Steps to list a boat for rent ────────────────────────────────────────────

// #1 - Component reference instead of pre-rendered JSX in data
interface Step {
  number: string
  icon: LucideIcon
  titleKey: string
  descKey: string
}

const STEPS: Step[] = [
  { number: '01', icon: Anchor, titleKey: 'ownerGuidePage.steps.1.title', descKey: 'ownerGuidePage.steps.1.desc' },
  { number: '02', icon: Camera, titleKey: 'ownerGuidePage.steps.2.title', descKey: 'ownerGuidePage.steps.2.desc' },
  { number: '03', icon: CalendarDays, titleKey: 'ownerGuidePage.steps.3.title', descKey: 'ownerGuidePage.steps.3.desc' },
  { number: '04', icon: FileText, titleKey: 'ownerGuidePage.steps.4.title', descKey: 'ownerGuidePage.steps.4.desc' },
  { number: '05', icon: Star, titleKey: 'ownerGuidePage.steps.5.title', descKey: 'ownerGuidePage.steps.5.desc' },
]

// ─── Required documents checklist ─────────────────────────────────────────────

const DOCUMENT_KEYS = [0, 1, 2, 3, 4, 5, 6]

// ─── Revenue estimator ────────────────────────────────────────────────────────

type BoatTypeKey = 'INFLATABLE' | 'MOTORBOAT' | 'SAILBOAT' | 'CATAMARAN'

const DAILY_RATES: Record<BoatTypeKey, number> = {
  INFLATABLE: 120,
  MOTORBOAT: 250,
  SAILBOAT: 350,
  CATAMARAN: 600,
}

// #10 - Named constants for magic calculation values
/** Share collected by SailingLoc on each confirmed transaction (10%) */
const PLATFORM_COMMISSION = 0.10
/** Indicative length of the sailing season (in months) */
const SEASON_MONTHS = 10

// ─── Owner guide page ─────────────────────────────────────────────────────────

const GuideProprietaire: React.FC = () => {
  const { t } = useTranslation()
  // #6 - Tab title for SEO and accessibility
  usePageTitle(t('ownerGuidePage.pageTitle'))

  const [boatType, setBoatType] = useState<BoatTypeKey>('SAILBOAT')
  const [daysPerMonth, setDaysPerMonth] = useState(8)

  const dailyRate = DAILY_RATES[boatType] ?? 350
  // #10 - Use named constants
  const monthlyNet = Math.round(dailyRate * daysPerMonth * (1 - PLATFORM_COMMISSION))
  const yearlyNet = monthlyNet * SEASON_MONTHS

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* #2 - Hero extracted into shared PageHero component */}
      <PageHero
        icon={TrendingUp}
        badge={t('ownerGuidePage.heroBadge')}
        title={t('ownerGuidePage.heroTitle')}
        subtitle={t('ownerGuidePage.heroSubtitle')}
        backgroundImage="/view-luxurious-yacht.jpg"
      >
        <div className="mt-8">
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 bg-white text-ocean-800 font-semibold px-7 py-3 rounded-xl hover:bg-ocean-50 transition-colors text-sm"
          >
            {t('ownerGuidePage.heroCta')}
          </Link>
        </div>
      </PageHero>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Steps */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            {t('ownerGuidePage.stepsTitle')}
          </h2>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex items-start gap-5"
              >
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <span className="text-2xl font-black text-ocean-200 dark:text-ocean-700">{step.number}</span>
                  <div className="bg-ocean-50 dark:bg-ocean-900/30 p-2 rounded-xl">
                    {/* #1 - Instantiate on the fly from the component reference */}
                    <step.icon size={22} className="text-ocean-600 dark:text-ocean-400" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t(step.titleKey)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue estimator */}
        <section id="revenus" className="scroll-mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
                <TrendingUp size={20} className="text-ocean-700 dark:text-ocean-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('ownerGuidePage.estimatorTitle')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Boat type */}
              <div>
                {/* #5 - htmlFor/id for WCAG 2.1 accessibility */}
                <label htmlFor="boat-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('ownerGuidePage.boatTypeLabel')}
                </label>
                <select
                  id="boat-type"
                  value={boatType}
                  onChange={(e) => setBoatType(e.target.value as BoatTypeKey)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                >
                  {(Object.keys(DAILY_RATES) as BoatTypeKey[]).map((type) => (
                    <option key={type} value={type}>
                      {t(`ownerGuidePage.boatTypes.${type}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Days per month */}
              <div>
                {/* #5 - htmlFor/id + ARIA attributes on the range */}
                <label htmlFor="days-per-month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('ownerGuidePage.daysPerMonthLabel')} <span className="text-ocean-700 dark:text-ocean-400 font-bold">{daysPerMonth}</span>
                </label>
                <input
                  id="days-per-month"
                  type="range"
                  min={1}
                  max={25}
                  value={daysPerMonth}
                  aria-valuenow={daysPerMonth}
                  aria-valuemin={1}
                  aria-valuemax={25}
                  onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                  className="w-full accent-ocean-600"
                />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                  <span>{t('ownerGuidePage.daysMin')}</span>
                  <span>{t('ownerGuidePage.daysMax')}</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('ownerGuidePage.avgDailyRate')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dailyRate} €</p>
              </div>
              <div className="bg-ocean-50 dark:bg-ocean-900/30 rounded-xl p-4 text-center border border-ocean-100 dark:border-ocean-800">
                <p className="text-xs text-ocean-600 dark:text-ocean-400 mb-1">{t('ownerGuidePage.netMonthly')}</p>
                <p className="text-2xl font-bold text-ocean-800 dark:text-ocean-300">{monthlyNet} €</p>
              </div>
              <div className="bg-ocean-700 rounded-xl p-4 text-center">
                <p className="text-xs text-ocean-100 mb-1">{t('ownerGuidePage.netYearly', { months: SEASON_MONTHS })}</p>
                <p className="text-2xl font-bold text-white">{yearlyNet.toLocaleString('en-US')} €</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              {t('ownerGuidePage.estimatorNote', { percent: PLATFORM_COMMISSION * 100 })}
            </p>
          </div>
        </section>

        {/* Documents checklist */}
        <section>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
                <FileText size={20} className="text-ocean-700 dark:text-ocean-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('ownerGuidePage.documentsTitle')}</h2>
            </div>
            <ul className="space-y-3">
              {DOCUMENT_KEYS.map((index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={17} className="shrink-0 text-ocean-500 mt-0.5" />
                  {t(`ownerGuidePage.documents.${index}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl border border-ocean-100 dark:border-ocean-800 p-10">
          <Anchor size={36} className="text-ocean-600 dark:text-ocean-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('ownerGuidePage.ctaTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {t('ownerGuidePage.ctaSubtitle')}
          </p>
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-ocean-600 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            {t('ownerGuidePage.ctaButton')}
          </Link>
        </section>
      </div>
    </div>
  )
}

export default GuideProprietaire
