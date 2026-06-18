import { format, addMonths } from 'date-fns'
import api from '../lib/axios'
import type { Availability, AvailabilityUpdateData } from '../types'

interface AvailabilityQueryParams {
  startDate: string
  endDate: string
}

interface BulkAvailabilityUpdateData {
  periods: AvailabilityUpdateData[]
}

interface DayStatus {
  date: string // YYYY-MM-DD
  status: 'available' | 'unavailable' | 'booked'
}

/**
 * Fetch the availability calendar for a boat within a date range.
 * Returns an array of availability periods (blocked and open intervals).
 * This endpoint is public - it is used on the boat detail and booking pages.
 */
export const getAvailability = async (
  boatId: number,
  params: AvailabilityQueryParams,
): Promise<Availability[]> => {
  const { data } = await api.get<Availability[]>(`/availability/${boatId}`, { params })
  return data
}

/**
 * Create or update one or more availability periods for a boat.
 * Owners use this to block dates (maintenance, personal use, etc.)
 * or to re-open previously blocked periods.
 * Periods that overlap existing records are merged server-side.
 */
export const updateAvailability = async (
  boatId: number,
  payload: BulkAvailabilityUpdateData,
): Promise<Availability[]> => {
  const { data } = await api.put<Availability[]>(`/availability/${boatId}`, payload)
  return data
}

export const availabilityApi = {
  /**
   * Fetch availability for a boat (6-month window from today).
   * Returns { booked, unavailable, available } date string arrays.
   */
  getBoatAvailability: async (boatId: number) => {
    const from = format(new Date(), 'yyyy-MM-dd')
    const to = format(addMonths(new Date(), 6), 'yyyy-MM-dd')
    const { data } = await api.get<{ availability: Array<{ date: string; isAvailable: boolean; bookingId?: string | null }> }>(
      `/availability/${boatId}`,
      { params: { from, to } },
    )
    const list: Array<{ date: string; isAvailable: boolean; bookingId?: string | null }> =
      (data as any).availability ?? data ?? []
    const booked: string[] = []
    const unavailable: string[] = []
    const available: string[] = []
    for (const item of list) {
      const d = typeof item.date === 'string' ? item.date.slice(0, 10) : item.date
      if (item.bookingId) {
        booked.push(d)
      } else if (!item.isAvailable) {
        unavailable.push(d)
      } else {
        available.push(d)
      }
    }
    return { booked, unavailable, available }
  },

  /**
   * Save a list of day-status changes.
   * Groups by status and sends two requests (available / unavailable) as needed.
   */
  setAvailability: async (boatId: number, days: DayStatus[]) => {
    const availableDates = days.filter((d) => d.status === 'available').map((d) => d.date)
    const unavailableDates = days.filter((d) => d.status === 'unavailable').map((d) => d.date)
    const requests: Promise<any>[] = []
    if (availableDates.length > 0) {
      requests.push(api.post(`/availability/${boatId}`, { dates: availableDates, isAvailable: true }))
    }
    if (unavailableDates.length > 0) {
      requests.push(api.post(`/availability/${boatId}`, { dates: unavailableDates, isAvailable: false }))
    }
    await Promise.all(requests)
  },
}
