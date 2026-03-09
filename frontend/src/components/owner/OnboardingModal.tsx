import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Camera, CalendarDays, TrendingUp, X, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ONBOARDING_KEY = 'sailingloc_owner_onboarded'

// ─── Étapes ────────────────────────────────────────────────────────────────────

interface Step {
  icon: LucideIcon
  title: string
  desc: string
}

const STEPS: Step[] = [
  {
    icon: Anchor,
    title: 'Bienvenue sur SailingLoc !',
    desc: "Félicitations pour votre inscription en tant que propriétaire ! Vous allez pouvoir louer votre bateau et générer des revenus. Ce guide rapide vous explique comment démarrer.",
  },
  {
    icon: Camera,
    title: 'Créez votre première annonce',
    desc: "Décrivez votre bateau, ajoutez de belles photos et définissez votre tarif journalier. Une annonce complète avec 5+ photos attire 3× plus de locataires.",
  },
  {
    icon: CalendarDays,
    title: 'Gérez vos disponibilités',
    desc: "Bloquez vos dates indisponibles et définissez vos créneaux de location. Vous restez libre de refuser ou d'accepter chaque demande de réservation.",
  },
  {
    icon: TrendingUp,
    title: 'Percevez vos revenus',
    desc: "Dès qu'une réservation est confirmée, le paiement est sécurisé. Vous recevez votre virement sous 2 à 5 jours ouvrés après la fin de chaque location via Stripe Connect.",
  },
]

// ─── Modal Onboarding ─────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onClose: () => void
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

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
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200">
        {/* Fermer */}
        <button
          onClick={handleClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Indicateur d'étapes */}
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

        {/* Icône */}
        <div className="h-16 w-16 bg-ocean-50 rounded-2xl flex items-center justify-center mb-6">
          <Icon size={32} className="text-ocean-600" />
        </div>

        {/* Contenu */}
        <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 mb-3">
          {current.title}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">{current.desc}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            ← Précédent
          </button>
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {isLast ? 'Créer mon annonce' : 'Suivant'}
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Étape N/N */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Étape {step + 1} sur {STEPS.length}
        </p>
      </div>
    </div>
  )
}

export default OnboardingModal
