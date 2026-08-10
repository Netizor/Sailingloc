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
  Star,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDate, formatPrice, EMPTY_VALUE } from '../../lib/utils'
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
    queryFn: () => adminApi.getRecentBookings(8),
    staleTime: 2 * 60 * 1000,
  })

  const statCards = [
    {
      label: 'Users',
      value: stats?.totalUsers ?? 0,
      icon: <Users size={22} />,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      to: '/admin/utilisateurs',
    },
    {
      label: 'Active boats',
      value: stats?.activeBoats ?? stats?.totalBoats ?? 0,
      icon: <Ship size={22} />,
      color: 'bg-ocean-50 text-ocean-600 dark:bg-ocean-900/30 dark:text-ocean-400',
      to: '/admin/bateaux',
    },
    {
      label: 'Bookings',
      value: stats?.totalBookings ?? 0,
      icon: <CalendarCheck size={22} />,
      color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      to: '/admin/reservations',
    },
    {
      label: 'Platform revenue',
      value: stats?.platformRevenue != null ? formatPrice(stats.platformRevenue) : EMPTY_VALUE,
      icon: <Euro size={22} />,
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      to: '/admin/reservations',
    },
    {
      label: 'Total volume',
      value: stats?.totalRevenue != null ? formatPrice(stats.totalRevenue) : EMPTY_VALUE,
      icon: <TrendingUp size={22} />,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      to: '/admin/reservations',
    },
    {
      label: 'Reviews',
      value: stats?.pendingReviews ?? 0,
      icon: <Star size={22} />,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      to: '/admin/avis',
    },
  ]

  const chartData = stats?.revenueByMonth ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of the SailingLoc platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Revenue by month ({new Date().getFullYear()})
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 pt-5 pb-2">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003366" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#003366" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => `${v}€`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(value) => [formatPrice(Number(value) || 0), 'Commission']} />
                  <Area type="monotone" dataKey="revenue" stroke="#003366" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Bookings by month ({new Date().getFullYear()})
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 pt-5 pb-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip formatter={(value) => [value ?? 0, 'Bookings']} />
                  <Bar dataKey="bookings" fill="#2563FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Recent bookings
          </h2>
          <Link to="/admin/reservations" className="text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-800 flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {bookingsLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    {['Boat', 'Renter', 'Dates', 'Amount', 'Status'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {(recentBookings ?? []).map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{booking.boat?.title ?? 'N/A'}</td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{booking.renter?.firstName} {booking.renter?.lastName}</td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(booking.startDate)} to {formatDate(booking.endDate)}</td>
                      <td className="px-5 py-3.5 font-medium">{formatPrice(booking.totalAmount ?? 0)}</td>
                      <td className="px-5 py-3.5"><BookingStatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                  {(!recentBookings || recentBookings.length === 0) && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No bookings</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
