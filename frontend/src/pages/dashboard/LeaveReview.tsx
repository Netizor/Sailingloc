import React, { useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Upload, UserCircle, X } from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import { createReview } from '../../api/reviews.api'
import type { ReviewCreateData } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import { formatDateRangeDash } from '../../lib/utils'

const RATING_LABELS = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent']

const StarPicker: React.FC<{
  value: number
  onChange: (v: number) => void
  size?: number
}> = ({ value, onChange, size = 28 }) => {
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
            size={size}
            strokeWidth={1.5}
            className={`transition-colors ${
              n <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

const CriteriaRow: React.FC<{
  label: string
  value: number
  onChange: (v: number) => void
}> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <p className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
      {label}
    </p>
    <StarPicker value={value} onChange={onChange} size={20} />
  </div>
)

const LeaveReview: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const targetRenter = searchParams.get('target') === 'renter'
  const reviewType = targetRenter ? 'OWNER_TO_RENTER' : 'RENTER_TO_BOAT'
  const backUrl = targetRenter ? '/proprietaire/reservations' : '/mon-espace/reservations'

  const [globalRating, setGlobalRating] = useState(0)
  const [criteria, setCriteria] = useState({ proprete: 0, conformite: 0, communication: 0, qualite: 0 })
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getBooking(Number(id!)),
    enabled: !!id,
  })

  const reviewMutation = useMutation({
    mutationFn: (data: ReviewCreateData) => createReview(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['reviews', 'mine'] })
      toast.success('Votre avis a été publié. Merci !')
      navigate(backUrl)
    },
    onError: () => toast.error("Impossible de publier l'avis. Veuillez réessayer."),
  })

  const handleCriteriaChange = (key: keyof typeof criteria, v: number) => {
    const next = { ...criteria, [key]: v }
    setCriteria(next)
    if (globalRating === 0) {
      const filled = Object.values(next).filter((x) => x > 0)
      if (filled.length > 0) {
        setGlobalRating(Math.round(filled.reduce((s, x) => s + x, 0) / filled.length))
      }
    }
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024,
    )
    setPhotos((prev) => [...prev, ...valid].slice(0, 5))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalRating === 0) {
      toast.error('Veuillez sélectionner une note globale.')
      return
    }
    if (!id || !booking) return
    reviewMutation.mutate({ bookingId: Number(id), type: reviewType, rating: globalRating, comment })
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
        <Button variant="secondary" onClick={() => navigate(backUrl)}>Retour</Button>
      </div>
    )
  }

  if (booking.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Vous ne pouvez laisser un avis que pour une réservation terminée.
        </p>
        <Button variant="secondary" onClick={() => navigate(backUrl)}>Retour</Button>
      </div>
    )
  }

  const boat = booking.boat
  const renter = booking.renter
  const location = [boat?.city, boat?.port].filter(Boolean).join(' • ') || ''

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative h-52 sm:h-64 overflow-hidden">
        {!targetRenter && boat?.images?.[0] ? (
          <img src={boat.images[0]} alt={boat.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-600 to-brand-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/65" />

        <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 max-w-2xl mx-auto">
          <span className="inline-flex self-start text-[10px] font-bold tracking-wider uppercase bg-green-500 text-white px-2.5 py-1 rounded-md mb-3">
            Réservation terminée
          </span>
          {targetRenter ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center">
                {renter?.avatar ? (
                  <img src={renter.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle size={20} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">
                  {renter ? `${renter.firstName} ${renter.lastName}` : 'Locataire'}
                </p>
                <p className="text-white/75 text-sm">{formatDateRangeDash(booking.startDate, booking.endDate)}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white font-bold text-xl leading-tight">{boat?.title ?? 'Bateau'}</p>
              <p className="text-white/75 text-sm mt-1">
                {formatDateRangeDash(booking.startDate, booking.endDate)}
                {location ? ` • ${location}` : ''}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {targetRenter ? 'Évaluer le locataire' : 'Votre expérience à bord'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {targetRenter
                ? 'Aidez la communauté en évaluant ce locataire.'
                : 'Partagez votre avis pour aider la communauté et remercier le propriétaire'}
            </p>
          </div>

          <div className="px-8 py-7 space-y-8">
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                Note Globale
              </p>
              <StarPicker value={globalRating} onChange={setGlobalRating} size={36} />
              <p className="text-sm text-gray-400 dark:text-gray-500 min-h-[1.25rem]">
                {globalRating > 0 ? RATING_LABELS[globalRating] : ''}
              </p>
            </div>

            {!targetRenter && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <CriteriaRow label="Propreté du bateau" value={criteria.proprete} onChange={(v) => handleCriteriaChange('proprete', v)} />
                <CriteriaRow label="Conformité à l'annonce" value={criteria.conformite} onChange={(v) => handleCriteriaChange('conformite', v)} />
                <CriteriaRow label="Communication propriétaire" value={criteria.communication} onChange={(v) => handleCriteriaChange('communication', v)} />
                <CriteriaRow label="Rapport qualité-prix" value={criteria.qualite} onChange={(v) => handleCriteriaChange('qualite', v)} />
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                Votre avis détaillé
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={
                  targetRenter
                    ? 'Décrivez votre expérience avec ce locataire : ponctualité, soin du bateau…'
                    : "Qu'avez-vous particulièrement apprécié ? Comment s'est passée la navigation ?"
                }
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none dark:bg-gray-700"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{comment.length} / 1000 caractères</p>
            </div>

            {!targetRenter && (
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                  Photos du séjour <span className="normal-case font-normal">(facultatif)</span>
                </p>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-ocean-400 bg-ocean-50 dark:bg-ocean-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Upload size={26} className="text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Glissez-déposez vos photos ici</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG jusqu'à 5MB par fichier</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photos.map((f, i) => (
                      <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPhotos((p) => p.filter((_, j) => j !== i)) }}
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-8 pb-8 flex flex-row-reverse items-center gap-3">
            <Button type="submit" variant="primary" loading={reviewMutation.isPending}>
              Publier mon avis
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(backUrl)}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeaveReview
