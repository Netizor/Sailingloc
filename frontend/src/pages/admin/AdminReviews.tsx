import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminListReviews, adminUpdateReview } from '../../api/reviews.api'
import type { ReviewModerationStatus } from '../../api/reviews.api'
import { formatDate } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import type { Review, User } from '../../types'

type StatusFilter = ReviewModerationStatus | 'ALL'

const STATUS_CONFIG: Record<ReviewModerationStatus, {
  label: string
  icon: React.ReactNode
  variant: 'warning' | 'success' | 'default'
}> = {
  PENDING:  { label: 'En attente', icon: <Clock size={12} />,       variant: 'warning' },
  APPROVED: { label: 'Approuvé',   icon: <CheckCircle size={12} />, variant: 'success' },
  REJECTED: { label: 'Rejeté',     icon: <XCircle size={12} />,     variant: 'default' },
}

const TYPE_LABELS: Record<string, string> = {
  RENTER_TO_BOAT:   'Locataire → Bateau',
  OWNER_TO_RENTER:  'Propriétaire → Locataire',
}

const PAGE_SIZE = 15

const AdminReviews: React.FC = () => {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [filter, setFilter] = useState<StatusFilter>('PENDING')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', filter, page],
    queryFn: () => adminListReviews({
      page,
      limit: PAGE_SIZE,
      status: filter === 'ALL' ? undefined : filter,
    }),
    staleTime: 30 * 1000,
  })

  const reviews     = data?.data ?? []
  const totalPages  = data?.totalPages ?? 1

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) =>
      adminUpdateReview(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success('Avis mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const handleFilter = (f: StatusFilter) => { setFilter(f); setPage(1) }

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'PENDING',  label: 'En attente' },
    { key: 'APPROVED', label: 'Approuvés' },
    { key: 'REJECTED', label: 'Rejetés' },
    { key: 'ALL',      label: 'Tous' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Star size={22} className="text-amber-400" />
          Modération des avis
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Approuvez ou rejetez les avis avant publication.
        </p>
      </div>

      {/* Filtres de statut */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f.key
                ? 'bg-ocean-700 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun avis dans cette catégorie.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {reviews.map((review) => {
              // Le backend enrichit les avis admin avec des champs supplémentaires
              const r = review as Review & {
                moderationStatus?: ReviewModerationStatus
                reviewee?: Partial<User>
                boatTitle?: string
              }
              const status = (r.moderationStatus ?? 'PENDING') as ReviewModerationStatus
              const cfg = STATUS_CONFIG[status]
              return (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge variant={cfg.variant} className="flex items-center gap-1">
                          {cfg.icon}{cfg.label}
                        </Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {TYPE_LABELS[review.type] ?? review.type}
                        </span>
                        {r.boatTitle && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            · {r.boatTitle}
                          </span>
                        )}
                      </div>

                      {/* Auteur + cible */}
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {review.reviewer
                          ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                          : `User #${review.reviewerId}`}
                        {r.reviewee && (
                          <span className="font-normal text-gray-400 dark:text-gray-500">
                            {' '}→ {r.reviewee.firstName} {r.reviewee.lastName}
                          </span>
                        )}
                      </p>

                      {/* Note */}
                      <div className="flex items-center gap-1 my-1.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}
                          />
                        ))}
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{review.rating}/5</span>
                      </div>

                      {/* Commentaire */}
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{review.comment}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{formatDate(review.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    {status === 'PENDING' && (
                      <div className="flex sm:flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<CheckCircle size={14} />}
                          loading={mutation.isPending}
                          onClick={() => mutation.mutate({ id: review.id, status: 'APPROVED' })}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<XCircle size={14} />}
                          loading={mutation.isPending}
                          onClick={() => mutation.mutate({ id: review.id, status: 'REJECTED' })}
                        >
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="secondary" size="sm"
                leftIcon={<ChevronLeft size={16} />}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="secondary" size="sm"
                rightIcon={<ChevronRight size={16} />}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminReviews
