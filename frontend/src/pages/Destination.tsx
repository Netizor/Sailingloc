import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { MapPin, LayoutGrid, Map as MapIcon, Anchor } from 'lucide-react'
import { boatsApi } from '../api/boats.api'
import type { Boat } from '../types'
import BoatCard from '../components/boats/BoatCard'
import MapView from '../components/boats/MapView'
import Pagination from '../components/ui/Pagination'
import Spinner from '../components/ui/Spinner'
import {
  getDestinationSearchParams,
  resolveDestinationSlug,
  type DestinationDef,
} from '../data/destinations'

const PAGE_SIZE = 12

function destinationLabel(def: DestinationDef, lang: string): string {
  return lang.startsWith('en') ? def.nameEn : def.name
}

function destinationSubregions(def: DestinationDef, lang: string): string {
  return lang.startsWith('en') ? def.subregionsEn : def.subregions
}

function destinationImage(def: DestinationDef): string {
  return def.image
}

const Destination: React.FC = () => {
  const { port: slug } = useParams<{ port: string }>()
  const { i18n, t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  const destination = slug ? resolveDestinationSlug(slug) : null
  const searchParams = destination ? getDestinationSearchParams(destination) : {}
  const displayName = destination ? destinationLabel(destination, i18n.language) : ''
  const heroImage = destination ? destinationImage(destination) : '/view-luxurious-yacht-water.jpg'
  const subregions = destination ? destinationSubregions(destination, i18n.language) : ''

  const { data, isLoading } = useQuery({
    queryKey: ['boats', 'destination', slug, searchParams, currentPage],
    queryFn: () =>
      boatsApi.search({
        ...searchParams,
        page: currentPage,
        limit: PAGE_SIZE,
      }),
    enabled: Boolean(slug && destination),
    staleTime: 5 * 60 * 1000,
  })

  const boats: Boat[] = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (!destination) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Helmet>
        <title>
          {t('destinations.boats', { count: total })} {displayName} | SailingLoc
        </title>
        <meta
          name="description"
          content={`Louez un bateau en ${displayName}. ${total > 0 ? `${total} bateaux disponibles` : 'Explorez les offres'} sur SailingLoc.`}
        />
      </Helmet>

      <div className="relative bg-ocean-700 text-white overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          loading="eager"
        />
        <div className="relative max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-ocean-200 text-sm mb-2 flex items-center gap-1">
            <Link to="/destinations" className="hover:text-white transition-colors">
              {t('destinations.title')}
            </Link>
            {' / '}
            {displayName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <MapPin size={30} />
            {displayName}
          </h1>
          {subregions && (
            <p className="text-ocean-100/90 mt-2 text-sm sm:text-base">{subregions}</p>
          )}
          {!isLoading && (
            <p className="text-ocean-200 mt-2">
              {t('destinations.boats', { count: total })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-ocean-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <LayoutGrid size={13} /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-ocean-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
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
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t('destinations.noBoats', { name: displayName })}
            </p>
            <Link
              to="/bateaux"
              className="text-sm text-ocean-700 dark:text-ocean-400 hover:underline font-medium"
            >
              {t('home.seeAllBoats')} →
            </Link>
          </div>
        ) : viewMode === 'map' ? (
          <MapView
            boats={boats}
            className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm h-[500px]"
          />
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
                  onPageChange={(p) => {
                    setCurrentPage(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
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
