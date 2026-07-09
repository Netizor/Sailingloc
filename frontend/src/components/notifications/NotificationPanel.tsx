import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Bell, CalendarCheck, CalendarX, CheckCheck,
  CreditCard, Star, MessageCircle, ShieldCheck, Ship, AlertCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Notification } from '../../types'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notifications.api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "à l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const NOTIF_ICONS: Record<string, React.ReactElement> = {
  BOOKING_REQUEST:   <CalendarCheck size={15} />,
  BOOKING_CONFIRMED: <CalendarCheck size={15} />,
  BOOKING_CANCELLED: <CalendarX size={15} />,
  BOOKING_COMPLETED: <CheckCheck size={15} />,
  PAYMENT_RECEIVED:  <CreditCard size={15} />,
  NEW_REVIEW:        <Star size={15} />,
  NEW_MESSAGE:       <MessageCircle size={15} />,
  KYC_APPROVED:      <ShieldCheck size={15} />,
  KYC_REJECTED:      <ShieldCheck size={15} />,
  BOAT_APPROVED:     <Ship size={15} />,
  BOAT_REJECTED:     <Ship size={15} />,
}

const NOTIF_COLORS: Record<string, string> = {
  BOOKING_REQUEST:   'badge-variant-info border',
  BOOKING_CONFIRMED: 'badge-variant-success border',
  BOOKING_CANCELLED: 'badge-variant-danger border',
  BOOKING_COMPLETED: 'badge-variant-primary border',
  PAYMENT_RECEIVED:  'badge-variant-success border',
  NEW_REVIEW:        'badge-variant-warning border',
  NEW_MESSAGE:       'badge-variant-info border',
  KYC_APPROVED:      'badge-variant-success border',
  KYC_REJECTED:      'badge-variant-danger border',
  BOAT_APPROVED:     'badge-variant-success border',
  BOAT_REJECTED:     'badge-variant-danger border',
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  onClose: () => void
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'panel'],
    queryFn: () => getNotifications({ limit: 10 }),
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

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-ocean-700" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="text-xs text-ocean-600 hover:text-ocean-800 font-medium px-2 py-1 rounded-lg hover:bg-ocean-50 transition-colors disabled:opacity-50"
            >
              Tout lire
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <span className="text-sm text-gray-400 dark:text-gray-500">Chargement…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell size={28} strokeWidth={1.5} className="text-gray-200 dark:text-gray-700" />
            <span className="text-sm text-gray-400 dark:text-gray-500">Aucune notification</span>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotifItem
              key={notif.id}
              notif={notif}
              onRead={() => { if (!notif.isRead) readMutation.mutate(notif.id) }}
              onDelete={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id) }}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-700 p-3">
        <Link
          to="/mon-espace/notifications"
          onClick={onClose}
          className="flex items-center justify-center w-full py-2 text-sm font-medium text-ocean-700 hover:text-ocean-900 hover:bg-ocean-50 rounded-xl transition-colors dark:text-ocean-400 dark:hover:text-ocean-300 dark:hover:bg-ocean-900/30"
        >
          Voir toutes les notifications
        </Link>
      </div>
    </div>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

interface NotifItemProps {
  notif: Notification
  onRead: () => void
  onDelete: (e: React.MouseEvent) => void
  onClose: () => void
}

const NotifItem: React.FC<NotifItemProps> = ({ notif, onRead, onDelete, onClose }) => {
  const icon = NOTIF_ICONS[notif.type] ?? <AlertCircle size={15} />
  const colorClass = NOTIF_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600'

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group',
        !notif.isRead && 'bg-blue-50/40 dark:bg-blue-900/20',
      )}
      onClick={onRead}
    >
      {/* Unread indicator */}
      {!notif.isRead && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" />
      )}

      {/* Type icon */}
      <div className={cn('flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5', colorClass)}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5">
          <p className={cn('text-sm leading-snug', notif.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium')}>
            {notif.title}
          </p>
          <button
            onClick={onDelete}
            className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 text-gray-300 transition-all dark:text-gray-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label="Supprimer"
          >
            <X size={13} />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>

        <div className="flex items-center justify-between mt-1.5 gap-2">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo(notif.createdAt)}</span>
          <Link
            to={`/mon-espace/notifications/${notif.id}`}
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="text-[11px] text-ocean-600 hover:text-ocean-800 font-medium hover:underline flex-shrink-0"
          >
            Afficher les détails
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel
