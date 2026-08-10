import React, { useMemo, useState } from 'react'
import { SEO } from '../components/SEO'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { boatsApi, type DestinationCountrySummary } from '../api/boats.api'
import { cn } from '../lib/utils'
import {
  CATALOG_DESTINATIONS,
  DESTINATION_REGIONS,
  POPULAR_DESTINATIONS,
  getDestinationImage,
  getDestinationBySlug,
  getDestinationSearchParams,
  type DestinationDef,
  type DestinationRegion,
} from '../data/destinations'

type RegionFilter = DestinationRegion | 'all'

function labelFor(def: DestinationDef, lang: string): string {
  return lang.startsWith('en') ? def.nameEn : def.name
}

function subregionsFor(def: DestinationDef, lang: string): string {
  return lang.startsWith('en') ? def.subregionsEn : def.subregions
}

function countFromSummary(def: DestinationDef, summary: DestinationCountrySummary[]): number {
  if (def.country) {
    return summary.find((s) => s.country === def.country)?.count ?? 0
  }
  if (def.countries?.length) {
    return def.countries.reduce(
      (sum, c) => sum + (summary.find((s) => s.country === c)?.count ?? 0),
      0,
    )
  }
  return 0
}

const DestinationCard: React.FC<{
  dest: DestinationDef
  boatCount: number
  image: string
  lang: string
}> = ({ dest, boatCount, image, lang }) => (
  <Link
    to={`/destinations/${dest.slug}`}
    className="group relative block overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-auto sm:min-h-[280px]"
  >
    <img
      src={image}
      alt={labelFor(dest, lang)}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/90 via-[#003366]/20 to-transparent" />

    {dest.badge && (
      <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#2563FF] rounded-full">
        {dest.badge}
      </span>
    )}

    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
      <h3 className="font-serif text-2xl font-bold text-white mb-1">{labelFor(dest, lang)}</h3>
      <p className="text-white/75 text-sm mb-4">{subregionsFor(dest, lang)}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/90">
        {boatCount} bateau{boatCount > 1 ? 'x' : ''}
      </p>
    </div>
  </Link>
)

const Destinations: React.FC = () => {
  const { i18n, t } = useTranslation()
  const [region, setRegion] = useState<RegionFilter>('all')

  const { data: summary = [] } = useQuery({
    queryKey: ['destinations', 'summary'],
    queryFn: () => boatsApi.getDestinationSummary(),
    staleTime: 5 * 60 * 1000,
  })

  const locationCatalog = CATALOG_DESTINATIONS.filter((d) => d.locations?.length && !d.country && !d.countries)
  const locationCounts = useQueries({
    queries: locationCatalog.map((dest) => ({
      queryKey: ['destinations', 'count', dest.slug],
      queryFn: async () => {
        const result = await boatsApi.search({
          ...getDestinationSearchParams(dest),
          limit: 1,
          page: 1,
        })
        return result.total
      },
      staleTime: 5 * 60 * 1000,
    })),
  })

  const popularCounts = useQueries({
    queries: POPULAR_DESTINATIONS.map((dest) => ({
      queryKey: ['destinations', 'popular-count', dest.slug],
      queryFn: async () => {
        const result = await boatsApi.search({
          ...getDestinationSearchParams(dest),
          limit: 1,
          page: 1,
        })
        return result.total
      },
      staleTime: 5 * 60 * 1000,
    })),
  })

  const getBoatCount = (def: DestinationDef): number => {
    const summaryCount = countFromSummary(def, summary)
    if (summaryCount > 0) return summaryCount
    const locIdx = locationCatalog.findIndex((d) => d.slug === def.slug)
    if (locIdx >= 0) return locationCounts[locIdx]?.data ?? 0
    const popIdx = POPULAR_DESTINATIONS.findIndex((d) => d.slug === def.slug)
    if (popIdx >= 0) return popularCounts[popIdx]?.data ?? 0
    return 0
  }

  const filtered = useMemo(
    () =>
      region === 'all'
        ? CATALOG_DESTINATIONS
        : CATALOG_DESTINATIONS.filter((d) => d.region === region),
    [region],
  )

  const popularList = POPULAR_DESTINATIONS.slice(0, 4)

  const regionLabels = DESTINATION_REGIONS.map((r) => ({
    id: r.id,
    label: i18n.language.startsWith('en') ? r.labelEn : r.label,
  }))

  const heroDest = getDestinationBySlug('mediterranee')

  return (
    <>
      <SEO
        title={`${t('destinations.title')} | SailingLoc`}
        description={t('destinations.subtitle')}
      />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
          <img
            src={heroDest ? getDestinationImage(heroDest) : '/view-luxurious-yacht-water.jpg'}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 lg:px-[10%]">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold italic text-white leading-tight mb-4">
              {t('destinations.heroTitle')}
            </h1>
            <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-2xl italic">
              {t('destinations.subtitle')}
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-[10%] py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {regionLabels.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRegion(id)}
                className={cn(
                  'px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.08em] transition-colors border-2',
                  region === id
                    ? 'bg-[#2563FF] text-white border-[#2563FF]'
                    : 'bg-white dark:bg-gray-800 text-[#003366] dark:text-gray-200 border-[#003366]/20 hover:border-[#2563FF] hover:text-[#2563FF]',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filtered.map((dest) => (
                <DestinationCard
                  key={dest.slug}
                  dest={dest}
                  boatCount={getBoatCount(dest)}
                  image={getDestinationImage(dest)}
                  lang={i18n.language}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-brand-slate py-16">
              {t('destinations.emptyRegion')}
            </p>
          )}
        </section>

        {popularList.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-[10%] pb-16 sm:pb-24">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#003366] dark:text-white mb-8">
              {t('home.destinationsTitle')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {popularList.map((item) => (
                <Link
                  key={item.slug}
                  to={`/destinations/${item.slug}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[16/9]"
                >
                  <img
                    src={getDestinationImage(item)}
                    alt={labelFor(item, i18n.language)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/90 via-[#003366]/20 to-transparent" />
                  {item.badge && (
                    <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#2563FF] rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      {labelFor(item, i18n.language)}
                    </h3>
                    <p className="text-white/75 text-sm mt-1">
                      {subregionsFor(item, i18n.language)}
                    </p>
                    <p className="text-white/70 text-[11px] font-bold uppercase tracking-[0.12em] mt-3">
                      {getBoatCount(item)} bateau{getBoatCount(item) > 1 ? 'x' : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default Destinations
