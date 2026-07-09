import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Heart,
  Star,
  ArrowRight,
  Anchor,
  MapPin,
  Users,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { bookingsApi } from '../../api/bookings.api'
import { getFavorites } from '../../api/favorites.api'
import {
  daysBetween,
  formatDateRangeShort,
  formatDateShort,
  formatPrice,
  getBookingStatusColor,
  getBookingStatusLabel,
} from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import DraftSection from '../../components/ui/DraftSection'
import type { Booking } from '../../types'
import { BookingStatus } from '../../types'

interface BookingWithReview extends Booking {
  hasReview?: boolean
}

const RenterDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingsApi.getMyBookings(),
    staleTime: 2 * 60 * 1000,
  })

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 60 * 1000,
  })

  const bookings: BookingWithReview[] = bookingsData?.data ?? []

  const { totalBookings, reviewsGiven, nextBooking, recentBookings } = useMemo(() => {
    const now = new Date()
    let reviewsGiven = 0
    let nextBooking: BookingWithReview | null = null

    for (const b of bookings) {
      if (b.hasReview) reviewsGiven++
      if (
        !nextBooking &&
        b.status === BookingStatus.CONFIRMED &&
        new Date(b.startDate) > now
      ) {
        nextBooking = b
      }
    }

    return {
      totalBookings: bookings.length,
      reviewsGiven,
      nextBooking,
      recentBookings: bookings.slice(0, 4),
    }
  }, [bookings])

  const stats = [
    {
      label: 'Total Réservations',
      value: totalBookings,
      icon: <Calendar size={22} />,
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Avis Donnés',
      value: reviewsGiven,
      icon: <Star size={22} />,
      iconBg: 'bg-teal-100 text-teal-600',
    },
    {
      label: 'Favoris',
      value: favorites?.length ?? 0,
      icon: <Heart size={22} />,
      iconBg: 'bg-blue-100 text-blue-600',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bonjour, {user?.firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Bienvenue dans votre espace personnel.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Réservations non finalisées */}
      <DraftSection type="bookings" />

      {/* Prochaine escapade */}
      {nextBooking ? (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Prochaine escapade
          </h2>
          <NextTripCard
            booking={nextBooking}
            onDetails={() => navigate(`/mon-espace/reservations/${nextBooking.id}`)}
          />
        </section>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <Anchor size={36} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune escapade à venir</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-5">
            Trouvez le bateau de vos rêves et réservez dès maintenant.
          </p>
          <Button variant="primary" onClick={() => navigate('/bateaux')}>
            Explorer les bateaux
          </Button>
        </div>
      )}

      {/* Historique récent */}
      {recentBookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Historique des réservations
            </h2>
            <Link
              to="/mon-espace/reservations"
              className="text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 font-medium flex items-center gap-1"
            >
              Tout voir <ArrowRight size={13} />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                    <th className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">Bateau</th>
                    <th className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">Dates</th>
                    <th className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">Lieu</th>
                    <th className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                    <th className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => navigate(`/mon-espace/reservations/${booking.id}`)}
                      className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {booking.boat?.title ?? 'Bateau'}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {formatDateRangeShort(booking.startDate, booking.endDate)}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {booking.boat?.city ?? booking.boat?.port ?? ''}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full border ${getBookingStatusColor(booking.status)}`}
                        >
                          {getBookingStatusLabel(booking.status).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(booking.totalAmount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center py-4 border-t border-gray-100 dark:border-gray-700">
              <Link
                to="/mon-espace/reservations"
                className="text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 font-medium transition-colors"
              >
                Voir tout l'historique
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

const NextTripCard: React.FC<{
  booking: BookingWithReview
  onDetails: () => void
}> = ({ booking, onDetails }) => {
  const navigate = useNavigate()
  const days = daysBetween(booking.startDate, booking.endDate) || booking.totalDays || 1
  const location = [booking.boat?.city, booking.boat?.country].filter(Boolean).join(', ') || ''

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="relative md:w-2/5 h-52 md:h-auto flex-shrink-0">
        {booking.boat?.images?.[0] ? (
          <img
            src={booking.boat.images[0]}
            alt={booking.boat.title ?? 'Bateau'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
            <Anchor size={40} className="text-ocean-300" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-brand-blue text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
          Confirmée
        </span>
      </div>

      <div className="flex-1 bg-brand-navy text-white p-6 md:p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="text-xl font-bold">{booking.boat?.title ?? 'Bateau'}</h3>
            <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase whitespace-nowrap">
              Départ le {formatDateShort(booking.startDate)}
            </p>
          </div>
          <p className="text-sm text-white/80 flex items-center gap-1.5 mb-6">
            <MapPin size={14} />
            {location}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/60 uppercase mb-1">Durée</p>
              <p className="text-sm font-semibold">
                {days} Jour{days > 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/60 uppercase mb-1 flex items-center gap-1">
                <Users size={11} />
                Passagers
              </p>
              <p className="text-sm font-semibold">
                {booking.boat?.capacity ?? ''} Personnes
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onDetails}
            className="bg-white text-brand-navy text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Détails de la réservation
          </button>
          <button
            onClick={() => navigate(`/mon-espace/reservations/${booking.id}`)}
            className="border border-white/40 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
  )
}

export default RenterDashboard
