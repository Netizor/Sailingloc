import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin.api'
import type { ResolveDisputePayload } from '../../api/admin.api'
import { formatDate, formatPrice } from '../../lib/utils'
import { BookingStatus } from '../../types'
import type { Booking } from '../../types'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'

// Type union pour le filtre statut : valeur spéciale 'ALL' + valeurs de l'enum
type BookingStatusFilter = 'ALL' | BookingStatus

// Libellés des options du filtre statut
const statusOptions: { value: BookingStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: BookingStatus.PENDING, label: 'En attente' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmées' },
  { value: BookingStatus.COMPLETED, label: 'Terminées' },
  { value: BookingStatus.CANCELLED, label: 'Annulées' },
  { value: BookingStatus.DISPUTED, label: 'Litigieuses' },
]

// ─── Modal de résolution de litige ────────────────────────────────────────────

interface ResolveModalProps {
  booking: Booking
  onClose: () => void
  onResolved: () => void
}

const ResolveDisputeModal: React.FC<ResolveModalProps> = ({ booking, onClose, onResolved }) => {
  const [resolution, setResolution] = useState<'complete' | 'cancel' | null>(null)
  const [refund, setRefund] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  const mutation = useMutation({
    mutationFn: (payload: ResolveDisputePayload) => adminApi.resolveDispute(booking.id, payload),
    onSuccess: () => {
      toast.success('Litige résolu avec succès')
      onResolved()
    },
    onError: () => {
      toast.error('Erreur lors de la résolution du litige')
    },
  })

  // Fermer la modale avec la touche Échap (sauf en cours de traitement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, mutation.isPending])

  // Bloquer le scroll du body pendant que la modale est ouverte
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleConfirm = () => {
    if (!resolution) return
    mutation.mutate({
      resolution,
      refund: resolution === 'cancel' ? refund : undefined,
      adminNote: adminNote.trim() || undefined,
    })
  }

  return (
    /* Overlay — désactivé pendant le traitement pour éviter une fermeture accidentelle */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-dispute-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={mutation.isPending ? undefined : onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
            <h2 id="resolve-dispute-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Résoudre le litige #{booking.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Résumé réservation */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-5 text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-gray-200 mb-0.5">
            {booking.boat?.title ?? '—'}
          </p>
          <p>
            {booking.renter?.firstName} {booking.renter?.lastName} —{' '}
            {formatDate(booking.startDate)} au {formatDate(booking.endDate)}
          </p>
          <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {formatPrice(booking.totalAmount)}
          </p>
        </div>

        {/* Choix de résolution */}
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Décision :</p>
        <div className="flex gap-3 mb-4">
          {/* Terminer */}
          <button
            type="button"
            onClick={() => setResolution('complete')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              resolution === 'complete'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-green-300'
            }`}
          >
            <CheckCircle size={16} />
            Terminer
          </button>

          {/* Annuler */}
          <button
            type="button"
            onClick={() => setResolution('cancel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              resolution === 'cancel'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300'
            }`}
          >
            <XCircle size={16} />
            Annuler
          </button>
        </div>

        {/* Option remboursement (uniquement pour annulation + paiement Stripe existant) */}
        {resolution === 'cancel' && booking.stripePaymentIntentId && (
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={refund}
              onChange={(e) => setRefund(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
            />
            Rembourser le locataire via Stripe
          </label>
        )}

        {/* Note admin */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Note interne <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Motif de la décision, remarques…"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!resolution || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Traitement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

const AdminBookings: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('ALL')
  const [selectedDispute, setSelectedDispute] = useState<Booking | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['admin', 'bookings', { statusFilter }],
    queryFn: () =>
      adminApi.getBookings({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    staleTime: 60 * 1000,
    // Conserve les données précédentes lors d'un changement de filtre
    // pour éviter le flash du spinner entre deux requêtes
    placeholderData: keepPreviousData,
  })

  const bookings: Booking[] = data?.data ?? []

  // Nombre de litiges ouverts pour l'indicateur dans le filtre
  const disputedCount = statusFilter === BookingStatus.DISPUTED ? (data?.total ?? 0) : undefined

  const handleResolved = () => {
    setSelectedDispute(null)
    queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des réservations</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {data?.total ?? 0} réservation(s)
            {disputedCount !== undefined && disputedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle size={13} /> {disputedCount} litige(s) ouvert(s)
              </span>
            )}
          </p>
        </div>

        {/* Filtre statut */}
        <div className="flex gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatusFilter)}
            aria-label="Filtrer par statut"
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-700"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-red-400 text-sm">
              Une erreur est survenue lors du chargement des réservations
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
              Aucune réservation trouvée
            </div>
          ) : (
            // Légère opacité pendant le rechargement après changement de filtre
            <div className={`overflow-x-auto transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    {['Bateau', 'Locataire', 'Propriétaire', 'Dates', 'Jours', 'Montant', 'Statut', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      {/* Bateau : miniature + titre tronqué */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            {booking.boat?.images?.[0] ? (
                              <img
                                src={booking.boat.images[0]}
                                alt={booking.boat.title ?? ''}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center">
                                <span className="text-[10px] text-ocean-300">No img</span>
                              </div>
                            )}
                          </div>
                          <div className="max-w-[160px]">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {booking.boat?.title ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Locataire */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {booking.renter?.firstName} {booking.renter?.lastName}
                      </td>

                      {/* Propriétaire */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {booking.owner?.firstName} {booking.owner?.lastName}
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                      </td>

                      {/* Jours */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-center">
                        {booking.totalDays}
                      </td>

                      {/* Montant */}
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatPrice(booking.totalAmount)}
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4">
                        <BookingStatusBadge status={booking.status} />
                      </td>

                      {/* Actions — bouton de résolution uniquement pour les litiges */}
                      <td className="px-5 py-4">
                        {booking.status === BookingStatus.DISPUTED && (
                          <button
                            type="button"
                            onClick={() => setSelectedDispute(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap"
                          >
                            <AlertTriangle size={13} />
                            Résoudre
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de résolution de litige */}
      {selectedDispute && (
        <ResolveDisputeModal
          booking={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  )
}

export default AdminBookings
