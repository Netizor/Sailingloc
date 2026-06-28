import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, UserCheck, UserX, Shield, User as UserIcon, Ship, Eye, X,
  Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight, MailCheck,
} from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { formatDate, cn } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { BadgeVariant } from '../../components/ui/Badge'
import type { User } from '../../types'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/auth.store'

interface AdminUser extends User {
  boatsCount?: number
  bookingsCount?: number
}

const ROLE_HIERARCHY: Record<string, number> = { RENTER: 0, OWNER: 1, ADMIN: 2 }

const roleConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  ADMIN: { label: 'Admin', variant: 'danger', icon: <Shield size={11} /> },
  OWNER: { label: 'Propriétaire', variant: 'primary', icon: <Ship size={11} /> },
  RENTER: { label: 'Locataire', variant: 'default', icon: <UserIcon size={11} /> },
}

const INPUT_CLS = 'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-400'
const LABEL_CLS = 'block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'

function ActionBtn({
  icon,
  title,
  onClick,
  disabled,
  className,
  invisible: inv,
}: {
  icon: React.ReactNode
  title: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  invisible?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || inv}
      title={title}
      aria-label={title}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        inv ? 'invisible pointer-events-none' : '',
        !inv && 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
        !inv && disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {icon}
    </button>
  )
}

// ─── UserFormModal ────────────────────────────────────────────
interface UserFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  phone: string
}

