import React, { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'

type RegionFilter = 'all' | 'europe' | 'caribbean' | 'asia'

type Destination = {
  slug: string
  name: string
  subregions: string
  boats: number
  region: Exclude<RegionFilter, 'all'>
  image: string
  badge?: 'PREMIUM' | 'NOUVEAU'
}

const REGION_FILTERS: { id: RegionFilter; label: string }[] = [
  { id: 'all', label: 'Tout voir' },
  { id: 'europe', label: 'Europe' },
  { id: 'caribbean', label: 'Caraïbes' },
  { id: 'asia', label: 'Asie' },
]

const DESTINATIONS: Destination[] = [
  {
    slug: 'mediterranee',
    name: 'Méditerranée',
    subregions: "Côte d'Azur, Corse, Sardaigne",
    boats: 142,
    region: 'europe',
    badge: 'PREMIUM',
    image: '/view-luxurious-yacht-water.jpg',
  },
  {
    slug: 'atlantique',
    name: 'Atlantique',
    subregions: 'Bretagne, Bassin d\'Arcachon',
    boats: 85,
    region: 'europe',
    image: '/boat-navigating-through-canyon.jpg',
  },
  {
    slug: 'croatie',
    name: 'Croatie',
    subregions: 'Split, Hvar, Dubrovnik',
    boats: 64,
    region: 'europe',
    badge: 'NOUVEAU',
    image: '/view-luxurious-cruise-ship (2).jpg',
  },
  {
    slug: 'grece',
    name: 'Grèce',
    subregions: 'Cyclades, Îles ioniennes',
    boats: 82,
    region: 'europe',
    image: '/view-luxurious-cruise-ship (3).jpg',
  },
  {
    slug: 'espagne',
    name: 'Espagne',
    subregions: 'Baléares, Costa Brava',
    boats: 118,
    region: 'europe',
    image: '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
  },
  {
    slug: 'caraibes',
    name: 'Caraïbes',
    subregions: 'Saint-Barth, Grenadines',
    boats: 58,
    region: 'caribbean',
    image: '/miami-bayside-landscape.jpg',
  },
]

const POPULAR = {
  featured: {
    slug: 'cote-azur',
    label: "Côte d'Azur",
    description:
      'Des yachts d\'exception pour une navigation inoubliable le long de la Riviera.',
    image: '/view-luxurious-yacht (1).jpg',
  },
  side: [
    {
      slug: 'corse',
      label: 'La Corse',
      image: '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
    },
    {
      slug: 'sardaigne',
      label: 'Sardaigne',
      image: '/view-luxurious-cruise-ship (1).jpg',
    },
  ],
} as const

const DestinationCard: React.FC<{ dest: Destination }> = ({ dest }) => (
  <Link
    to={`/destinations/${dest.slug}`}
    className="group relative block overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-auto sm:min-h-[280px]"
  >
    <img
      src={dest.image}
      alt={dest.name}
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
      <h3 className="font-serif text-2xl font-bold text-white mb-1">{dest.name}</h3>
      <p className="text-white/75 text-sm mb-4">{dest.subregions}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/90">
        {dest.boats} bateaux
      </p>
    </div>
  </Link>
)

const Destinations: React.FC = () => {
  const [region, setRegion] = useState<RegionFilter>('all')

  const filtered = useMemo(
    () => (region === 'all' ? DESTINATIONS : DESTINATIONS.filter((d) => d.region === region)),
    [region]
  )

  return (
    <>
      <Helmet>
        <title>Destinations — SailingLoc</title>
        <meta
          name="description"
          content="Explorez nos destinations de navigation : Méditerranée, Atlantique, Croatie, Grèce, Espagne, Caraïbes. Louez un bateau d'exception."
        />
        <meta property="og:title" content="Destinations de navigation — SailingLoc" />
        <meta
          property="og:description"
          content="Des horizons infinis, sélectionnés pour l'excellence de votre navigation."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
          <img
            src="/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg"
            alt="Voilier en mer"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-[10%]">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold italic text-white leading-tight mb-4">
              Explorez nos destinations
            </h1>
            <p className="text-white/85 text-base sm:text-lg max-w-2xl italic">
              Des horizons infinis, sélectionnés pour l&apos;excellence de votre navigation.
            </p>
          </div>
        </section>

        {/* Filtres + grille */}
        <section className="px-[10%] py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {REGION_FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRegion(id)}
                  className={cn(
                    'px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.08em] transition-colors border-2',
                    region === id
                      ? 'bg-[#003366] text-white border-[#003366]'
                      : 'bg-white text-[#003366] border-[#003366]/20 hover:border-[#2563FF] hover:text-[#2563FF]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#003366] border-2 border-[#003366]/20 rounded-full hover:border-[#2563FF] hover:text-[#2563FF] transition-colors self-start sm:self-auto"
            >
              <SlidersHorizontal size={14} className="text-[#2563FF]" />
              Filtrer les résultats
            </button>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filtered.map((dest) => (
                <DestinationCard key={dest.slug} dest={dest} />
              ))}
            </div>
          ) : (
            <p className="text-center text-brand-slate py-16">
              Aucune destination disponible pour cette région pour le moment.
            </p>
          )}
        </section>

        {/* Destinations populaires */}
        <section className="px-[10%] pb-16 sm:pb-24">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#003366] mb-8">
            Destinations populaires
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 min-h-[480px]">
            {/* Carte principale */}
            <Link
              to={`/destinations/${POPULAR.featured.slug}`}
              className="group relative lg:col-span-7 overflow-hidden rounded-2xl min-h-[320px] lg:min-h-0"
            >
              <img
                src={POPULAR.featured.image}
                alt={POPULAR.featured.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/95 via-[#003366]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2563FF] mb-3">
                  La sélection de la saison
                </p>
                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
                  {POPULAR.featured.label}
                </h3>
                <p className="text-white/80 text-sm max-w-md mb-5 leading-relaxed">
                  {POPULAR.featured.description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                  Voir la sélection
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>

            {/* Cartes latérales */}
            <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
              {POPULAR.side.map((item) => (
                <Link
                  key={item.slug}
                  to={`/destinations/${item.slug}`}
                  className="group relative flex-1 overflow-hidden rounded-2xl min-h-[200px]"
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      {item.label}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Destinations
