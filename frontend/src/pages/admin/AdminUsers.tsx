import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, Shield, User as UserIcon, Ship } from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { formatDate } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { BadgeVariant } from '../../components/ui/Badge'
import type { User } from '../../types'
import toast from 'react-hot-toast'

// Le backend ajoute boatsCount au payload admin, absent de l'interface User de base
interface AdminUser extends User {
  boatsCount?: number
}

const roleConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  ADMIN: { label: 'Admin', variant: 'danger', icon: <Shield size={11} /> },
  OWNER: { label: 'Propriétaire', variant: 'primary', icon: <Ship size={11} /> },
  RENTER: { label: 'Locataire', variant: 'default', icon: <UserIcon size={11} /> },
}

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter }],
    queryFn: () => adminApi.getUsers({ search: search || undefined, role: roleFilter === 'ALL' ? undefined : roleFilter }),
    staleTime: 60 * 1000,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) =>
      adminApi.setUserActive(userId, active),
    onSuccess: (_, { active }) => {
      toast.success(active ? 'Compte activé' : 'Compte suspendu')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Erreur'),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      adminApi.setUserRole(userId, role),
    onSuccess: () => {
      toast.success('Rôle mis à jour')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Erreur'),
  })

  const users: AdminUser[] = data?.users ?? []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des utilisateurs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{data?.total ?? 0} utilisateur(s)</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-700"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="RENTER">Locataires</option>
            <option value="OWNER">Propriétaires</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Bateaux', 'Membre depuis', 'Actions'].map((h) => (
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
                  {users.map((user: AdminUser) => {
                    const roleInfo = roleConfig[user.role] ?? roleConfig['RENTER']
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        {/* Avatar + name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-[120px] sm:max-w-[180px] truncate">
                          {user.email}
                        </td>

                        {/* Role with change select */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Badge variant={roleInfo.variant} size="sm">
                              {roleInfo.icon}
                              {roleInfo.label}
                            </Badge>
                            <select
                              value={user.role}
                              onChange={(e) =>
                                changeRoleMutation.mutate({ userId: user.id, role: e.target.value })
                              }
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-1.5 py-1 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                              aria-label="Changer le rôle"
                            >
                              <option value="RENTER">Locataire</option>
                              <option value="OWNER">Propriétaire</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={user.isActive ? 'success' : 'danger'} size="sm" dot>
                            {user.isActive ? 'Actif' : 'Suspendu'}
                          </Badge>
                        </td>

                        <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-center">
                          {user.boatsCount ?? 0}
                        </td>

                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <Button
                            variant={user.isActive ? 'danger' : 'secondary'}
                            size="sm"
                            leftIcon={
                              user.isActive ? (
                                <UserX size={13} />
                              ) : (
                                <UserCheck size={13} />
                              )
                            }
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                userId: user.id,
                                active: !user.isActive,
                              })
                            }
                            loading={toggleActiveMutation.isPending}
                          >
                            {user.isActive ? 'Suspendre' : 'Activer'}
                          </Button>
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

export default AdminUsers
