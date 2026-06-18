import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Trash2, EyeOff, Eye, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { formatDate } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import type { Review } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  RENTER_TO_BOAT: 'Locataire → Bateau',
  OWNER_TO_RENTER: 'Propriétaire → Locataire',
}

type StatusFilter = 'all' | 'published' | 'hidden'

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'published', label: 'Publiés' },
  { key: 'hidden', label: 'Masqués' },
]

const PAGE_SIZE = 15

const AdminReviews: React.FC = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Modal masquage
  const [hideTarget, setHideTarget] = useState<Review | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', page, statusFilter],
    queryFn: () => adminApi.listReviews({
      page,
      limit: PAGE_SIZE,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    staleTime: 30 * 1000,
  })

  const reviews = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  const moderateMutation = useMutation({
    mutationFn: ({ id, isPublished, note }: { id: number; isPublished: boolean; note?: string }) =>
      adminApi.moderateReview(id, isPublished, note),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success(vars.isPublished ? 'Avis restauré et publié' : 'Avis masqué')
      setHideTarget(null)
      setAdminNote('')
    },
    onError: () => toast.error('Erreur lors de la modération'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success('Avis supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const handleTabChange = (tab: StatusFilter) => {
    setStatusFilter(tab)
    setPage(1)
  }

  const openHideModal = (review: Review) => {
    setHideTarget(review)
    setAdminNote('')
  }

  const confirmHide = () => {
    if (!hideTarget) return
    moderateMutation.mutate({ id: hideTarget.id, isPublished: false, note: adminNote.trim() || undefined })
  }

  const restore = (review: Review) => {
    moderateMutation.mutate({ id: review.id, isPublished: true })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Star size={22} className="text-amber-400" />
          Modération des avis
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data?.total ?? 0} avis au total. Masquez ou supprimez les contenus inappropriés.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === tab.key
                ? 'bg-ocean-700 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun avis{statusFilter !== 'all' ? ` dans cette catégorie` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {reviews.map((review) => {
              const r = review as Review
              const isHidden = r.isPublished === false
              return (
                <div
                  key={r.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-opacity ${
                    isHidden
                      ? 'border-red-200 dark:border-red-800/50 opacity-75'
                      : 'border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {/* Badge statut */}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        isHidden
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      }`}>
                        {isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                        {isHidden ? 'Masqué' : 'Publié'}
                      </span>
                      <span className="text-xs text-gray-400">{TYPE_LABELS[r.type] ?? r.type}</span>
                      {r.boatTitle && (
                        <span className="text-xs text-gray-500">· {r.boatTitle}</span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {r.reviewer
                        ? `${r.reviewer.firstName} ${r.reviewer.lastName}`
                        : `User #${r.reviewerId}`}
                    </p>

                    <div className="flex items-center gap-1 my-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{r.rating}/5</span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>

                    {isHidden && r.adminNote && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-start gap-1">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                        <span>Note admin : {r.adminNote}</span>
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(r.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    {isHidden ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        loading={moderateMutation.isPending}
                        onClick={() => restore(r)}
                      >
                        Restaurer
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<EyeOff size={14} />}
                        loading={moderateMutation.isPending}
                        onClick={() => openHideModal(r)}
                      >
                        Masquer
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      loading={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Supprimer définitivement cet avis ?')) {
                          deleteMutation.mutate(r.id)
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="secondary" size="sm" leftIcon={<ChevronLeft size={16} />} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} sur {totalPages}</span>
              <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={16} />} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal masquage */}
      <Modal
        isOpen={!!hideTarget}
        onClose={() => { setHideTarget(null); setAdminNote('') }}
        title="Masquer cet avis"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              L'avis sera masqué du site public. Il restera visible ici et pourra être restauré.
            </p>
          </div>

          {hideTarget && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-300 italic line-clamp-3">
              « {hideTarget.comment} »
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Note interne <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Raison du masquage (visible uniquement par les admins)…"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none bg-white dark:bg-gray-800"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setHideTarget(null); setAdminNote('') }}
              disabled={moderateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              fullWidth
              leftIcon={<EyeOff size={14} />}
              loading={moderateMutation.isPending}
              onClick={confirmHide}
            >
              Masquer l'avis
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminReviews
