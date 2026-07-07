export const SETTINGS_ROUTE = '/mon-espace/profil'

/** Tableau de bord principal selon le rôle */
export function getDefaultDashboardPath(role?: string): string {
  if (role === 'OWNER' || role === 'ADMIN') return '/proprietaire'
  return '/mon-espace'
}
