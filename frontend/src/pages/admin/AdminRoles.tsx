import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck,
  Users,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Search,
  Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi, type RoleDefinition } from '../../api/admin.api'
import { useAuthStore } from '../../store/auth.store'
import { getInitials, cn } from '../../lib/utils'

// ─── Constantes ────────────────────────────────────────────
const ROLE_HIERARCHY: Record<string, number> = { RENTER: 0, OWNER: 1, ADMIN: 2 }

const FALLBACK_ROLES: RoleDefinition[] = [
  // { id: 0, name: 'RENTER', label: 'Locataire', description: '', color: 'gray', is_system: true, created_at: '' },
  // { id: 0, name: 'OWNER', label: 'Propriétaire', description: '', color: 'blue', is_system: true, created_at: '' },
  // { id: 0, name: 'ADMIN', label: 'Administrateur', description: '', color: 'red', is_system: true, created_at: '' },
]

const COLOR_OPTIONS = [
  { value: 'gray',   bg: 'bg-gray-100 dark:bg-gray-700',     dot: 'bg-gray-400',    text: 'text-gray-600 dark:text-gray-300' },
  { value: 'blue',   bg: 'bg-blue-50 dark:bg-blue-900/30',   dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-300' },
  { value: 'red',    bg: 'bg-red-50 dark:bg-red-900/30',     dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-400' },
  { value: 'green',  bg: 'bg-green-50 dark:bg-green-900/30', dot: 'bg-green-500',   text: 'text-green-700 dark:text-green-400' },
  { value: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/30',dot:'bg-yellow-500',  text: 'text-yellow-700 dark:text-yellow-400' },
  { value: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/30',dot:'bg-purple-500',  text: 'text-purple-700 dark:text-purple-400' },
  { value: 'orange', bg: 'bg-orange-50 dark:bg-orange-900/30',dot:'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400' },
] as const

function getColorMeta(color: string) {
  return COLOR_OPTIONS.find((c) => c.value === color) ?? COLOR_OPTIONS[0]
}

// ─── RoleBadge ─────────────────────────────────────────────
function RoleBadge({ label, color }: { name?: string; label: string; color: string }) {
  const meta = getColorMeta(color)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {label}
    </span>
  )
}

// ─── ColorPicker ───────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={cn(
            'w-7 h-7 rounded-full border-2 transition-all',
            c.dot,
            value === c.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105',
          )}
          title={c.value}
        />
      ))}
    </div>
  )
}

// ─── RoleForm (création / édition) ─────────────────────────
interface RoleFormProps {
  initial?: Partial<RoleDefinition>
  isEdit?: boolean
  onSubmit: (v: { name: string; label: string; description: string; color: string }) => void
  onCancel: () => void
  isLoading: boolean
}

