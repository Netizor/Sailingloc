import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, BedDouble } from 'lucide-react'
import { formatPrice } from '../../lib/utils'
import type { Boat } from '../../types'

interface FeaturedBoatCardProps {
  boat: Boat
  image?: string
  badge?: 'PREMIUM' | 'NOUVEAU' | 'EXEMPLE'
  /** Bateau de démonstration : redirige vers la recherche au lieu de la fiche */
  isDemo?: boolean
}

const FeaturedBoatCard: React.FC<FeaturedBoatCardProps> = ({ boat, image, badge, isDemo = false }) => {
  const mainImage = image ?? boat.images?.[0] ?? null
  const location = boat.city ? `${boat.port}, ${boat.city}` : boat.port
  const linkTo = isDemo ? '/bateaux' : `/bateaux/${boat.id}`

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <Link to={linkTo} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {mainImage ? (
            <img
              src={mainImage}
              alt={boat.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
          {badge && (
            <span className="absolute top-3 right-3 bg-white/90 text-brand-navy text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md">
              {badge}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-serif font-bold text-brand-navy text-lg leading-snug line-clamp-1">
              {boat.title}
            </h3>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">À partir de</p>
              <p className="text-brand-navy leading-none">
                <span className="text-lg font-bold">{formatPrice(boat.dailyRate)}</span>
                <span className="text-xs text-brand-slate"> /jour</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-brand-slate text-sm mb-5">
            <MapPin size={14} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{location}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-brand-slate">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              {boat.capacity} pers.
            </span>
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-gray-400" />
              {boat.cabins} cabines
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default FeaturedBoatCard
