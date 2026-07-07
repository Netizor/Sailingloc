import React, { useState, useCallback, useEffect, useMemo } from 'react'

import { Helmet } from 'react-helmet-async'

import { useSearchParams } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'

import { Anchor, ChevronDown, LayoutGrid, Ship, Sailboat, X } from 'lucide-react'

import { useTranslation } from 'react-i18next'

import { boatsApi } from '../api/boats.api'

import type { Boat, BoatType } from '../types'

import { BoatType as BoatTypeEnum } from '../types'

import { DEMO_BOATS } from '../data/demoBoats'

import {

  filterBoatsLocally,

  sortBoats,

  parseTypeParam,

  type BoatSortValue,

} from '../lib/boatSearch'

import SearchBar from '../components/boats/SearchBar'

import ListingBoatCard from '../components/boats/ListingBoatCard'

import MapView from '../components/boats/MapView'

import Spinner from '../components/ui/Spinner'



const PAGE_SIZE = 6



type TypeFilter = 'all' | BoatTypeEnum.YACHT | BoatTypeEnum.SAILBOAT | BoatTypeEnum.CATAMARAN



const TYPE_FILTERS: { id: TypeFilter; label: string; Icon: React.FC<{ className?: string }> }[] = [

  { id: 'all', label: 'Tout voir', Icon: LayoutGrid },

  { id: BoatTypeEnum.YACHT, label: 'Yacht', Icon: Ship },

  { id: BoatTypeEnum.SAILBOAT, label: 'Voilier', Icon: Sailboat },

  { id: BoatTypeEnum.CATAMARAN, label: 'Catamaran', Icon: Ship },

]



