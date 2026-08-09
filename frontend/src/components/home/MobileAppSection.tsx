import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarDays, Compass, Home, Search, Ship, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import StoreBadges from '../ui/StoreBadges'
import BrandLogo from '../ui/BrandLogo'

function PhoneMockup({ t }: { t: (key: string) => string }) {
  const boats = [
    { name: 'Oceanis 51.1', port: 'Marseille', price: '1 200 €', img: '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg', rating: '4.9' },
    { name: 'Lagoon 46', port: 'Nice', price: '1 850 €', img: '/view-luxurious-yacht-water.jpg', rating: '4.8' },
  ]

  return (
    <div className="relative mx-auto w-[290px] sm:w-[300px] lg:mr-0">
      <div
        className="absolute -inset-10 rounded-full opacity-50 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,255,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative animate-[mobileFloat_5s_ease-in-out_infinite]">
        <div className="rounded-[2.75rem] p-[3px] bg-gradient-to-b from-brand-navy/20 via-brand-blue/10 to-ocean-200/30 shadow-[0_32px_64px_-16px_rgba(0,51,102,0.22)]">
          <div className="rounded-[2.6rem] bg-brand-navy p-2">
            <div className="relative rounded-[2.25rem] overflow-hidden bg-[#f4f6fa] aspect-[9/19.5] flex flex-col">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 h-[22px] w-[88px] rounded-full bg-black shadow-inner" />

              <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 text-[10px] font-semibold text-brand-navy/70">
                <span>9:41</span>
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-navy/30" />
                  <span className="h-2 w-3 rounded-sm bg-brand-navy/30" />
                </span>
              </div>

              <div className="px-4 pt-8 pb-3 bg-white border-b border-gray-100">
                {/* BrandLogo bascule logo clair/sombre — nécessaire car .dark .bg-white force un fond sombre */}
                <BrandLogo className="h-8 w-auto max-w-[148px] object-contain object-left mb-2.5" />
                <p className="font-serif text-[15px] font-bold text-brand-navy leading-tight">
                  {t('home.mobileAppPreviewGreeting')}
                </p>
              </div>

              <div className="px-4 py-3">
                <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-[0_4px_20px_rgba(0,51,102,0.08)] border border-gray-100">
                  <Search size={14} className="text-brand-blue flex-shrink-0" />
                  <span className="text-[11px] text-brand-muted truncate">{t('home.mobileAppPreviewSearch')}</span>
                </div>
              </div>

              <div className="flex-1 px-4 space-y-2.5 overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                  {t('home.mobileAppPreviewLabel')}
                </p>
                {boats.map((boat) => (
                  <div
                    key={boat.name}
                    className="flex gap-2.5 rounded-2xl bg-white p-2 shadow-[0_4px_16px_rgba(0,51,102,0.06)] border border-gray-100/80"
                  >
                    <div className="h-14 w-[4.5rem] rounded-xl overflow-hidden flex-shrink-0">
                      <img src={boat.img} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-[11px] font-bold text-brand-navy truncate">{boat.name}</p>
                      <p className="text-[10px] text-brand-muted">{boat.port} · {boat.rating} ★</p>
                      <p className="text-[11px] font-semibold text-brand-blue mt-0.5">{boat.price}<span className="text-brand-muted font-normal">/j</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto px-4 pb-5 pt-2">
                <div className="flex items-center justify-around rounded-2xl bg-white/95 backdrop-blur-md px-2 py-2.5 shadow-[0_-4px_24px_rgba(0,51,102,0.08)] border border-gray-100">
                  {[
                    { icon: Home, active: true },
                    { icon: Compass, active: false },
                    { icon: CalendarDays, active: false },
                    { icon: User, active: false },
                  ].map(({ icon: Icon, active }, i) => (
                    <span
                      key={i}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        active ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30' : 'text-brand-muted'
                      }`}
                    >
                      <Icon size={15} strokeWidth={active ? 2.25 : 1.75} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -left-2 sm:-left-6 top-[28%] rounded-2xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-gray-100 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <Bell size={16} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-brand-navy">{t('home.mobileAppPreviewNotifTitle')}</p>
            <p className="text-[9px] text-brand-muted max-w-[120px] leading-snug">{t('home.mobileAppPreviewNotifBody')}</p>
          </div>
        </div>

        <div className="absolute -right-1 sm:-right-3 bottom-[22%] rounded-full bg-brand-blue px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md shadow-brand-blue/30">
          {t('nav.comingSoon')}
        </div>
      </div>

      <style>{`
        @keyframes mobileFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}

const MobileAppSection: React.FC = () => {
  const { t } = useTranslation()

  const features = [
    { icon: Search, title: t('home.mobileAppFeature1Title') },
    { icon: CalendarDays, title: t('home.mobileAppFeature2Title') },
    { icon: Bell, title: t('home.mobileAppFeature3Title') },
  ]

  return (
    <section
      className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#eef3fb] overflow-hidden"
      aria-labelledby="mobile-app-title"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="rounded-[2rem] border border-ocean-200/60 bg-white p-8 sm:p-10 lg:p-12 shadow-[0_12px_48px_rgba(0,51,102,0.08)] ring-1 ring-brand-navy/5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-14">
            <div className="lg:w-[50%] order-2 lg:order-1">
              <p className="text-brand-blue dark:text-blue-200 text-sm font-semibold mb-3">
                {t('home.mobileAppLabel')}
              </p>
              <h2
                id="mobile-app-title"
                className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy dark:text-white leading-tight mb-4"
              >
                {t('home.mobileAppTitle')}
              </h2>
              <p className="text-brand-slate dark:text-gray-100 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                {t('home.mobileAppSubtitle')}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {features.map(({ icon: Icon, title }) => (
                  <span
                    key={title}
                    className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-ocean-100 dark:border-gray-500 px-4 py-2 text-xs font-semibold text-brand-navy dark:text-white shadow-sm"
                  >
                    <Icon size={14} className="text-brand-blue dark:text-blue-300 flex-shrink-0" />
                    {title}
                  </span>
                ))}
              </div>

              <StoreBadges className="mb-8" />

              <div className="flex items-start gap-3 rounded-xl border border-ocean-100 dark:border-gray-500 bg-ocean-50/50 dark:bg-gray-800 px-5 py-4 max-w-md">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 dark:bg-blue-500/20 text-brand-blue dark:text-blue-300">
                  <Ship size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-navy dark:text-white mb-1">{t('home.mobileAppPwaTitle')}</p>
                  <p className="text-xs text-brand-slate dark:text-gray-200 leading-relaxed mb-2">{t('home.mobileAppPwaDesc')}</p>
                  <Link
                    to="/bateaux"
                    className="inline-flex text-xs font-semibold text-brand-blue dark:text-blue-300 hover:underline transition-colors"
                  >
                    {t('home.mobileAppPwaAction')} →
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:w-[50%] order-1 lg:order-2 flex justify-center lg:justify-end">
              <PhoneMockup t={t} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MobileAppSection
