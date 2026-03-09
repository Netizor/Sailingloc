import React from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import { BOAT_TYPE_LABELS } from '../../lib/labels'

export interface BoatFilterValues {
  types: string[]
  minPrice: number | ''
  maxPrice: number | ''
  withSkipper: boolean | null
  sortBy: SortOption
}

type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'created_desc'
  | ''

const defaultFilters: BoatFilterValues = {
  types: [],
  minPrice: '',
  maxPrice: '',
  withSkipper: null,
  sortBy: '',
}


interface BoatFiltersProps {
  filters: BoatFilterValues
  onChange: (filters: BoatFilterValues) => void
  className?: string
}

const BoatFilters: React.FC<BoatFiltersProps> = ({ filters, onChange, className }) => {
  const { t } = useTranslation()

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: '', label: t('filters.relevance') },
    { value: 'price_asc', label: t('filters.priceAsc') },
    { value: 'price_desc', label: t('filters.priceDesc') },
    { value: 'rating_desc', label: t('filters.topRated') },
    { value: 'created_desc', label: t('filters.newest') },
  ]

  const handleTypeToggle = (value: string) => {
    const updated = filters.types.includes(value)
      ? filters.types.filter((t) => t !== value)
      : [...filters.types, value]
    onChange({ ...filters, types: updated })
  }

  const handleReset = () => onChange(defaultFilters)

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.withSkipper !== null ||
    filters.sortBy !== ''

  return (
    <aside
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-6',
        'dark:bg-gray-800 dark:border-gray-700',
        className
      )}
      aria-label={t('filters.title')}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
          <SlidersHorizontal size={16} className="text-ocean-600" />
          {t('filters.title')}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-ocean-600 hover:text-ocean-800 transition-colors font-medium"
          >
            <RotateCcw size={12} />
            {t('filters.reset')}
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title={t('filters.sortBy')}>
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SortOption })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Boat types */}
      <FilterSection title={t('filters.boatType')}>
        <div className="flex flex-col gap-2">
          {(Object.entries(BOAT_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.types.includes(value)}
                onChange={() => handleTypeToggle(value)}
                className="h-5 w-5 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title={t('filters.pricePerDay')}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('filters.min')}</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minPrice: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <span className="text-gray-300 dark:text-gray-600 mt-4">—</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{t('filters.max')}</label>
            <input
              type="number"
              min={0}
              placeholder="∞"
              value={filters.maxPrice}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxPrice: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </div>
      </FilterSection>

      {/* With skipper */}
      <FilterSection title={t('filters.skipper')}>
        <div className="flex flex-col gap-2">
          {[
            { value: null, label: t('filters.skipperAny') },
            { value: true, label: t('filters.skipperWith') },
            { value: false, label: t('filters.skipperWithout') },
          ].map((opt) => (
            <label
              key={String(opt.value)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="skipper"
                checked={filters.withSkipper === opt.value}
                onChange={() => onChange({ ...filters, withSkipper: opt.value })}
                className="h-4 w-4 border-gray-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {hasActiveFilters && (
        <Button variant="secondary" size="sm" onClick={handleReset} fullWidth>
          <RotateCcw size={14} />
          {t('filters.resetAll')}
        </Button>
      )}
    </aside>
  )
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </h3>
    {children}
  </div>
)

export default BoatFilters
export { defaultFilters }
export type { SortOption }
