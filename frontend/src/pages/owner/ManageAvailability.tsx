import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Info,
} from 'lucide-react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  addMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { availabilityApi } from '../../api/availability.api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

type DateStatus = 'available' | 'unavailable' | 'booked'

interface DayStatus {
  date: string // YYYY-MM-DD
  status: DateStatus
}

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const ManageAvailability: React.FC = () => {
  const { id: boatId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Référence stable - évite d'invalider le useCallback à chaque rendu
  const today = useMemo(() => new Date(), [])
  const [baseMonth, setBaseMonth] = useState(today)
  // Show 3 months
  const months = [baseMonth, addMonths(baseMonth, 1), addMonths(baseMonth, 2)]

  const [localChanges, setLocalChanges] = useState<Map<string, DateStatus>>(new Map())

  // ─── E1 : Drag-to-select ──────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<string | null>(null)
  const [dragCurrent, setDragCurrent] = useState<string | null>(null)
  // Action appliquée pendant le drag (déterminée par le statut initial de la cellule de départ)
  const [dragAction, setDragAction] = useState<'available' | 'unavailable' | null>(null)

  // Ensemble des dates dans la plage de drag courante (pour le surlignage)
  const dragRangeDates = useMemo((): Set<string> => {
    if (!isDragging || !dragStart || !dragCurrent) return new Set()
    const a = parseISO(dragStart)
    const b = parseISO(dragCurrent)
    const [start, end] = a <= b ? [a, b] : [b, a]
    return new Set(eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd')))
  }, [isDragging, dragStart, dragCurrent])

  // Load existing availability
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['availability', boatId],
    queryFn: () => availabilityApi.getBoatAvailability(Number(boatId!)),
    enabled: !!boatId,
    staleTime: 2 * 60 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: (days: DayStatus[]) =>
      availabilityApi.setAvailability(Number(boatId!), days),
    onSuccess: () => {
      toast.success('Disponibilités enregistrées !')
      setLocalChanges(new Map())
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  const getDateStatus = useCallback(
    (date: Date): DateStatus => {
      const key = format(date, 'yyyy-MM-dd')
      if (localChanges.has(key)) return localChanges.get(key)!

      // Check API data
      if (availabilityData?.booked?.includes(key)) return 'booked'
      if (availabilityData?.unavailable?.includes(key)) return 'unavailable'
      if (availabilityData?.available?.includes(key)) return 'available'

      // Default: available for future dates
      return isBefore(date, today) ? 'unavailable' : 'available'
    },
    [localChanges, availabilityData, today]
  )

  // Démarre le drag sur mousedown
  const handleDayMouseDown = (date: Date) => {
    if (isBefore(date, today) && !isSameDay(date, today)) return
    const key = format(date, 'yyyy-MM-dd')
    const currentStatus = getDateStatus(date)
    if (currentStatus === 'booked') return

    setIsDragging(true)
    setDragStart(key)
    setDragCurrent(key)
    setDragAction(currentStatus === 'available' ? 'unavailable' : 'available')
  }

  // Met à jour la cellule courante pendant le drag
  const handleDayMouseEnter = (date: Date) => {
    if (!isDragging) return
    setDragCurrent(format(date, 'yyyy-MM-dd'))
  }

  // Finalise le drag sur mouseup (déclenché via useEffect global)
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

  // Écoute le mouseup global pour terminer le drag même hors du calendrier
  useEffect(() => {
    document.addEventListener('mouseup', finalizeDrag)
    return () => document.removeEventListener('mouseup', finalizeDrag)
  }, [finalizeDrag])

  const handleSave = () => {
    const days: DayStatus[] = Array.from(localChanges.entries()).map(([date, status]) => ({
      date,
      status,
    }))
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
      status === 'booked' && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
      isPast && status === 'available' && 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
      // Surlignage pendant le drag-to-select
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('/proprietaire/bateaux')}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
            >
              <ChevronLeft size={15} /> Retour à mes bateaux
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gérer les disponibilités</h1>
          </div>
          <div className="flex items-center gap-2">
            {localChanges.size > 0 && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 rounded-full">
                {localChanges.size} modification{localChanges.size > 1 ? 's' : ''} non sauvegardée{localChanges.size > 1 ? 's' : ''}
              </span>
            )}
            <Button
              variant="primary"
              leftIcon={<Save size={15} />}
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={localChanges.size === 0}
            >
              Enregistrer
            </Button>
          </div>
        </div>

        {/* C7 - Statistiques d'occupation sur les 3 mois affichés */}
        {availabilityData && (() => {
          const booked    = (availabilityData.booked    ?? []).length
          const available = (availabilityData.available ?? []).length
          const occupied  = booked + available > 0 ? Math.round((booked / (booked + available)) * 100) : 0
          const totalDays = months.reduce((acc, m) => acc + eachDayOfInterval({
            start: startOfMonth(m), end: endOfMonth(m),
          }).length, 0)
          const blockedDays = (availabilityData.unavailable ?? []).length
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Jours réservés', value: booked, color: 'text-ocean-700 bg-ocean-50' },
                { label: 'Jours disponibles', value: available, color: 'text-green-700 bg-green-50' },
                { label: 'Jours bloqués', value: blockedDays, color: 'text-red-600 bg-red-50' },
                { label: 'Taux d\'occupation', value: `${occupied} %`, color: occupied >= 50 ? 'text-green-700 bg-green-50' : 'text-gray-700 bg-gray-50' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border border-transparent p-4 ${s.color.split(' ')[1]} dark:bg-gray-800`}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                  {s.label === 'Jours bloqués' && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">sur {totalDays} j au total</p>
                  )}
                </div>
              ))}
            </div>
          )
        })()}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            { color: 'bg-green-100', label: 'Disponible', text: 'text-green-800' },
            { color: 'bg-red-100', label: 'Indisponible', text: 'text-red-700' },
            { color: 'bg-gray-200', label: 'Réservé', text: 'text-gray-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className={cn('h-5 w-5 rounded-full', item.color)} />
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Info size={13} />
            Cliquez ou glissez pour basculer disponible / indisponible
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setBaseMonth((m) => addMonths(m, -1))}
            disabled={isBefore(addMonths(baseMonth, -1), startOfMonth(today))}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {format(baseMonth, 'MMMM yyyy', { locale: fr })} à {format(months[2], 'MMMM yyyy', { locale: fr })}
          </span>
          <button
            onClick={() => setBaseMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendars grid - user-select désactivé pendant le drag pour éviter la sélection de texte */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ userSelect: isDragging ? 'none' : 'auto' }}
        >
          {months.map((month) => (
            <MonthCalendar
              key={format(month, 'yyyy-MM')}
              month={month}
              getDateStatus={getDateStatus}
              onDayMouseDown={handleDayMouseDown}
              onDayMouseEnter={handleDayMouseEnter}
              dragRangeDates={dragRangeDates}
              dayClasses={dayClasses}
            />
          ))}
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
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  getDateStatus,
  onDayMouseDown,
  onDayMouseEnter,
  dragRangeDates,
  dayClasses,
}) => {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center capitalize mb-4">
        {format(month, 'MMMM yyyy', { locale: fr })}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
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
