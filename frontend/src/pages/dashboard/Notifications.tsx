import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell, BellOff, X, CheckCheck,
  CalendarCheck, CalendarX, CreditCard, Star,
  MessageCircle, ShieldCheck, Ship, AlertCircle,
  ChevronLeft, ChevronRight, Settings, EyeOff,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Notification } from '../../types'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notifications.api'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useNotificationPrefs, NOTIFICATION_TYPES } from '../../hooks/useNotificationPrefs'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NOTIF_ICONS: Record<string, React.ReactElement> = {
  BOOKING_REQUEST:    <CalendarCheck size={16} />,
  BOOKING_CONFIRMED:  <CalendarCheck size={16} />,
  BOOKING_CANCELLED:  <CalendarX size={16} />,
  BOOKING_COMPLETED:  <CheckCheck size={16} />,
  PAYMENT_RECEIVED:   <CreditCard size={16} />,
  NEW_REVIEW:         <Star size={16} />,
  NEW_MESSAGE:        <MessageCircle size={16} />,
  KYC_APPROVED:       <ShieldCheck size={16} />,
  KYC_REJECTED:       <ShieldCheck size={16} />,
  BOAT_APPROVED:      <Ship size={16} />,
  BOAT_REJECTED:      <Ship size={16} />,
  BOAT_CREATED:       <Ship size={16} />,
  BOAT_STATUS_CHANGED:<Ship size={16} />,
  BOAT_DELETED:       <Ship size={16} />,
}

const NOTIF_COLORS: Record<string, string> = {
  BOOKING_REQUEST:    'badge-variant-info border',
  BOOKING_CONFIRMED:  'badge-variant-success border',
  BOOKING_CANCELLED:  'badge-variant-danger border',
  BOOKING_COMPLETED:  'badge-variant-primary border',
  PAYMENT_RECEIVED:   'badge-variant-success border',
  NEW_REVIEW:         'badge-variant-warning border',
  NEW_MESSAGE:        'badge-variant-info border',
  KYC_APPROVED:       'badge-variant-success border',
  KYC_REJECTED:       'badge-variant-danger border',
  BOAT_APPROVED:      'badge-variant-success border',
  BOAT_REJECTED:      'badge-variant-danger border',
  BOAT_CREATED:       'badge-variant-primary border',
  BOAT_STATUS_CHANGED:'badge-variant-primary border',
  BOAT_DELETED:       'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
}

const NOTIF_LABELS: Record<string, string> = {
  BOOKING_REQUEST:    'Booking request',
  BOOKING_CONFIRMED:  'Booking confirmed',
  BOOKING_CANCELLED:  'Booking cancelled',
  BOOKING_COMPLETED:  'Booking completed',
  PAYMENT_RECEIVED:   'Payment received',
  NEW_REVIEW:         'New review',
  NEW_MESSAGE:        'New message',
  KYC_APPROVED:       'Verification approved',
  KYC_REJECTED:       'Verification rejected',
  BOAT_APPROVED:      'Listing approved',
  BOAT_REJECTED:      'Listing rejected',
  BOAT_CREATED:       'New listing',
  BOAT_STATUS_CHANGED:'Listing updated',
  BOAT_DELETED:       'Listing deleted',
}

const PREF_GROUPS = [
  {
    label: 'Bookings',
    types: ['BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED'],
  },
  {
    label: 'Payments & Reviews',
    types: ['PAYMENT_RECEIVED', 'NEW_REVIEW'],
  },
  {
    label: 'Messages',
    types: ['NEW_MESSAGE'],
  },
  {
    label: 'Listings',
    types: ['BOAT_APPROVED', 'BOAT_REJECTED', 'BOAT_CREATED', 'BOAT_STATUS_CHANGED', 'BOAT_DELETED'],
  },
  {
    label: 'Account',
    types: ['KYC_APPROVED', 'KYC_REJECTED'],
  },
] as const

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const PAGE_SIZE = 15

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: () => void
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={e => { e.stopPropagation(); onChange() }}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500',
      checked ? 'bg-ocean-600 dark:bg-ocean-500' : 'bg-gray-200 dark:bg-gray-600',
    )}
  >
    <span
      className={cn(
        'pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-4' : 'translate-x-0',
      )}
    />
  </button>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

