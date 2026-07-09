import React, { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Anchor,
  CalendarCheck,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Heart,
  MapPin,
  Star,
} from 'lucide-react'
import { getMyAllBookings } from '../../api/bookings.api'
import { getFavorites } from '../../api/favorites.api'
import { getMyReviewStats } from '../../api/reviews.api'
import {
  daysUntil,
  formatDateRangeDash,
  formatDateRangeShort,
  formatPrice,
} from '../../lib/utils'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import { BookingStatus } from '../../types'
import type { Booking } from '../../types'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import DashboardBanner from '../../components/ui/DashboardBanner'

type HistoryFilter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'PENDING' | 'CANCELLED'

const FILTER_KEYS: Record<HistoryFilter, string> = {
  ALL: 'booking.myBookings.filterAll',
  UPCOMING: 'booking.myBookings.filterUpcoming',
  COMPLETED: 'booking.myBookings.filterCompleted',
  PENDING: 'booking.myBookings.filterPending',
  CANCELLED: 'booking.myBookings.filterCancelled',
}

const MyBookings: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['bookings', 'my', 'all'],
    queryFn: getMyAllBookings,
    staleTime: 2 * 60 * 1000,
  })

  const { data: reviewStats } = useQuery({
    queryKey: ['reviews', 'mine'],
    queryFn: getMyReviewStats,
    staleTime: 5 * 60 * 1000,
  })

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 60 * 1000,
  })

  const reviewedBookingIds = useMemo(
    () => new Set(reviewStats?.bookingIds ?? []),
    [reviewStats],
  )

  const { bookingsThisMonth, nextBooking, filteredHistory } = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    let bookingsThisMonth = 0

    for (const b of bookings) {
      if (new Date(b.createdAt) >= monthStart) bookingsThisMonth++
    }

    const nextBooking =
      bookings
        .filter(
          (b) =>
            (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING) &&
            new Date(b.endDate) >= now,
        )
        .sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )[0] ?? null

    const filteredHistory = bookings.filter((b) => {
      if (historyFilter === 'ALL') return true
      if (historyFilter === 'UPCOMING') {
        return (
          (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING) &&
          new Date(b.startDate) >= now
        )
      }
      if (historyFilter === 'PENDING') return b.status === BookingStatus.PENDING
      if (historyFilter === 'CANCELLED') return b.status === BookingStatus.CANCELLED
      return b.status === BookingStatus.COMPLETED
    })

    return { bookingsThisMonth, nextBooking, filteredHistory }
  }, [bookings, historyFilter])

  const handleExportPdf = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-24 text-red-500">
        {t('booking.myBookings.loadError')}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <DashboardBanner
        icon={<CalendarCheck size={18} className="opacity-80" />}
        title={t('booking.myBookings.title')}
        subtitle={t('booking.myBookings.subtitle')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Calendar size={20} />}
          value={bookings.length}
          label={t('booking.myBookings.totalBookings')}
          sub={
            bookingsThisMonth > 0
              ? t('booking.myBookings.thisMonth', { count: bookingsThisMonth })
              : t('booking.myBookings.noneThisMonth')
          }
        />
        <StatCard
          icon={<Star size={20} />}
          value={reviewStats?.count ?? 0}
          label={t('booking.myBookings.reviewsGiven')}
          sub={
            reviewStats?.avgRating
              ? t('booking.myBookings.avgRating', { rating: reviewStats.avgRating })
              : (reviewStats?.count ?? 0) > 0
                ? t('booking.myBookings.reviewsPublished')
                : t('booking.myBookings.noReviewsYet')
          }
        />
        <StatCard
          icon={<Heart size={20} />}
          value={favorites?.length ?? 0}
          label={t('booking.myBookings.favorites')}
          sub={t('booking.myBookings.savedBoats')}
        />
      </div>

      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('booking.myBookings.nextTrip')}
        </h2>
        {nextBooking ? (
          <NextTripHero
            booking={nextBooking}
            onClick={() => navigate(`/mon-espace/reservations/${nextBooking.id}`)}
          />
        ) : (
          <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-ocean-600 to-brand-navy flex flex-col items-center justify-center text-center px-6">
            <Anchor size={40} className="text-white/40 mb-3" />
            <p className="text-white font-semibold text-lg">{t('booking.myBookings.noTripPlanned')}</p>
            <p className="text-white/70 text-sm mt-1 mb-5 max-w-sm">
              {t('booking.myBookings.noTripHint')}
            </p>
            <Button variant="primary" onClick={() => navigate('/bateaux')}>
              {t('booking.myBookings.exploreBoats')}
            </Button>
          </div>
        )}
      </section>

      <section ref={tableRef} className="print:block">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('booking.myBookings.history')}
          </h2>
          <div className="flex items-center gap-2 print:hidden">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
              >
                <Filter size={15} />
                {t('common.filter')}
                <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg py-1 min-w-[160px]">
                    {(Object.keys(FILTER_KEYS) as HistoryFilter[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setHistoryFilter(key)
                          setFilterOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          historyFilter === key
                            ? 'text-brand-blue font-medium bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t(FILTER_KEYS[key])}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
            >
              <Download size={15} />
              {t('booking.myBookings.exportPdf')}
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Anchor size={36} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('booking.myBookings.noBookingsFound')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-5">
              {historyFilter === 'ALL'
                ? t('booking.noBookingsHint')
                : t('booking.myBookings.noBookingsCategory')}
            </p>
            <Button variant="primary" onClick={() => navigate('/bateaux')}>
              {t('booking.myBookings.exploreBoats')}
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-left bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">{t('booking.myBookings.tableBoat')}</th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">{t('booking.myBookings.tableDates')}</th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">{t('booking.myBookings.tableLocation')}</th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">{t('booking.myBookings.tableStatus')}</th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase text-right">{t('booking.myBookings.tableAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => navigate(`/mon-espace/reservations/${booking.id}`)}
                      className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <BoatThumbnail booking={booking} />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {booking.boat?.title ?? t('booking.myBookings.boatFallback')}
                            </span>
                            {reviewedBookingIds.has(booking.id) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <Star size={10} fill="currentColor" />
                                {t('booking.myBookings.reviewLeft')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDateRangeShort(booking.startDate, booking.endDate)}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {booking.boat?.city ?? booking.boat?.port ?? ''}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={booking.status} />
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatPrice(booking.totalAmount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

const StatCard: React.FC<{
  icon: React.ReactNode
  value: number
  label: string
  sub: string
}> = ({ icon, value, label, sub }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-brand-blue flex items-center justify-center">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
  </div>
)

const BoatThumbnail: React.FC<{ booking: Booking }> = ({ booking }) => {
  const { t } = useTranslation()
  return (
    <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
      {booking.boat?.images?.[0] ? (
        <img
          src={booking.boat.images[0]}
          alt={booking.boat.title ?? t('booking.myBookings.boatFallback')}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-ocean-50 dark:bg-ocean-900/30">
          <Anchor size={14} className="text-ocean-300" />
        </div>
      )}
    </div>
  )
}

const StatusPill: React.FC<{ status: BookingStatus }> = ({ status }) => (
  <BookingStatusBadge status={status} size="sm" dot={false} />
)

const NextTripHero: React.FC<{
  booking: Booking
  onClick: () => void
}> = ({ booking, onClick }) => {
  const { t } = useTranslation()
  const daysLeft = daysUntil(booking.startDate)
  const location = [booking.boat?.city, booking.boat?.country].filter(Boolean).join(', ') || ''
  const departureLabel =
    daysLeft > 0
      ? t('booking.myBookings.departureIn', { count: daysLeft })
      : daysLeft === 0
        ? t('booking.myBookings.departureToday')
        : t('booking.myBookings.inProgress')

  return (
    <button
      onClick={onClick}
      className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden group text-left"
    >
      {booking.boat?.images?.[0] ? (
        <img
          src={booking.boat.images[0]}
          alt={booking.boat.title ?? t('booking.myBookings.boatFallback')}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-600 to-brand-navy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/50" />

      <div className="relative h-full flex items-end justify-between p-5 sm:p-6 gap-4">
        <div className="flex flex-col items-start gap-2">
          <BookingStatusBadge status={booking.status} size="sm" className="uppercase tracking-wider" />
          <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
            {booking.boat?.title ?? t('booking.myBookings.boatFallback')}
          </h3>
          <p className="text-sm text-white/80 flex items-center gap-1.5">
            <MapPin size={14} />
            {location}
          </p>
        </div>

        <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3 text-right flex-shrink-0">
          <p className="text-[10px] font-semibold tracking-wider text-white/70 uppercase mb-1">
            {departureLabel}
          </p>
          <p className="text-sm font-bold text-white whitespace-nowrap">
            {formatDateRangeDash(booking.startDate, booking.endDate)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default MyBookings
