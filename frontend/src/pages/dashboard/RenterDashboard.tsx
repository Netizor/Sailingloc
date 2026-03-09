import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  CheckCircle,
  CreditCard,
  Heart,
  MessageCircle,
  ArrowRight,
  Clock,
  Anchor,
  Receipt,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { bookingsApi } from '../../api/bookings.api'
import { formatDate, formatPrice } from '../../lib/utils'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import type { Booking } from '../../types'
import { BookingStatus } from '../../types'

const RenterDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingsApi.getMyBookings(),
    staleTime: 2 * 60 * 1000,
  })

  // Correction extraction : la réponse paginée expose `.data`, pas `.bookings`
  const bookings: Booking[] = bookingsData?.data ?? []

  // Calculs dérivés mémoïsés : ne se recalculent que si `bookings` change
  const { upcoming, completed, totalSpent } = useMemo(() => {
    const now = new Date()
    const upcomingAcc: Booking[] = []
    let completed = 0
    let totalSpent = 0

    for (const b of bookings) {
      if (b.status === BookingStatus.COMPLETED) {
        completed++
        totalSpent += b.totalAmount ?? 0
      } else if (b.status === BookingStatus.CONFIRMED) {
        totalSpent += b.totalAmount ?? 0
        if (new Date(b.startDate) > now && upcomingAcc.length < 3) {
          upcomingAcc.push(b)
        }
      }
    }

    return { upcoming: upcomingAcc, completed, totalSpent }
  }, [bookings])

  const stats = useMemo(
    () => [
      {
        label: 'Réservations à venir',
        value: upcoming.length,
        icon: <CalendarCheck size={22} />,
        color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      },
      {
        label: 'Séjours effectués',
        value: completed,
        icon: <CheckCircle size={22} />,
        color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      },
      {
        label: 'Total dépensé',
        value: formatPrice(totalSpent),
        icon: <CreditCard size={22} />,
        color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      },
    ],
    [upcoming.length, completed, totalSpent],
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenue dans votre espace locataire.</p>
        </div>

        {/* Stats — spinner pendant le chargement (même pattern que OwnerDashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4"
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming bookings */}
        <section aria-labelledby="upcoming-title" className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 id="upcoming-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Prochaines réservations
            </h2>
            <Link
              to="/mon-espace/reservations"
              className="text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-800 font-medium flex items-center gap-1"
            >
              Tout voir <ArrowRight size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <Anchor size={36} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune réservation à venir</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-5">
                Trouvez le bateau de vos rêves et réservez dès maintenant.
              </p>
              <Button variant="primary" onClick={() => navigate('/bateaux')}>
                Explorer les bateaux
              </Button>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section aria-labelledby="actions-title">
          <h2 id="actions-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction
              icon={<CalendarCheck size={20} />}
              label="Mes réservations"
              desc="Gérez toutes vos réservations"
              to="/mon-espace/reservations"
              color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
            />
            <QuickAction
              icon={<Heart size={20} />}
              label="Mes favoris"
              desc="Bateaux sauvegardés"
              to="/mon-espace/favoris"
              color="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30"
            />
            <QuickAction
              icon={<MessageCircle size={20} />}
              label="Messages"
              desc="Vos conversations"
              to="/mon-espace/messages"
              color="text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30"
            />
            {/* D3 — Historique des paiements */}
            <QuickAction
              icon={<Receipt size={20} />}
              label="Paiements"
              desc="Historique de vos transactions"
              to="/mon-espace/paiements"
              color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

const BookingListItem: React.FC<{ booking: Booking }> = React.memo(({ booking }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
    <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
      {booking.boat?.images?.[0] ? (
        <img
          src={booking.boat.images[0]}
          alt={booking.boat.title ?? 'Bateau'}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-ocean-100 dark:bg-ocean-800/40 flex items-center justify-center">
          <Anchor size={20} className="text-ocean-400" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
        {booking.boat?.title ?? 'Bateau'}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
        <Clock size={11} />
        {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
      </p>
    </div>
    <BookingStatusBadge status={booking.status} />
  </div>
))

BookingListItem.displayName = 'BookingListItem'

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  desc: string
  to: string
  color: string
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, desc, to, color }) => (
  <Link
    to={to}
    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:border-ocean-200 dark:hover:border-ocean-700 hover:shadow-sm transition-all group"
  >
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
        {label}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
    <ArrowRight size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors" />
  </Link>
)

export default RenterDashboard
