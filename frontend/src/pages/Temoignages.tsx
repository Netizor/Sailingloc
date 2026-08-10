import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BadgeCheck,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'
import TestimonialCard from '../components/testimonials/TestimonialCard'
import {
  FEATURED_TESTIMONIAL,
  TESTIMONIAL_STATS,
  TESTIMONIALS,
  pickLocale,
  type TestimonialCategory,
} from '../data/testimonials'
import { usePageTitle } from '../hooks/usePageTitle'

type FilterKey = 'all' | TestimonialCategory

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    titleKey: 'testimonials.trust.security.title',
    descKey: 'testimonials.trust.security.desc',
  },
  {
    icon: BadgeCheck,
    titleKey: 'testimonials.trust.verified.title',
    descKey: 'testimonials.trust.verified.desc',
  },
  {
    icon: Users,
    titleKey: 'testimonials.trust.community.title',
    descKey: 'testimonials.trust.community.desc',
  },
] as const

const Temoignages: React.FC = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [filter, setFilter] = useState<FilterKey>('all')

  usePageTitle(t('testimonials.pageTitle'))

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('testimonials.filters.all') },
    { key: 'renter', label: t('testimonials.filters.renters') },
    { key: 'owner', label: t('testimonials.filters.owners') },
  ]

  const filtered = useMemo(
    () => (filter === 'all' ? TESTIMONIALS : TESTIMONIALS.filter((item) => item.category === filter)),
    [filter],
  )

  const stats = [
    { value: `${TESTIMONIAL_STATS.averageRating}/5`, label: t('testimonials.stats.rating') },
    { value: `${TESTIMONIAL_STATS.totalReviews}+`, label: t('testimonials.stats.reviews') },
    { value: `${TESTIMONIAL_STATS.satisfactionRate}%`, label: t('testimonials.stats.satisfaction') },
    { value: `${TESTIMONIAL_STATS.portsCount}+`, label: t('testimonials.stats.ports') },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900">
      {/* Hero */}
      <section className="relative min-h-[480px] sm:min-h-[540px] flex items-center">
        <img
          src="/view-luxurious-yacht-water.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071d49]/95 via-[#071d49]/80 to-[#0A737A]/60" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/90 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full uppercase mb-6">
            <Star size={13} className="text-amber-300" fill="currentColor" />
            {t('testimonials.heroBadge')}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-3xl leading-tight mb-4">
            {t('testimonials.heroTitle')}
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
            {t('testimonials.heroSubtitle')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="text-amber-300" fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <span className="text-white font-semibold text-sm">{TESTIMONIAL_STATS.averageRating}/5</span>
              <span className="text-white/70 text-sm">
                {t('testimonials.stats.reviewsCount', { count: TESTIMONIAL_STATS.totalReviews })}
              </span>
            </div>
            <a
              href="#avis"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/40 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-colors"
            >
              {t('testimonials.readReviews')}
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">{stat.value}</p>
                <p className="text-sm text-brand-slate dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured quote */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-ocean-800 text-white p-8 sm:p-12 shadow-xl">
          <MessageSquareQuote
            size={120}
            className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none"
            strokeWidth={1}
          />
          <div className="relative z-10 max-w-3xl">
            <p className="text-ocean-200 text-xs font-bold uppercase tracking-widest mb-4">
              {t('testimonials.featuredLabel')}
            </p>
            <blockquote className="font-serif text-xl sm:text-2xl leading-relaxed mb-8">
              &ldquo;{pickLocale(FEATURED_TESTIMONIAL.text, lang)}&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
                {FEATURED_TESTIMONIAL.avatar}
              </div>
              <div>
                <p className="font-semibold">{FEATURED_TESTIMONIAL.name}</p>
                <p className="text-sm text-ocean-200">
                  {pickLocale(FEATURED_TESTIMONIAL.role, lang)} · {FEATURED_TESTIMONIAL.location}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews grid */}
      <section id="avis" className="scroll-mt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy dark:text-white mb-3">
              {t('testimonials.gridTitle')}
            </h2>
            <p className="text-brand-slate dark:text-gray-400 max-w-2xl mx-auto">
              {t('testimonials.gridSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  filter === item.key
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-brand-slate dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-blue/30',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white text-center mb-10">
            {t('testimonials.trustTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUST_PILLARS.map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-[#f8f9fa] dark:bg-gray-900 p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-brand-navy dark:text-white mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-brand-slate dark:text-gray-400 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-ocean-900 to-ocean-700 text-white px-6 py-12 sm:px-12 shadow-lg">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">{t('testimonials.ctaTitle')}</h2>
          <p className="text-ocean-100 mb-8 max-w-xl mx-auto">{t('testimonials.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/bateaux"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-navy font-semibold rounded-xl hover:bg-ocean-50 transition-colors"
            >
              {t('testimonials.ctaBrowse')}
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/devenir-proprietaire"
              className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              {t('testimonials.ctaOwner')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Temoignages
