import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar, Users, Search, Ship, Anchor, Globe2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import { BoatType } from '../../types'
import { BOAT_TYPE_LABELS } from '../../lib/labels'
import { autocompleteLocation, type LocationSuggestion } from '../../api/boats.api'

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

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  city: 'Ville',
  port: 'Port',
  country: 'Pays',
}

const SuggestionIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'port') return <Anchor size={14} className="text-gray-400 flex-shrink-0" />
  if (type === 'country') return <Globe2 size={14} className="text-gray-400 flex-shrink-0" />
  return <MapPin size={14} className="text-gray-400 flex-shrink-0" />
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  defaultValues = {},
  compact = false,
  hero = false,
  listing = false,
  className,
}) => {
  const { t } = useTranslation()
  const [location, setLocation] = useState(defaultValues.location ?? '')
  const [startDate, setStartDate] = useState(defaultValues.startDate ?? '')
  const [endDate, setEndDate] = useState(defaultValues.endDate ?? '')
  const [capacity, setCapacity] = useState<number | ''>(defaultValues.capacity ?? '')
  const [boatType, setBoatType] = useState(defaultValues.boatType ?? '')

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setLocation(defaultValues.location ?? '')
    setStartDate(defaultValues.startDate ?? '')
    setEndDate(defaultValues.endDate ?? '')
    setCapacity(defaultValues.capacity ?? '')
    setBoatType(defaultValues.boatType ?? '')
  }, [
    defaultValues.location,
    defaultValues.startDate,
    defaultValues.endDate,
    defaultValues.capacity,
    defaultValues.boatType,
  ])

  const fetchSuggestions = useCallback((value: string) => {
    clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await autocompleteLocation(value)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
        setHighlightIndex(-1)
      } catch {
        // silent fail
      }
    }, 300)
  }, [])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    fetchSuggestions(value)
  }

  const selectSuggestion = (label: string) => {
    setLocation(label)
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightIndex(-1)
  }

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && highlightIndex >= 0 && showSuggestions) {
      e.preventDefault()
      selectSuggestion(suggestions[highlightIndex].label)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const SuggestionDropdown: React.FC<{ dark?: boolean }> = ({ dark }) =>
    showSuggestions && suggestions.length > 0 ? (
      <ul
        role="listbox"
        className={cn(
          'absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-lg border overflow-hidden',
          dark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        )}
      >
        {suggestions.map((s, i) => (
          <li
            key={`${s.label}-${i}`}
            role="option"
            aria-selected={i === highlightIndex}
            onMouseDown={() => selectSuggestion(s.label)}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm select-none',
              i === highlightIndex
                ? 'bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300'
                : dark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <SuggestionIcon type={s.type} />
            <span className="flex-1">{s.label}</span>
            <span className="text-xs text-gray-400">{SUGGESTION_TYPE_LABELS[s.type] ?? s.type}</span>
          </li>
        ))}
      </ul>
    ) : null

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
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
        aria-label={t('searchBar.searchBoat')}
      >
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="relative flex-1 flex items-center gap-3 px-4 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-100">
            <MapPin size={18} className="text-brand-blue flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-slate mb-0.5">
                {t('searchBar.location')}
              </span>
              <input
                type="text"
                placeholder={t('searchBar.locationPlaceholderListing')}
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
                className="w-full text-sm font-medium text-brand-navy placeholder:text-brand-muted bg-transparent border-none outline-none"
              />
            </div>
            <SuggestionDropdown />
          </div>

          <div className="flex-1 flex items-center gap-3 px-4 py-3 md:py-2.5 border-b md:border-b-0 md:border-r border-gray-100">
            <Calendar size={18} className="text-brand-blue flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
              <div className="relative text-left">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-slate mb-0.5">
                  {t('searchBar.departure')}
                </span>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (endDate && e.target.value > endDate) setEndDate('')
                  }}
                  className={cn(
                    'w-full text-sm font-medium bg-transparent border-none outline-none cursor-pointer',
                    startDate ? 'text-brand-navy' : 'text-brand-muted'
                  )}
                />
              </div>
              <div className="relative text-left">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-slate mb-0.5">
                  {t('searchBar.return')}
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(
                    'w-full text-sm font-medium bg-transparent border-none outline-none cursor-pointer',
                    endDate ? 'text-brand-navy' : 'text-brand-muted'
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-4 py-3 md:py-2.5">
            <Ship size={18} className="text-brand-blue flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-slate mb-0.5">
                {t('searchBar.type')}
              </span>
              <select
                value={boatType}
                onChange={(e) => setBoatType(e.target.value)}
                className={cn(
                  'w-full text-sm font-medium bg-transparent border-none outline-none cursor-pointer appearance-none',
                  boatType ? 'text-brand-navy' : 'text-brand-muted'
                )}
              >
                <option value="">{t('searchBar.typePlaceholderListing')}</option>
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
              aria-label={t('common.search')}
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
        aria-label={t('searchBar.quickSearch')}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
          <MapPin size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={t('searchBar.portOrCity')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            autoComplete="off"
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
          'w-full min-w-0 bg-white dark:bg-gray-900 rounded-2xl md:rounded-full',
          'border border-gray-200 dark:border-gray-600',
          'shadow-[0_8px_32px_rgba(0,0,0,0.18)] p-1.5 max-w-3xl mx-auto',
          className
        )}
        aria-label={t('searchBar.searchBoat')}
      >
        <div className="flex flex-col md:flex-row md:items-center min-w-0">
          <div className="relative flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2 md:py-1.5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600">
            <MapPin size={16} className="text-brand-blue flex-shrink-0" strokeWidth={1.5} aria-hidden />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-brand-slate dark:text-gray-200 mb-0.5">
                {t('searchBar.destinations')}
              </span>
              <input
                type="text"
                placeholder={t('searchBar.whereGoing')}
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
                className="w-full min-w-0 text-[13px] font-medium text-brand-navy dark:text-white placeholder:text-brand-muted dark:placeholder:text-gray-400 bg-transparent border-none outline-none"
              />
            </div>
            <SuggestionDropdown />
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2 md:py-1.5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600">
            <Calendar size={16} className="text-brand-blue flex-shrink-0" strokeWidth={1.5} aria-hidden />
            <div className="flex-1 min-w-0 text-left relative">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-brand-slate dark:text-gray-200 mb-0.5">
                {t('searchBar.dates')}
              </span>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  'w-full max-w-full min-w-0 text-[13px] font-medium bg-transparent border-none outline-none cursor-pointer relative z-10',
                  startDate ? 'text-brand-navy dark:text-white' : 'text-transparent'
                )}
              />
              {!startDate && (
                <span className="absolute left-0 bottom-0 text-[13px] font-medium text-brand-muted dark:text-gray-300 pointer-events-none truncate max-w-full">
                  {t('searchBar.whenLeaving')}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2 md:py-1.5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600">
            <Ship size={16} className="text-brand-blue flex-shrink-0" strokeWidth={1.5} aria-hidden />
            <div className="flex-1 min-w-0 text-left">
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-brand-slate dark:text-gray-200 mb-0.5">
                {t('searchBar.type')}
              </span>
              <select
                value={boatType}
                onChange={(e) => setBoatType(e.target.value)}
                className={cn(
                  'w-full min-w-0 text-[13px] font-medium bg-transparent border-none outline-none cursor-pointer appearance-none',
                  boatType ? 'text-brand-navy dark:text-white' : 'text-brand-muted dark:text-gray-300'
                )}
              >
                <option value="">{t('searchBar.allBoats')}</option>
                {BOAT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {BOAT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-stretch md:items-center p-1 md:pl-0 md:pr-0.5 shrink-0">
            <button
              type="submit"
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-blue hover:bg-ocean-600 text-white font-semibold rounded-xl md:rounded-full whitespace-nowrap text-[13px] shadow-md"
            >
              <Search size={15} strokeWidth={2.5} aria-hidden />
              {t('searchBar.explore')}
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
      aria-label={t('searchBar.searchBoat')}
    >
      <div className="flex flex-col sm:flex-row items-stretch gap-1">
        <div className="relative flex-1 flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-text group">
          <MapPin size={18} className="text-brand-blue flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
              {t('searchBar.portCity')}
            </label>
            <input
              type="text"
              placeholder={t('searchBar.portCityPlaceholder')}
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
              className="w-full text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent border-none outline-none"
            />
          </div>
          <SuggestionDropdown dark />
        </div>

        <Divider />

        <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Calendar size={18} className="text-brand-blue flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
              {t('searchBar.departure')}
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
              {t('searchBar.return')}
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
              {t('searchBar.people')}
            </label>
            <select
              value={capacity}
              onChange={(e) =>
                setCapacity(e.target.value === '' ? '' : parseInt(e.target.value))
              }
              className="w-full text-sm text-gray-800 bg-transparent border-none outline-none cursor-pointer appearance-none"
            >
              <option value="">{t('searchBar.all')}</option>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {t('searchBar.peopleCount', { count: n })}
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
            {t('common.search')}
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
