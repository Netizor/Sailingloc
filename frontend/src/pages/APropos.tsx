import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Anchor,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronDown,
  CreditCard,
  FileText,
  Headphones,
  MessageCircle,
  MessageSquareQuote,
  ShieldCheck,
  Ship,
  Star,
  UserCheck,
} from 'lucide-react'
import { FEATURED_TESTIMONIAL, pickLocale } from '../data/testimonials'
import { usePageTitle } from '../hooks/usePageTitle'
import { cn } from '../lib/utils'

const STATS = [
  { value: '52+', labelKey: 'aboutPage.stats.ports' },
  { value: '4.9/5', labelKey: 'aboutPage.stats.rating' },
  { value: '24/7', labelKey: 'aboutPage.stats.support' },
  { value: '100%', labelKey: 'aboutPage.stats.payments' },
] as const

const PROMISE_ITEMS = [
  { icon: ShieldCheck, titleKey: 'aboutPage.promise.insurance.title', descKey: 'aboutPage.promise.insurance.desc' },
  { icon: BadgeCheck, titleKey: 'aboutPage.promise.verified.title', descKey: 'aboutPage.promise.verified.desc' },
  { icon: CreditCard, titleKey: 'aboutPage.promise.payment.title', descKey: 'aboutPage.promise.payment.desc' },
  { icon: Headphones, titleKey: 'aboutPage.promise.support.title', descKey: 'aboutPage.promise.support.desc' },
] as const

const STEP_KEYS = ['1', '2', '3', '4'] as const

const FEATURE_ITEMS = [
  { icon: Calendar, titleKey: 'aboutPage.features.booking.title', descKey: 'aboutPage.features.booking.desc' },
  { icon: FileText, titleKey: 'aboutPage.features.contract.title', descKey: 'aboutPage.features.contract.desc' },
  { icon: MessageCircle, titleKey: 'aboutPage.features.messaging.title', descKey: 'aboutPage.features.messaging.desc' },
  { icon: UserCheck, titleKey: 'aboutPage.features.kyc.title', descKey: 'aboutPage.features.kyc.desc' },
] as const

const AUDIENCE_KEYS = ['renter', 'owner'] as const

const BADGE_ITEMS = [
  { icon: BadgeCheck, key: 'verified' },
  { icon: CreditCard, key: 'secure' },
  { icon: Headphones, key: 'support' },
  { icon: Star, key: 'rating' },
] as const

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
      <p className="text-brand-blue text-sm font-medium mb-3">{label}</p>
      <h2 className="text-3xl lg:text-4xl font-serif font-bold text-brand-navy dark:text-white">{title}</h2>
      {subtitle && <p className="mt-4 text-brand-slate dark:text-gray-200 leading-relaxed">{subtitle}</p>}
    </div>
  )
}