function RoleForm({ initial, isEdit, onSubmit, onCancel, isLoading }: RoleFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    label: initial?.label ?? '',
    description: initial?.description ?? '',
    color: initial?.color ?? 'gray',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-200 dark:border-gray-600 p-5 space-y-4"
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {isEdit ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Identifiant technique *
            </label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              placeholder="EX: MODERATOR"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-mono uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">Lettres majuscules et underscores uniquement</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Nom affiché *
          </label>
          <input
            required
            value={form.label}
            onChange={set('label')}
            placeholder="Ex : Modérateur"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Description
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={set('description')}
          placeholder="Ce rôle permet de…"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Couleur du badge
        </label>
        <div className="flex items-center gap-4">
          <ColorPicker value={form.color} onChange={(v) => setForm((f) => ({ ...f, color: v }))} />
          <RoleBadge label={form.label || 'Aperçu'} color={form.color} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-ocean-500 hover:bg-ocean-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <Check size={15} />
          {isEdit ? 'Enregistrer' : 'Créer le rôle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={15} />
          Annuler
        </button>
      </div>
    </form>
  )
}

// ─── RoleCard ──────────────────────────────────────────────
interface RoleCardProps {
  role: RoleDefinition
  userCount: number
  onEdit: () => void
  onDelete: () => void
}

function RoleCard({ role, userCount, onEdit, onDelete }: RoleCardProps) {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <RoleBadge label={role.label} color={role.color} />
        {role.is_system ? (
          <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full">
            <Lock size={10} />
            Système
          </span>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-ocean-600 hover:bg-ocean-50 dark:hover:bg-ocean-900/20 transition-colors"
              title="Modifier"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{role.name}</p>
        {role.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{role.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50">
        <Users size={13} className="text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {userCount} utilisateur{userCount !== 1 ? 's' : ''}
        </span>
      </div>

      {role.is_system && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
        >
          <Pencil size={12} />
          Modifier label / description
        </button>
      )}
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────
export default function AdminRoles() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuthStore()

  const [showCreate, setShowCreate] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null)

  // Attribution
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pendingRoles, setPendingRoles] = useState<Record<number, string>>({})

  // Queries
  const { data: rolesRaw = [] } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminApi.listRoles,
  })
  const roles = rolesRaw.length > 0 ? rolesRaw : FALLBACK_ROLES

  const { data: stats = {} } = useQuery({
    queryKey: ['admin', 'role-stats'],
    queryFn: adminApi.getRoleStats,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'roles-users', roleFilter, search, page],
    queryFn: () => adminApi.getUsers({ role: roleFilter || undefined, search, page, limit: 20 }),
  })

  // Mutations rôles
  const createMutation = useMutation({
    mutationFn: adminApi.createRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); setShowCreate(false); toast.success('Rôle créé') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; label?: string; description?: string; color?: string }) =>
      adminApi.updateRole(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); setEditingRole(null); toast.success('Rôle modifié') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); qc.invalidateQueries({ queryKey: ['admin', 'role-stats'] }); toast.success('Rôle supprimé') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  // Mutation attribution
  const assignMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => adminApi.setUserRole(userId, role),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles-users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'role-stats'] })
      setPendingRoles((p) => { const n = { ...p }; delete n[userId]; return n })
      toast.success('Rôle attribué')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const users = (usersData as any)?.users ?? (usersData as any)?.data ?? []
  const totalPages = (usersData as any)?.totalPages ?? 1
  const total = (usersData as any)?.total ?? 0

  const getPending = (userId: number, cur: string) => pendingRoles[userId] ?? cur

  const isSelfDowngrade = (userId: number, newRole: string) => {
    if (userId !== currentUser?.id) return false
    return (ROLE_HIERARCHY[newRole] ?? 0) < (ROLE_HIERARCHY[currentUser?.role] ?? 0)
  }

  const canApply = (userId: number, cur: string) => {
    const p = getPending(userId, cur)
    return p !== cur && !isSelfDowngrade(userId, p)
  }

  // Tabs dynamiques depuis les rôles DB
  const tabs = [
    { value: '', label: 'Tous', count: Object.values(stats).reduce((a, b) => a + b, 0) },
    ...roles.map((r) => ({ value: r.name, label: r.label, count: (stats as any)[r.name] ?? 0 })),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des rôles</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Créez et gérez les rôles de la plateforme, puis attribuez-les aux utilisateurs.
        </p>
      </div>

      {/* ── Section 1 : Définition des rôles ─────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-ocean-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Rôles de la plateforme
            </h2>
          </div>
          {!showCreate && !editingRole && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-ocean-500 hover:bg-ocean-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} />
              Créer un rôle
            </button>
          )}
        </div>

        {/* Formulaire de création */}
        {showCreate && !editingRole && (
          <div className="mb-5">
            <RoleForm
              onSubmit={(v) => createMutation.mutate(v)}
              onCancel={() => setShowCreate(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        )}

        {/* Formulaire d'édition */}
        {editingRole && (
          <div className="mb-5">
            <RoleForm
              isEdit
              initial={editingRole}
              onSubmit={(v) => updateMutation.mutate({ id: editingRole.id, label: v.label, description: v.description, color: v.color })}
              onCancel={() => setEditingRole(null)}
              isLoading={updateMutation.isPending}
            />
          </div>
        )}

        {/* Grille des rôles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              userCount={(stats as any)[role.name] ?? 0}
              onEdit={() => { setShowCreate(false); setEditingRole(role) }}
              onDelete={() => {
                if (!window.confirm(`Supprimer le rôle "${role.label}" ?`)) return
                deleteMutation.mutate(role.id)
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Section 2 : Attribution des rôles ────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5 mb-4">
            <Users size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Attribution des rôles
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-1 flex-wrap">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setRoleFilter(t.value); setPage(1) }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    roleFilter === t.value
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                  )}
                >
                  {t.label}
                  <span className="text-xs text-gray-400">{t.count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-400"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {usersLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-ocean-500 border-t-transparent rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">Aucun utilisateur trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Utilisateur', 'Email', 'Rôle actuel', 'Nouveau rôle', ''].map((col, i) => (
                    <th key={i} className={`text-xs font-medium text-gray-400 dark:text-gray-500 px-5 py-3 ${i < 3 ? 'text-left' : 'text-center'}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {(users as any[]).map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const pending = getPending(u.id, u.role)
                  const downgradeBlocked = isSelfDowngrade(u.id, pending)
                  const applicable = canApply(u.id, u.role)
                  const roleLabel = roles.find((r) => r.name === u.role)

                  return (
                    <tr key={u.id} className={cn('hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors', isSelf && 'bg-ocean-50/30 dark:bg-ocean-900/10')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-ocean-100 dark:bg-ocean-800/40 flex items-center justify-center shrink-0 text-xs font-semibold text-ocean-700 dark:text-ocean-400">
                            {u.avatar ? <img src={u.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(u.firstName, u.lastName)}
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {u.firstName} {u.lastName}
                            {isSelf && <span className="ml-1.5 text-[10px] text-ocean-500 font-semibold">(vous)</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <RoleBadge
                          label={roleLabel?.label ?? u.role}
                          color={roleLabel?.color ?? 'gray'}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={pending}
                          onChange={(e) => setPendingRoles((p) => ({ ...p, [u.id]: e.target.value }))}
                          className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-400"
                        >
                          {roles.map((r) => (
                            <option key={r.name} value={r.name}>{r.label}</option>
                          ))}
                        </select>
                        {downgradeBlocked && (
                          <p className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                            <AlertTriangle size={10} />
                            Auto-rétrogradation interdite
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => assignMutation.mutate({ userId: u.id, role: pending })}
                          disabled={!applicable || assignMutation.isPending}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                            applicable
                              ? 'bg-ocean-500 hover:bg-ocean-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
                          )}
                        >
                          <Check size={13} />
                          Appliquer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">{total} utilisateurs</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors', p === page ? 'bg-brand-navy text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
