import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { boatsApi } from '../../api/boats.api'
import type { Boat, BoatType } from '../../types'
import BoatCard from './BoatCard'

interface SimilarBoatsProps {
  currentBoatId: number
  boatType: BoatType
}

const SimilarBoats: React.FC<SimilarBoatsProps> = ({ currentBoatId, boatType }) => {
  const { data } = useQuery({
    queryKey: ['boats', 'similar', boatType, currentBoatId],
    queryFn: () => boatsApi.search({ types: [boatType], limit: 5 }),
    staleTime: 5 * 60 * 1000,
  })

  // Exclure le bateau courant et limiter à 4 résultats
  const similar: Boat[] = (data?.data ?? [])
    .filter((b) => b.id !== currentBoatId)
    .slice(0, 4)

  if (similar.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Vous aimerez aussi</h2>
        <Link
          to={`/bateaux?type=${boatType}`}
          className="text-sm text-ocean-700 hover:text-ocean-900 font-medium flex items-center gap-1"
        >
          Voir plus <ChevronRight size={14} />
        </Link>
      </div>

      {/* Carousel horizontal sur mobile, grille sur desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
        {similar.map((boat) => (
          <div key={boat.id} className="flex-shrink-0 w-72 sm:w-auto">
            <BoatCard boat={boat} isFavorite={false} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default SimilarBoats