const Notifications: React.FC = () => {
  const [page, setPage] = useState(1)
  const [showPrefs, setShowPrefs] = useState(false)
  const qc = useQueryClient()
  const push = usePushNotifications()
  const { isEnabled, toggle, disabledCount } = useNotificationPrefs()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', page],
    queryFn: () => getNotifications({ page, limit: PAGE_SIZE }),
  })

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const allNotifications = data?.notifications ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1
  const unreadCount = data?.unreadCount ?? 0

  const notifications = allNotifications.filter(n => isEnabled(n.type))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell size={22} className="text-ocean-700 dark:text-ocean-400" />
            Notifications
          </h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {total} notification{total > 1 ? 's' : ''}
              {unreadCount > 0 && ` · ${unreadCount} unread`}
              {disabledCount > 0 && (
                <span className="ml-1 text-gray-400">
                  · {disabledCount} type{disabledCount > 1 ? 's' : ''} hidden
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              <CheckCheck size={15} className="mr-1.5" />
              Mark all as read
            </Button>
          )}
          <button
            onClick={() => setShowPrefs(p => !p)}
            className={cn(
              'p-2 rounded-xl transition-colors',
              showPrefs
                ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300',
            )}
            title="Notification preferences"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Preferences panel */}
      {showPrefs && (
        <div className="mb-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notification preferences
            </p>
            <p className="text-xs text-gray-400">
              Hide selected types on this page
            </p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-x-8 gap-y-5">
            {PREF_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.types.map(type => (
                    <label
                      key={type}
                      className="flex items-center justify-between gap-3 cursor-pointer group/row"
                      onClick={() => toggle(type)}
                    >
                      <span className={cn(
                        'text-sm transition-colors select-none',
                        isEnabled(type)
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-600 line-through',
                      )}>
                        {NOTIF_LABELS[type] ?? type}
                      </span>
                      <Toggle checked={isEnabled(type)} onChange={() => toggle(type)} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Push notifications banner */}
      {push.isSupported && push.permission !== 'denied' && (
        <div className="mb-5 flex items-center justify-between gap-4 bg-ocean-50 dark:bg-ocean-900/20 border border-ocean-100 dark:border-ocean-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Bell size={16} className="text-ocean-600 dark:text-ocean-400 flex-shrink-0" />
            <p className="text-sm text-ocean-800 dark:text-ocean-300">
              {push.isSubscribed
                ? 'Push notifications enabled on this device'
                : 'Enable push notifications so you never miss an update'}
            </p>
          </div>
          <button
            onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
            disabled={push.isLoading}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0',
              push.isSubscribed
                ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                : 'bg-ocean-600 text-white hover:bg-ocean-700',
            )}
          >
            {push.isLoading ? '…' : push.isSubscribed ? (
              <span className="flex items-center gap-1"><BellOff size={12} /> Disable</span>
            ) : (
              <span className="flex items-center gap-1"><Bell size={12} /> Enable</span>
            )}
          </button>
        </div>
      )}

      {/* Filtered types notice */}
      {disabledCount > 0 && !showPrefs && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <EyeOff size={13} />
          {disabledCount} notification type{disabledCount > 1 ? 's' : ''} hidden:{' '}
          <button
            className="underline hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowPrefs(true)}
          >
            edit
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Bell size={40} strokeWidth={1.5} className="text-gray-200 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {disabledCount > 0
              ? 'Some types are hidden — check your preferences.'
              : 'You will be notified here about important activity.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
          {notifications.map((notif) => (
            <NotifRow
              key={notif.id}
              notif={notif}
              onRead={() => { if (!notif.isRead) readMutation.mutate(notif.id) }}
              onDelete={() => deleteMutation.mutate(notif.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
            <ChevronLeft size={15} className="mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
            Next <ChevronRight size={15} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface NotifRowProps {
  notif: Notification
  onRead: () => void
  onDelete: () => void
}

const NotifRow: React.FC<NotifRowProps> = ({ notif, onRead, onDelete }) => {
  const icon = NOTIF_ICONS[notif.type] ?? <AlertCircle size={16} />
  const colorClass = NOTIF_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600'
  const typeLabel = NOTIF_LABELS[notif.type] ?? notif.type

  return (
    <div
      className={cn(
        'relative flex items-start gap-2 sm:gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group',
        !notif.isRead && 'bg-blue-50/30 dark:bg-blue-900/10',
      )}
    >
      {!notif.isRead && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-orange-400" />
      )}
      <div className={cn('flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mt-0.5', colorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
              {typeLabel}
            </span>
            <p className={cn('text-sm leading-snug', notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100 font-semibold')}>
              {notif.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{notif.body}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(notif.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              to={`/mon-espace/notifications/${notif.id}`}
              onClick={onRead}
              className="text-xs text-ocean-600 dark:text-ocean-400 hover:text-ocean-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-ocean-50 dark:hover:bg-ocean-900/30 transition-colors whitespace-nowrap"
            >
              View details
            </Link>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 text-gray-300 dark:text-gray-600 transition-all"
              aria-label="Delete"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
