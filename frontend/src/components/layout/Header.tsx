import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  User,
  X,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth.store'
import { getDefaultDashboardPath } from '../../lib/profilePaths'
import { getUnreadCount } from '../../api/notifications.api'
import { getUnreadMessagesCount } from '../../api/messages.api'
import NotificationPanel from '../notifications/NotificationPanel'
import SiteSettingsMenu from './SiteSettingsMenu'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { t } = useTranslation()

  const navLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.boats'), to: '/bateaux' },
    { label: t('nav.destinationsShort'), to: '/destinations' },
    { label: t('nav.services'), to: '/a-propos' },
  ]

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  })
  const unreadCount = unreadData?.count ?? 0

  const { data: unreadMsgData } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: getUnreadMessagesCount,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })
  const unreadMsgCount = unreadMsgData?.count ?? 0

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  const linkClass = (to: string) =>
    cn(
      'inline-flex items-center h-full px-2 xl:px-3 text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap border-b-[3px] transition-colors',
      isActive(to)
        ? 'text-[#2563FF] border-[#2563FF] font-bold dark:text-blue-400 dark:border-blue-400'
        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-[#2563FF] dark:hover:text-blue-400'
    )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm overflow-visible">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-stretch justify-between h-[72px] gap-3 lg:gap-4 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 self-center focus:outline-none focus:ring-2 focus:ring-brand-blue rounded-lg">
            <img
              src="/logo.jpeg"
              alt="SailingLoc"
              className="h-9 sm:h-10 lg:h-11 w-auto max-w-[140px] lg:max-w-[180px] object-contain"
            />
          </Link>

          {/* Nav desktop - reculée vers le logo pour libérer la droite */}
          <nav
            className="hidden lg:flex items-stretch justify-start flex-1 min-w-0 h-full pl-2 xl:pl-6"
            aria-label="Navigation principale"
          >
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions - boutons auth avant les icônes pour éviter la coupure à droite */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 self-center min-w-0">
            {!isAuthenticated && (
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/connexion')}
                  className="px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-[#2563FF] dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-[#2563FF] dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                >
                  {t('nav.login')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/devenir-proprietaire')}
                  className="px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-white bg-[#2563FF] hover:bg-[#1a4fcc] rounded-lg whitespace-nowrap transition-colors"
                >
                  {t('nav.becomeOwner')}
                </button>
              </div>
            )}

            <SiteSettingsMenu />

            {isAuthenticated && user ? (
              <>
                <Link
                  to="/mon-espace/messages"
                  aria-label={t('nav.messages')}
                  className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <MessageSquare size={20} />
                  {unreadMsgCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-brand-blue text-white text-[10px] font-bold rounded-full">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    aria-label={t('nav.notifications')}
                    className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-bold">
                      {user.avatar ? (
                        <img src={user.avatar} alt={userInitials} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <ChevronDown size={14} className={cn('text-gray-400', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                      </div>
                      <DropdownItem icon={<LayoutDashboard size={15} />} label={t('nav.mySpace')} to={getDefaultDashboardPath(user.role)} onClick={() => setDropdownOpen(false)} />
                      {user.role === 'ADMIN' && (
                        <DropdownItem icon={<Settings size={15} />} label={t('nav.admin')} to="/admin" onClick={() => setDropdownOpen(false)} />
                      )}
                      <DropdownItem icon={<User size={15} />} label={t('nav.myProfile')} to="/mon-espace/profil" onClick={() => setDropdownOpen(false)} />
                      <div className="border-t border-gray-50 dark:border-gray-700 mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <LogOut size={15} />
                          {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300"
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
          <nav className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide',
                  isActive(link.to) ? 'text-[#2563FF] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-300'
                )}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/connexion')}
                  className="px-5 py-2.5 text-sm font-semibold text-[#2563FF] dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-[#2563FF] dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('nav.login')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/devenir-proprietaire')}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#2563FF] rounded-lg"
                >
                  {t('nav.becomeOwner')}
                </button>
              </div>
            )}
            <SiteSettingsMenu variant="mobile" />
          </nav>
        </div>
      )}
    </header>
  )
}

interface DropdownItemProps {
  icon: React.ReactNode
  label: string
  to: string
  onClick: () => void
}

const DropdownItem: React.FC<DropdownItemProps> = ({ icon, label, to, onClick }) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
    <span className="text-gray-400 dark:text-gray-500">{icon}</span>
    {label}
  </Link>
)

export default Header
