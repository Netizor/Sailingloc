import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Euro,
  Ship,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { formatDate, formatPrice } from '../../lib/utils'
import { bookingsApi } from '../../api/bookings.api'
import { useAuthStore } from '../../store/auth.store'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import OnboardingModal, { ONBOARDING_KEY } from '../../components/owner/OnboardingModal'
import toast from 'react-hot-toast'

const OwnerDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Afficher le modal d'onboarding si le propriétaire ne l'a jamais vu
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY),
  )

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['owner', 'earnings'],
    queryFn: () => bookingsApi.getOwnerEarnings(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['owner', 'pending-bookings'],
    queryFn: () => bookingsApi.getOwnerPendingBookings(),
    staleTime: 60 * 1000,
  })

  const acceptMutation = useMutation({
    mutationFn: (bookingId: number) => bookingsApi.accept(bookingId),
    onSuccess: () => {
      toast.success('Réservation confirmée')
      queryClient.invalidateQueries({ queryKey: ['owner', 'pending-bookings'] })
    },
    onError: () => toast.error('Erreur lors de la confirmation'),
  })

  const declineMutation = useMutation({
    mutationFn: (bookingId: number) => bookingsApi.decline(bookingId),
    onSuccess: () => {
      toast.success('Réservation refusée')
      queryClient.invalidateQueries({ queryKey: ['owner', 'pending-bookings'] })
    },
    onError: () => toast.error('Erreur lors du refus'),
  })

  const earnings = earningsData ?? { total: 0, thisMonth: 0, pending: 0 }
  const pendingBookings: any[] = pendingData?.bookings ?? []

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Espace propriétaire
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bonjour, {user?.firstName} !</p>
        </div>

        {/* CTA Ajouter un bateau - mis en avant */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-teal to-brand-navy p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg shadow-brand-teal/20">
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">
              Publiez votre annonce
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Ajoutez votre bateau dès maintenant
            </h2>
            <p className="text-white/80 text-sm max-w-md">
              Mettez votre unité en location en quelques minutes et commencez à générer des revenus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/proprietaire/bateaux/nouveau')}
            className="relative z-10 flex-shrink-0 flex items-center gap-2.5 bg-white text-brand-navy hover:bg-gray-50 font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <Ship size={18} />
            Ajouter un bateau
          </button>
          <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Earnings cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {earningsLoading ? (
            <div className="col-span-3 flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              <EarningsCard
                label="Total encaissé"
                value={formatPrice(earnings.total)}
                icon={<Euro size={22} />}
                color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <EarningsCard
                label="Ce mois-ci"
                value={formatPrice(earnings.thisMonth)}
                icon={<TrendingUp size={22} />}
                color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <EarningsCard
                label="En attente"
                value={formatPrice(earnings.pending)}
                icon={<Clock size={22} />}
                color="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending bookings */}
          <section aria-labelledby="pending-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="pending-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                Demandes en attente
                {pendingBookings.length > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full px-2 py-0.5 font-medium">
                    {pendingBookings.length}
                  </span>
                )}
              </h2>
              <Link
                to="/proprietaire/reservations"
                className="text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-800 dark:hover:text-ocean-300 flex items-center gap-1"
              >
                Tout voir <ArrowRight size={13} />
              </Link>
            </div>

            {pendingLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                <CheckCircle size={32} className="text-green-300 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 4).map((booking: any) => (
                  <PendingBookingCard
                    key={booking.id}
                    booking={booking}
                    onAccept={() => acceptMutation.mutate(booking.id)}
                    onDecline={() => declineMutation.mutate(booking.id)}
                    isAccepting={acceptMutation.isPending}
                    isDeclining={declineMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section aria-labelledby="links-title">
            <h2 id="links-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Accès rapides
            </h2>
            <div className="space-y-3">
              {[
                {
                  icon: <Ship size={20} />,
                  label: 'Mes bateaux',
                  desc: 'Gérer vos annonces',
                  to: '/proprietaire/bateaux',
                  color: 'bg-ocean-50 text-ocean-600 dark:bg-ocean-900/30 dark:text-ocean-400',
                },
                {
                  icon: <CheckCircle size={20} />,
                  label: 'Toutes les réservations',
                  desc: 'Historique complet',
                  to: '/proprietaire/reservations',
                  color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                },
                {
                  icon: <BarChart3 size={20} />,
                  label: 'Revenus détaillés',
                  desc: 'Statistiques et export',
                  to: '/proprietaire/revenus',
                  color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:border-ocean-200 dark:hover:border-ocean-700 hover:shadow-sm transition-all group"
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-ocean-400" />
                </Link>
              ))}
            </div>
          </section>
        </div>
    </div>

    {/* Onboarding - affiché une seule fois après l'inscription */}
    {showOnboarding && (
      <OnboardingModal onClose={() => setShowOnboarding(false)} />
    )}
    </>
  )
}

const EarningsCard: React.FC<{
  label: string
  value: string
  icon: React.ReactNode
  color: string
}> = ({ label, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
)

const PendingBookingCard: React.FC<{
  booking: any
  onAccept: () => void
  onDecline: () => void
  isAccepting: boolean
  isDeclining: boolean
}> = ({ booking, onAccept, onDecline, isAccepting, isDeclining }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
    <div className="flex items-start justify-between gap-2 mb-3">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{booking.boat?.title ?? 'Bateau'}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
          <Clock size={11} />
          {formatDate(booking.startDate)} au {formatDate(booking.endDate)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Locataire : {booking.renter?.firstName} {booking.renter?.lastName}
        </p>
      </div>
      <BookingStatusBadge status={booking.status} />
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        leftIcon={<CheckCircle size={13} />}
        onClick={onAccept}
        loading={isAccepting}
        className="flex-1"
      >
        Accepter
      </Button>
      <Button
        variant="danger"
        size="sm"
        leftIcon={<XCircle size={13} />}
        onClick={onDecline}
        loading={isDeclining}
        className="flex-1"
      >
        Refuser
      </Button>
    </div>
  </div>
)

export default OwnerDashboard
