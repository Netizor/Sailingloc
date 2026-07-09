import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, Anchor, UserCheck, Sparkles, Sailboat, Heart, GitCompareArrows } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Boat } from '../../types'
import { BOAT_TYPE_LABELS } from '../../lib/labels'
import { BoatType } from '../../types'
import { useCompareStore } from '../../store/compare.store'
import { INLINE_SEP } from '../../lib/typography'

interface ListingBoatCardProps {
  boat: Boat
  className?: string
  isFavorite?: boolean
  onFavoriteToggle?: (boatId: number) => void
}

const formatDailyPrice = (amount: number) =>
  `${Math.round(amount).toLocaleString('fr-FR')}€`

const ListingBoatCard: React.FC<ListingBoatCardProps> = ({
  boat,
  className,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const { t } = useTranslation()
  const mainImage = boat.images?.[0] ?? null
  const typeLabel = BOAT_TYPE_LABELS[boat.type] ?? boat.type
  const location = boat.city || boat.port
  const isTopRated = (boat.rating ?? 0) >= 4.9
  const showPremiumService = boat.type === BoatType.YACHT

  const { ids, add, remove } = useCompareStore()
  const isCompared = ids.includes(boat.id)
  const canAddMore = ids.length < 3

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavoriteToggle?.(boat.id)
  }

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isCompared) {
      remove(boat.id)
    } else if (canAddMore) {
      add(boat.id)
    }
  }

  return (
    <article
      className={cn(
        'group bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,51,102,0.08)]',
        'border border-gray-100 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,51,102,0.12)]',
        className
      )}
    >
      <Link to={`/bateaux/${boat.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {mainImage ? (
            <img
              src={mainImage}
              alt={boat.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
              <Anchor size={36} className="text-blue-200" strokeWidth={1.5} />
            </div>
          )}

          {onFavoriteToggle && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
              aria-pressed={isFavorite}
              className={cn(
                'absolute top-3 left-3 p-2 rounded-full transition-all duration-150 z-10',
                'focus:outline-none focus:ring-2 focus:ring-[#2563FF]',
                isFavorite
                  ? 'bg-[#2563FF] text-white shadow-md'
                  : 'bg-white/90 backdrop-blur-sm text-[#8A94A6] hover:text-[#2563FF] shadow-sm'
              )}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
          )}

          {boat.rating != null && boat.rating > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 text-[#003366] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <Star size={12} fill="#f59e0b" strokeWidth={0} className="text-amber-400" />
              {boat.rating.toFixed(1)}
            </span>
          )}

          <button
            type="button"
            onClick={handleCompareClick}
            aria-label={isCompared ? t('compare.remove') : t('compare.add')}
            aria-pressed={isCompared}
            disabled={!isCompared && !canAddMore}
            className={cn(
              'absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded transition-all duration-150 z-10',
              'focus:outline-none focus:ring-2 focus:ring-[#2563FF]',
              isCompared
                ? 'bg-[#2563FF] text-white shadow-md'
                : 'bg-white/90 backdrop-blur-sm text-[#003366] hover:bg-white shadow-sm',
              !isCompared && !canAddMore && 'opacity-40 cursor-not-allowed'
            )}
          >
            <GitCompareArrows size={12} strokeWidth={2.5} />
            {t('compare.compare')}
          </button>

          {isTopRated && (
            <span className="absolute bottom-3 right-3 bg-[#006875] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
              {t('search.topRated')}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-semibold text-[#003366] text-[15px] leading-snug line-clamp-1">
              {boat.title}
            </h3>
            <div className="text-right flex-shrink-0">
              <span className="text-base font-bold text-[#003366]">{formatDailyPrice(boat.dailyRate)}</span>
              <span className="text-xs text-[#334155]"> {t('search.perDay')}</span>
            </div>
          </div>

          <p className="text-xs text-[#8A94A6] mb-3">
            {typeLabel}{INLINE_SEP}{boat.capacity} {t('search.persons')}{INLINE_SEP}{location}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {boat.withSkipper ? (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#006875]">
                <UserCheck size={12} strokeWidth={2.5} color="#006875" />
                {t('search.withSkipperIncluded')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#8A94A6]">
                <Sailboat size={12} strokeWidth={2.5} color="#8A94A6" />
                {t('search.withoutSkipper')}
              </span>
            )}
            {showPremiumService && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#2563FF]">
                <Sparkles size={12} strokeWidth={2.5} color="#2563FF" />
                {t('search.premiumService')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}

export default ListingBoatCard
