import React, { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Anchor, ChevronDown, LayoutGrid, Ship, Sailboat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { boatsApi } from '../api/boats.api'
import type { Boat, BoatType } from '../types'
import { BoatStatus, BoatType as BoatTypeEnum, MotorizationType } from '../types'
import SearchBar from '../components/boats/SearchBar'
import ListingBoatCard from '../components/boats/ListingBoatCard'
import MapView from '../components/boats/MapView'
import Spinner from '../components/ui/Spinner'

const PAGE_SIZE = 6

const DEMO_BOATS: Boat[] = [
  {
    id: 101,
    ownerId: 1,
    title: "L'Émeraude des Mers",
    description: '',
    type: BoatTypeEnum.CATAMARAN,
    capacity: 12,
    cabins: 5,
    motorizationType: MotorizationType.OUTBOARD,
    withSkipper: true,
    port: 'Marseille',
    city: 'Marseille',
    country: 'France',
    dailyRate: 540,
    depositAmount: 0,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 32,
    createdAt: '',
    images: ['/view-luxurious-yacht-water.jpg'],
    lat: 43.2965,
    lng: 5.3698,
  },
  {
    id: 102,
    ownerId: 1,
    title: 'Le Zenith',
    description: '',
    type: BoatTypeEnum.SAILBOAT,
    capacity: 8,
    cabins: 3,
    motorizationType: MotorizationType.NONE,
    withSkipper: true,
    port: 'Ajaccio',
    city: 'Corse',
    country: 'France',
    dailyRate: 780,
    depositAmount: 0,
    status: BoatStatus.ACTIVE,
    rating: 4.8,
    reviewCount: 18,
    createdAt: '',
    images: ['/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg'],
    lat: 41.9192,
    lng: 8.7386,
  },
  {
    id: 103,
    ownerId: 1,
    title: 'Azure Dream',
    description: '',
    type: BoatTypeEnum.YACHT,
    capacity: 6,
    cabins: 3,
    motorizationType: MotorizationType.INBOARD,
    withSkipper: false,
    port: 'Cannes',
    city: 'Cannes',
    country: 'France',
    dailyRate: 1200,
    depositAmount: 0,
    status: BoatStatus.ACTIVE,
    rating: 5,
    reviewCount: 14,
    createdAt: '',
    images: ['/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg'],
    lat: 43.5528,
    lng: 7.0174,
  },
  {
    id: 104,
    ownerId: 1,
    title: 'Ocean Breeze',
    description: '',
    type: BoatTypeEnum.CATAMARAN,
    capacity: 10,
    cabins: 4,
    motorizationType: MotorizationType.OUTBOARD,
    withSkipper: false,
    port: 'Nice',
    city: 'Nice',
    country: 'France',
    dailyRate: 650,
    depositAmount: 0,
    status: BoatStatus.ACTIVE,
    rating: 4.7,
    reviewCount: 21,
    createdAt: '',
    images: ['/view-luxurious-yacht.jpg'],
    lat: 43.7102,
    lng: 7.262,
  },
  {
    id: 105,
    ownerId: 1,
    title: 'Vent du Large',
    description: '',
    type: BoatTypeEnum.SAILBOAT,
    capacity: 6,
    cabins: 2,
    motorizationType: MotorizationType.NONE,
    withSkipper: true,
    port: 'La Rochelle',
    city: 'La Rochelle',
    country: 'France',
    dailyRate: 420,
    depositAmount: 0,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 27,
    createdAt: '',
    images: ['/boat-navigating-through-canyon.jpg'],
    lat: 46.1603,
    lng: -1.1511,
  },
  {
    id: 106,
    ownerId: 1,
    title: 'Majestic Star',
    description: '',
    type: BoatTypeEnum.YACHT,
    capacity: 8,
    cabins: 4,
    motorizationType: MotorizationType.INBOARD,
    withSkipper: true,
    port: 'Saint-Tropez',
    city: 'Saint-Tropez',
    country: 'France',
    dailyRate: 1850,
    depositAmount: 0,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 11,
    createdAt: '',
    images: ['/view-luxurious-cruise-ship (3).jpg'],
    lat: 43.2727,
    lng: 6.6407,
  },
]

type TypeFilter = 'all' | BoatTypeEnum.YACHT | BoatTypeEnum.SAILBOAT | BoatTypeEnum.CATAMARAN

const TYPE_FILTERS: { id: TypeFilter; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'Tout voir', Icon: LayoutGrid },
  { id: BoatTypeEnum.YACHT, label: 'Yacht', Icon: Ship },
  { id: BoatTypeEnum.SAILBOAT, label: 'Voilier', Icon: Sailboat },
  { id: BoatTypeEnum.CATAMARAN, label: 'Catamaran', Icon: Ship },
]

