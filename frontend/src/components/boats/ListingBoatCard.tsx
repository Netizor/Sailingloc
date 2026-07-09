import React from 'react'
import { Link } from 'react-router-dom'
import { Star, Anchor, UserCheck, Sparkles, Sailboat } from 'lucide-react'
import { cn } from '../../lib/utils'
import { INLINE_SEP } from '../../lib/typography'
import type { Boat } from '../../types'
import { BOAT_TYPE_LABELS } from '../../lib/labels'
import { BoatType } from '../../types'
import FavoriteButton from './FavoriteButton'

interface ListingBoatCardProps {
  boat: Boat
  className?: string
}

const formatDailyPrice = (amount: number) =>
  `${Math.round(amount).toLocaleString('fr-FR')}€`

const ListingBoatCard: React.FC<ListingBoatCardProps> = ({ boat, className }) => {
  const mainImage = boat.images?.[0] ?? null
  const typeLabel = BOAT_TYPE_LABELS[boat.type] ?? boat.type
  const location = boat.city || boat.port
  const isTopRated = (boat.rating ?? 0) >= 4.9
  const showPremiumService = boat.type === BoatType.YACHT

  return (
    <article
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,51,102,0.08)]',
        'border border-gray-100 dark:border-gray-700 transition-shadow duration-200',
        'hover:shadow-[0_4px_20px_rgba(0,51,102,0.12)] dark:hover:shadow-lg',
        className,
      )}
    >
      <Link to={`/bateaux/${boat.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {mainImage ? (
            <img
              src={mainImage}
              alt={boat.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100 dark:from-gray-700 dark:to-gray-800">
              <Anchor size={36} className="text-brand-blue/40" strokeWidth={1.5} />
            </div>
          )}

          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton boatId={boat.id} size="sm" />
          </div>

          {boat.rating != null && boat.rating > 0 && (
            <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 dark:bg-gray-800/95 text-brand-navy dark:text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <Star size={12} fill="#f59e0b" strokeWidth={0} className="text-amber-400" />
              {boat.rating.toFixed(1)}
            </span>
          )}

          {isTopRated && (
            <span className="absolute bottom-3 left-3 bg-brand-teal dark:bg-teal-800 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
              Coup de coeur
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-semibold text-brand-navy dark:text-white text-[15px] leading-snug line-clamp-1">
              {boat.title}
            </h3>
            <div className="text-right flex-shrink-0">
              <span className="text-base font-bold text-brand-navy dark:text-white">{formatDailyPrice(boat.dailyRate)}</span>
              <span className="text-xs text-brand-slate dark:text-gray-400"> /jour</span>
            </div>
          </div>

          <p className="text-xs text-brand-muted dark:text-gray-400 mb-3">
            {typeLabel}{INLINE_SEP}{boat.capacity} pers.{INLINE_SEP}{location}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {boat.withSkipper ? (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-teal dark:text-teal-300">
                <UserCheck size={12} strokeWidth={2.5} />
                Skipper professionnel inclus
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-muted dark:text-gray-400">
                <Sailboat size={12} strokeWidth={2.5} />
                Sans skipper
              </span>
            )}
            {showPremiumService && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-blue dark:text-blue-300">
                <Sparkles size={12} strokeWidth={2.5} />
                Service de bord premium
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}

export default ListingBoatCard
