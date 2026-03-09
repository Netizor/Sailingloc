import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, LayoutGrid, Map as MapIcon, Anchor } from 'lucide-react'
import { boatsApi } from '../api/boats.api'
import type { Boat } from '../types'
import BoatCard from '../components/boats/BoatCard'
import MapView from '../components/boats/MapView'
import Pagination from '../components/ui/Pagination'
import Spinner from '../components/ui/Spinner'

const PAGE_SIZE = 12

const Destination: React.FC = () => {
  const { port } = useParams<{ port: string }>()
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  // Décode les caractères spéciaux de l'URL (ex: saint-tropez → Saint-Tropez)
  const portName = port ? decodeURIComponent(port.replace(/-/g, ' ')) : ''
  const portDisplay = portName.replace(/\b\w/g, (l) => l.toUpperCase())

  const { data, isLoading } = useQuery({
    queryKey: ['boats', 'destination', portName, currentPage],
    queryFn: () => boatsApi.search({ location: portName, page: currentPage, limit: PAGE_SIZE }),
    staleTime: 5 * 60 * 1000,
  })

  const boats: Boat[] = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Helmet>
        <title>Bateaux à {portDisplay} — SailingLoc</title>
        <meta name="description" content={`Louez un bateau à ${portDisplay}. ${total > 0 ? `${total} bateaux disponibles` : 'Explorez les offres de location'} sur SailingLoc.`} />
        <meta property="og:title" content={`Bateaux à ${portDisplay} — SailingLoc`} />
        <meta property="og:description" content={`Location de bateaux à ${portDisplay} entre particuliers.`} />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Hero */}
      <div className="bg-ocean-700 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-ocean-200 text-sm mb-2 flex items-center gap-1">
            <Link to="/destinations" className="hover:text-white transition-colors">
              Destinations
            </Link>
            {' / '}
            {portDisplay}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <MapPin size={30} />
            {portDisplay}
          </h1>
          {!isLoading && (
            <p className="text-ocean-200 mt-2">
              {total} bateau{total > 1 ? 'x' : ''} disponible{total > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toggle vue */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-ocean-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <LayoutGrid size={13} /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'map' ? 'bg-ocean-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <MapIcon size={13} /> Carte
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : boats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Anchor size={40} strokeWidth={1.5} className="text-gray-200 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun bateau disponible à {portDisplay}.</p>
            <Link to="/bateaux" className="text-sm text-ocean-700 dark:text-ocean-400 hover:underline font-medium">
              Voir tous les bateaux →
            </Link>
          </div>
        ) : viewMode === 'map' ? (
          <MapView boats={boats} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm h-[500px]" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {boats.map((boat) => (
                <BoatCard key={boat.id} boat={boat} isFavorite={false} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Destination