const SORT_OPTIONS: { value: BoatSortValue; label: string }[] = [

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



  const location = searchParams.get('location') ?? ''

  const startDate = searchParams.get('startDate') ?? ''

  const endDate = searchParams.get('endDate') ?? ''

  const capacityParam = searchParams.get('capacity') ?? ''

  const capacity = capacityParam ? Number(capacityParam) : undefined

  const boatType = parseTypeParam(searchParams.get('type'))

  const sortBy = (searchParams.get('sort') as BoatSortValue) || 'price_asc'



  const typeFilter: TypeFilter =

    boatType === BoatTypeEnum.YACHT

      ? BoatTypeEnum.YACHT

      : boatType === BoatTypeEnum.SAILBOAT

        ? BoatTypeEnum.SAILBOAT

        : boatType === BoatTypeEnum.CATAMARAN

          ? BoatTypeEnum.CATAMARAN

          : 'all'



  const hasActiveFilters = !!(location || startDate || endDate || boatType || capacity)



  const queryParams = useMemo(

    () => ({

      location: location || undefined,

      startDate: startDate || undefined,

      endDate: endDate || undefined,

      capacity: capacity || undefined,

      types: boatType ? ([boatType] as BoatType[]) : undefined,

      sort: sortBy || undefined,

      page: 1,

      limit: 50,

    }),

    [location, startDate, endDate, capacity, boatType, sortBy]

  )



  const { data, isLoading, isError } = useQuery({

    queryKey: ['boats', 'search', queryParams],

    queryFn: () => boatsApi.search(queryParams),

    staleTime: 2 * 60 * 1000,

    retry: false,

  })



  const apiBoats: Boat[] = data?.data ?? []

  const usingDemo = isError || (!isLoading && apiBoats.length === 0)



  const filteredBoats = useMemo(() => {

    const source = usingDemo ? DEMO_BOATS : apiBoats

    const filtered = usingDemo

      ? filterBoatsLocally(source, { location, type: boatType, capacity })

      : source

    return sortBoats(filtered, sortBy)

  }, [usingDemo, apiBoats, location, boatType, capacity, sortBy])



  const total = usingDemo ? filteredBoats.length : (data?.total ?? filteredBoats.length)

  const visibleBoats = filteredBoats.slice(0, visibleCount)

  const hasMore = visibleCount < filteredBoats.length



  useEffect(() => {

    setVisibleCount(PAGE_SIZE)

  }, [location, startDate, endDate, boatType, capacity, sortBy])



  const handleSearch = (params: {

    location: string

    startDate: string

    endDate: string

    capacity: number | ''

    boatType?: string

  }) => {

    const newParams = new URLSearchParams()

    if (params.location.trim()) newParams.set('location', params.location.trim())

    if (params.startDate) newParams.set('startDate', params.startDate)

    if (params.endDate) newParams.set('endDate', params.endDate)

    if (params.capacity) newParams.set('capacity', String(params.capacity))

    if (params.boatType) newParams.set('type', params.boatType)

    if (sortBy) newParams.set('sort', sortBy)

    setSearchParams(newParams)

  }



  const handleTypeFilter = useCallback(

    (filter: TypeFilter) => {

      const newParams = new URLSearchParams(searchParams)

      newParams.delete('type')

      if (filter !== 'all') newParams.set('type', filter)

      setSearchParams(newParams)

    },

    [searchParams, setSearchParams]

  )



  const handleSortChange = (value: BoatSortValue) => {

    const newParams = new URLSearchParams(searchParams)

    newParams.set('sort', value)

    setSearchParams(newParams)

  }



  const clearFilters = () => {

    setSearchParams({})

  }



  const searchTitle = location

    ? `Bateaux à ${location} - SailingLoc`

    : 'Nos bateaux - SailingLoc'



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

          <div className="flex-1 min-w-0 lg:max-w-[62%]">

            <div className="pt-6 pb-4">

              <SearchBar

                listing

                onSearch={handleSearch}

                defaultValues={{

                  location,

                  startDate,

                  endDate,

                  capacity: capacity || '',

                  boatType: boatType || '',

                }}

              />

            </div>



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

                      <filter.Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#2563FF]'}`} />

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

                    onChange={(e) => handleSortChange(e.target.value as BoatSortValue)}

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



            <div className="pb-12">

              <div className="mb-6">

                {isLoading ? (

                  <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />

                ) : (

                  <>

                    <h1 className="text-xl sm:text-2xl font-bold text-[#003366] mb-1">

                      {location ? (

                        <>

                          {total} bateau{total > 1 ? 'x' : ''} à{' '}

                          <span className="text-[#2563FF]">{location}</span>

                        </>

                      ) : (

                        t('search.adventures_other', { count: total })

                      )}

                    </h1>

                    <p className="text-sm text-[#8A94A6]">

                      {hasActiveFilters

                        ? 'Résultats selon vos critères de recherche.'

                        : t('search.subtitle')}

                    </p>



                    {hasActiveFilters && (

                      <div className="flex flex-wrap items-center gap-2 mt-3">

                        {location && (

                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#eef3fb] text-[#003366] px-3 py-1 rounded-full">

                            {location}

                          </span>

                        )}

                        {boatType && (

                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#eef3fb] text-[#003366] px-3 py-1 rounded-full">

                            {TYPE_FILTERS.find((f) => f.id === boatType)?.label ?? boatType}

                          </span>

                        )}

                        {(startDate || endDate) && (

                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#eef3fb] text-[#003366] px-3 py-1 rounded-full">

                            {startDate || '…'} → {endDate || '…'}

                          </span>

                        )}

                        <button

                          type="button"

                          onClick={clearFilters}

                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563FF] hover:underline"

                        >

                          <X size={12} />

                          Effacer les filtres

                        </button>

                      </div>

                    )}

                  </>

                )}

              </div>



              {usingDemo && !isLoading && (

                <p className="text-xs text-amber-600 mb-4">

                  {isError
                    ? t('search.demoApiError')
                    : hasActiveFilters
                      ? t('search.demoNoResults')
                      : t('search.demoFallback')}

                </p>

              )}



              {isLoading ? (

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (

                    <SkeletonCard key={i} />

                  ))}

                </div>

              ) : filteredBoats.length === 0 ? (

                <div className="flex flex-col items-center justify-center py-20 text-center">

                  <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">

                    <Anchor size={36} className="text-gray-300" />

                  </div>

                  <h2 className="text-xl font-semibold text-[#003366] mb-2">

                    {t('search.noResults')}

                  </h2>

                  <p className="text-[#8A94A6] text-sm max-w-xs mb-4">

                    {t('search.noResultsHint')}

                  </p>

                  {hasActiveFilters && (

                    <button

                      type="button"

                      onClick={clearFilters}

                      className="sl-btn-outline px-5 py-2 rounded-lg text-sm font-semibold"

                    >

                      Effacer les filtres

                    </button>

                  )}

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



          <aside className="hidden lg:block lg:w-[38%] sticky top-[72px] h-[calc(100vh-72px)] pl-6">

            {isLoading ? (

              <div className="w-full h-full flex items-center justify-center bg-[#002b36] rounded-xl">

                <Spinner size="lg" />

              </div>

            ) : (

              <MapView

                boats={filteredBoats}

                dark

                fullHeight

                className="w-full h-full rounded-xl overflow-hidden"

              />

            )}

          </aside>

        </div>

      </div>



      <div className="lg:hidden px-[10%] pb-8">

        <div className="h-[400px] rounded-xl overflow-hidden">

          {!isLoading && <MapView boats={filteredBoats} dark className="w-full h-full" />}

        </div>

      </div>

    </div>

  )

}



export default Search


