import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Flag,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import api from '../../lib/axios'
import { formatDate } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import type { Review } from '../../types'

type StatusFilter = 'all' | 'published' | 'hidden'
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'

const PAGE_SIZE = 15

const TYPE_LABELS: Record<string, string> = {
  RENTER_TO_BOAT: 'Locataire → Bateau',
  OWNER_TO_RENTER: 'Propriétaire → Locataire',
}

function exportCsv(reviews: Review[]) {
  const header = ['ID', 'Auteur', 'Bateau', 'Type', 'Note', 'Commentaire', 'Statut', 'Date']
  const rows = reviews.map((r) => [
    r.id,
    r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : `#${r.reviewerId}`,
    r.boatTitle ?? '',
    TYPE_LABELS[r.type] ?? r.type,
    r.rating,
    `"${(r.comment ?? '').replace(/"/g, '""')}"`,
    r.isPublished ? 'Publié' : 'Masqué',
    formatDate(r.createdAt),
  ])
  const csv = [header, ...rows].map((row) => row.join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `avis-sailingloc-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}
      />
    ))}
    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">{rating}/5</span>
  </div>
)

const StatusBadge: React.FC<{ isPublished: boolean }> = ({ isPublished }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md uppercase ${
      isPublished
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    }`}
  >
    {isPublished ? <Eye size={9} /> : <EyeOff size={9} />}
    {isPublished ? 'Publié' : 'En attente'}
  </span>
)

