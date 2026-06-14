import { clsx, type ClassValue } from 'clsx'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import i18n from '../i18n'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

/** Valeur vide affichée quand une donnée est absente (sans tiret). */
export const EMPTY_VALUE = ''

const getDateLocale = () => (i18n.language?.startsWith('en') ? enUS : fr)
const getNumberLocale = () => (i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR')

export const formatDate = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'd MMMM yyyy', { locale: getDateLocale() })

export const formatDateShort = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'd MMM yyyy', { locale: getDateLocale() })

export const formatDateRangeShort = (start: string | Date, end: string | Date) => {
  const locale = getDateLocale()
  const sep = i18n.language?.startsWith('en') ? 'to' : 'au'
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return `${format(s, 'd MMM', { locale })} ${sep} ${format(e, 'd MMM yyyy', { locale })}`
}

export const formatDateRangeDash = (start: string | Date, end: string | Date) => {
  const locale = getDateLocale()
  const sep = i18n.language?.startsWith('en') ? 'to' : 'au'
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return `${format(s, 'd MMM', { locale })} ${sep} ${format(e, 'd MMM yyyy', { locale })}`
}

export const daysUntil = (date: string | Date) => {
  const target = typeof date === 'string' ? parseISO(date) : date
  return differenceInCalendarDays(target, new Date())
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat(getNumberLocale(), { style: 'currency', currency: 'EUR' }).format(amount)

export const daysBetween = (start: string | Date, end: string | Date) => {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return differenceInCalendarDays(e, s)
}

export const getBoatTypeLabel = (type: string): string =>
  ({
    SAILBOAT: 'Voilier',
    MOTORBOAT: 'Bateau à moteur',
    CATAMARAN: 'Catamaran',
    INFLATABLE: 'Semi-rigide',
    YACHT: 'Yacht',
    PONTOON: 'Ponton',
    DINGHY: 'Dériveur',
  }[type] ?? type)

export const getBookingStatusLabel = (status: string): string =>
  ({
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée',
    DISPUTED: 'Litige',
  }[status] ?? status)

export const getBookingStatusColor = (status: string): string =>
  ({
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-ocean-100 text-ocean-800',
    DISPUTED: 'bg-orange-100 text-orange-800',
  }[status] ?? 'bg-gray-100 text-gray-800')

export const getBoatStatusLabel = (status: string): string =>
  ({
    DRAFT: 'Brouillon',
    PENDING_REVIEW: 'En attente de validation',
    ACTIVE: 'Actif',
    INACTIVE: 'Inactif',
    SUSPENDED: 'Suspendu',
    REJECTED: 'Rejeté',
  }[status] ?? status)

export const getBoatStatusColor = (status: string): string =>
  ({
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-700',
    SUSPENDED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-red-100 text-red-800',
  }[status] ?? 'bg-gray-100 text-gray-800')

export const getMotorizationLabel = (type: string): string =>
  ({
    NONE: 'Sans moteur',
    INBOARD: 'Moteur inboard',
    OUTBOARD: 'Moteur hors-bord',
    ELECTRIC: 'Électrique',
    HYBRID: 'Hybride',
  }[type] ?? type)

export const truncate = (str: string, n: number): string =>
  str.length > n ? `${str.slice(0, n)}...` : str

export const generateConversationId = (
  userId1: number,
  userId2: number,
  boatId?: number,
): string => {
  // Tri numérique pour garantir la cohérence de l'ID quel que soit l'ordre des paramètres
  const sorted = [userId1, userId2].sort((a, b) => a - b).map(String).join('_')
  return boatId ? `${sorted}_${boatId}` : sorted
}

export const getInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

export const calculatePlatformFee = (subtotal: number, feeRate = 0.1): number =>
  Math.round(subtotal * feeRate * 100) / 100

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const isImageUrl = (url: string): boolean =>
  /\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(url)

export const buildQueryString = (params: Record<string, unknown>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return query.toString()
}
