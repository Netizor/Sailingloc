import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { formatDate } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import type { Review } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  RENTER_TO_BOAT: 'Locataire → Bateau',
  OWNER_TO_RENTER: 'Propriétaire → Locataire',
}

const PAGE_SIZE = 15

const AdminReviews: React.FC = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', page],
    queryFn: () => adminApi.listReviews({ page, limit: PAGE_SIZE }),
    staleTime: 30 * 1000,
  })

  const reviews = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success('Avis supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Star size={22} className="text-amber-400" />
          Gestion des avis
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data?.total ?? 0} avis — supprimez les contenus inappropriés
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun avis.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {reviews.map((review) => {
              const r = review as Review & { boatTitle?: string }
              return (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs text-gray-400">{TYPE_LABELS[review.type] ?? review.type}</span>
                      {r.boatTitle && <span className="text-xs text-gray-500">· {r.boatTitle}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {review.reviewer
                        ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                        : `User #${review.reviewerId}`}
                    </p>
                    <div className="flex items-center gap-1 my-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(review.createdAt)}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Supprimer cet avis ?')) deleteMutation.mutate(review.id)
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="secondary" size="sm" leftIcon={<ChevronLeft size={16} />} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-gray-600">Page {page} sur {totalPages}</span>
              <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={16} />} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
