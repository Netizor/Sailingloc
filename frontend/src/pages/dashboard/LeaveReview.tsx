import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Anchor, CheckCircle, UserCircle } from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import { createReview } from '../../api/reviews.api'
import type { ReviewCreateData } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

// ─── Sélecteur d'étoiles ──────────────────────────────────────────────────────

interface StarPickerProps {
  value: number
  onChange: (v: number) => void
}

const StarPicker: React.FC<StarPickerProps> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 focus:outline-none"
        >
          <Star
            size={32}
            strokeWidth={1.5}
            className={`transition-colors ${
              n <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        {value > 0
          ? ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'][value]
          : 'Sélectionnez une note'}
      </span>
    </div>
  )
}

// ─── Page Laisser un avis ─────────────────────────────────────────────────────

const LeaveReview: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  // ?target=renter — propriétaire évalue un locataire (D1)
  const targetRenter = searchParams.get('target') === 'renter'
  const reviewType    = targetRenter ? 'OWNER_TO_RENTER' : 'RENTER_TO_BOAT'
  const backUrl       = targetRenter ? '/proprietaire/reservations' : '/mon-espace/reservations'

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getBooking(Number(id!)),
    enabled: !!id,
  })

  const reviewMutation = useMutation({
    mutationFn: (data: ReviewCreateData) => createReview(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Votre avis a été publié. Merci !')
      navigate(backUrl)
    },
    onError: () => toast.error("Impossible de publier l'avis. Veuillez réessayer."),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Veuillez sélectionner une note.'); return }
    if (!id || !booking) return
    reviewMutation.mutate({
      bookingId: Number(id),
      type: reviewType,
      rating,
      comment,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600 dark:text-gray-400 font-medium">Réservation introuvable.</p>
        <Button variant="secondary" onClick={() => navigate(backUrl)}>
          Retour
        </Button>
      </div>
    )
  }

  if (booking.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Vous ne pouvez laisser un avis que pour une réservation terminée.
        </p>
        <Button variant="secondary" onClick={() => navigate(backUrl)}>
          Retour
        </Button>
      </div>
    )
  }

  const boat   = booking.boat
  const renter = booking.renter

  // Résumé affiché dans la carte : bateau pour le locataire, locataire pour le propriétaire
  const summaryContent = targetRenter ? (
    <>
      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
        {renter?.avatar ? (
          <img src={renter.avatar} alt={renter.firstName} className="h-full w-full object-cover" />
        ) : (
          <UserCircle size={28} className="text-gray-400" />
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {renter ? `${renter.firstName} ${renter.lastName}` : 'Locataire'}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {booking.startDate} — {booking.endDate}
        </p>
      </div>
    </>
  ) : (
    <>
      <div className="h-16 w-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {boat?.images?.[0] ? (
          <img src={boat.images[0]} alt={boat.title ?? 'Bateau'} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-ocean-50 dark:bg-ocean-900/30">
            <Anchor size={20} className="text-ocean-300" />
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-100">{boat?.title ?? 'Bateau'}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {booking.startDate} — {booking.endDate}
        </p>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          {targetRenter ? 'Évaluer le locataire' : 'Laisser un avis'}
        </h1>

        {/* Récap */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4 mb-6">
          {summaryContent}
          <CheckCircle size={20} className="ml-auto text-green-500 flex-shrink-0" />
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 space-y-6">
          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Votre note globale <span className="text-red-500">*</span>
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Commentaire */}
          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Votre commentaire
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder={
                targetRenter
                  ? 'Décrivez votre expérience avec ce locataire : ponctualité, soin du bateau, respect des règles…'
                  : 'Décrivez votre expérience : état du bateau, communication avec le propriétaire, respect de l\'annonce…'
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none dark:bg-gray-800"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{comment.length}/1000</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={reviewMutation.isPending}
              leftIcon={<Star size={15} />}
            >
              Publier mon avis
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(backUrl)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeaveReview
