import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle, XCircle, X, Eye, Search,
  ChevronLeft, ChevronRight, CalendarDays,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin.api'
import { formatDate, formatPrice, getBookingStatusLabel, cn } from '../../lib/utils'
import { BookingStatus } from '../../types'
import type { Booking } from '../../types'
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge'
import Spinner from '../../components/ui/Spinner'

type StatusFilter = 'ALL' | BookingStatus

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL',                   label: 'All statuses' },
  { value: BookingStatus.PENDING,   label: 'Pending' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
  { value: BookingStatus.COMPLETED, label: 'Completed' },
  { value: BookingStatus.CANCELLED, label: 'Cancelled' },
  { value: BookingStatus.DISPUTED,  label: 'Disputed' },
]

const ALL_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.DISPUTED,
]

const LIMIT = 20

// ─── ActionBtn ────────────────────────────────────────────────
function ActionBtn({
  icon, title, onClick, disabled, className, invisible: inv,
}: {
  icon: React.ReactNode; title: string; onClick?: () => void
  disabled?: boolean; className?: string; invisible?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || inv}
      title={title}
      aria-label={title}
      className={cn(
        'p-1.5 rounded-lg transition-colors flex-shrink-0',
        inv ? 'invisible pointer-events-none' : '',
        !inv && 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
        !inv && disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >{icon}</button>
  )
}

// ─── Pagination ───────────────────────────────────────────────
function Pagination({ page, totalPages, total, onPage }: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
      <span>Page {page} / {totalPages} · {total} result(s)</span>
      <div className="flex gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className={cn('p-1.5 rounded-lg border border-gray-200 dark:border-gray-600',
            page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={cn('w-8 h-8 rounded-lg text-xs font-medium border transition-colors',
              p === page
                ? 'bg-ocean-500 text-white border-ocean-500'
                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700')}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className={cn('p-1.5 rounded-lg border border-gray-200 dark:border-gray-600',
            page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── DetailModal ──────────────────────────────────────────────
function DetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Booking #{booking.id}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {booking.boat?.images?.[0] && (
          <div className="h-32 w-full rounded-xl overflow-hidden mb-5 bg-gray-100 dark:bg-gray-700">
            <img src={booking.boat.images[0]} alt={booking.boat.title ?? ''} className="h-full w-full object-cover" />
          </div>
        )}

        <dl className="text-sm divide-y divide-gray-50 dark:divide-gray-700">
          {[
            { label: 'Boat',         value: booking.boat?.title ?? '-' },
            { label: 'City',         value: booking.boat?.city  ?? '-' },
            { label: 'Renter',       value: `${booking.renter?.firstName ?? ''} ${booking.renter?.lastName ?? ''}`.trim() || '-' },
            { label: 'Email',        value: (booking.renter as { email?: string })?.email ?? '-' },
            { label: 'Owner',        value: `${booking.owner?.firstName ?? ''} ${booking.owner?.lastName ?? ''}`.trim() || '-' },
            { label: 'Check-in',     value: formatDate(booking.startDate) },
            { label: 'Check-out',    value: formatDate(booking.endDate) },
            { label: 'Duration',     value: `${booking.totalDays} day(s)` },
            { label: 'Total amount', value: formatPrice(booking.totalAmount) },
            { label: 'Created',      value: formatDate(booking.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2">
              <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 text-right max-w-[60%] truncate">{value}</dd>
            </div>
          ))}
          <div className="flex justify-between py-2">
            <dt className="text-gray-500 dark:text-gray-400">Status</dt>
            <dd><BookingStatusBadge status={booking.status} /></dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// ─── ResolveDisputeModal ──────────────────────────────────────
function ResolveDisputeModal({ booking, onClose, onResolved }: {
  booking: Booking; onClose: () => void; onResolved: () => void
}) {
  const [resolution, setResolution] = useState<'complete' | 'cancel' | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const mutation = useMutation({
    mutationFn: (status: BookingStatus) => adminApi.updateBookingStatus(booking.id, status),
    onSuccess: () => { toast.success('Dispute resolved'); onResolved() },
    onError:   () => toast.error('Error resolving dispute'),
  })

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && !mutation.isPending) onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose, mutation.isPending])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      role="dialog" aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={mutation.isPending ? undefined : onClose}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Resolve dispute #{booking.id}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-5 text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-gray-200 mb-0.5">{booking.boat?.title ?? ''}</p>
          <p>{booking.renter?.firstName} {booking.renter?.lastName}, {formatDate(booking.startDate)} to {formatDate(booking.endDate)}</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{formatPrice(booking.totalAmount)}</p>
        </div>

        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Decision:</p>
        <div className="flex gap-3 mb-4">
          {(['complete', 'cancel'] as const).map((r) => {
            const isComplete = r === 'complete'
            const active = resolution === r
            return (
              <button key={r} type="button" onClick={() => setResolution(r)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                  active
                    ? isComplete
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : isComplete
                      ? 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-green-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300',
                )}>
                {isComplete ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {isComplete ? 'Complete' : 'Cancel'}
              </button>
            )
          })}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Internal note <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2} maxLength={500}
            placeholder="Reason for the decision, notes…"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => resolution && mutation.mutate(resolution === 'complete' ? BookingStatus.COMPLETED : BookingStatus.CANCELLED)}
            disabled={!resolution || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-ocean-600 text-white text-sm font-medium disabled:opacity-50">
            {mutation.isPending ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
const AdminBookings: React.FC = () => {
  const queryClient = useQueryClient()

  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('ALL')
  const [search,        setSearch]        = useState('')
  const [startDate,     setStartDate]     = useState('')
  const [endDate,       setEndDate]       = useState('')
  const [page,          setPage]          = useState(1)
  const [detailBooking,  setDetailBooking]  = useState<Booking | null>(null)
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null)

  const resetPage = () => setPage(1)

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['admin', 'bookings', { statusFilter, search, startDate, endDate, page }],
    queryFn: () => adminApi.getBookings({
      status:    statusFilter === 'ALL' ? undefined : statusFilter,
      search:    search    || undefined,
      startDate: startDate || undefined,
      endDate:   endDate   || undefined,
      page,
      limit: LIMIT,
    }),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingStatus }) =>
      adminApi.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    },
    onError: () => toast.error('Error updating status'),
  })

  const bookings: Booking[] = data?.data ?? []
  const total      = data?.total      ?? 0
  const totalPages = data?.totalPages ?? 1
  const disputedCount = statusFilter === BookingStatus.DISPUTED ? total : undefined

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking management</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {total} booking(s)
          {disputedCount != null && disputedCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle size={13} /> {disputedCount} dispute(s)
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Renter, email, booking #…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); resetPage() }}
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-gray-400 flex-shrink-0" />
          <input type="date" value={startDate} title="From"
            onChange={(e) => { setStartDate(e.target.value); resetPage() }}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          <span className="text-gray-400 text-xs">→</span>
          <input type="date" value={endDate} title="To"
            onChange={(e) => { setEndDate(e.target.value); resetPage() }}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); resetPage() }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : isError ? (
          <div className="text-center py-16 text-red-400 text-sm">Error loading data</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            No bookings found
          </div>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', isPlaceholderData && 'opacity-60')}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  {['Boat', 'Renter', 'Owner', 'Dates', 'Days', 'Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">

                    {/* Boat */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          {booking.boat?.images?.[0] ? (
                            <img src={booking.boat.images[0]} alt={booking.boat.title ?? ''} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center">
                              <span className="text-[10px] text-ocean-300">-</span>
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
                          {booking.boat?.title ?? '-'}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {booking.renter?.firstName} {booking.renter?.lastName}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {booking.owner?.firstName} {booking.owner?.lastName}
                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                      {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-center">
                      {booking.totalDays}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatPrice(booking.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>

                    {/* Actions - 3 fixed slots */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn
                          icon={<Eye size={14} />}
                          title="View details"
                          onClick={() => setDetailBooking(booking)}
                        />
                        <select
                          value={booking.status}
                          onChange={(e) =>
                            statusMutation.mutate({ id: booking.id, status: e.target.value as BookingStatus })
                          }
                          className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{getBookingStatusLabel(s)}</option>
                          ))}
                        </select>
                        {/* Dispute - invisible if not disputed */}
                        <ActionBtn
                          icon={<AlertTriangle size={14} />}
                          title="Resolve dispute"
                          onClick={() => setDisputeBooking(booking)}
                          invisible={booking.status !== BookingStatus.DISPUTED}
                          className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />

      {detailBooking && (
        <DetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />
      )}

      {disputeBooking && (
        <ResolveDisputeModal
          booking={disputeBooking}
          onClose={() => setDisputeBooking(null)}
          onResolved={() => {
            setDisputeBooking(null)
            queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
          }}
        />
      )}
    </div>
  )
}

export default AdminBookings
