import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, ExternalLink, ShieldOff, ShieldCheck, Star, Trash2,
  AlertTriangle, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/admin.api'
import { formatPrice, cn } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { BadgeVariant } from '../../components/ui/Badge'
import toast from 'react-hot-toast'

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE:    { label: 'Actif',      variant: 'success' },
  PUBLISHED: { label: 'Actif',      variant: 'success' },
  INACTIVE:  { label: 'Inactif',    variant: 'danger' },
  SUSPENDED: { label: 'Inactif',    variant: 'danger' },
  DRAFT:     { label: 'Brouillon',  variant: 'default' },
}

const boatTypeLabels: Record<string, string> = {
  SAILBOAT:   'Voilier',
  CATAMARAN:  'Catamaran',
  MOTORBOAT:  'Moteur',
  SEMI_RIGID: 'Semi-rigide',
  YACHT:      'Yacht',
  OTHER:      'Autre',
}

const LIMIT = 20

// ─── DeleteConfirmModal ───────────────────────────────────────
function DeleteConfirmModal({
  boatTitle,
  onClose,
  onConfirm,
  isLoading,
}: {
  boatTitle: string
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Supprimer l'annonce</h2>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Supprimer <strong>« {boatTitle} »</strong> ? Cette action est irréversible et supprimera
          toutes les données associées.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Suppression…' : 'Supprimer'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────
function Pagination({ page, totalPages, total, onPage }: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
      <span>Page {page} / {totalPages} — {total} résultat(s)</span>
      <div className="flex gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className={cn('p-1.5 rounded-lg border border-gray-200 dark:border-gray-600',
            page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={cn('w-8 h-8 rounded-lg text-xs font-medium border transition-colors',
              p === page
                ? 'bg-ocean-500 text-white border-ocean-500'
                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700')}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className={cn('p-1.5 rounded-lg border border-gray-200 dark:border-gray-600',
            page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
const AdminBoats: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page,         setPage]         = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)

  const resetPage = () => setPage(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'boats', { search, statusFilter, page }],
    queryFn: () => adminApi.getBoats({
      search:  search       || undefined,
      status:  statusFilter === 'ALL' ? undefined : statusFilter,
      page,
      limit: LIMIT,
    }),
    staleTime: 60 * 1000,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ boatId, action }: { boatId: number; action: 'suspend' | 'activate' }) =>
      adminApi.setBoatStatus(boatId, action === 'activate' ? 'ACTIVE' : 'INACTIVE'),
    onSuccess: (_, { action }) => {
      toast.success(action === 'activate' ? 'Annonce activée' : 'Annonce suspendue')
      queryClient.invalidateQueries({ queryKey: ['admin', 'boats'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (boatId: number) => adminApi.deleteBoat(boatId),
    onSuccess: () => {
      toast.success('Annonce supprimée')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'boats'] })
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const boats: any[] = data?.boats ?? []
  const total      = data?.total      ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des bateaux</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} annonce(s)</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Titre, ville…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); resetPage() }}
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">Actifs</option>
          <option value="DRAFT">Brouillons</option>
          <option value="INACTIVE">Inactifs / Suspendus</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : boats.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            Aucune annonce trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  {['Annonce', 'Type', 'Propriétaire', 'Ville', 'Tarif/j', 'Note', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {boats.map((boat: any) => {
                  const statusInfo = statusConfig[boat.status ?? 'DRAFT'] ?? statusConfig['DRAFT']
                  const isInactive = boat.status === 'INACTIVE' || boat.status === 'SUSPENDED'
                  return (
                    <tr key={boat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">

                      {/* Image + titre */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            {boat.images?.[0] ? (
                              <img src={boat.images[0]} alt={boat.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center">
                                <span className="text-[10px] text-ocean-300">—</span>
                              </div>
                            )}
                          </div>
                          <div className="max-w-[160px]">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{boat.title}</p>
                            {boat.port && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{boat.port}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {boatTypeLabels[boat.type] ?? boat.type}
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {boat.owner?.firstName} {boat.owner?.lastName}
                      </td>

                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{boat.city ?? '—'}</td>

                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {formatPrice(boat.dailyRate)}
                      </td>

                      <td className="px-5 py-4">
                        {(boat.rating ?? 0) > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star size={13} fill="currentColor" strokeWidth={0} className="text-amber-400" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {boat.rating.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant={statusInfo.variant} size="sm" dot>
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Actions — 3 slots fixes */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<ExternalLink size={12} />}
                            onClick={() => navigate(`/bateaux/${boat.id}`)}
                            aria-label="Voir l'annonce"
                          />
                          <Button
                            variant={isInactive ? 'secondary' : 'danger'}
                            size="sm"
                            leftIcon={isInactive ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                boatId: boat.id,
                                action: isInactive ? 'activate' : 'suspend',
                              })
                            }
                            loading={toggleStatusMutation.isPending}
                          >
                            {isInactive ? 'Activer' : 'Suspendre'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 size={12} />}
                            onClick={() => setDeleteTarget({ id: boat.id, title: boat.title })}
                            loading={deleteMutation.isPending && deleteTarget?.id === boat.id}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          boatTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

export default AdminBoats
