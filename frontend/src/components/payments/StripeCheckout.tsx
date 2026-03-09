import React, { useState } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'

// Load stripe once outside component to avoid re-instantiation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '')

// ─── Checkout Form (inner) ───────────────────────────────────────────────────

interface CheckoutFormProps {
  bookingId: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ bookingId, onSuccess, onError }) => {
  const stripe = useStripe()
  const elements = useElements()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setErrorMsg(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/mon-espace/reservations?booking=${bookingId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      const msg = error.message ?? 'Une erreur de paiement est survenue.'
      setErrorMsg(msg)
      onError(msg)
      setIsSubmitting(false)
    } else if (paymentIntent?.status === 'succeeded') {
      setSucceeded(true)
      onSuccess(paymentIntent.id)
    } else {
      const msg = 'Le paiement n\'a pas pu être traité. Veuillez réessayer.'
      setErrorMsg(msg)
      onError(msg)
      setIsSubmitting(false)
    }
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Paiement effectué !</h3>
        <p className="text-sm text-gray-500">
          Votre demande de réservation a été envoyée au propriétaire.
          Vous serez notifié dès qu&apos;il l&apos;aura confirmée.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Stripe PaymentElement */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'FR',
                },
              },
            },
          }}
        />
      </div>

      {/* Error display */}
      {errorMsg && (
        <div
          className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          role="alert"
        >
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting || !stripe || !elements}
        leftIcon={<Lock size={16} />}
      >
        Payer maintenant
      </Button>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock size={11} />
        Paiement sécurisé par Stripe — Données chiffrées (TLS 1.3)
      </div>

      <p className="text-xs text-gray-400 text-center">
        En cliquant sur &laquo; Payer maintenant &raquo;, vous acceptez les{' '}
        <a href="/cgu" className="underline hover:text-gray-600">
          conditions générales
        </a>{' '}
        de SailingLoc.
      </p>
    </form>
  )
}

// ─── Stripe Checkout (outer wrapper) ─────────────────────────────────────────

interface StripeCheckoutProps {
  clientSecret: string
  bookingId: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  className?: string
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  clientSecret,
  bookingId,
  onSuccess,
  onError,
  className,
}) => {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 shadow-md p-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-ocean-700 flex items-center justify-center flex-shrink-0">
          <Lock size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-base">Paiement sécurisé</h2>
          <p className="text-xs text-gray-400">Propulsé par Stripe</p>
        </div>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0369a1',
              colorBackground: '#ffffff',
              colorText: '#111827',
              colorDanger: '#dc2626',
              fontFamily: 'Inter, system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px',
            },
          },
          locale: 'fr',
        }}
      >
        <CheckoutForm
          bookingId={bookingId}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  )
}

export default StripeCheckout
export type { StripeCheckoutProps }
