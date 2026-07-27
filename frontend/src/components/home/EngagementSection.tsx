import React from 'react'
import { Shield, Headphones, BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const FEATURE_IMAGE = '/view-luxurious-yacht.jpg'

const EngagementSection: React.FC = () => {
  const { t } = useTranslation()

  const features = [
    { icon: Shield, title: t('home.feature1Title'), desc: t('home.feature1Desc') },
    { icon: Headphones, title: t('home.feature2Title'), desc: t('home.feature2Desc') },
    { icon: BadgeCheck, title: t('home.feature3Title'), desc: t('home.feature3Desc') },
  ]

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="features-title">
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-[2.5rem] px-8 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16"
          style={{ backgroundColor: '#0A1120' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">
            {/* Colonne gauche - texte */}
            <div className="lg:w-[44%] flex flex-col justify-center">
              <p className="text-blue-300 text-[11px] font-bold uppercase tracking-[0.25em] mb-6">
                {t('home.featuresLabel')}
              </p>

              <h2
                id="features-title"
                className="font-serif text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] font-bold text-white leading-[1.15] mb-12"
              >
                {t('home.featuresTitle')}
              </h2>

              <ul className="flex flex-col gap-9">
                {features.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-4">
                    <span
                      className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-400/40"
                      style={{ backgroundColor: '#101D30', color: '#93C5FD' }}
                    >
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <div className="pt-0.5">
                      <p className="text-white font-semibold text-[15px] mb-1.5 leading-snug">
                        {title}
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne droite - image + badge */}
            <div className="lg:w-[56%] relative">
              <img
                src={FEATURE_IMAGE}
                alt="Yacht de luxe en navigation"
                className="w-full aspect-[4/3] lg:aspect-auto lg:min-h-[400px] lg:h-full object-cover rounded-3xl"
                loading="lazy"
              />

              <div
                className="absolute bottom-6 left-6 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-lg"
                style={{ backgroundColor: '#003366' }}
              >
                <span className="font-serif text-3xl font-bold text-white leading-none">
                  {t('home.milesStat')}
                </span>
                <span className="text-[9px] font-semibold text-white uppercase tracking-[0.12em] leading-[1.4] max-w-[72px]">
                  {t('home.milesStatLabel')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EngagementSection
