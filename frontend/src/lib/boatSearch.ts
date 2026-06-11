import type { Boat, BoatType } from '../types'
import { BoatType as BoatTypeEnum } from '../types'

export type BoatSortValue = 'price_asc' | 'price_desc' | 'rating_desc' | 'created_desc'

export interface BoatSearchFilters {
  location?: string
  type?: BoatType | ''
  startDate?: string
  endDate?: string
  capacity?: number
}

const TYPE_VALUES = new Set<string>(Object.values(BoatTypeEnum))

export function parseTypeParam(value: string | null): BoatType | '' {
  if (!value || !TYPE_VALUES.has(value)) return ''
  return value as BoatType
}

export function filterBoatsLocally(boats: Boat[], filters: BoatSearchFilters): Boat[] {
  let result = [...boats]

  if (filters.type) {
    result = result.filter((b) => b.type === filters.type)
  }

  if (filters.location?.trim()) {
    const q = filters.location.toLowerCase().trim()
    result = result.filter(
      (b) =>
        b.port.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q)
    )
  }

  if (filters.capacity && filters.capacity > 0) {
    result = result.filter((b) => b.capacity >= filters.capacity!)
  }

  return result
}

export function sortBoats(boats: Boat[], sortBy: BoatSortValue): Boat[] {
  return [...boats].sort((a, b) => {
    switch (sortBy) {
      case 'price_desc':
        return b.dailyRate - a.dailyRate
      case 'rating_desc':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'created_desc':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      default:
        return a.dailyRate - b.dailyRate
    }
  })
}
