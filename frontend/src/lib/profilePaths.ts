import type { User } from '../types'
import { UserRole } from '../types'

/** Profil public visible par les locataires (propriétaires). */
export function getPublicProfilePath(user: Pick<User, 'id' | 'role'>): string | null {
  if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
    return `/proprietaires/${user.id}`
  }
  return null
}

/** Route protégée : redirige vers le profil public de l'utilisateur connecté. */
export const MY_PUBLIC_PROFILE_ROUTE = '/mon-espace/mon-profil'

export const SETTINGS_ROUTE = '/mon-espace/profil'

/** Tableau de bord principal selon le rôle */
export function getDefaultDashboardPath(role?: string): string {
  if (role === 'OWNER' || role === 'ADMIN') return '/proprietaire'
  return '/mon-espace'
}