function UserFormModal({
  initial,
  onClose,
  onSubmit,
  isLoading,
  currentUserRole,
}: {
  initial?: AdminUser | null
  onClose: () => void
  onSubmit: (data: UserFormData) => void
  isLoading: boolean
  currentUserRole: string
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<UserFormData>({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    password: '',
    role: initial?.role ?? 'RENTER',
    phone: initial?.phone ?? '',
  })

  const set =
    (k: keyof UserFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const selfDemotion =
    isEdit &&
    (ROLE_HIERARCHY[form.role] ?? 0) < (ROLE_HIERARCHY[currentUserRole] ?? 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isEdit
              ? `Modifier — ${initial?.firstName} ${initial?.lastName}`
              : 'Créer un utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Prénom *</label>
              <input required value={form.firstName} onChange={set('firstName')} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Nom *</label>
              <input required value={form.lastName} onChange={set('lastName')} className={INPUT_CLS} />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Email *</label>
            <input required type="email" value={form.email} onChange={set('email')} className={INPUT_CLS} />
          </div>

          {!isEdit && (
            <div>
              <label className={LABEL_CLS}>
                Mot de passe{' '}
                <span className="normal-case font-normal text-gray-400">(auto-généré si vide)</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Laisser vide pour auto-générer"
                className={INPUT_CLS}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+33 6 00 00 00 00"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Rôle</label>
              <select value={form.role} onChange={set('role')} className={INPUT_CLS}>
                <option value="RENTER">Locataire</option>
                <option value="OWNER">Propriétaire</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {selfDemotion && (
            <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
              <AlertTriangle size={13} />
              Auto-rétrogradation interdite — vous ne pouvez pas choisir un rôle inférieur au vôtre.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || selfDemotion}
              className="flex-1 bg-ocean-500 hover:bg-ocean-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? '...' : isEdit ? 'Enregistrer' : "Créer l'utilisateur"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DeleteConfirmModal ───────────────────────────────────────
function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  user: AdminUser
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Supprimer l'utilisateur
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Supprimer{' '}
          <strong>
            {user.firstName} {user.lastName}
          </strong>{' '}
          ({user.email}) ? Cette action est irréversible.
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

// ─── DetailModal ──────────────────────────────────────────────
function DetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Profil utilisateur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-full bg-ocean-700 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <dl className="space-y-2 text-sm">
          {[
            { label: 'Rôle', value: roleConfig[user.role]?.label ?? user.role },
            { label: 'Statut', value: user.isActive ? 'Actif' : 'Bloqué' },
            { label: 'Téléphone', value: user.phone ?? '—' },
            { label: 'Email vérifié', value: user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'Non vérifié' },
            { label: 'Inscrit le', value: formatDate(user.createdAt) },
            { label: 'Bateaux', value: user.boatsCount ?? 0 },
            ...(user.bookingsCount != null
              ? [{ label: 'Réservations', value: user.bookingsCount }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const LIMIT = 20

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  // reset to first page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleRole = (v: string) => { setRoleFilter(v); setPage(1) }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, page }],
    queryFn: () =>
      adminApi.getUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        page,
        limit: LIMIT,
      }),
    staleTime: 60 * 1000,
  })

  const { data: detailData } = useQuery({
    queryKey: ['admin', 'user', detailUser?.id],
    queryFn: () => adminApi.getUser(detailUser!.id),
    enabled: detailUser != null,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) =>
      adminApi.setUserActive(userId, active),
    onSuccess: (_, { active }) => {
      toast.success(active ? 'Compte activé' : 'Compte suspendu')
      invalidate()
    },
    onError: () => toast.error('Erreur'),
  })

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      toast.success('Utilisateur créé')
      setShowCreate(false)
      invalidate()
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Erreur création'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof adminApi.updateUser>[1] }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour')
      setEditTarget(null)
      invalidate()
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Erreur mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Utilisateur supprimé')
      setDeleteTarget(null)
      invalidate()
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Erreur suppression'),
  })

  const verifyEmailMutation = useMutation({
    mutationFn: (id: number) => adminApi.verifyUserEmail(id),
    onSuccess: () => {
      toast.success('Email marqué comme vérifié')
      invalidate()
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Erreur'),
  })

  const handleCreateSubmit = (form: UserFormData) => {
    createMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password || undefined,
      role: form.role,
      phone: form.phone || undefined,
    })
  }

  const handleEditSubmit = (form: UserFormData) => {
    if (!editTarget) return
    updateMutation.mutate({
      id: editTarget.id,
      payload: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        phone: form.phone || undefined,
      },
    })
  }

  const users: AdminUser[] = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} utilisateur(s)</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setShowCreate(true)}
        >
          Créer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            placeholder="Rechercher par nom, email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRole(e.target.value)}
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
                  {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Bateaux', 'Membre depuis', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {users.map((user) => {
                  const roleInfo = roleConfig[user.role] ?? roleConfig['RENTER']
                  const isSelf = currentUser?.id === user.id
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Avatar + name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {user.firstName} {user.lastName}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-ocean-500 font-semibold">(vous)</span>
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-[120px] sm:max-w-[180px] truncate">
                        {user.email}
                      </td>

                      {/* Role badge */}
                      <td className="px-5 py-4">
                        <Badge variant={roleInfo.variant} size="sm">
                          {roleInfo.icon}
                          {roleInfo.label}
                        </Badge>
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

                      {/* Actions — 5 slots fixes pour toutes les lignes */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn
                            icon={<Eye size={14} />}
                            title="Voir le profil"
                            onClick={() => setDetailUser(user)}
                          />
                          <ActionBtn
                            icon={<Pencil size={14} />}
                            title="Modifier"
                            onClick={() => setEditTarget(user)}
                          />
                          {/* Slot vérification email — toujours présent, invisible si déjà vérifié */}
                          <ActionBtn
                            icon={<MailCheck size={14} />}
                            title="Marquer l'email comme vérifié"
                            onClick={() => verifyEmailMutation.mutate(user.id)}
                            disabled={verifyEmailMutation.isPending}
                            invisible={!!user.emailVerifiedAt}
                            className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          />
                          {/* Bloquer / Débloquer */}
                          <ActionBtn
                            icon={user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            title={user.isActive ? 'Bloquer le compte' : 'Débloquer le compte'}
                            onClick={() =>
                              toggleActiveMutation.mutate({ userId: user.id, active: !user.isActive })
                            }
                            disabled={toggleActiveMutation.isPending}
                            className={
                              user.isActive
                                ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }
                          />
                          {/* Slot suppression — toujours présent, invisible pour soi-même */}
                          <ActionBtn
                            icon={<Trash2 size={14} />}
                            title="Supprimer l'utilisateur"
                            onClick={() => setDeleteTarget(user)}
                            invisible={isSelf}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Page {page} / {totalPages} — {total} résultat(s)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                'p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors',
                page === 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium border transition-colors',
                    p === page
                      ? 'bg-ocean-500 text-white border-ocean-500'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                'p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors',
                page === totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailUser && (
        <DetailModal
          user={(detailData as AdminUser) ?? detailUser}
          onClose={() => setDetailUser(null)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <UserFormModal
          initial={null}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
          isLoading={createMutation.isPending}
          currentUserRole={currentUser?.role ?? 'RENTER'}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <UserFormModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          isLoading={updateMutation.isPending}
          currentUserRole={currentUser?.role ?? 'RENTER'}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

export default AdminUsers
