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
import { daysBetween, formatDate, formatPrice } from '../../lib/utils'
import { downloadInvoicePdf } from '../../lib/generateInvoice'
import { useAuthStore } from '../../store/auth.store'
import { BookingStatus } from '../../types'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

// Cancellation reasons offered to the renter
const CANCEL_REASONS = [
  'Change of plans',
  'Health issue',
  'Work-related reason',
  'Financial issue',
  'Unfavorable weather conditions',
  'Other',
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
      toast.success('Booking cancelled', { id: 'cancel-booking' })
      setCancelOpen(false)
      qc.invalidateQueries({ queryKey: ['booking', id] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err: any) => toast.error(
      err?.response?.data?.message ?? 'Unable to cancel the booking',
      { id: 'cancel-booking' },
    ),
  })

  const handleConfirmCancel = () => {
    const reason = cancelReason === 'Other' ? (cancelOther.trim() || 'Other') : cancelReason
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
        <p className="text-gray-600 dark:text-gray-400 font-medium">Booking not found.</p>
        <Button variant="secondary" onClick={() => navigate('/mon-espace/reservations')}>
          Back
        </Button>
      </div>
    )
  }

  const boat = booking.boat
  const totalDays = booking.totalDays || daysBetween(booking.startDate, booking.endDate) || 1
  const dailyRate = booking.dailyRate ?? boat?.dailyRate ?? 0
  const subtotal = booking.subtotal ?? dailyRate * totalDays
  const canReview = booking.status === BookingStatus.COMPLETED && !booking.hasReview
  // Renter can cancel if the booking is still active
  const canCancel =
    user?.id === booking.renterId &&
    (booking.status === BookingStatus.PENDING ||
     (booking.status === BookingStatus.CONFIRMED && new Date(booking.startDate) > new Date()))

  const daysUntilStart = booking.startDate
    ? Math.ceil((new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0
  const refundPercent = daysUntilStart > 7 ? 100 : daysUntilStart >= 2 ? 50 : 0

  // Invoice is only available when payment is confirmed or completed
  const canDownloadInvoice =
    booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED

  const handleDownloadInvoice = () => {
    const renterName = booking.renter
      ? `${booking.renter.firstName ?? ''} ${booking.renter.lastName ?? ''}`.trim()
      : (user ? `${user.firstName} ${user.lastName}` : 'Customer')
    const renterEmail = booking.renter?.email ?? user?.email
    downloadInvoicePdf(booking, { name: renterName || 'Customer', email: renterEmail }).catch(() => {
      toast.error('Unable to download the invoice')
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back */}
        <button
          onClick={() => navigate('/mon-espace/reservations')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          My bookings
        </button>

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking details</h1>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="space-y-5">
          {/* Boat */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 h-40 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {boat?.images?.[0] ? (
                  <img
                    src={boat.images[0]}
                    alt={boat.title ?? 'Boat'}
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
                    {boat?.title ?? 'Boat'}
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
                    View listing →
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Dates & duration */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Dates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow icon={<CalendarDays size={16} />} label="Check-in" value={formatDate(booking.startDate)} />
              <InfoRow icon={<CalendarDays size={16} />} label="Check-out" value={formatDate(booking.endDate)} />
              <InfoRow icon={<Clock size={16} />} label="Duration" value={`${totalDays} day${totalDays > 1 ? 's' : ''}`} />
            </div>
          </section>

          {/* Price breakdown */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Price breakdown
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{formatPrice(dailyRate)} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {booking.withSkipper && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Skipper</span>
                  <span>included</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Service fee</span>
                <span>{formatPrice(booking.platformFee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Deposit (refundable)</span>
                <span>{formatPrice(booking.depositAmount ?? 0)}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2.5 flex justify-between font-semibold text-gray-900 dark:text-gray-100 text-base">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={15} />
                  Total paid
                </span>
                <span>{formatPrice(booking.totalAmount ?? 0)}</span>
              </div>
            </div>
          </section>

          {/* Cancellation reason (if applicable) */}
          {booking.status === BookingStatus.CANCELLED && booking.cancellationReason && (
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl p-5">
              <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                <XCircle size={15} />
                Booking cancelled
              </p>
              <p className="text-sm text-red-600 italic">
                Reason: {booking.cancellationReason}
              </p>
            </section>
          )}

          {/* Owner */}
          {booking.owner && (
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                Owner
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
                {/* A6 - Link to messaging */}
                <Link
                  to={`/mon-espace/messages?to=${booking.ownerId}`}
                  className="flex items-center gap-1.5 text-sm text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 font-medium transition-colors"
                >
                  <MessageCircle size={15} />
                  Contact
                </Link>
              </div>
            </section>
          )}

          {/* Booking message */}
          {booking.message && (
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Your message
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
                Leave a review
              </Button>
            )}
            {canDownloadInvoice && (
              <Button
                variant="secondary"
                leftIcon={<Download size={15} />}
                onClick={handleDownloadInvoice}
              >
                Download invoice
              </Button>
            )}
            {booking.status === BookingStatus.COMPLETED && (
              <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle size={15} />
                Booking completed
              </div>
            )}
            {canCancel && (
              <Button
                variant="danger"
                leftIcon={<XCircle size={15} />}
                onClick={() => setCancelOpen(true)}
              >
                Cancel booking
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation modal */}
      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel booking"
        size="sm"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 space-y-1">
              <p className="font-medium">This action cannot be undone.</p>
              {refundPercent > 0 ? (
                <p>
                  Applicable refund: <strong>{refundPercent}%</strong>
                  {booking.totalAmount
                    ? ` (${formatPrice(booking.totalAmount * refundPercent / 100)})`
                    : ''}
                </p>
              ) : (
                <p>No refund: cancellation less than 48 hours before departure.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cancellation reason
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

          {cancelReason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Please specify
              </label>
              <textarea
                value={cancelOther}
                onChange={(e) => setCancelOther(e.target.value)}
                rows={3}
                placeholder="Describe your cancellation reason…"
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
              Keep booking
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleConfirmCancel}
              loading={cancelMutation.isPending}
              disabled={cancelMutation.isPending}
            >
              Confirm cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

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
