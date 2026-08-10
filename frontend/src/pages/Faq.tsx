import React, { useMemo, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'all' | 'reservations' | 'paiements' | 'proprietaires' | 'securite'

interface FaqEntry {
  // Stable identifier for React key, ARIA refs, and i18n lookup
  id: string
  category: Exclude<Category, 'all'>
}

// ─── Structure (copy lives in faqPage.* locales) ──────────────────────────────

const FAQ_DATA: FaqEntry[] = [
  { id: 'res-comment-reserver', category: 'reservations' },
  { id: 'res-contrat', category: 'reservations' },
  { id: 'res-annuler', category: 'reservations' },
  { id: 'res-refus', category: 'reservations' },
  { id: 'res-delai', category: 'reservations' },
  { id: 'res-modifier-dates', category: 'reservations' },
  { id: 'pai-modes', category: 'paiements' },
  { id: 'pai-debit', category: 'paiements' },
  { id: 'pai-caution', category: 'paiements' },
  { id: 'pai-remboursement', category: 'paiements' },
  { id: 'pai-frais', category: 'paiements' },
  { id: 'pro-mettre-en-location', category: 'proprietaires' },
  { id: 'pro-documents', category: 'proprietaires' },
  { id: 'pro-commissions', category: 'proprietaires' },
  { id: 'pro-paiements', category: 'proprietaires' },
  { id: 'pro-bloquer-dates', category: 'proprietaires' },
  { id: 'sec-assurance', category: 'securite' },
  { id: 'sec-dommages', category: 'securite' },
  { id: 'sec-verification-locataires', category: 'securite' },
  { id: 'sec-permis', category: 'securite' },
  { id: 'sec-verification-proprietaires', category: 'securite' },
]

const CATEGORY_TABS: Category[] = [
  'all',
  'reservations',
  'paiements',
  'proprietaires',
  'securite',
]

// ─── Accordion component ──────────────────────────────────────────────────────

interface FaqItemProps {
  question: string
  answer: string
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false)
  // Stable unique id to link the button to its panel (WAI-ARIA accordion)
  const panelId = useId()

  return (
    <div className="py-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 text-left group"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
          {question}
        </span>
        {/* 180° rotation on open via CSS grid trick */}
        <ChevronDown
          size={20}
          className={`shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* CSS grid animation: grid-rows-[0fr] → grid-rows-[1fr] */}
      <div
        id={panelId}
        role="region"
        aria-label={question}
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// ─── FAQ page ─────────────────────────────────────────────────────────────────

const Faq: React.FC = () => {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  usePageTitle(t('faqPage.pageTitle'))

  // Memoize filtering to avoid recalculating on every render
  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? FAQ_DATA
        : FAQ_DATA.filter((item) => item.category === activeCategory),
    [activeCategory],
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Hero */}
      <section className="relative min-h-[420px] sm:min-h-[480px] flex items-center justify-center text-center px-4">
        <img
          src="/boat-navigating-through-canyon.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071d49]/80 via-[#071d49]/65 to-[#071d49]/85" />
        <div className="relative z-10 max-w-2xl py-20 text-white">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <HelpCircle size={15} />
            {t('faqPage.heroBadge')}
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-4">
            {t('faqPage.heroTitle')}
          </h1>
          <p className="text-lg text-white/85 leading-relaxed">
            {t('faqPage.heroSubtitle')}{' '}
            <Link to="/contact" className="text-teal-300 hover:text-teal-200 underline underline-offset-2">
              {t('faqPage.ctaButton')}
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category tabs - same style as OwnerBookings, ARIA tablist semantics */}
        <div
          role="tablist"
          aria-label={t('faqPage.categoriesLabel')}
          className="flex flex-wrap gap-1 mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl p-1 w-fit"
        >
          {CATEGORY_TABS.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeCategory === key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeCategory === key
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t(`faqPage.categories.${key}`)}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700 px-6">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <FaqItem
                key={item.id}
                question={t(`faqPage.items.${item.id}.q`)}
                answer={t(`faqPage.items.${item.id}.a`)}
              />
            ))
          ) : (
            // Defensive fallback: shown if a category were ever empty
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              {t('faqPage.empty')}
            </p>
          )}
        </div>

        {/* End-of-page CTA */}
        <div className="mt-10 bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl p-8 text-center border border-ocean-100 dark:border-ocean-800">
          <MessageCircle size={32} className="text-ocean-600 dark:text-ocean-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('faqPage.ctaTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {t('faqPage.ctaSubtitle')}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-ocean-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            {t('faqPage.ctaButton')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Faq
