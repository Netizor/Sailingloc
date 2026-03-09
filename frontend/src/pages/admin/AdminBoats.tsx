import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ExternalLink, ShieldOff, ShieldCheck, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/admin.api'
import { formatPrice } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { BadgeVariant } from '../../components/ui/Badge'
import toast from 'react-hot-toast'

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PUBLISHED: { label: 'Publié', variant: 'success' },
  DRAFT: { label: 'Brouillon', variant: 'default' },
  SUSPENDED: { label: 'Suspendu', variant: 'danger' },
  PENDING_REVIEW: { label: 'En révision', variant: 'warning' },
}

const boatTypeLabels: Record<string, string> = {
  SAILBOAT: 'Voilier',
  CATAMARAN: 'Catamaran',
  MOTORBOAT: 'Moteur',
  SEMI_RIGID: 'Semi-rigide',
  YACHT: 'Yacht',
  OTHER: 'Autre',
}

const AdminBoats: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'boats', { search, statusFilter }],
    queryFn: () =>
      adminApi.getBoats({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    staleTime: 60 * 1000,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ boatId, action }: { boatId: number; action: 'suspend' | 'activate' }) =>
      adminApi.setBoatStatus(boatId, action === 'activate' ? 'PUBLISHED' : 'SUSPENDED'),
    onSuccess: (_, { action }) => {
      toast.success(action === 'activate' ? 'Bateau réactivé' : 'Bateau suspendu')
      queryClient.invalidateQueries({ queryKey: ['admin', 'boats'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const boats: any[] = data?.boats ?? []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des bateaux</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{data?.total ?? 0} bateau(x)</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par titre, ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-700"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PUBLISHED">Publiés</option>
            <option value="DRAFT">Brouillons</option>
            <option value="PENDING_REVIEW">En révision</option>
            <option value="SUSPENDED">Suspendus</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : boats.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
              Aucun bateau trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    {['Bateau', 'Type', 'Propriétaire', 'Ville', 'Tarif/j', 'Note', 'Statut', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {boats.map((boat: any) => {
                    const statusInfo = statusConfig[boat.status ?? 'DRAFT'] ?? statusConfig['DRAFT']
                    const isSuspended = boat.status === 'SUSPENDED'
                    return (
                      <tr key={boat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        {/* Image + title */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                              {boat.images?.[0] ? (
                                <img
                                  src={boat.images[0]}
                                  alt={boat.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center">
                                  <span className="text-[10px] text-ocean-300">No img</span>
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
                          {boat.averageRating != null && boat.averageRating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star size={13} fill="currentColor" strokeWidth={0} className="text-amber-400" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {boat.averageRating.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={statusInfo.variant} size="sm" dot>
                            {statusInfo.label}
                          </Badge>
                        </td>

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
                              variant={isSuspended ? 'secondary' : 'danger'}
                              size="sm"
                              leftIcon={
                                isSuspended ? (
                                  <ShieldCheck size={12} />
                                ) : (
                                  <ShieldOff size={12} />
                                )
                              }
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  boatId: boat.id,
                                  action: isSuspended ? 'activate' : 'suspend',
                                })
                              }
                              loading={toggleStatusMutation.isPending}
                            >
                              {isSuspended ? 'Activer' : 'Suspendre'}
                            </Button>
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
      </div>
    </div>
  )
}

export default AdminBoats
