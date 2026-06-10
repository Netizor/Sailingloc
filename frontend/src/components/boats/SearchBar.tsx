import React, { useState } from 'react'
import { MapPin, Calendar, Users, Search, Ship } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import { BoatType } from '../../types'
import { BOAT_TYPE_LABELS } from '../../lib/labels'

export interface SearchParams {
  location: string
  startDate: string
  endDate: string
  capacity: number | ''
  boatType?: string
}

interface SearchBarProps {
  onSearch: (params: SearchParams) => void
  defaultValues?: Partial<SearchParams>
  compact?: boolean
  hero?: boolean
  listing?: boolean
  className?: string
}

const BOAT_TYPE_OPTIONS = Object.values(BoatType)

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  defaultValues = {},
  compact = false,
  hero = false,
  listing = false,
  className,
}) => {
  const [location, setLocation] = useState(defaultValues.location ?? '')
  const [startDate, setStartDate] = useState(defaultValues.startDate ?? '')
  const [endDate, setEndDate] = useState(defaultValues.endDate ?? '')
  const [capacity, setCapacity] = useState<number | ''>(defaultValues.capacity ?? '')
  const [boatType, setBoatType] = useState(defaultValues.boatType ?? '')

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({ location, startDate, endDate, capacity, boatType: boatType || undefined })
  }

  if (listing) {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,51,102,0.10)] border border-gray-100 p-2',
          className
        )}
        aria-label="Rechercher un bateau"
      >
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-100">
            <MapPin size={18} className="text-[#8A94A6] flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A94A6] mb-0.5">
                Lieu
              </span>
              <input
                type="text"
                placeholder="Où naviguez-vous ?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm text-[#334155] placeholder:text-[#8A94A6] bg-transparent border-none outline-none"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-4 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-100">
            <Calendar size={18} className="text-[#8A94A6] flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left relative">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A94A6] mb-0.5">
                Dates
              </span>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  'w-full text-sm bg-transparent border-none outline-none cursor-pointer relative z-10',
                  startDate ? 'text-[#334155]' : 'text-transparent'
                )}
              />
              {!startDate && (
                <span className="absolute left-0 bottom-0 text-sm text-[#8A94A6] pointer-events-none">
                  Ajouter dates
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-4 py-3 md:py-2.5">
            <Ship size={18} className="text-[#8A94A6] flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A94A6] mb-0.5">
                Type
              </span>
              <select
                value={boatType}
                onChange={(e) => setBoatType(e.target.value)}
                className={cn(
                  'w-full text-sm bg-transparent border-none outline-none cursor-pointer appearance-none',
                  boatType ? 'text-[#334155]' : 'text-[#8A94A6]'
                )}
              >
                <option value="">Catamaran, Voilier...</option>
                {BOAT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {BOAT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center p-2 md:pl-0">
            <button
              type="submit"
              className="sl-btn-navy w-12 h-12 flex items-center justify-center rounded-full shadow-md transition-colors flex-shrink-0"
              aria-label="Rechercher"
            >
              <Search size={20} strokeWidth={2.5} color="#ffffff" />
            </button>
          </div>
        </div>
      </form>
    )
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

  if (hero) {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'bg-white rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.14)] p-1.5 max-w-5xl mx-auto',
          className
        )}
        aria-label="Rechercher un bateau"
      >
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex-1 flex items-center gap-3 px-5 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-200">
            <MapPin size={18} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-0.5">
                Destinations
              </span>
              <input
                type="text"
                placeholder="Où allez-vous ?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm text-brand-slate placeholder:text-gray-400 bg-transparent border-none outline-none"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-5 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-200">
            <Calendar size={18} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left relative">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-0.5">
                Dates
              </span>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  'w-full text-sm bg-transparent border-none outline-none cursor-pointer relative z-10',
                  startDate ? 'text-brand-slate' : 'text-transparent'
                )}
              />
              {!startDate && (
                <span className="absolute left-0 bottom-0 text-sm text-gray-400 pointer-events-none">
                  Quand partir ?
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-5 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-200">
            <Ship size={18} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-0.5">
                Type
              </span>
              <select
                value={boatType}
                onChange={(e) => setBoatType(e.target.value)}
                className={cn(
                  'w-full text-sm bg-transparent border-none outline-none cursor-pointer appearance-none',
                  boatType ? 'text-brand-slate' : 'text-gray-400'
                )}
              >
                <option value="">Tous les bateaux</option>
                {BOAT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {BOAT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center p-1 md:pl-0 md:pr-1">
            <button
              type="submit"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#003366] text-white font-medium rounded-full whitespace-nowrap text-sm"
            >
              <Search size={16} strokeWidth={2} />
              explorer
            </button>
          </div>
        </div>
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
        <div className="flex-1 flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-text group">
          <MapPin size={18} className="text-brand-blue flex-shrink-0" />
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

        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Calendar size={18} className="text-brand-blue flex-shrink-0" />
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

        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Calendar size={18} className="text-brand-blue flex-shrink-0" />
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

        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Users size={18} className="text-brand-blue flex-shrink-0" />
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

        <div className="flex items-center px-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="whitespace-nowrap rounded-xl px-6 bg-brand-navy hover:bg-ocean-800"
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