const StatCard: React.FC<{
  label: string
  value: string | number
  sub?: string
  accent?: 'amber' | 'red' | 'blue' | 'default'
}> = ({ label, value, sub, accent = 'default' }) => {
  const colors = {
    default: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
    amber: 'bg-white dark:bg-gray-800 border-amber-100 dark:border-amber-800/50',
    red: 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-800/50',
    blue: 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-800/50',
  }
  const valColors = {
    default: 'text-gray-900 dark:text-gray-100',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-brand-blue dark:text-blue-400',
  }
  return (
    <div className={`rounded-2xl border shadow-sm p-5 ${colors[accent]}`}>
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">{label}</p>
      <p className={`text-3xl font-bold ${valColors[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

const ActionBtn: React.FC<{
  icon: React.ReactNode
  title: string
  onClick: () => void
  className?: string
}> = ({ icon, title, onClick, className = 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700' }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-colors ${className}`}
  >
    {icon}
  </button>
)

const AdminReviews: React.FC = () => {
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Review | null>(null)
  const [hideTarget, setHideTarget] = useState<Review | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['admin', 'reviews', 'stats'],
    queryFn: adminApi.getReviewStats,
    staleTime: 60 * 1000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', page, statusFilter],
    queryFn: () =>
      adminApi.listReviews({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    staleTime: 30 * 1000,
  })

  const reviews = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  const filtered = reviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      const name = r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}`.toLowerCase() : ''
      if (
        !name.includes(q) &&
        !(r.boatTitle ?? '').toLowerCase().includes(q) &&
        !(r.comment ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const moderateMutation = useMutation({
    mutationFn: ({ id, isPublished, note }: { id: number; isPublished: boolean; note?: string }) =>
      adminApi.moderateReview(id, isPublished, note),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success(vars.isPublished ? 'Avis approuvé & publié' : 'Avis masqué')
      setHideTarget(null)
      setAdminNote('')
      if (selected?.id === vars.id) setSelected(null)
    },
    onError: () => toast.error('Erreur lors de la modération'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      toast.success('Avis supprimé')
      if (selected?.id === id) setSelected(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const flagMutation = useMutation({
    mutationFn: (id: number) =>
      api.post('/reports', { targetType: 'REVIEW', targetId: id, reason: 'INAPPROPRIATE_CONTENT' }),
    onSuccess: () => toast.success('Avis signalé'),
    onError: () => toast.error('Erreur lors du signalement'),
  })

  const handleTabChange = (tab: StatusFilter) => {
    setStatusFilter(tab)
    setPage(1)
    setSelected(null)
  }

  const confirmHide = () => {
    if (!hideTarget) return
    moderateMutation.mutate({ id: hideTarget.id, isPublished: false, note: adminNote.trim() || undefined })
  }

  const confirmDelete = (r: Review) => {
    if (window.confirm('Supprimer définitivement cet avis ? Cette action est irréversible.')) {
      deleteMutation.mutate(r.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Avis &amp; Commentaires
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Modérez et analysez les retours d'expérience de la communauté SailingLoc.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={14} />}
          onClick={() => exportCsv(filtered)}
        >
          Exporter CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total avis" value={stats?.total ?? data?.total ?? '—'} sub="+2% ce mois" />
        <StatCard
          label="Moyenne plateforme"
          value={stats?.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
          sub="Avis publiés"
          accent="blue"
        />
        <StatCard label="En attente" value={stats?.hiddenCount ?? '—'} sub="À modérer" accent="amber" />
        <StatCard label="Signalés" value={0} sub="Aucun signalement" accent="red" />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par client, bateau ou avis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
        </div>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500"
        >
          <option value="all">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>
          ))}
        </select>

        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-0.5">
          {([
            { key: 'all', label: 'Tous' },
            { key: 'published', label: 'Publiés' },
            { key: 'hidden', label: 'Masqués' },
          ] as { key: StatusFilter; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === tab.key
                  ? 'bg-ocean-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun avis trouvé.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-left">
                  <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Client</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Bateau &amp; Résumé</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Note</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Statut</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      onClick={() => setSelected(selected?.id === r.id ? null : r)}
                      className={`border-b border-gray-50 dark:border-gray-700/50 last:border-0 cursor-pointer transition-colors ${
                        selected?.id === r.id
                          ? 'bg-ocean-50/50 dark:bg-ocean-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-gray-500">
                            {r.reviewer?.avatar ? (
                              <img src={r.reviewer.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (r.reviewer?.firstName?.[0] ?? '#').toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight">
                              {r.reviewer
                                ? `${r.reviewer.firstName} ${r.reviewer.lastName}`
                                : `Utilisateur #${r.reviewerId}`}
                            </p>
                            <p className="text-[11px] text-gray-400">{TYPE_LABELS[r.type] ?? r.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[240px]">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{r.boatTitle ?? '—'}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{r.comment ?? ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StarRow rating={r.rating} />
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge isPublished={r.isPublished} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {r.isPublished ? (
                            <ActionBtn
                              icon={<EyeOff size={14} />}
                              title="Masquer"
                              onClick={() => { setHideTarget(r); setAdminNote('') }}
                            />
                          ) : (
                            <ActionBtn
                              icon={<Eye size={14} />}
                              title="Approuver & publier"
                              onClick={() => moderateMutation.mutate({ id: r.id, isPublished: true })}
                            />
                          )}
                          <ActionBtn
                            icon={<Flag size={14} />}
                            title="Signaler"
                            className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            onClick={() => flagMutation.mutate(r.id)}
                          />
                          <ActionBtn
                            icon={<Trash2 size={14} />}
                            title="Supprimer"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => confirmDelete(r)}
                          />
                        </div>
                      </td>
                    </tr>

                    {selected?.id === r.id && (
                      <tr className="bg-ocean-50/30 dark:bg-ocean-900/10 border-b border-gray-100 dark:border-gray-700/50">
                        <td colSpan={6} className="px-6 py-5">
                          <div className="flex flex-col sm:flex-row gap-5">
                            <div className="flex-1">
                              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                                Commentaire du client
                              </p>
                              <blockquote className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 italic leading-relaxed">
                                « {r.comment || 'Aucun commentaire.'} »
                              </blockquote>
                              {r.adminNote && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
                                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                                  Note admin : {r.adminNote}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 justify-start pt-6 sm:pt-0 sm:justify-center">
                              {!r.isPublished ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<Eye size={14} />}
                                  loading={moderateMutation.isPending}
                                  onClick={() => moderateMutation.mutate({ id: r.id, isPublished: true })}
                                >
                                  Approuver &amp; Publier
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  leftIcon={<EyeOff size={14} />}
                                  onClick={() => { setHideTarget(r); setAdminNote('') }}
                                >
                                  Masquer l'avis
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                leftIcon={<Trash2 size={14} />}
                                loading={deleteMutation.isPending}
                                onClick={() => confirmDelete(r)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} sur {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft size={15} />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={15} />}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

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
          {hideTarget?.comment && (
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
              placeholder="Raison du masquage, visible uniquement par les admins…"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
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
