import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Anchor,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  MessageSquarePlus,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  MapPin,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { bookingsApi } from '../../api/bookings.api'
import { formatDate, formatPrice } from '../../lib/utils'
import { generateInvoice } from '../../lib/generateInvoice'
import { useAuthStore } from '../../store/auth.store'
import { BookingStatus } from '../../types'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

// Motifs d'annulation proposés au locataire
const CANCEL_REASONS = [
  'Changement de plans',
  'Problème de santé',
  'Raison professionnelle',
  'Problème financier',
  'Conditions météo défavorables',
  'Autre',
]

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [cancelOther, setCancelOther] = useState('')

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getBooking(Number(id!)),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingsApi.cancel(Number(id!), { cancellationReason: reason }),
    onSuccess: () => {
      toast.success('Réservation annulée')
      setCancelOpen(false)
      qc.invalidateQueries({ queryKey: ['booking', id] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: () => toast.error("Impossible d'annuler la réservation"),
  })

  const handleConfirmCancel = () => {
    const reason = cancelReason === 'Autre' ? (cancelOther.trim() || 'Autre') : cancelReason
    cancelMutation.mutate(reason)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600 dark:text-gray-400 font-medium">Réservation introuvable.</p>
        <Button variant="secondary" onClick={() => navigate('/mon-espace/reservations')}>
          Retour
        </Button>
      </div>
    )
  }

  const boat = booking.boat
  const canReview = booking.status === BookingStatus.COMPLETED
  // Le locataire peut annuler si la réservation est encore active
  const canCancel =
    user?.id === booking.renterId &&
    (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED)

  // La facture n'est disponible que lorsque le paiement est confirmé ou terminé
  const canDownloadInvoice =
    booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED

  const handleDownloadInvoice = () => {
    const renterName = booking.renter
      ? `${booking.renter.firstName ?? ''} ${booking.renter.lastName ?? ''}`.trim()
      : (user ? `${user.firstName} ${user.lastName}` : 'Client')
    generateInvoice(booking, renterName)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Retour */}
        <button
          onClick={() => navigate('/mon-espace/reservations')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Mes réservations
        </button>

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Détail de la réservation</h1>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="space-y-5">
          {/* Bateau */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 h-40 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {boat?.images?.[0] ? (
                  <img
                    src={boat.images[0]}
                    alt={boat.title ?? 'Bateau'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-ocean-50 dark:bg-ocean-900/30">
                    <Anchor size={28} className="text-ocean-300" />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    {boat?.title ?? 'Bateau'}
                  </p>
                  {boat?.port && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={13} />
                      {boat.port}{boat.city ? `, ${boat.city}` : ''}
                    </p>
                  )}
                </div>
                {boat?.id && (
                  <Link
                    to={`/bateaux/${boat.id}`}
                    className="text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 font-medium"
                  >
                    Voir l'annonce →
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Dates & durée */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Dates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow icon={<CalendarDays size={16} />} label="Arrivée" value={formatDate(booking.startDate)} />
              <InfoRow icon={<CalendarDays size={16} />} label="Départ" value={formatDate(booking.endDate)} />
              <InfoRow icon={<Clock size={16} />} label="Durée" value={`${booking.totalDays} jour${booking.totalDays > 1 ? 's' : ''}`} />
            </div>
          </section>

          {/* Récapitulatif financier */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Récapitulatif financier
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{booking.dailyRate} € × {booking.totalDays} jour{booking.totalDays > 1 ? 's' : ''}</span>
                <span>{formatPrice(booking.subtotal ?? 0)}</span>
              </div>
              {booking.withSkipper && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Skipper</span>
                  <span>inclus</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Frais de service</span>
                <span>{formatPrice(booking.platformFee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Caution (remboursée)</span>
                <span>{formatPrice(booking.depositAmount ?? 0)}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2.5 flex justify-between font-semibold text-gray-900 dark:text-gray-100 text-base">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={15} />
                  Total payé
                </span>
                <span>{formatPrice(booking.totalAmount ?? 0)}</span>
              </div>
            </div>
          </section>

          {/* Raison d'annulation (si applicable) */}
          {booking.status === BookingStatus.CANCELLED && booking.cancellationReason && (
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl p-5">
              <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                <XCircle size={15} />
                Réservation annulée
              </p>
              <p className="text-sm text-red-600 italic">
                Motif : {booking.cancellationReason}
              </p>
            </section>
          )}

          {/* Propriétaire */}
          {booking.owner && (
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                Propriétaire
              </h2>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-ocean-700 text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {booking.owner.firstName?.[0]}{booking.owner.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {booking.owner.firstName} {booking.owner.lastName}
                  </p>
                </div>
                {/* A6 — Lien vers la messagerie */}
                <Link
                  to={`/mon-espace/messages?to=${booking.ownerId}`}
                  className="flex items-center gap-1.5 text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 font-medium transition-colors"
                >
                  <MessageCircle size={15} />
                  Contacter
                </Link>
              </div>
            </section>
          )}

          {/* Message de réservation */}
          {booking.message && (
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Votre message
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">"{booking.message}"</p>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canReview && (
              <Button
                variant="primary"
                leftIcon={<MessageSquarePlus size={15} />}
                onClick={() => navigate(`/mon-espace/reservations/${id}/avis`)}
              >
                Laisser un avis
              </Button>
            )}
            {canDownloadInvoice && (
              <Button
                variant="secondary"
                leftIcon={<Download size={15} />}
                onClick={handleDownloadInvoice}
              >
                Télécharger la facture
              </Button>
            )}
            {booking.status === BookingStatus.COMPLETED && (
              <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle size={15} />
                Réservation terminée
              </div>
            )}
            {canCancel && (
              <Button
                variant="danger"
                leftIcon={<XCircle size={15} />}
                onClick={() => setCancelOpen(true)}
              >
                Annuler la réservation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'annulation */}
      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler la réservation"
        size="sm"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Cette action est irréversible. Le remboursement dépend des conditions
              d'annulation en vigueur.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motif d'annulation
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-800"
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {cancelReason === 'Autre' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Précisez
              </label>
              <textarea
                value={cancelOther}
                onChange={(e) => setCancelOther(e.target.value)}
                rows={3}
                placeholder="Décrivez votre motif d'annulation…"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none dark:bg-gray-800"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setCancelOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Garder la réservation
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleConfirmCancel}
              loading={cancelMutation.isPending}
            >
              Confirmer l'annulation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Ligne d'information ──────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-center gap-3">
    <div className="h-9 w-9 rounded-lg bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center text-ocean-600 dark:text-ocean-400 flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
)

export default BookingDetail
