import React, { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  Ship,
  MessageCircle,
  Settings,
  Plus,
  Shield,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth.store'
import { MY_PUBLIC_PROFILE_ROUTE, SETTINGS_ROUTE, getPublicProfilePath } from '../../lib/profilePaths'
import api, { resolveApiBaseUrl } from '../../lib/axios'
import { getInitials, cn } from '../../lib/utils'
import { UserRole } from '../../types'

interface NavItem {
  to: string
  labelKey: string
  icon: React.ReactNode
  end?: boolean
  ownerOnly?: boolean
  renterOnly?: boolean
}

const renterNavItems: NavItem[] = [
  { to: '/mon-espace', labelKey: 'layout.dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/mon-espace/reservations', labelKey: 'layout.myBookings', icon: <CalendarCheck size={18} /> },
  { to: '/proprietaire/bateaux', labelKey: 'layout.myBoats', icon: <Ship size={18} />, ownerOnly: true },
  { to: '/mon-espace/messages', labelKey: 'layout.messages', icon: <MessageCircle size={18} /> },
  { to: '/mon-espace/verification', labelKey: 'layout.identityVerification', icon: <ShieldCheck size={18} /> },
  { to: SETTINGS_ROUTE, labelKey: 'layout.settings', icon: <Settings size={18} /> },
]

const ownerNavItems: NavItem[] = [
  { to: '/proprietaire', labelKey: 'layout.dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/proprietaire/reservations', labelKey: 'layout.myBookings', icon: <CalendarCheck size={18} /> },
  { to: '/proprietaire/bateaux', labelKey: 'layout.myBoats', icon: <Ship size={18} /> },
  { to: '/mon-espace/messages', labelKey: 'layout.messages', icon: <MessageCircle size={18} /> },
  { to: '/mon-espace/verification', labelKey: 'layout.identityVerification', icon: <ShieldCheck size={18} /> },
  { to: MY_PUBLIC_PROFILE_ROUTE, labelKey: 'nav.myProfile', icon: <UserCircle size={18} /> },
  { to: SETTINGS_ROUTE, labelKey: 'layout.settings', icon: <Settings size={18} /> },
]

const UserDashboardLayout: React.FC = () => {
  const { t } = useTranslation()
  const { user, accessToken } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const qc = useQueryClient()
  const lastMsgIdRef = useRef(0)

  // SSE global : notifie le destinataire dès qu'un nouveau message arrive
  useEffect(() => {
    if (!accessToken) return
    let es: EventSource | null = null
    let active = true

    const connect = async () => {
      if (!active) return
      let token = useAuthStore.getState().accessToken
      if (!token) return

      // Rafraîchit le token s'il est expiré avant d'ouvrir le SSE
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.exp * 1000 < Date.now()) {
          const rt = useAuthStore.getState().refreshToken
          if (!rt) return
          const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken: rt })
          useAuthStore.getState().setAccessToken(data.accessToken)
          useAuthStore.getState().setRefreshToken(data.refreshToken)
          token = data.accessToken
        }
      } catch { return }

      if (!active) return
      const url =
        `${resolveApiBaseUrl()}/messages/stream` +
        `?token=${encodeURIComponent(token)}&lastId=${lastMsgIdRef.current}`
      es = new EventSource(url)

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const newMsgs: Array<{ id: number }> = JSON.parse(event.data)
          if (!newMsgs.length) return
          const maxId = Math.max(...newMsgs.map((m) => m.id))
          if (maxId > lastMsgIdRef.current) lastMsgIdRef.current = maxId
          qc.invalidateQueries({ queryKey: ['conversations'] })
          qc.invalidateQueries({ queryKey: ['unread-messages-count'] })
        } catch { /* parse error silencieux */ }
      }

      es.onerror = () => {
        es?.close()
        es = null
        if (active) setTimeout(connect, 3_000)
      }
    }

    connect()
    return () => { active = false; es?.close() }
  }, [accessToken, qc])
  const isAdmin = user?.role === UserRole.ADMIN
  const isOwner = user?.role === UserRole.OWNER || isAdmin
  const isOwnerSpace = pathname.startsWith('/proprietaire')

  const navItems = (isOwnerSpace ? ownerNavItems : renterNavItems).map((item) =>
    !isOwnerSpace && isOwner && item.to === '/mon-espace' && item.end
      ? { ...item, to: '/proprietaire' }
      : item,
  )

  const roleLabel =
    user?.role === UserRole.OWNER
      ? t('layout.ownerPremium')
      : user?.role === UserRole.ADMIN
        ? t('layout.administrator')
        : t('layout.renter')

  const displayName = isOwnerSpace && user
    ? `${user.firstName} ${user.lastName}`
    : t('layout.myAccount')

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 sticky top-24 flex flex-col">
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-gray-700">
                {user && getPublicProfilePath(user) ? (
                  <button
                    type="button"
                    onClick={() => navigate(MY_PUBLIC_PROFILE_ROUTE)}
                    className="group flex flex-col items-center w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors p-2 -m-2"
                    title="Voir mon profil public"
                  >
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-ocean-100 dark:bg-ocean-800/40 flex items-center justify-center mb-3 ring-2 ring-ocean-50 dark:ring-ocean-900 group-hover:ring-ocean-200 dark:group-hover:ring-ocean-700 transition-all">
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
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-brand-blue transition-colors">
                      {displayName}
                    </p>
                    <p className="text-xs text-brand-blue dark:text-ocean-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Voir mon profil public
                    </p>
                  </button>
                ) : (
                  <>
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
                  </>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {roleLabel}
                </p>
              </div>

              <nav className="py-4 space-y-1 flex-1">
                {navItems
                  .filter((item) => {
                    if (item.ownerOnly && !isOwner) return false
                    if (item.renterOnly && isOwner) return false
                    return true
                  })
                  .map((item) => {
                    const isSettingsForRenter = item.labelKey === 'layout.settings' && !isOwner
                    return (
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
                        {isSettingsForRenter ? <UserCircle size={18} /> : item.icon}
                        {isSettingsForRenter ? t('nav.myProfile') : t(item.labelKey)}
                      </NavLink>
                    )
                  })}
                {isAdmin && (
                  <NavLink
                    to="/admin/bateaux"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mt-2 border border-dashed',
                        isActive
                          ? 'bg-brand-navy text-white border-brand-navy'
                          : 'text-brand-navy dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      )
                    }
                  >
                    <Shield size={18} />
                    {t('layout.adminAllBoats')}
                  </NavLink>
                )}
              </nav>

              {isOwner && (
                <button
                  onClick={() => navigate('/proprietaire/bateaux/nouveau')}
                  className="w-full flex items-center justify-center gap-2.5 bg-brand-teal hover:bg-brand-teal/90 active:scale-[0.98] text-white text-sm font-semibold py-3.5 px-4 rounded-xl transition-all mt-2 shadow-lg shadow-brand-teal/30 ring-2 ring-brand-teal/20 hover:shadow-xl hover:ring-brand-teal/40"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  {t('layout.addBoat')}
                </button>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default UserDashboardLayout
