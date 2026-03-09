import React, { useState } from 'react'
import { MapPin, Calendar, Users, Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'

export interface SearchParams {
  location: string
  startDate: string
  endDate: string
  capacity: number | ''
}

interface SearchBarProps {
  onSearch: (params: SearchParams) => void
  defaultValues?: Partial<SearchParams>
  compact?: boolean
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  defaultValues = {},
  compact = false,
  className,
}) => {
  const [location, setLocation] = useState(defaultValues.location ?? '')
  const [startDate, setStartDate] = useState(defaultValues.startDate ?? '')
  const [endDate, setEndDate] = useState(defaultValues.endDate ?? '')
  const [capacity, setCapacity] = useState<number | ''>(defaultValues.capacity ?? '')

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({ location, startDate, endDate, capacity })
  }

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm p-1.5',
          'dark:bg-gray-800 dark:border-gray-700',
          className
        )}
        aria-label="Recherche rapide"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
          <MapPin size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Port ou ville"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent border-none outline-none w-full min-w-0"
          />
        </div>
        <Button type="submit" size="sm" variant="primary">
          <Search size={14} />
        </Button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-white rounded-2xl shadow-xl border border-gray-100 p-2',
        'dark:bg-gray-800 dark:border-gray-700',
        className
      )}
      aria-label="Rechercher un bateau"
    >
      <div className="flex flex-col sm:flex-row items-stretch gap-1">
        {/* Location */}
        <div className="flex-1 flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-text group">
          <MapPin size={18} className="text-ocean-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
              Port / Ville
            </label>
            <input
              type="text"
              placeholder="Ex: Marseille, La Rochelle…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent border-none outline-none"
            />
          </div>
        </div>

        <Divider />

        {/* Start date */}
        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Calendar size={18} className="text-ocean-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
              Départ
            </label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate && e.target.value > endDate) setEndDate('')
              }}
              className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none cursor-pointer dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <Divider />

        {/* End date */}
        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Calendar size={18} className="text-ocean-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
              Retour
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none cursor-pointer dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <Divider />

        {/* Capacity */}
        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Users size={18} className="text-ocean-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
              Personnes
            </label>
            <select
              value={capacity}
              onChange={(e) =>
                setCapacity(e.target.value === '' ? '' : parseInt(e.target.value))
              }
              className="w-full text-sm text-gray-800 bg-transparent border-none outline-none cursor-pointer appearance-none"
            >
              <option value="">Tous</option>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n}+ pers.
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center px-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="whitespace-nowrap rounded-xl px-6"
            leftIcon={<Search size={18} />}
          >
            Rechercher
          </Button>
        </div>
      </div>
    </form>
  )
}

const Divider: React.FC = () => (
  <div
    className="hidden sm:block w-px bg-gray-200 dark:bg-gray-700 self-stretch my-2 flex-shrink-0"
    aria-hidden="true"
  />
)

export default SearchBar
export type { SearchBarProps }
