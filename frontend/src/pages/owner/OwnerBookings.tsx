import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Anchor, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import type { Booking } from '../../types'
import { BookingStatus } from '../../types'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatPrice } from '../../lib/utils'

// ─── Onglets de filtrage ──────────────────────────────────────────────────────

type FilterTab = 'ALL' | BookingStatus

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Toutes' },
  // Utilise les valeurs de l'enum pour être compatible avec le type FilterTab
  { key: BookingStatus.PENDING, label: 'En attente' },
  { key: BookingStatus.CONFIRMED, label: 'Confirmées' },
  { key: BookingStatus.COMPLETED, label: 'Terminées' },
  { key: BookingStatus.CANCELLED, label: 'Annulées' },
]

const LIMIT = 10

// ─── Page principale ──────────────────────────────────────────────────────────

const OwnerBookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [page, setPage] = useState(1)

  const status = activeTab === 'ALL' ? undefined : activeTab

  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner', 'bookings', activeTab, page],
    queryFn: () => bookingsApi.getMyBookingsAsOwner({ page, limit: LIMIT, status }),
    staleTime: 60 * 1000,
  })

  const bookings = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes réservations</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gérez les demandes de réservation pour vos bateaux
          </p>
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-ocean-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Erreur lors du chargement des réservations.
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center mx-auto mb-5">
              <Anchor size={36} className="text-ocean-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Aucune réservation
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
              {activeTab === 'ALL'
                ? "Vous n'avez pas encore reçu de réservation."
                : `Aucune réservation avec le statut "${TABS.find((t) => t.key === activeTab)?.label}".`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft size={16} />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={16} />}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Carte de réservation ─────────────────────────────────────────────────────
// Chaque carte gère ses propres mutations pour qu'un chargement en cours
// sur la carte A ne désactive pas les boutons de la carte B.

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
  const queryClient = useQueryClient()
  const boat = booking.boat
  const renter = booking.renter
  const mainImage = boat?.images?.[0]
  const isPending   = booking.status === BookingStatus.PENDING
  const isCompleted = booking.status === BookingStatus.COMPLETED
  // Calcul unique pour éviter la duplication du libellé de durée
  const daysLabel = `${booking.totalDays} jour${booking.totalDays !== 1 ? 's' : ''}`

  const { mutate: accept, isPending: isAccepting } = useMutation({
    mutationFn: () => bookingsApi.accept(booking.id),
    onSuccess: () => {
      toast.success('Réservation confirmée')
      queryClient.invalidateQueries({ queryKey: ['owner', 'bookings'] })
    },
    onError: () => toast.error('Erreur lors de la confirmation'),
  })

  const { mutate: decline, isPending: isDeclining } = useMutation({
    mutationFn: () => bookingsApi.decline(booking.id),
    onSuccess: () => {
      toast.success('Réservation refusée')
      queryClient.invalidateQueries({ queryKey: ['owner', 'bookings'] })
    },
    onError: () => toast.error('Erreur lors du refus'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
      {/* Image du bateau */}
      <div className="sm:w-44 h-44 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {mainImage ? (
          <img src={mainImage} alt={boat?.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-ocean-50 dark:bg-ocean-900/30 gap-2">
            <Anchor size={28} className="text-ocean-300" />
            <span className="text-xs text-ocean-400">Pas de photo</span>
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BookingStatusBadge status={booking.status} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
              {boat?.title ?? ''}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
              <span className="ml-2 text-gray-400 dark:text-gray-500">({daysLabel})</span>
            </p>
            {renter && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Locataire : {renter.firstName} {renter.lastName}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-orange-500">
              {formatPrice(booking.totalAmount)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{daysLabel}</p>
          </div>
        </div>

        {/* Actions pour les réservations en attente */}
        {isPending && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={() => accept()}
              disabled={isAccepting || isDeclining}
              loading={isAccepting}
            >
              Accepter
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => decline()}
              disabled={isAccepting || isDeclining}
              loading={isDeclining}
            >
              Refuser
            </Button>
          </div>
        )}

        {/* D1 - Évaluer le locataire pour les réservations terminées */}
        {isCompleted && (
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/proprietaire/reservations/${booking.id}/avis?target=renter`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean-700 dark:text-ocean-400 hover:underline"
            >
              <Star size={14} />
              Évaluer le locataire
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerBookings
