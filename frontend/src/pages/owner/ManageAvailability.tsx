import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Info,
  CalendarCheck,
  PlusCircle,
} from 'lucide-react'
import {
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  isAfter,
  addMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { availabilityApi } from '../../api/availability.api'
import { getMyBoats } from '../../api/boats.api'
import { bookingsApi } from '../../api/bookings.api'
import type { Booking } from '../../types'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

type DateStatus = 'available' | 'unavailable' | 'booked'

interface DayStatus {
  date: string
  status: DateStatus
}

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const ManageAvailability: React.FC = () => {
  const { id: boatId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const today = useMemo(() => startOfDay(new Date()), [])
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today))
  const [localChanges, setLocalChanges] = useState<Map<string, DateStatus>>(new Map())

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<string | null>(null)
  const [dragCurrent, setDragCurrent] = useState<string | null>(null)
  const [dragAction, setDragAction] = useState<'available' | 'unavailable' | null>(null)

  const dragRangeDates = useMemo((): Set<string> => {
    if (!isDragging || !dragStart || !dragCurrent) return new Set()
    const a = parseISO(dragStart)
    const b = parseISO(dragCurrent)
    const [start, end] = a <= b ? [a, b] : [b, a]
    return new Set(eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd')))
  }, [isDragging, dragStart, dragCurrent])

  const { data: myBoats } = useQuery({
    queryKey: ['boats', 'my'],
    queryFn: getMyBoats,
    staleTime: 5 * 60 * 1000,
  })

  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['availability', boatId],
    queryFn: () => availabilityApi.getBoatAvailability(Number(boatId!)),
    enabled: !!boatId,
    staleTime: 2 * 60 * 1000,
  })

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings', 'owner', 'confirmed'],
    queryFn: () => bookingsApi.getMyBookingsAsOwner({ status: 'CONFIRMED', limit: 50 }),
    enabled: !!boatId,
    staleTime: 2 * 60 * 1000,
  })

  const upcomingBookings = useMemo((): Booking[] => {
    const all: Booking[] = bookingsData?.data ?? []
    return all
      .filter((b) => String(b.boatId) === boatId && isAfter(parseISO(b.endDate), today))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 4)
  }, [bookingsData, boatId, today])

  const saveMutation = useMutation({
    mutationFn: (days: DayStatus[]) => availabilityApi.setAvailability(Number(boatId!), days),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability', boatId] })
      toast.success('Disponibilités enregistrées !')
      setLocalChanges(new Map())
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  const getDateStatus = useCallback(
    (date: Date): DateStatus => {
      const key = format(date, 'yyyy-MM-dd')
      if (localChanges.has(key)) return localChanges.get(key)!
      if (availabilityData?.booked?.includes(key)) return 'booked'
      if (availabilityData?.unavailable?.includes(key)) return 'unavailable'
      if (availabilityData?.available?.includes(key)) return 'available'
      return isBefore(date, today) ? 'unavailable' : 'available'
    },
    [localChanges, availabilityData, today]
  )

  const handleDayMouseDown = (date: Date) => {
    if (isBefore(date, today) && !isSameDay(date, today)) return
    const currentStatus = getDateStatus(date)
    if (currentStatus === 'booked') return
    const key = format(date, 'yyyy-MM-dd')
    setIsDragging(true)
    setDragStart(key)
    setDragCurrent(key)
    setDragAction(currentStatus === 'available' ? 'unavailable' : 'available')
  }

  const handleDayMouseEnter = (date: Date) => {
    if (!isDragging) return
    setDragCurrent(format(date, 'yyyy-MM-dd'))
  }

  const finalizeDrag = useCallback(() => {
    if (!isDragging || !dragStart || !dragCurrent || !dragAction) {
      setIsDragging(false)
      return
    }
    const a = parseISO(dragStart)
    const b = parseISO(dragCurrent)
    const [start, end] = a <= b ? [a, b] : [b, a]
    setLocalChanges((prev) => {
      const next = new Map(prev)
      for (const d of eachDayOfInterval({ start, end })) {
        const key = format(d, 'yyyy-MM-dd')
        if (getDateStatus(d) !== 'booked') next.set(key, dragAction)
      }
      return next
    })
    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
    setDragAction(null)
  }, [isDragging, dragStart, dragCurrent, dragAction, getDateStatus])

  useEffect(() => {
    document.addEventListener('mouseup', finalizeDrag)
    return () => document.removeEventListener('mouseup', finalizeDrag)
  }, [finalizeDrag])

  const handleSave = () => {
    const days: DayStatus[] = Array.from(localChanges.entries()).map(([date, status]) => ({ date, status }))
    saveMutation.mutate(days)
  }

  const dayClasses = (date: Date, status: DateStatus, isCurrentMonth: boolean, isInDrag: boolean) => {
    const isPast = isBefore(date, today) && !isSameDay(date, today)
    return cn(
      'h-9 w-9 flex items-center justify-center text-sm rounded-full transition-all cursor-pointer select-none',
      !isCurrentMonth && 'opacity-25',
      isPast && 'cursor-not-allowed opacity-40',
      status === 'available' && !isPast && 'bg-green-100 text-green-800 hover:bg-green-200 font-medium',
      status === 'unavailable' && !isPast && 'bg-red-100 text-red-700 hover:bg-red-200',
      status === 'booked' && 'bg-ocean-100 dark:bg-ocean-900/40 text-ocean-700 dark:text-ocean-300 cursor-not-allowed',
      isPast && 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
      isInDrag && !isPast && status !== 'booked' && 'ring-2 ring-ocean-500 ring-inset scale-110'
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const boats = myBoats?.data ?? []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gérer les disponibilités</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Mettez à jour la planification de votre flotte en temps réel
            </p>
          </div>
          {boats.length > 0 && (
            <div className="flex-shrink-0">
              <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1.5">Choisir un bateau</p>
              <select
                value={boatId}
                onChange={(e) => navigate(`/proprietaire/bateaux/${e.target.value}/disponibilites`)}
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ocean-500"
              >
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
                disabled={isBefore(addMonths(currentMonth, -1), startOfMonth(today))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize min-w-[160px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={() => setCurrentMonth(startOfMonth(today))}
              className="text-sm font-medium text-ocean-600 dark:text-ocean-400 hover:underline"
            >
              Aujourd'hui
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
            {[
              { color: 'bg-green-100', label: 'Disponible' },
              { color: 'bg-ocean-100 dark:bg-ocean-900/40', label: 'Réservé' },
              { color: 'bg-red-100', label: 'Indisponible' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-sm">
                <span className={cn('h-4 w-4 rounded-full flex-shrink-0', item.color)} />
                <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 ml-auto">
              <Info size={13} />
              Cliquez ou glissez pour basculer
            </div>
          </div>

          <MonthCalendar
            month={currentMonth}
            getDateStatus={getDateStatus}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
            dragRangeDates={dragRangeDates}
            dayClasses={dayClasses}
            isDragging={isDragging}
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            {localChanges.size > 0 ? (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                {localChanges.size} modification{localChanges.size > 1 ? 's' : ''} non sauvegardée{localChanges.size > 1 ? 's' : ''}
              </span>
            ) : (
              <span />
            )}
            <Button
              variant="primary"
              leftIcon={<Save size={15} />}
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={localChanges.size === 0}
            >
              Appliquer les modifications
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Réservations à venir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-md">
                    Confirmé
                  </span>
                  <CalendarCheck size={15} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {booking.renter
                    ? `${booking.renter.firstName} ${booking.renter.lastName}`
                    : `Réservation #${booking.id}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {format(parseISO(booking.startDate), 'd MMM', { locale: fr })} au{' '}
                  {format(parseISO(booking.endDate), 'd MMM yyyy', { locale: fr })}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(booking.totalAmount ?? 0)}
                  </span>
                  <button
                    onClick={() => navigate('/proprietaire/reservations')}
                    className="text-xs font-semibold text-ocean-600 dark:text-ocean-400 hover:underline"
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}

            <div
              onClick={() => toast('Fonctionnalité à venir.', { icon: '📅' })}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-ocean-300 dark:hover:border-ocean-600 transition-colors min-h-[140px]"
            >
              <PlusCircle size={26} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Ajouter manuellement</p>
            </div>
          </div>

          {upcomingBookings.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
              Aucune réservation confirmée à venir pour ce bateau.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface MonthCalendarProps {
  month: Date
  getDateStatus: (date: Date) => DateStatus
  onDayMouseDown: (date: Date) => void
  onDayMouseEnter: (date: Date) => void
  dragRangeDates: Set<string>
  dayClasses: (date: Date, status: DateStatus, isCurrentMonth: boolean, isInDrag: boolean) => string
  isDragging: boolean
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  getDateStatus,
  onDayMouseDown,
  onDayMouseEnter,
  dragRangeDates,
  dayClasses,
  isDragging,
}) => {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div style={{ userSelect: isDragging ? 'none' : 'auto' }}>
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date) => {
          const isCurrentMonth = isSameMonth(date, month)
          const status = getDateStatus(date)
          const dateStr = format(date, 'yyyy-MM-dd')
          const isInDrag = dragRangeDates.has(dateStr)
          return (
            <div key={date.toISOString()} className="flex items-center justify-center">
              <div
                className={dayClasses(date, status, isCurrentMonth, isInDrag)}
                onMouseDown={() => onDayMouseDown(date)}
                onMouseEnter={() => onDayMouseEnter(date)}
                title={format(date, 'dd/MM/yyyy')}
              >
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ManageAvailability
