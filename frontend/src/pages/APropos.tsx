import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Anchor,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Clock,
  CreditCard,
  Headphones,
  Lock,
  Map,
  MessageSquareQuote,
  Plane,
  ShieldCheck,
  Ship,
  Star,
  Users,
  Utensils,
} from 'lucide-react'
import { FEATURED_TESTIMONIAL } from '../data/testimonials'
import { usePageTitle } from '../hooks/usePageTitle'
import { cn } from '../lib/utils'

const STATS = [
  { value: '52+', labelKey: 'servicesPage.stats.ports' },
  { value: '4.9/5', labelKey: 'servicesPage.stats.rating' },
  { value: '24/7', labelKey: 'servicesPage.stats.support' },
  { value: '100%', labelKey: 'servicesPage.stats.payments' },
] as const

const PROMISE_ITEMS = [
  { icon: ShieldCheck, titleKey: 'servicesPage.promise.insurance.title', descKey: 'servicesPage.promise.insurance.desc' },
  { icon: BadgeCheck, titleKey: 'servicesPage.promise.verified.title', descKey: 'servicesPage.promise.verified.desc' },
  { icon: CreditCard, titleKey: 'servicesPage.promise.payment.title', descKey: 'servicesPage.promise.payment.desc' },
  { icon: Headphones, titleKey: 'servicesPage.promise.support.title', descKey: 'servicesPage.promise.support.desc' },
] as const

const STEP_KEYS = ['1', '2', '3', '4'] as const

const OFFER_KEYS = ['essential', 'premium', 'concierge'] as const

const BADGE_ITEMS = [
  { icon: Users, key: 'concierge' },
  { icon: Lock, key: 'privacy' },
  { icon: Clock, key: 'response' },
  { icon: Star, key: 'rating' },
] as const

const FAQ_KEYS = ['1', '2', '3'] as const

