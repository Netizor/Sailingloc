import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Ship,
  CalendarCheck,
  Euro,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Star,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDate, formatPrice } from '../../lib/utils'
import { adminApi } from '../../api/admin.api'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin', 'recent-bookings'],
    queryFn: () => adminApi.getRecentBookings(10),
    staleTime: 2 * 60 * 1000,
  })

  const statCards = [
    {
      label: 'Utilisateurs',
      value: stats?.totalUsers ?? '—',
      icon: <Users size={22} />,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      to: '/admin/utilisateurs',
    },
    {
      label: 'Bateaux',
      value: stats?.totalBoats ?? '—',
      icon: <Ship size={22} />,
      color: 'bg-ocean-50 text-ocean-600 dark:bg-ocean-900/30 dark:text-ocean-400',
      to: '/admin/bateaux',
    },
    {
      label: 'Réservations',
      value: stats?.totalBookings ?? '—',
      icon: <CalendarCheck size={22} />,
      color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      to: '/admin/reservations',
    },
    {
      label: 'Revenus plateforme',
      value: stats?.platformRevenue != null ? formatPrice(stats.platformRevenue) : '—',
      icon: <Euro size={22} />,
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      to: '/admin/revenus',
    },
    {
      label: 'Taux de conversion',
      value: stats?.conversionRate != null ? `${stats.conversionRate}%` : '—',
      icon: <BarChart2 size={22} />,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      to: '/admin/reservations',
    },
    {
      label: 'Avis en attente',
      value: stats?.pendingReviews ?? '—',
      icon: <Star size={22} />,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      to: '/admin/avis',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-ocean-700 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administration</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vue d&apos;ensemble de la plateforme</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {statsLoading ? (
            <div className="col-span-3 flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            statCards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:border-ocean-200 dark:hover:border-ocean-700 hover:shadow-sm transition-all group"
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{card.value}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-ocean-500 transition-colors flex-shrink-0" />
              </Link>
            ))
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Gérer les utilisateurs', to: '/admin/utilisateurs', icon: <Users size={18} /> },
            { label: 'Gérer les bateaux', to: '/admin/bateaux', icon: <Ship size={18} /> },
            { label: 'Toutes les réservations', to: '/admin/reservations', icon: <CalendarCheck size={18} /> },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center gap-3 hover:border-ocean-200 dark:hover:border-ocean-700 hover:shadow-sm transition-all group text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <span className="text-ocean-600 dark:text-ocean-400">{link.icon}</span>
              {link.label}
              <ArrowRight size={14} className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-ocean-500" />
            </Link>
          ))}
        </div>

        {/* Graphique revenus plateforme par mois (E4) */}
        {stats?.revenueByMonth && stats.revenueByMonth.some((r) => r.revenue > 0) && (
          <section aria-labelledby="revenue-chart-title" className="mb-10">
            <h2
              id="revenue-chart-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
            >
              Revenus plateforme — {new Date().getFullYear()}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 pt-5 pb-2">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={stats.revenueByMonth}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0369a1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0369a1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${v}€`}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [formatPrice(value ?? 0), 'Commission']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0369a1"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={{ r: 3, fill: '#0369a1' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Recent bookings table */}
        <section aria-labelledby="recent-bookings-title">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-bookings-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Réservations récentes
            </h2>
            <Link
              to="/admin/reservations"
              className="text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-800 dark:hover:text-ocean-300 flex items-center gap-1"
            >
              Tout voir <ArrowRight size={13} />
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {bookingsLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      {['Bateau', 'Locataire', 'Dates', 'Montant', 'Statut'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {(recentBookings ?? []).map((booking: any) => (
                      <tr key={booking.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {booking.boat?.title ?? 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                          {booking.renter?.firstName} {booking.renter?.lastName}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                          {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                          {formatPrice(booking.totalPrice ?? 0)}
                        </td>
                        <td className="px-5 py-3.5">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                    {(!recentBookings || recentBookings.length === 0) && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                          Aucune réservation récente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
