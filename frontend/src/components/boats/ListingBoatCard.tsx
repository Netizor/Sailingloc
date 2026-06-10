import React from 'react'
import { Link } from 'react-router-dom'
import { Star, Anchor, UserCheck, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Boat } from '../../types'
import { BOAT_TYPE_LABELS } from '../../lib/labels'
import { BoatType } from '../../types'

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
  const isFavorite = (boat.rating ?? 0) >= 4.9
  const showPremiumService = boat.type === BoatType.YACHT

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

          {boat.rating != null && boat.rating > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 text-[#003366] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <Star size={12} fill="#f59e0b" strokeWidth={0} className="text-amber-400" />
              {boat.rating.toFixed(1)}
            </span>
          )}

          {isFavorite && (
            <span className="absolute bottom-3 left-3 bg-[#006875] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
              Coup de coeur
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
              <span className="text-xs text-[#334155]"> /jour</span>
            </div>
          </div>

          <p className="text-xs text-[#8A94A6] mb-3">
            {typeLabel} • {boat.capacity} pers. • {location}
          </p>

          {(boat.withSkipper || showPremiumService) && (
            <div className="flex items-center gap-1.5 pt-1">
              {boat.withSkipper && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#006875]">
                  <UserCheck size={12} strokeWidth={2.5} color="#006875" />
                  Skipper professionnel inclus
                </span>
              )}
              {showPremiumService && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#2563FF]">
                  <Sparkles size={12} strokeWidth={2.5} color="#2563FF" />
                  Service de bord premium
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

export default ListingBoatCard
