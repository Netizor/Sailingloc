import React, { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal, X, Anchor, LayoutGrid, Map, Bookmark, BookmarkCheck } from 'lucide-react'
import { boatsApi } from '../api/boats.api'
import { useSavedSearches } from '../hooks/useSavedSearches'
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites.api'
import { useAuthStore } from '../store/auth.store'
import type { Boat, BoatType } from '../types'
import SearchBar from '../components/boats/SearchBar'
import BoatCard from '../components/boats/BoatCard'
import BoatFilters, { BoatFilterValues, defaultFilters } from '../components/boats/BoatFilters'
import CompareBar from '../components/boats/CompareBar'
import MapView from '../components/boats/MapView'
import Pagination from '../components/ui/Pagination'
import Button from '../components/ui/Button'
const PAGE_SIZE = 12

// ─── Skeleton Card ───────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
    </div>
  </div>
)

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const { add: saveSearch, searches: savedSearches } = useSavedSearches()

  const [currentPage, setCurrentPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  // Read initial filter state from URL
  const [filters, setFilters] = useState<BoatFilterValues>(() => ({
    ...defaultFilters,
    types: searchParams.getAll('type'),
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : '',
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : '',
    withSkipper: searchParams.get('skipper') === 'true'
      ? true
      : searchParams.get('skipper') === 'false'
      ? false
      : null,
    sortBy: (searchParams.get('sort') as BoatFilterValues['sortBy']) || '',
  }))

  const location = searchParams.get('location') ?? ''
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''
  const capacity = searchParams.get('capacity') ?? ''

  // Sync filters to URL
  const syncFiltersToUrl = useCallback(
    (newFilters: BoatFilterValues, page = 1) => {
      const params = new URLSearchParams(searchParams)
      params.delete('type')
      newFilters.types.forEach((t) => params.append('type', t))
      if (newFilters.minPrice !== '') params.set('minPrice', String(newFilters.minPrice))
      else params.delete('minPrice')
      if (newFilters.maxPrice !== '') params.set('maxPrice', String(newFilters.maxPrice))
      else params.delete('maxPrice')
      if (newFilters.withSkipper !== null) params.set('skipper', String(newFilters.withSkipper))
      else params.delete('skipper')
      if (newFilters.sortBy) params.set('sort', newFilters.sortBy)
      else params.delete('sort')
      params.set('page', String(page))
      setSearchParams(params)
    },
    [searchParams, setSearchParams]
  )

  const handleFiltersChange = (newFilters: BoatFilterValues) => {
    setFilters(newFilters)
    setCurrentPage(1)
    syncFiltersToUrl(newFilters, 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    syncFiltersToUrl(filters, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (params: { location: string; startDate: string; endDate: string; capacity: number | '' }) => {
    const newParams = new URLSearchParams()
    if (params.location) newParams.set('location', params.location)
    if (params.startDate) newParams.set('startDate', params.startDate)
    if (params.endDate) newParams.set('endDate', params.endDate)
    if (params.capacity) newParams.set('capacity', String(params.capacity))
    newParams.set('page', '1')
    setSearchParams(newParams)
    setCurrentPage(1)
  }

  // Build query params for API
  const queryParams = {
    location: location || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    capacity: capacity ? Number(capacity) : undefined,
    types: filters.types.length > 0 ? (filters.types as BoatType[]) : undefined,
    minPrice: filters.minPrice !== '' ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice !== '' ? Number(filters.maxPrice) : undefined,
    withSkipper: filters.withSkipper !== null ? filters.withSkipper : undefined,
    sort: filters.sortBy || undefined,
    page: currentPage,
    limit: PAGE_SIZE,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boats', 'search', queryParams],
    queryFn: () => boatsApi.search(queryParams),
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
  })
  const favoriteBoatIds = new Set((favoritesData ?? []).map((f) => f.boatId))

  const addFavMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
  const removeFavMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const handleFavoriteToggle = (boatId: number) => {
    if (!isAuthenticated) { navigate('/connexion'); return }
    if (favoriteBoatIds.has(boatId)) {
      removeFavMutation.mutate(boatId)
    } else {
      addFavMutation.mutate(boatId)
    }
  }

  const boats: Boat[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.withSkipper !== null ||
    filters.sortBy !== ''

  // C9 — Vérifie si la recherche courante est déjà sauvegardée
  const isCurrentSearchSaved = savedSearches.some(
    (s) =>
      s.location === location &&
      s.startDate === startDate &&
      s.endDate === endDate &&
      String(s.capacity) === capacity,
  )

  const handleSaveSearch = () => {
    saveSearch({ location, startDate, endDate, capacity: capacity ? Number(capacity) : '' })
  }

  const searchTitle = location ? `Bateaux à ${location} — SailingLoc` : 'Recherche de bateaux — SailingLoc'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Helmet>
        <title>{searchTitle}</title>
        <meta name="description" content={`${total > 0 ? `${total} bateaux disponibles` : 'Recherchez des bateaux'}${location ? ` à ${location}` : ''} sur SailingLoc.`} />
        <meta property="og:title" content={searchTitle} />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Search refinement bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <SearchBar
            onSearch={handleSearch}
            compact
            defaultValues={{ location, startDate, endDate, capacity: capacity ? Number(capacity) : '' }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ─ Filters sidebar (desktop) ─ */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-32">
              <BoatFilters filters={filters} onChange={handleFiltersChange} />
            </div>
          </aside>

          {/* ─ Main content ─ */}
          <main className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                {isLoading ? (
                  <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {total > 0 ? (
                      <>
                        <span className="text-ocean-700 font-bold">{total}</span>{' '}
                        bateau{total > 1 ? 'x' : ''} trouvé{total > 1 ? 's' : ''}
                        {location && (
                          <span className="text-gray-400 dark:text-gray-500 font-normal text-base ml-1">
                            à {location}
                          </span>
                        )}
                      </>
                    ) : (
                      'Aucun résultat'
                    )}
                  </h1>
                )}
                {(startDate || endDate) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {startDate} — {endDate}
                  </p>
                )}
              </div>

              {/* Contrôles droite : filtres + toggle vue */}
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <span className="text-xs bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 px-2 py-1 rounded-full font-medium">
                    Filtres actifs
                  </span>
                )}
                {/* C9 — Sauvegarder la recherche courante */}
                {isAuthenticated && (location || startDate) && (
                  <button
                    onClick={handleSaveSearch}
                    disabled={isCurrentSearchSaved}
                    title={isCurrentSearchSaved ? 'Recherche déjà sauvegardée' : 'Sauvegarder cette recherche'}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-ocean-700 dark:hover:text-ocean-400 border border-gray-200 dark:border-gray-600 hover:border-ocean-300 rounded-lg px-2.5 py-1.5 transition-colors bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-default"
                  >
                    {isCurrentSearchSaved ? <BookmarkCheck size={13} className="text-ocean-600" /> : <Bookmark size={13} />}
                    {isCurrentSearchSaved ? 'Sauvegardé' : 'Sauvegarder'}
                  </button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFiltersOpen(true)}
                  leftIcon={<SlidersHorizontal size={14} />}
                  className="lg:hidden"
                >
                  Filtres
                </Button>

                {/* Toggle Liste / Carte */}
                <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="Vue liste"
                    aria-pressed={viewMode === 'list'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-ocean-700 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <LayoutGrid size={13} />
                    Liste
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    aria-label="Vue carte"
                    aria-pressed={viewMode === 'map'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'map'
                        ? 'bg-ocean-700 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Map size={13} />
                    Carte
                  </button>
                </div>
              </div>
            </div>

            {/* Error state */}
            {isError && (
              <div className="text-center py-16 text-red-600">
                <p className="font-medium">Une erreur est survenue lors du chargement.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Veuillez actualiser la page.</p>
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Résultats — liste ou carte */}
            {!isLoading && !isError && (
              <>
                {boats.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-5">
                      <Anchor size={36} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aucun bateau trouvé
                    </h2>
                    <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mb-6">
                      Essayez d&apos;élargir vos critères de recherche ou de modifier vos filtres.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFilters(defaultFilters)
                        setSearchParams(new URLSearchParams())
                      }}
                      leftIcon={<X size={14} />}
                    >
                      Effacer les filtres
                    </Button>
                  </div>
                ) : viewMode === 'map' ? (
                  /* Vue carte */
                  <MapView boats={boats} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm" />
                ) : (
                  /* Vue liste */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                    {boats.map((boat) => (
                      <BoatCard
                        key={boat.id}
                        boat={boat}
                        isFavorite={favoriteBoatIds.has(boat.id)}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination (liste uniquement) */}
                {viewMode === 'list' && totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ─ Barre comparateur (fixe en bas) ─ */}
      <CompareBar />

      {/* ─ Mobile filters drawer ─ */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" aria-modal="true" role="dialog">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="relative ml-auto w-80 max-w-full h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Filtres</span>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                aria-label="Fermer les filtres"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BoatFilters
                filters={filters}
                onChange={(f) => {
                  handleFiltersChange(f)
                  setFiltersOpen(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
