import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, ExternalLink, TrendingUp } from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import { formatDate, formatPrice } from '../../lib/utils'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'
import type { Booking } from '../../types'
import { BookingStatus } from '../../types'

const MyPayments: React.FC = () => {
  // Récupère les réservations CONFIRMED et COMPLETED du locataire (transactions payées)
  const { data: confirmedData, isLoading: loadingConfirmed } = useQuery({
    queryKey: ['bookings', 'renter', 'confirmed'],
    queryFn: () => bookingsApi.getMyBookings({ status: 'CONFIRMED', limit: 100 }),
    staleTime: 2 * 60 * 1000,
  })

  const { data: completedData, isLoading: loadingCompleted } = useQuery({
    queryKey: ['bookings', 'renter', 'completed'],
    queryFn: () => bookingsApi.getMyBookings({ status: 'COMPLETED', limit: 100 }),
    staleTime: 2 * 60 * 1000,
  })

  const isLoading = loadingConfirmed || loadingCompleted

  // Fusionne et trie par date décroissante (paiement le plus récent en premier)
  const transactions: Booking[] = useMemo(() => {
    const all = [
      ...(confirmedData?.data ?? []),
      ...(completedData?.data ?? []),
    ]
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [confirmedData, completedData])

  const totalSpent = useMemo(
    () => transactions.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0),
    [transactions],
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard size={22} className="text-ocean-700 dark:text-ocean-400" />
            Historique des paiements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Toutes vos réservations confirmées et terminées.
          </p>
        </div>

        {/* Résumé */}
        {transactions.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-ocean-50 dark:bg-ocean-800/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-ocean-700 dark:text-ocean-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total dépensé</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(totalSpent)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{transactions.length}</p>
            </div>
          </div>
        )}

        {/* Liste */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <CreditCard size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucun paiement pour l'instant</p>
            <p className="text-sm mt-1">Vos réservations confirmées et terminées apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* Image du bateau */}
                {booking.boat?.images?.[0] ? (
                  <img
                    src={booking.boat.images[0]}
                    alt={booking.boat.title ?? ''}
                    className="h-16 w-24 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-24 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                )}

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {booking.boat?.title ?? `Réservation #${booking.id}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    &nbsp;· {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Payé le {formatDate(booking.createdAt)}
                  </p>
                </div>

                {/* Montant + statut + lien */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(booking.totalAmount ?? 0)}
                  </span>
                  <BookingStatusBadge status={booking.status as BookingStatus} />
                  <Link
                    to={`/mon-espace/reservations/${booking.id}`}
                    className="text-xs text-ocean-600 dark:text-ocean-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Détails <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPayments
