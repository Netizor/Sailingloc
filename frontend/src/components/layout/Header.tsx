import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Anchor,
  Bell,
  ChevronDown,
  Home,
  Info,
  LogOut,
  Menu,
  MessageSquare,
  Ship,
  User,
  X,
  LayoutDashboard,
  Settings,
  Moon,
  Sun,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth.store'
import { getUnreadCount } from '../../api/notifications.api'
import { getUnreadMessagesCount } from '../../api/messages.api'
import { useTheme } from '../../hooks/useTheme'
import NotificationPanel from '../notifications/NotificationPanel'
import Button from '../ui/Button'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggle: toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()

  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷', available: true },
    { code: 'en', label: 'English',  flag: '🇬🇧', available: true },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪', available: false },
    { code: 'es', label: 'Español',  flag: '🇪🇸', available: false },
    { code: 'it', label: 'Italiano', flag: '🇮🇹', available: false },
    { code: 'pt', label: 'Português',flag: '🇵🇹', available: false },
  ]

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  const navLinks = [
    { label: t('nav.home'), to: '/', icon: <Home size={16} /> },
    { label: t('nav.boats'), to: '/bateaux', icon: <Ship size={16} /> },
    { label: t('nav.howItWorks'), to: '/#comment-ca-marche', icon: <Info size={16} /> },
  ]

  const [scrolled, setScrolled] = useState(false)
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

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false)
    setNotifOpen(false)
    setLangOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white dark:bg-gray-900 transition-shadow duration-200',
        scrolled ? 'shadow-md dark:shadow-gray-900' : 'shadow-sm border-b border-gray-100 dark:border-gray-700'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-ocean-500 rounded-lg"
          >
            <div className="bg-ocean-700 text-white p-1.5 rounded-lg group-hover:bg-ocean-800 transition-colors">
              <Anchor size={20} />
            </div>
            <span className="text-xl font-bold text-ocean-700 tracking-tight">
              SailingLoc
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-ocean-700 bg-ocean-50 dark:text-ocean-400 dark:bg-ocean-900/30'
                    : 'text-gray-600 hover:text-ocean-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-ocean-400 dark:hover:bg-gray-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* C12 — Sélecteur de langue */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                aria-label={t('nav.language')}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1 p-2 rounded-lg text-gray-500 hover:text-ocean-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:text-gray-400 dark:hover:text-ocean-400 dark:hover:bg-gray-800"
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="hidden sm:inline text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {currentLang.code}
                </span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'text-gray-400 transition-transform duration-150',
                    langOpen && 'rotate-180'
                  )}
                />
              </button>

              {langOpen && (
                <div
                  role="listbox"
                  aria-label={t('nav.language')}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in slide-in-from-top-1 duration-150 dark:bg-gray-800 dark:border-gray-700"
                >
                  <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('nav.language')}
                  </p>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={i18n.language === lang.code}
                      disabled={!lang.available}
                      onClick={() => {
                        if (!lang.available) return
                        i18n.changeLanguage(lang.code)
                        setLangOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
                        lang.available
                          ? 'hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700'
                          : 'cursor-default opacity-50',
                        i18n.language === lang.code
                          ? 'text-ocean-700 font-semibold bg-ocean-50/60 dark:text-ocean-400 dark:bg-ocean-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {i18n.language === lang.code && (
                        <span className="h-1.5 w-1.5 rounded-full bg-ocean-600 flex-shrink-0" />
                      )}
                      {!lang.available && (
                        <span className="text-[10px] text-gray-400 font-normal italic flex-shrink-0">
                          {t('nav.comingSoon')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* C11 — Toggle mode sombre */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
              className="p-2 rounded-lg text-gray-500 hover:text-ocean-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:text-gray-400 dark:hover:text-ocean-400 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated && user ? (
              <>
                {/* Icône messages */}
                <Link
                  to="/mon-espace/messages"
                  aria-label={t('nav.messages')}
                  className="relative p-2 rounded-lg text-gray-500 hover:text-ocean-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:text-gray-400 dark:hover:text-ocean-400 dark:hover:bg-gray-800"
                >
                  <MessageSquare size={20} />
                  {unreadMsgCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-ocean-500 text-white text-[10px] font-bold rounded-full leading-none">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    aria-label={t('nav.notifications')}
                    aria-expanded={notifOpen}
                    className="relative p-2 rounded-lg text-gray-500 hover:text-ocean-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:text-gray-400 dark:hover:text-ocean-400 dark:hover:bg-gray-800"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
                </div>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:hover:bg-gray-800"
                  >
                    <div className="h-8 w-8 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={userInitials}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {user.firstName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-gray-400 transition-transform duration-150',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in slide-in-from-top-1 duration-150 dark:bg-gray-800 dark:border-gray-700"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                      </div>

                      <DropdownItem
                        icon={<LayoutDashboard size={15} />}
                        label={t('nav.mySpace')}
                        to="/mon-espace"
                        onClick={() => setDropdownOpen(false)}
                      />

                      {(user.role === 'OWNER' || user.role === 'ADMIN') && (
                        <DropdownItem
                          icon={<Ship size={15} />}
                          label={t('nav.ownerSpace')}
                          to="/proprietaire"
                          onClick={() => setDropdownOpen(false)}
                        />
                      )}

                      {user.role === 'ADMIN' && (
                        <DropdownItem
                          icon={<Settings size={15} />}
                          label={t('nav.admin')}
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                        />
                      )}

                      <DropdownItem
                        icon={<User size={15} />}
                        label={t('nav.myProfile')}
                        to="/mon-espace/profil"
                        onClick={() => setDropdownOpen(false)}
                      />

                      <div className="border-t border-gray-50 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} />
                          {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/connexion')}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/inscription')}
                >
                  {t('nav.becomeOwner')}
                </Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-500"
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1" aria-label="Menu mobile">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-ocean-700 bg-ocean-50 dark:text-ocean-400 dark:bg-ocean-900/30'
                    : 'text-gray-600 hover:text-ocean-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-ocean-400 dark:hover:bg-gray-800'
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/connexion')}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/inscription')}
                >
                  {t('nav.becomeOwner')}
                </Button>
              </div>
            )}
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
  <Link
    to={to}
    onClick={onClick}
    role="menuitem"
    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-ocean-700 transition-colors dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-ocean-400"
  >
    <span className="text-gray-400">{icon}</span>
    {label}
  </Link>
)

export default Header