type SortValue = 'price_asc' | 'price_desc' | 'rating_desc' | 'created_desc'

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating_desc', label: 'Mieux notés' },
  { value: 'created_desc', label: 'Plus récents' },
]

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="aspect-[16/10] bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
)

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() => {
    const types = searchParams.getAll('type')
    if (types.includes(BoatTypeEnum.YACHT)) return BoatTypeEnum.YACHT
    if (types.includes(BoatTypeEnum.SAILBOAT)) return BoatTypeEnum.SAILBOAT
    if (types.includes(BoatTypeEnum.CATAMARAN)) return BoatTypeEnum.CATAMARAN
    return 'all'
  })
  const [sortBy, setSortBy] = useState<SortValue>(
    (searchParams.get('sort') as SortValue) || 'price_asc'
  )

  const location = searchParams.get('location') ?? ''
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''
  const boatTypeParam = searchParams.get('type') ?? ''

  const queryParams = {
    location: location || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    types: typeFilter !== 'all' ? ([typeFilter] as BoatType[]) : undefined,
    sort: sortBy || undefined,
    page: 1,
    limit: 50,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boats', 'search', queryParams],
    queryFn: () => boatsApi.search(queryParams),
    staleTime: 2 * 60 * 1000,
    retry: false,
  })

  const apiBoats: Boat[] = data?.data ?? []
  const usingDemo = apiBoats.length === 0
  const boats = usingDemo ? DEMO_BOATS : apiBoats
  const total = usingDemo ? 42 : (data?.total ?? boats.length)

  const filteredBoats =
    typeFilter === 'all'
      ? boats
      : boats.filter((b) => b.type === typeFilter)

  const sortedBoats = [...filteredBoats].sort((a, b) => {
    switch (sortBy) {
      case 'price_desc':
        return b.dailyRate - a.dailyRate
      case 'rating_desc':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'created_desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return a.dailyRate - b.dailyRate
    }
  })

  const visibleBoats = sortedBoats.slice(0, visibleCount)
  const hasMore = visibleCount < sortedBoats.length

  const handleSearch = (params: {
    location: string
    startDate: string
    endDate: string
    capacity: number | ''
    boatType?: string
  }) => {
    const newParams = new URLSearchParams(searchParams)
    if (params.location) newParams.set('location', params.location)
    else newParams.delete('location')
    if (params.startDate) newParams.set('startDate', params.startDate)
    else newParams.delete('startDate')
    if (params.endDate) newParams.set('endDate', params.endDate)
    else newParams.delete('endDate')
    newParams.delete('type')
    if (params.boatType) newParams.set('type', params.boatType)
    setSearchParams(newParams)
    setVisibleCount(PAGE_SIZE)
  }

  const handleTypeFilter = useCallback(
    (filter: TypeFilter) => {
      setTypeFilter(filter)
      setVisibleCount(PAGE_SIZE)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('type')
      if (filter !== 'all') newParams.append('type', filter)
      setSearchParams(newParams)
    },
    [searchParams, setSearchParams]
  )

  const handleSortChange = (value: SortValue) => {
    setSortBy(value)
    const newParams = new URLSearchParams(searchParams)
    if (value) newParams.set('sort', value)
    else newParams.delete('sort')
    setSearchParams(newParams)
  }

  const searchTitle = location
    ? `Bateaux à ${location} — SailingLoc`
    : 'Nos bateaux — SailingLoc'

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{searchTitle}</title>
        <meta
          name="description"
          content={`${total} aventures maritimes disponibles sur SailingLoc.`}
        />
      </Helmet>

      <div className="w-full px-[10%]">
        <div className="flex flex-col lg:flex-row gap-0">
        {/* Colonne gauche — listings */}
        <div className="flex-1 min-w-0 lg:max-w-[62%]">
          <div className="pt-6 pb-4">
            <SearchBar
              listing
              onSearch={handleSearch}
              defaultValues={{
                location,
                startDate,
                endDate,
                boatType: boatTypeParam,
              }}
            />
          </div>

          {/* Filtres + tri */}
          <div className="pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {TYPE_FILTERS.map((filter) => {
                const isActive = typeFilter === filter.id
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => handleTypeFilter(filter.id)}
                    className={
                      isActive
                        ? 'sl-btn-filled flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm'
                        : 'sl-btn-outline flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap'
                    }
                  >
                    <filter.Icon size={14} color={isActive ? '#ffffff' : '#2563FF'} />
                    {filter.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6]">
                Trier par :
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortValue)}
                  className="appearance-none bg-transparent text-sm font-bold text-[#003366] pr-6 cursor-pointer focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  color="#003366"
                  className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="pb-12">
            <div className="mb-6">
              {isLoading ? (
                <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#003366] mb-1">
                    {t('search.adventures_other', { count: total })}
                  </h1>
                  <p className="text-sm text-[#8A94A6]">{t('search.subtitle')}</p>
                </>
              )}
            </div>

            {isError && usingDemo && (
              <p className="text-xs text-amber-600 mb-4">
                Affichage de bateaux de démonstration — connexion API indisponible.
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : sortedBoats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                  <Anchor size={36} className="text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-brand-navy mb-2">
                  {t('search.noResults')}
                </h2>
                <p className="text-brand-muted text-sm max-w-xs">
                  {t('search.noResultsHint')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {visibleBoats.map((boat) => (
                    <ListingBoatCard key={boat.id} boat={boat} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="sl-btn-navy w-full py-3.5 text-sm font-semibold rounded-xl transition-colors"
                    >
                      {t('search.showMore')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Colonne droite — carte */}
        <aside className="hidden lg:block lg:w-[38%] sticky top-[72px] h-[calc(100vh-72px)] pl-6">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-[#002b36] rounded-xl">
              <Spinner size="lg" />
            </div>
          ) : (
            <MapView
              boats={sortedBoats}
              dark
              fullHeight
              className="w-full h-full rounded-xl overflow-hidden"
            />
          )}
        </aside>
        </div>
      </div>

      {/* Carte mobile */}
      <div className="lg:hidden px-[10%] pb-8">
        <div className="h-[400px] rounded-xl overflow-hidden">
          {!isLoading && <MapView boats={sortedBoats} dark className="w-full h-full" />}
        </div>
      </div>
    </div>
  )
}

export default Search
