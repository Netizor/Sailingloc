import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  addMonths,
  isBefore,
  startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { availabilityApi } from '../../api/availability.api'

interface BoatAvailabilityCalendarProps {
  boatId: number
}

// Noms courts des jours en français (lundi en premier)
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** Convertit getDay (0=dim) en index lundi-premier (0=lun … 6=dim) */
const mondayFirst = (d: Date) => (getDay(d) + 6) % 7

const BoatAvailabilityCalendar: React.FC<BoatAvailabilityCalendarProps> = ({ boatId }) => {
  const today = startOfDay(new Date())

  const { data, isLoading } = useQuery({
    queryKey: ['availability', boatId],
    queryFn: () => availabilityApi.getBoatAvailability(boatId),
    staleTime: 5 * 60 * 1000,
  })

  const bookedSet = new Set(data?.booked ?? [])
  const unavailableSet = new Set(data?.unavailable ?? [])

  // Affiche le mois en cours et le suivant
  const months = [today, addMonths(today, 1)]

  const getDayClass = (date: Date, dateStr: string) => {
    const past = isBefore(date, today)
    if (past) return 'bg-gray-50 text-gray-300 cursor-default'
    if (bookedSet.has(dateStr)) return 'bg-orange-100 text-orange-400 cursor-default'
    if (unavailableSet.has(dateStr)) return 'bg-gray-100 text-gray-300 line-through cursor-default'
    // Disponible
    return 'bg-white text-gray-800 border border-gray-100'
  }

  return (
    <div>
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 mb-5 text-xs text-gray-500">
        <LegendDot color="bg-white border border-gray-200" label="Disponible" />
        <LegendDot color="bg-orange-100" label="Réservé" />
        <LegendDot color="bg-gray-100" label="Indisponible" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, j) => (
                  <div key={j} className="h-8 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {months.map((monthStart) => {
            const firstDay = startOfMonth(monthStart)
            const lastDay = endOfMonth(monthStart)
            const days = eachDayOfInterval({ start: firstDay, end: lastDay })
            const leadingBlanks = mondayFirst(firstDay)

            return (
              <div key={monthStart.toISOString()} className="bg-white rounded-xl border border-gray-100 p-4">
                {/* En-tête mois */}
                <p className="text-sm font-semibold text-gray-900 mb-3 capitalize">
                  {format(monthStart, 'MMMM yyyy', { locale: fr })}
                </p>

                {/* Noms des jours */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Cellules des jours */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Cases vides avant le 1er */}
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}

                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    return (
                      <div
                        key={dateStr}
                        title={dateStr}
                        className={`h-8 w-full rounded-lg flex items-center justify-center text-xs font-medium ${getDayClass(day, dateStr)}`}
                      >
                        {format(day, 'd')}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`h-3.5 w-3.5 rounded-sm flex-shrink-0 ${color}`} />
    <span>{label}</span>
  </div>
)

export default BoatAvailabilityCalendar
