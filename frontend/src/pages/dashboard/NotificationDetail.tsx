import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CalendarCheck, CalendarX, CheckCheck,
  CreditCard, Star, MessageCircle, ShieldCheck, Ship, AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { getNotificationById, markAsRead } from '../../api/notifications.api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const NOTIF_ICONS: Record<string, React.ReactElement> = {
  BOOKING_REQUEST:   <CalendarCheck size={22} />,
  BOOKING_CONFIRMED: <CalendarCheck size={22} />,
  BOOKING_CANCELLED: <CalendarX size={22} />,
  BOOKING_COMPLETED: <CheckCheck size={22} />,
  PAYMENT_RECEIVED:  <CreditCard size={22} />,
  NEW_REVIEW:        <Star size={22} />,
  NEW_MESSAGE:       <MessageCircle size={22} />,
  KYC_APPROVED:      <ShieldCheck size={22} />,
  KYC_REJECTED:      <ShieldCheck size={22} />,
  BOAT_APPROVED:     <Ship size={22} />,
  BOAT_REJECTED:     <Ship size={22} />,
}

const NOTIF_COLORS: Record<string, string> = {
  BOOKING_REQUEST:   'bg-blue-100 text-blue-600',
  BOOKING_CONFIRMED: 'bg-green-100 text-green-600',
  BOOKING_CANCELLED: 'bg-red-100 text-red-600',
  BOOKING_COMPLETED: 'bg-green-100 text-green-600',
  PAYMENT_RECEIVED:  'bg-emerald-100 text-emerald-600',
  NEW_REVIEW:        'bg-amber-100 text-amber-600',
  NEW_MESSAGE:       'bg-sky-100 text-sky-600',
  KYC_APPROVED:      'bg-green-100 text-green-600',
  KYC_REJECTED:      'bg-red-100 text-red-600',
  BOAT_APPROVED:     'bg-green-100 text-green-600',
  BOAT_REJECTED:     'bg-red-100 text-red-600',
}

const NOTIF_LABELS: Record<string, string> = {
  BOOKING_REQUEST:   'Demande de réservation',
  BOOKING_CONFIRMED: 'Réservation confirmée',
  BOOKING_CANCELLED: 'Réservation annulée',
  BOOKING_COMPLETED: 'Réservation terminée',
  PAYMENT_RECEIVED:  'Paiement reçu',
  NEW_REVIEW:        'Nouvel avis',
  NEW_MESSAGE:       'Nouveau message',
  KYC_APPROVED:      'Vérification d\'identité approuvée',
  KYC_REJECTED:      'Vérification d\'identité rejetée',
  BOAT_APPROVED:     'Annonce approuvée',
  BOAT_REJECTED:     'Annonce rejetée',
}

// Map notification type + data to a contextual action link
function resolveActionLink(type: string, data?: Record<string, unknown>): { label: string; to: string } | null {
  if (!data) return null
  if ((type === 'BOOKING_REQUEST' || type === 'BOOKING_CONFIRMED' || type === 'BOOKING_CANCELLED' || type === 'BOOKING_COMPLETED') && data.bookingId) {
    return { label: 'Voir la réservation', to: `/mon-espace/reservations` }
  }
  if (type === 'NEW_REVIEW' && data.boatId) {
    return { label: 'Voir le bateau', to: `/bateaux/${data.boatId}` }
  }
  if ((type === 'BOAT_APPROVED' || type === 'BOAT_REJECTED') && data.boatId) {
    return { label: 'Voir le bateau', to: `/bateaux/${data.boatId}` }
  }
  if (type === 'PAYMENT_RECEIVED' && data.bookingId) {
    return { label: 'Voir la réservation', to: `/mon-espace/reservations` }
  }
  return null
}

const NotificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: notif, isLoading, isError } = useQuery({
    queryKey: ['notification', id],
    queryFn: () => getNotificationById(Number(id!)),
    enabled: !!id,
  })

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  // Auto-mark as read when the page is opened
  React.useEffect(() => {
    if (notif && !notif.isRead) {
      readMutation.mutate(notif.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notif?.id, notif?.isRead])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !notif) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Notification introuvable.</p>
        <Button variant="secondary" onClick={() => navigate('/mon-espace/notifications')}>
          Retour aux notifications
        </Button>
      </div>
    )
  }

  const icon = NOTIF_ICONS[notif.type] ?? <AlertCircle size={22} />
  const colorClass = NOTIF_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600'
  const typeLabel = NOTIF_LABELS[notif.type] ?? notif.type
  const actionLink = resolveActionLink(notif.type, notif.data)

  const formattedDate = new Date(notif.createdAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/mon-espace/notifications')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-ocean-700 dark:hover:text-ocean-400 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Toutes les notifications
      </button>

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Top bar */}
        <div className={cn('flex items-center gap-3 px-6 py-5 border-b border-gray-50 dark:border-gray-800')}>
          <div className={cn('h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{typeLabel}</p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{notif.title}</h1>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{notif.body}</p>

          <p className="text-sm text-gray-400 dark:text-gray-500 mt-4 capitalize">{formattedDate}</p>

          {/* Extra data */}
          {notif.data && Object.keys(notif.data).length > 0 && (
            <div className="mt-5 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              {Object.entries(notif.data).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-gray-400 dark:text-gray-500 capitalize">{key}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-right break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action button */}
          {actionLink && (
            <div className="mt-6">
              <Link
                to={actionLink.to}
                className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                {actionLink.label}
                <ExternalLink size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationDetail
