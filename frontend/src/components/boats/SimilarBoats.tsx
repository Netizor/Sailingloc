import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { boatsApi } from '../../api/boats.api'
import type { Boat, BoatType } from '../../types'
import ListingBoatCard from './ListingBoatCard'

interface SimilarBoatsProps {
  currentBoatId: number
  boatType: BoatType
  city?: string
}

const SimilarBoats: React.FC<SimilarBoatsProps> = ({ currentBoatId, boatType, city }) => {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['boats', 'similar', boatType, city, currentBoatId],
    queryFn: () =>
      boatsApi.search({
        types: [boatType],
        location: city,
        limit: 8,
        sort: 'rating_desc',
      }),
    staleTime: 5 * 60 * 1000,
  })

  const similar: Boat[] = (data?.data ?? [])
    .filter((b) => b.id !== currentBoatId)
    .slice(0, 4)

  if (similar.length === 0) return null

  return (
    <section className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-700" aria-labelledby="similar-boats-title">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 id="similar-boats-title" className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
            {t('boat.detail.similarBoats')}
          </h2>
          <p className="text-sm text-brand-slate dark:text-gray-400 mt-1">
            {t('boat.detail.similarBoatsSubtitle')}
          </p>
        </div>
        <Link
          to={`/bateaux?type=${boatType}${city ? `&location=${encodeURIComponent(city)}` : ''}`}
          className="hidden sm:flex text-sm text-brand-blue hover:text-ocean-600 dark:hover:text-blue-300 font-medium items-center gap-1 shrink-0"
        >
          {t('boat.detail.similarBoatsSeeAll', { defaultValue: 'Voir plus' })}
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {similar.map((boat) => (
          <ListingBoatCard key={boat.id} boat={boat} />
        ))}
      </div>
    </section>
  )
}

export default SimilarBoats
