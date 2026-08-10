import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, CalendarDays, TrendingUp, X, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ONBOARDING_KEY = 'sailingloc_owner_onboarded'

interface Step {
  icon?: LucideIcon
  useLogo?: boolean
  titleKey: string
  descKey: string
}

const STEPS: Step[] = [
  {
    useLogo: true,
    titleKey: 'onboarding.welcomeTitle',
    descKey: 'onboarding.welcomeDesc',
  },
  {
    icon: Camera,
    titleKey: 'onboarding.listingTitle',
    descKey: 'onboarding.listingDesc',
  },
  {
    icon: CalendarDays,
    titleKey: 'onboarding.availabilityTitle',
    descKey: 'onboarding.availabilityDesc',
  },
  {
    icon: TrendingUp,
    titleKey: 'onboarding.revenueTitle',
    descKey: 'onboarding.revenueDesc',
  },
]

interface OnboardingModalProps {
  onClose: () => void
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1
  const showLogo = current.useLogo

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onClose()
  }

  const handleNext = () => {
    if (isLast) {
      handleClose()
      navigate('/proprietaire/bateaux/nouveau')
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          aria-label={t('onboarding.close')}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-ocean-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="mb-6">
          {showLogo ? (
            <img
              src="/logo.png"
              alt="SailingLoc"
              className="h-12 w-auto max-w-[220px] object-contain"
            />
          ) : Icon ? (
            <div className="h-16 w-16 bg-ocean-50 rounded-2xl flex items-center justify-center">
              <Icon size={32} className="text-ocean-600" />
            </div>
          ) : null}
        </div>

        <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 mb-3">
          {t(current.titleKey)}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">{t(current.descKey)}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            ← {t('onboarding.previous')}
          </button>
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-ocean-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {isLast ? t('onboarding.createListing') : t('onboarding.next')}
            <ArrowRight size={15} />
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t('onboarding.step', { current: step + 1, total: STEPS.length })}
        </p>
      </div>
    </div>
  )
}

export default OnboardingModal
