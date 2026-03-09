import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { CreditCard, PlusCircle, Trash2 } from 'lucide-react'
import { stripeApi, type SavedPaymentMethod } from '../../api/stripe.api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { usePageTitle } from '../../hooks/usePageTitle'

// stripePromise est null si la clé est absente (évite un crash runtime en production)
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null
if (!stripePublicKey) {
  console.error('[Stripe] VITE_STRIPE_PUBLIC_KEY manquant — D6 PaymentMethods désactivé.')
}

// Libellés lisibles par marque de carte
const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
}

// ─── Page principale ───────────────────────────────────────────────────────────

const PaymentMethods: React.FC = () => {
  usePageTitle('Mes cartes')

  const qc = useQueryClient()
  const [addingCard, setAddingCard] = useState(false)
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Gestion du retour 3DS Stripe (redirection SCA — obligatoire pour les cartes européennes)
  useEffect(() => {
    const setupIntent = searchParams.get('setup_intent')
    const redirectStatus = searchParams.get('redirect_status')

    if (setupIntent && redirectStatus) {
      // Nettoie les paramètres Stripe de l'URL pour ne pas rejouer l'action au rechargement
      const next = new URLSearchParams(searchParams)
      next.delete('setup_intent')
      next.delete('setup_intent_client_secret')
      next.delete('redirect_status')
      setSearchParams(next, { replace: true })

      if (redirectStatus === 'succeeded') {
        toast.success('Carte ajoutée avec succès !')
        qc.invalidateQueries({ queryKey: ['payment-methods'] })
      } else {
        toast.error("L'ajout de carte a échoué. Veuillez réessayer.")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: cards, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: stripeApi.listPaymentMethods,
    staleTime: 60_000,
  })

  const deleteMutation = useMutation({
    mutationFn: stripeApi.detachPaymentMethod,
    onSuccess: () => {
      toast.success('Carte supprimée.')
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
    },
    onError: () => toast.error('Impossible de supprimer la carte.'),
  })

  const handleAddCard = async () => {
    try {
      const { clientSecret } = await stripeApi.createSetupIntent()
      setSetupClientSecret(clientSecret)
      setAddingCard(true)
    } catch {
      toast.error("Impossible d'initialiser l'ajout de carte.")
    }
  }

  const handleSuccess = () => {
    setAddingCard(false)
    setSetupClientSecret(null)
    qc.invalidateQueries({ queryKey: ['payment-methods'] })
    toast.success('Carte ajoutée avec succès !')
  }

  const handleCancel = () => {
    setAddingCard(false)
    setSetupClientSecret(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center">
            <CreditCard size={22} className="text-ocean-600 dark:text-ocean-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mes cartes de paiement
          </h1>
        </div>

        {/* ── Liste des cartes ── */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {(cards ?? []).map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onDelete={() => deleteMutation.mutate(card.id)}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === card.id}
              />
            ))}

            {(cards ?? []).length === 0 && !addingCard && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                Aucune carte sauvegardée.
                <br />
                Ajoutez-en une pour accélérer vos futurs paiements.
              </div>
            )}
          </div>
        )}

        {/* ── Formulaire d'ajout ou bouton ── */}
        {addingCard && setupClientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret: setupClientSecret }}>
            <AddCardForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </Elements>
        ) : addingCard ? (
          <p className="text-red-500 dark:text-red-400 text-sm">
            Service de paiement indisponible. Veuillez réessayer plus tard.
          </p>
        ) : (
          <Button
            onClick={handleAddCard}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Ajouter une carte
          </Button>
        )}

        {/* Info carte de test en dev */}
        {import.meta.env.DEV && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Mode test — utilisez <code className="font-mono">4242 4242 4242 4242</code>, date future,
            CVC quelconque.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Formulaire Stripe Elements pour l'ajout d'une carte ──────────────────────

interface AddCardFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const AddCardForm: React.FC<AddCardFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        // Retour URL en cas de redirection 3DS — redirige vers la même page
        return_url: window.location.href,
      },
      // Évite la redirection si le navigateur supporte la confirmation in-page
      redirect: 'if_required',
    })

    setLoading(false)

    if (stripeError) {
      setError(stripeError.message ?? 'Une erreur est survenue.')
    } else {
      onSuccess()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
    >
      <PaymentElement />

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? (
            <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin block" />
          ) : (
            'Sauvegarder'
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
      </div>
    </form>
  )
}

// ─── Élément de carte ─────────────────────────────────────────────────────────

interface CardItemProps {
  card: SavedPaymentMethod
  onDelete: () => void
  isDeleting: boolean
}

const CardItem: React.FC<CardItemProps> = ({ card, onDelete, isDeleting }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <CreditCard size={18} className="text-gray-500 dark:text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {BRAND_LABELS[card.brand] ?? card.brand} •••• {card.last4}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Expire {String(card.expMonth).padStart(2, '0')}/{card.expYear}
        </p>
      </div>
    </div>

    <button
      onClick={onDelete}
      disabled={isDeleting}
      aria-label="Supprimer la carte"
      className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
    >
      {isDeleting ? (
        <span className="h-4 w-4 border-2 border-current/40 border-t-current rounded-full animate-spin block" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  </div>
)

export default PaymentMethods