const APropos: React.FC = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [openFaq, setOpenFaq] = useState<string | null>('1')

  usePageTitle(t('aboutPage.pageTitle'))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-brand-navy dark:text-gray-100">
      {/* Hero */}
      <section
        className="relative min-h-[560px] lg:min-h-[600px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,51,102,.45), rgba(0,51,102,.75)), url('/view-luxurious-yacht-water.jpg')",
        }}
      >
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-xs tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              <Anchor size={14} />
              {t('aboutPage.heroBadge')}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-[1.1]">
              {t('aboutPage.heroTitle')}
              <br />
              <span className="italic text-white">{t('aboutPage.heroTitleAccent')}</span>
            </h1>
            <p className="mt-6 text-white/90 text-base sm:text-lg leading-relaxed max-w-xl">
              {t('aboutPage.heroSubtitle')}
            </p>
            <a
              href="#mission"
              className="mt-8 inline-flex items-center gap-2 bg-brand-blue hover:bg-ocean-600 text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-colors"
            >
              {t('aboutPage.heroCta')}
              <ArrowDown size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="px-6 sm:px-8 lg:px-12 py-16 bg-white dark:bg-gray-800 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy dark:text-white mb-6">
            {t('aboutPage.missionTitle')}
          </h2>
          <p className="text-brand-slate dark:text-gray-200 leading-relaxed mb-4">{t('aboutPage.missionP1')}</p>
          <p className="text-brand-slate dark:text-gray-200 leading-relaxed">{t('aboutPage.missionP2')}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f8f9fa] dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">{stat.value}</p>
                <p className="text-sm text-brand-slate dark:text-gray-200 mt-1">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagements */}
      <section className="px-6 sm:px-8 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('aboutPage.promiseLabel')}
            title={t('aboutPage.promiseTitle')}
            subtitle={t('aboutPage.promiseSubtitle')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROMISE_ITEMS.map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 text-brand-blue mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-brand-slate dark:text-gray-200 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('aboutPage.journeyLabel')}
            title={t('aboutPage.journeyTitle')}
            subtitle={t('aboutPage.journeySubtitle')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEP_KEYS.map((key, index) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-ocean-50 dark:bg-gray-900 p-6"
              >
                <span className="text-4xl font-serif font-bold text-brand-blue/20 dark:text-brand-blue/30">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-semibold mt-2 mb-2">{t(`aboutPage.steps.${key}.title`)}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-200 leading-relaxed">
                  {t(`aboutPage.steps.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section id="plateforme" className="px-6 sm:px-8 lg:px-12 py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('aboutPage.featuresLabel')}
            title={t('aboutPage.featuresTitle')}
            subtitle={t('aboutPage.featuresSubtitle')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURE_ITEMS.map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="flex gap-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 text-brand-blue">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1.5">{t(titleKey)}</h3>
                  <p className="text-sm text-brand-slate dark:text-gray-200 leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Renters / Owners */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            label={t('aboutPage.audienceLabel')}
            title={t('aboutPage.audienceTitle')}
            subtitle={t('aboutPage.audienceSubtitle')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AUDIENCE_KEYS.map((key) => {
              const isRenter = key === 'renter'
              const features = t(`aboutPage.audience.${key}.features`, { returnObjects: true }) as string[]
              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-2xl p-8 flex flex-col',
                    isRenter
                      ? 'bg-brand-blue text-white shadow-xl ring-2 ring-brand-blue/40'
                      : 'bg-ocean-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
                  )}
                >
                  {isRenter && (
                    <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider bg-brand-blue text-white px-3 py-1 rounded-full mb-4">
                      {t('aboutPage.audiencePopular')}
                    </span>
                  )}
                  <h3 className="text-xl font-serif font-bold">{t(`aboutPage.audience.${key}.name`)}</h3>
                  <p className={cn('text-sm mt-1 mb-6', isRenter ? 'text-white/90' : 'text-brand-slate dark:text-gray-200')}>
                    {t(`aboutPage.audience.${key}.tagline`)}
                  </p>
                  <ul className="space-y-3 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <BadgeCheck size={16} className={cn('shrink-0 mt-0.5', isRenter ? 'text-brand-blue' : 'text-brand-blue dark:text-ocean-300')} />
                        <span className={isRenter ? 'text-white/90' : 'text-brand-slate dark:text-gray-300'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={isRenter ? '/bateaux' : '/devenir-proprietaire'}
                    className={cn(
                      'mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors',
                      isRenter
                        ? 'bg-white text-brand-navy hover:bg-gray-100'
                        : 'bg-brand-blue text-white hover:bg-ocean-600',
                    )}
                  >
                    {t(`aboutPage.audience.${key}.cta`)}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 sm:px-8 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="italic font-serif text-2xl sm:text-3xl leading-snug">
              &ldquo;{t('aboutPage.quote')}&rdquo;
            </p>
            <p className="mt-6 text-brand-slate dark:text-gray-200 leading-relaxed">{t('aboutPage.quoteBody')}</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGE_ITEMS.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <span className="bg-ocean-100 dark:bg-ocean-900/40 text-brand-navy dark:text-brand-blue p-2.5 rounded-full shrink-0">
                    <Icon size={16} />
                  </span>
                  <p className="font-semibold text-sm">{t(`aboutPage.badges.${key}`)}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src="/boat-navigating-through-canyon.jpg"
            alt=""
            className="rounded-2xl shadow-2xl w-full h-[380px] object-cover"
          />
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-ocean-800 text-white p-8 sm:p-10 shadow-xl">
            <MessageSquareQuote size={100} className="absolute -right-2 -bottom-2 text-white/5 pointer-events-none" strokeWidth={1} />
            <p className="text-brand-blue text-xs font-bold uppercase tracking-widest mb-4">{t('aboutPage.testimonialLabel')}</p>
            <blockquote className="font-serif text-lg sm:text-xl leading-relaxed max-w-3xl mb-6">
              &ldquo;{pickLocale(FEATURED_TESTIMONIAL.text, lang)}&rdquo;
            </blockquote>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
                  {FEATURED_TESTIMONIAL.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{FEATURED_TESTIMONIAL.name}</p>
                  <p className="text-xs text-ocean-200">{pickLocale(FEATURED_TESTIMONIAL.role, lang)}</p>
                </div>
              </div>
              <Link
                to="/temoignages"
                className="inline-flex items-center gap-2 text-sm font-semibold border border-white/30 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-colors self-start sm:self-auto"
              >
                {t('aboutPage.testimonialCta')}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-white dark:bg-gray-800">
        <div className="max-w-3xl mx-auto">
          <SectionHeading label={t('aboutPage.faqLabel')} title={t('aboutPage.faqTitle')} />
          <div className="space-y-3">
            {FAQ_KEYS.map((key) => {
              const isOpen = openFaq === key
              return (
                <div key={key} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-ocean-50 dark:bg-gray-900 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-sm sm:text-base">{t(`aboutPage.faq.${key}.q`)}</span>
                    <ChevronDown size={18} className={cn('shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-brand-slate dark:text-gray-200 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
                      {t(`aboutPage.faq.${key}.a`)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-center mt-8">
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-ocean-600 dark:hover:text-ocean-300 transition-colors"
            >
              {t('aboutPage.faqSeeAll')}
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-8 lg:px-12 py-20">
        <div className="max-w-3xl mx-auto bg-brand-navy text-white rounded-2xl shadow-2xl px-8 sm:px-10 py-12 text-center relative overflow-hidden">
          <Anchor size={100} className="absolute right-6 top-4 text-white/10 pointer-events-none" />
          <Ship size={40} className="mx-auto mb-4 text-brand-blue/70" />
          <h2 className="text-2xl sm:text-3xl font-serif relative z-10">{t('aboutPage.ctaTitle')}</h2>
          <p className="mt-4 text-white/75 max-w-lg mx-auto relative z-10">{t('aboutPage.ctaSubtitle')}</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 relative z-10">
            <Link to="/bateaux" className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-ocean-600 px-7 py-3 rounded-full text-sm font-semibold transition-colors">
              {t('aboutPage.ctaBoats')} <ArrowRight size={15} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 px-7 py-3 rounded-xl text-sm font-semibold transition-colors">
              {t('aboutPage.ctaContact')}
            </Link>
            <Link to="/temoignages" className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 px-7 py-3 rounded-xl text-sm font-semibold transition-colors">
              {t('aboutPage.ctaTestimonials')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default APropos
