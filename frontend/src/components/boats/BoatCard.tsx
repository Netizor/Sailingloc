import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Users, Ruler, Star, Anchor } from 'lucide-react'
import { cn, formatPrice } from '../../lib/utils'
import type { Boat } from '../../types'
import Badge from '../ui/Badge'
import { useCompareStore } from '../../store/compare.store'
import { BOAT_TYPE_LABELS } from '../../lib/labels'

interface BoatCardProps {
  boat: Boat
  onFavoriteToggle?: (boatId: number) => void
  isFavorite?: boolean
  className?: string
}

const BoatCard: React.FC<BoatCardProps> = ({
  boat,
  onFavoriteToggle,
  isFavorite = false,
  className,
}) => {
  const mainImage = boat.images?.[0] ?? null

  const typeLabel = BOAT_TYPE_LABELS[boat.type] ?? boat.type

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
        'group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg',
        'border border-gray-100 transition-all duration-200 hover:-translate-y-0.5',
        'dark:bg-gray-800 dark:border-gray-700',
        className
      )}
    >
      <Link to={`/bateaux/${boat.id}`} className="block focus:outline-none focus:ring-2 focus:ring-ocean-500 rounded-2xl">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {mainImage ? (
            <img
              src={mainImage}
              alt={boat.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
              <Anchor size={40} className="text-blue-200 mb-2" strokeWidth={1.5} />
              <span className="text-xs text-blue-300 font-medium">Aucune photo</span>
            </div>
          )}

          {/* Top row badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge variant="info" size="sm">
              {typeLabel}
            </Badge>
            {boat.withSkipper && (
              <Badge variant="success" size="sm">
                Avec skipper
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isFavorite}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-orange-400',
              isFavorite
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:text-orange-500 hover:bg-white shadow dark:bg-gray-800/80 dark:text-gray-300'
            )}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          {/* Bouton comparateur — coin bas gauche */}
          <button
            onClick={handleCompareClick}
            aria-label={isCompared ? 'Retirer du comparateur' : 'Ajouter au comparateur'}
            aria-pressed={isCompared}
            disabled={!isCompared && !canAddMore}
            className={cn(
              'absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-ocean-400',
              isCompared
                ? 'bg-ocean-600 text-white shadow-md'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow dark:bg-gray-800/80 dark:text-gray-300',
              !isCompared && !canAddMore && 'opacity-40 cursor-not-allowed',
            )}
          >
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => {}} // Le clic est géré par le bouton parent
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none accent-ocean-600 h-3 w-3"
            />
            Comparer
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Location */}
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs mb-1.5">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">
              {boat.port}{boat.city ? `, ${boat.city}` : ''}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-snug mb-2 line-clamp-1 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
            {boat.title}
          </h3>

          {/* Specs row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-gray-400" />
              {boat.capacity} pers.
            </span>
            {boat.length && (
              <span className="flex items-center gap-1">
                <Ruler size={12} className="text-gray-400" />
                {boat.length} m
              </span>
            )}
            {!boat.withSkipper && (
              <span className="text-gray-400 italic text-xs">Sans skipper</span>
            )}
          </div>

          {/* Rating + price row */}
          <div className="flex items-center justify-between">
            {/* Stars */}
            <div className="flex items-center gap-1">
              {boat.rating != null && boat.rating > 0 ? (
                <>
                  <Star
                    size={13}
                    className="text-amber-400"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {boat.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({boat.reviewCount ?? 0})
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">Pas encore noté</span>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              <span className="text-lg font-bold text-orange-500">
                {formatPrice(boat.dailyRate)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500"> /jour</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default BoatCard
export type { BoatCardProps }