function SectionHeading({
  label,
  title,
  subtitle,
  dark = false,
}: {
  label: string
  title: string
  subtitle?: string
  dark?: boolean
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
      <p className="text-teal-700 dark:text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">
        {label}
      </p>
      <h2 className={cn('text-3xl lg:text-4xl font-serif font-bold', dark ? 'text-white' : 'text-[#071d49] dark:text-white')}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-4 leading-relaxed', dark ? 'text-white/70' : 'text-gray-500 dark:text-gray-400')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

const APropos: React.FC = () => {
  const { t } = useTranslation()
  const [openFaq, setOpenFaq] = useState<string | null>('1')

  usePageTitle(t('servicesPage.pageTitle'))

  return (
    <div className="min-h-screen bg-[#f8f7ff] dark:bg-gray-900 text-[#071d49] dark:text-gray-100">
      {/* Hero */}
      <section
        className="relative min-h-[580px] lg:min-h-[640px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(3,18,50,.35), rgba(3,18,50,.72)), url('/services-hero.jpg')",
        }}
      >
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-xs tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              <Anchor size={14} />
              {t('servicesPage.heroBadge')}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-[1.1]">
              {t('servicesPage.heroTitle')}
              <br />
              <span className="italic text-teal-300">{t('servicesPage.heroTitleAccent')}</span>
            </h1>

            <p className="mt-6 text-white/90 text-base sm:text-lg leading-relaxed max-w-xl">
              {t('servicesPage.heroSubtitle')}
            </p>

            <a
              href="#services"
              className="mt-8 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              {t('servicesPage.heroCta')}
              <ArrowDown size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#071d49] dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform promise */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('servicesPage.promiseLabel')}
            title={t('servicesPage.promiseTitle')}
            subtitle={t('servicesPage.promiseSubtitle')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROMISE_ITEMS.map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="group rounded-2xl border border-gray-100 dark:border-gray-700 bg-[#f8f7ff] dark:bg-gray-800 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-[#071d49] dark:text-white mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-[#f3f2fb] dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('servicesPage.journeyLabel')}
            title={t('servicesPage.journeyTitle')}
            subtitle={t('servicesPage.journeySubtitle')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEP_KEYS.map((key, index) => (
              <div
                key={key}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm"
              >
                <span className="text-4xl font-serif font-bold text-teal-700/15 dark:text-teal-400/20">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-semibold text-[#071d49] dark:text-white mt-2 mb-2">
                  {t(`servicesPage.steps.${key}.title`)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(`servicesPage.steps.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium bento */}
      <section id="services" className="px-6 sm:px-8 lg:px-12 py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('servicesPage.premiumLabel')}
            title={t('servicesPage.premiumTitle')}
            subtitle={t('servicesPage.premiumSubtitle')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div
              className="lg:col-span-2 min-h-[320px] rounded-2xl overflow-hidden bg-cover bg-center flex items-end p-8 text-white group"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(3,18,50,.15), rgba(3,18,50,.78)), url('/service-chef.jpg')",
              }}
            >
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-300">
                <Utensils className="mb-4" size={28} />
                <h3 className="text-2xl font-serif">{t('servicesPage.premium.chef.title')}</h3>
                <p className="mt-2 text-sm text-white/85 max-w-md leading-relaxed">
                  {t('servicesPage.premium.chef.desc')}
                </p>
              </div>
            </div>

            <div className="min-h-[320px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 flex flex-col justify-between shadow-sm">
              <Headphones size={32} className="text-teal-700 dark:text-teal-400" />
              <div>
                <h3 className="text-2xl font-serif text-[#071d49] dark:text-white">
                  {t('servicesPage.premium.support.title')}
                </h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('servicesPage.premium.support.desc')}
                </p>
              </div>
            </div>

            <div className="min-h-[320px] rounded-2xl bg-[#071d49] text-white p-8 flex flex-col justify-between shadow-lg">
              <Plane size={32} className="text-teal-300" />
              <div>
                <h3 className="text-2xl font-serif">{t('servicesPage.premium.vip.title')}</h3>
                <p className="mt-3 text-sm text-white/80 leading-relaxed">
                  {t('servicesPage.premium.vip.desc')}
                </p>
              </div>
            </div>

            <div
              className="lg:col-span-2 min-h-[320px] rounded-2xl overflow-hidden bg-cover bg-center flex items-end p-8 text-white group"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(3,18,50,.15), rgba(3,18,50,.72)), url('/service-itinerary.jpg')",
              }}
            >
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-300">
                <Map className="mb-4" size={28} />
                <h3 className="text-2xl font-serif">{t('servicesPage.premium.itinerary.title')}</h3>
                <p className="mt-2 text-sm text-white/85 max-w-md leading-relaxed">
                  {t('servicesPage.premium.itinerary.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label={t('servicesPage.offersLabel')}
            title={t('servicesPage.offersTitle')}
            subtitle={t('servicesPage.offersSubtitle')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {OFFER_KEYS.map((key) => {
              const isHighlight = key === 'premium'
              const features = t(`servicesPage.offers.${key}.features`, { returnObjects: true }) as string[]

              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-2xl p-8 flex flex-col transition-transform duration-300',
                    isHighlight
                      ? 'bg-[#071d49] text-white shadow-2xl md:scale-[1.03] ring-2 ring-teal-500/50'
                      : 'bg-[#f8f7ff] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md',
                  )}
                >
                  {isHighlight && (
                    <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider bg-teal-500 text-white px-3 py-1 rounded-full mb-4">
                      {t('servicesPage.offersPopular')}
                    </span>
                  )}
                  <h3 className="text-xl font-serif font-bold">{t(`servicesPage.offers.${key}.name`)}</h3>
                  <p className={cn('text-sm mt-1 mb-6', isHighlight ? 'text-white/70' : 'text-gray-500 dark:text-gray-400')}>
                    {t(`servicesPage.offers.${key}.tagline`)}
                  </p>
                  <ul className="space-y-3 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <BadgeCheck
                          size={16}
                          className={cn('shrink-0 mt-0.5', isHighlight ? 'text-teal-400' : 'text-teal-700 dark:text-teal-400')}
                        />
                        <span className={isHighlight ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={isHighlight ? '/bateaux' : '/contact'}
                    className={cn(
                      'mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors',
                      isHighlight
                        ? 'bg-white text-[#071d49] hover:bg-gray-100'
                        : 'bg-[#071d49] dark:bg-teal-700 text-white hover:bg-[#0a2a5c] dark:hover:bg-teal-600',
                    )}
                  >
                    {t(`servicesPage.offers.${key}.cta`)}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quote + badges */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-[#f3f2fb] dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="italic font-serif text-2xl sm:text-3xl text-[#071d49] dark:text-white leading-snug">
              &ldquo;{t('servicesPage.quote')}&rdquo;
            </p>
            <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('servicesPage.quoteBody')}
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGE_ITEMS.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 p-2.5 rounded-full shrink-0">
                    <Icon size={16} />
                  </span>
                  <p className="font-semibold text-sm">{t(`servicesPage.badges.${key}`)}</p>
                </div>
              ))}
            </div>
          </div>

          <img
            src="/service-concierge.jpg"
            alt=""
            className="rounded-2xl shadow-2xl w-full h-[380px] lg:h-[420px] object-cover"
          />
        </div>
      </section>

      {/* Testimonial strip */}
      <section className="px-6 sm:px-8 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071d49] to-ocean-800 text-white p-8 sm:p-10 shadow-xl">
            <MessageSquareQuote size={100} className="absolute -right-2 -bottom-2 text-white/5 pointer-events-none" strokeWidth={1} />
            <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-4">
              {t('servicesPage.testimonialLabel')}
            </p>
            <blockquote className="font-serif text-lg sm:text-xl leading-relaxed max-w-3xl mb-6">
              &ldquo;{FEATURED_TESTIMONIAL.text}&rdquo;
            </blockquote>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
                  {FEATURED_TESTIMONIAL.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{FEATURED_TESTIMONIAL.name}</p>
                  <p className="text-xs text-ocean-200">{FEATURED_TESTIMONIAL.role}</p>
                </div>
              </div>
              <Link
                to="/temoignages"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/30 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-colors self-start sm:self-auto"
              >
                {t('servicesPage.testimonialCta')}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <SectionHeading
            label={t('servicesPage.faqLabel')}
            title={t('servicesPage.faqTitle')}
          />

          <div className="space-y-3">
            {FAQ_KEYS.map((key) => {
              const isOpen = openFaq === key
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-[#f8f7ff] dark:bg-gray-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-[#071d49] dark:text-white text-sm sm:text-base">
                      {t(`servicesPage.faq.${key}.q`)}
                    </span>
                    <ChevronDown
                      size={18}
                      className={cn('shrink-0 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
                      {t(`servicesPage.faq.${key}.a`)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-8 lg:px-12 py-20">
        <div className="max-w-3xl mx-auto bg-[#071d49] text-white rounded-2xl shadow-2xl px-8 sm:px-10 py-12 text-center relative overflow-hidden">
          <Anchor size={100} className="absolute right-6 top-4 text-white/10 pointer-events-none" />
          <Ship size={40} className="mx-auto mb-4 text-teal-400/70" />

          <h2 className="text-2xl sm:text-3xl font-serif relative z-10">{t('servicesPage.ctaTitle')}</h2>
          <p className="mt-4 text-white/75 max-w-lg mx-auto relative z-10">{t('servicesPage.ctaSubtitle')}</p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 relative z-10">
            <Link
              to="/bateaux"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-7 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {t('servicesPage.ctaBoats')}
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 px-7 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {t('servicesPage.ctaContact')}
            </Link>
            <Link
              to="/temoignages"
              className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 px-7 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {t('servicesPage.ctaTestimonials')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default APropos
