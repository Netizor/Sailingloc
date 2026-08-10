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
import { enUS } from 'date-fns/locale'
import { availabilityApi } from '../../api/availability.api'
import { cn } from '../../lib/utils'

interface BoatAvailabilityCalendarProps {
  boatId: number
  variant?: 'default' | 'detail'
}

// Short day names (Monday first)
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Converts getDay (0=Sun) to Monday-first index (0=Mon … 6=Sun) */
const mondayFirst = (d: Date) => (getDay(d) + 6) % 7

const BoatAvailabilityCalendar: React.FC<BoatAvailabilityCalendarProps> = ({ boatId, variant = 'default' }) => {
  const today = startOfDay(new Date())

  const { data, isLoading } = useQuery({
    queryKey: ['availability', boatId],
    queryFn: () => availabilityApi.getBoatAvailability(boatId),
    staleTime: 5 * 60 * 1000,
  })

  const bookedSet = new Set(data?.booked ?? [])
  const unavailableSet = new Set(data?.unavailable ?? [])

  // Show current month and next
  const months = [today, addMonths(today, 1)]

  const getDayClass = (date: Date, dateStr: string) => {
    const past = isBefore(date, today)
    if (variant === 'detail') {
      if (past) return 'text-[#8A94A6] cursor-default'
      if (bookedSet.has(dateStr)) return 'bg-[#2563FF] text-white font-semibold rounded-lg'
      if (unavailableSet.has(dateStr)) return 'bg-[#003366] text-white font-semibold rounded-lg'
      return 'text-[#334155] hover:bg-[#eef3fb] rounded-lg'
    }
    if (past) return 'bg-gray-50 text-gray-300 cursor-default'
    if (bookedSet.has(dateStr)) return 'bg-orange-100 text-orange-400 cursor-default'
    if (unavailableSet.has(dateStr)) return 'bg-gray-100 text-gray-300 line-through cursor-default'
    return 'bg-white text-gray-800 border border-gray-100'
  }

  const monthsToShow = variant === 'detail' ? [today] : months

  return (
    <div>
      <div className={cn('flex flex-wrap items-center gap-4 mb-5 text-xs', variant === 'detail' ? 'text-[#8A94A6]' : 'text-gray-500')}>
        <LegendDot color={variant === 'detail' ? 'bg-white border border-gray-200' : 'bg-white border border-gray-200'} label="Available" />
        <LegendDot color={variant === 'detail' ? 'bg-[#2563FF]' : 'bg-orange-100'} label="Booked" />
        <LegendDot color={variant === 'detail' ? 'bg-[#003366]' : 'bg-gray-100'} label="Unavailable" />
      </div>

      {isLoading ? (
        <div className={cn('grid gap-6', variant === 'detail' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
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
        <div className={cn('grid gap-6', variant === 'detail' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {monthsToShow.map((monthStart) => {
            const firstDay = startOfMonth(monthStart)
            const lastDay = endOfMonth(monthStart)
            const days = eachDayOfInterval({ start: firstDay, end: lastDay })
            const leadingBlanks = mondayFirst(firstDay)

            return (
              <div key={monthStart.toISOString()} className={cn(variant === 'detail' ? 'p-1' : 'bg-white rounded-xl border border-gray-100 p-4')}>
                <p className={cn('text-sm font-semibold mb-3 capitalize', variant === 'detail' ? 'text-[#003366]' : 'text-gray-900')}>
                  {format(monthStart, 'MMMM yyyy', { locale: enUS })}
                </p>

                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before the 1st */}
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
