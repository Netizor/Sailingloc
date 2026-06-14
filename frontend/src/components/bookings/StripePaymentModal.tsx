import React, { useCallback, useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { X, Lock, CreditCard, AlertCircle } from 'lucide-react'
import { formatPrice } from '../../lib/utils'
import Button from '../ui/Button'
import { bookingsApi } from '../../api/bookings.api'

// Issue #3 - avertissement explicite si la clé Stripe est absente en développement
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY
if (!stripePublicKey && import.meta.env.DEV) {
  console.error('[Stripe] VITE_STRIPE_PUBLIC_KEY est absent. Le paiement ne fonctionnera pas.')
}

// Initialisation Stripe hors composant pour éviter les re-créations
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : Promise.resolve(null)

// ─── Formulaire interne (doit être monté dans <Elements>) ─────────────────────

interface PaymentFormProps {
  bookingId: number
  amount: number
  boatTitle: string
  onSuccess: () => void
  onClose: () => void
  /** Remonte l'état de traitement à la modale parente pour bloquer la fermeture (Issue #5) */
  onProcessingChange: (processing: boolean) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingId,
  amount,
  boatTitle,
  onSuccess,
  onClose,
  onProcessingChange,
}) => {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [ready, setReady]     = useState(false)

  const setProcessing = useCallback((v: boolean) => {
    setLoading(v)
    onProcessingChange(v)
  }, [onProcessingChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    // Confirme le paiement sans redirection (SPA)
    const { paymentIntent, error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Erreur de paiement')
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        // Confirme côté backend : passe la réservation en CONFIRMED
        await bookingsApi.confirmPayment({
          bookingId,
          paymentIntentId: paymentIntent.id,
        })
        onSuccess()
      } catch {
        setError('Paiement accepté, mais confirmation échouée. Contactez le support.')
        setProcessing(false)
      }
    } else {
      setError(`Statut inattendu : ${paymentIntent?.status ?? 'inconnu'}`)
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Récapitulatif */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
          Réservation
        </p>
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{boatTitle}</p>
        <p className="text-lg font-bold text-ocean-700 dark:text-ocean-400 mt-1">
          {formatPrice(amount)}
        </p>
      </div>

      {/* Stripe PaymentElement */}
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Informations de paiement
        </p>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: 'tabs' }}
        />
      </div>

      {/* Carte de test (visible uniquement en dev) */}
      {import.meta.env.DEV && (
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-3 py-2.5 text-xs text-blue-800 dark:text-blue-300">
          <CreditCard size={14} className="flex-shrink-0 mt-0.5 text-blue-500" />
          <div>
            <p className="font-semibold mb-0.5">Carte de test Stripe</p>
            <p>Numéro : <span className="font-mono">4242 4242 4242 4242</span></p>
            <p>Date : <span className="font-mono">12/34</span> - CVC : <span className="font-mono">123</span></p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2.5 text-xs text-red-700 dark:text-red-400">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading || !ready}
          className="flex-1"
        >
          <Lock size={14} />
          Payer {formatPrice(amount)}
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
        <Lock size={11} />
        Paiement sécurisé par Stripe
      </p>
    </form>
  )
}

// ─── Modale principale ─────────────────────────────────────────────────────────

interface StripePaymentModalProps {
  clientSecret: string
  bookingId: number
  amount: number
  boatTitle: string
  onSuccess: () => void
  onClose: () => void
}

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  clientSecret,
  bookingId,
  amount,
  boatTitle,
  onSuccess,
  onClose,
}) => {
  // Issue #5/#6 - état de traitement remonté depuis PaymentForm pour bloquer la fermeture
  const [isProcessing, setIsProcessing] = useState(false)

  // Verrouillez le scroll pendant l'ouverture de la modale
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Issue #6 - Escape bloqué pendant le traitement du paiement
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, isProcessing])

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0369a1',
      borderRadius: '10px',
      fontFamily: 'inherit',
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Issue #6 - overlay désactivé pendant le traitement */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panneau */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stripe-modal-title"
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2
            id="stripe-modal-title"
            className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"
          >
            <CreditCard size={18} className="text-ocean-600 dark:text-ocean-400" />
            Paiement sécurisé
          </h2>
          {/* Issue #6 - bouton fermer désactivé pendant le traitement */}
          <button
            onClick={isProcessing ? undefined : onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance, locale: 'fr' }}
          >
            <PaymentForm
              bookingId={bookingId}
              amount={amount}
              boatTitle={boatTitle}
              onSuccess={onSuccess}
              onClose={onClose}
              onProcessingChange={setIsProcessing}
            />
          </Elements>
        </div>
      </div>
    </div>
  )
}

export default StripePaymentModal
