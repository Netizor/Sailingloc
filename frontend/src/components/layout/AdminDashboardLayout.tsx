import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Ship,
  CalendarCheck,
  Flag,
  Star,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/auth.store'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin', labelKey: 'layout.dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/utilisateurs', labelKey: 'layout.users', icon: <Users size={18} /> },
  { to: '/admin/kyc', labelKey: 'layout.kycNav', icon: <ShieldCheck size={18} /> },
  { to: '/admin/bateaux', labelKey: 'layout.boatsNav', icon: <Ship size={18} /> },
  { to: '/admin/reservations', labelKey: 'layout.bookingsNav', icon: <CalendarCheck size={18} /> },
  { to: '/admin/signalements', labelKey: 'layout.reports', icon: <Flag size={18} /> },
  { to: '/admin/avis', labelKey: 'layout.reviewsNav', icon: <Star size={18} /> },
]

const AdminDashboardLayout: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 sticky top-24">
              <div className="flex items-center gap-3 pb-5 border-b border-gray-100 dark:border-gray-700 mb-4">
                <div className="h-10 w-10 rounded-xl bg-brand-navy flex items-center justify-center">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {t('layout.administration')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-navy text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200',
                      )
                    }
                  >
                    {item.icon}
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </nav>
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

export default AdminDashboardLayout
