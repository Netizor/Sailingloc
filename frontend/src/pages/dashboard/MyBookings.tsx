import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Anchor, Clock, ExternalLink, MessageSquarePlus } from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import { formatDate, formatPrice } from '../../lib/utils'
import { BookingStatus } from '../../types'
import type { Booking } from '../../types'

// Le backend ajoute hasReview pour afficher le CTA avis, absent de l'interface Booking de base
interface BookingWithReview extends Booking {
  hasReview?: boolean
}
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'

type TabFilter = 'ALL' | BookingStatus

const tabs: { value: TabFilter; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: BookingStatus.PENDING, label: 'En attente' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmées' },
  { value: BookingStatus.COMPLETED, label: 'Terminées' },
  { value: BookingStatus.CANCELLED, label: 'Annulées' },
]

const MyBookings: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingsApi.getMyBookings(),
    staleTime: 2 * 60 * 1000,
  })

  const bookings: BookingWithReview[] = data?.data ?? []

  const filtered =
    activeTab === 'ALL'
      ? bookings
      : bookings.filter((b) => b.status === activeTab)

  const tabCount = (status: TabFilter) =>
    status === 'ALL' ? bookings.length : bookings.filter((b) => b.status === status).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Mes réservations</h1>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 mb-6 border-b border-gray-200 dark:border-gray-600">
          {tabs.map((tab) => {
            const count = tabCount(tab.value)
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus:outline-none -mb-px ${
                  activeTab === tab.value
                    ? 'border-ocean-600 dark:border-ocean-400 text-ocean-700 dark:text-ocean-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      activeTab === tab.value
                        ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Erreur lors du chargement de vos réservations.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Anchor size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune réservation trouvée</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-6">
              {activeTab === 'ALL'
                ? 'Vous n\'avez pas encore fait de réservation.'
                : 'Aucune réservation dans cette catégorie.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/bateaux')}>
              Explorer les bateaux
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const BookingCard: React.FC<{ booking: BookingWithReview }> = ({ booking }) => {
  const navigate = useNavigate()
  const canReview =
    booking.status === 'COMPLETED' && !booking.hasReview

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row shadow-sm">
      {/* Boat image */}
      <div className="sm:w-36 h-36 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {booking.boat?.images?.[0] ? (
          <img
            src={booking.boat.images[0]}
            alt={booking.boat?.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-ocean-50 dark:bg-ocean-900/30">
            <Anchor size={28} className="text-ocean-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
              {booking.boat?.title ?? 'Bateau'}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
              <Clock size={13} />
              {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(booking.totalAmount ?? 0)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canReview && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageSquarePlus size={14} />}
                onClick={() => navigate(`/mon-espace/reservations/${booking.id}/avis`)}
              >
                Laisser un avis
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ExternalLink size={14} />}
              onClick={() => navigate(`/mon-espace/reservations/${booking.id}`)}
            >
              Voir détail
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyBookings
