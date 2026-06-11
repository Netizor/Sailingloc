import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  Ship,
  MessageCircle,
  Settings,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { getInitials, cn } from '../../lib/utils'
import { UserRole } from '../../types'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
  ownerOnly?: boolean
  renterOnly?: boolean
}

const renterNavItems: NavItem[] = [
  { to: '/mon-espace', label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/mon-espace/reservations', label: 'Mes Réservations', icon: <CalendarCheck size={18} /> },
  { to: '/proprietaire/bateaux', label: 'Mon Bateaux', icon: <Ship size={18} />, ownerOnly: true },
  { to: '/mon-espace/messages', label: 'Messages', icon: <MessageCircle size={18} /> },
  { to: '/mon-espace/profil', label: 'Paramètres', icon: <Settings size={18} /> },
]

const ownerNavItems: NavItem[] = [
  { to: '/proprietaire', label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/proprietaire/reservations', label: 'Mes Réservations', icon: <CalendarCheck size={18} /> },
  { to: '/proprietaire/bateaux', label: 'Mon Bateaux', icon: <Ship size={18} /> },
  { to: '/mon-espace/messages', label: 'Messages', icon: <MessageCircle size={18} /> },
  { to: '/mon-espace/profil', label: 'Paramètres', icon: <Settings size={18} /> },
]

const UserDashboardLayout: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isOwner = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN
  const isOwnerSpace = pathname.startsWith('/proprietaire')

  const navItems = isOwnerSpace ? ownerNavItems : renterNavItems

  const roleLabel =
    user?.role === UserRole.OWNER
      ? 'Propriétaire Premium'
      : user?.role === UserRole.ADMIN
        ? 'Administrateur'
        : 'Locataire'

  const displayName = isOwnerSpace && user
    ? `${user.firstName} ${user.lastName}`
    : 'Mon Compte'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 sticky top-24 flex flex-col">
              {/* Profil */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-gray-700">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-ocean-100 dark:bg-ocean-800/40 flex items-center justify-center mb-3 ring-2 ring-ocean-50 dark:ring-ocean-900">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-ocean-700 dark:text-ocean-400">
                      {user ? getInitials(user.firstName, user.lastName) : '?'}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {roleLabel}
                </p>
              </div>

              {/* Navigation */}
              <nav className="py-4 space-y-1 flex-1">
                {navItems
                  .filter((item) => {
                    if (item.ownerOnly && !isOwner) return false
                    if (item.renterOnly && isOwner) return false
                    return true
                  })
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-brand-blue text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200',
                        )
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  ))}
              </nav>

              {/* Ajouter un bateau — bouton mis en avant */}
              {isOwner && (
                <button
                  onClick={() => navigate('/proprietaire/bateaux/nouveau')}
                  className="w-full flex items-center justify-center gap-2.5 bg-brand-teal hover:bg-brand-teal/90 active:scale-[0.98] text-white text-sm font-semibold py-3.5 px-4 rounded-xl transition-all mt-2 shadow-lg shadow-brand-teal/30 ring-2 ring-brand-teal/20 hover:shadow-xl hover:ring-brand-teal/40"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Ajouter un bateau
                </button>
              )}
            </div>
          </aside>

          {/* Contenu principal */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default UserDashboardLayout
