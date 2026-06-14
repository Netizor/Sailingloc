/**
 * Catalogue des destinations (pays et spots) aligné sur les champs `country` / `city` / `port` en BDD.
 */
export type DestinationRegion =
  | 'europe'
  | 'americas'
  | 'caribbean'
  | 'asia'
  | 'africa'
  | 'oceania'

export interface DestinationDef {
  slug: string
  name: string
  nameEn: string
  subregions: string
  subregionsEn: string
  region: DestinationRegion
  /** Filtre exact sur `country` en BDD */
  country?: string
  /** Filtre OR sur plusieurs pays */
  countries?: string[]
  /** Filtre OR sur `city` / `port` */
  locations?: string[]
  image: string
  badge?: 'PREMIUM' | 'NOUVEAU'
  /** Mise en avant sur la page d'accueil (grille bento) */
  homeFeatured?: boolean
  homeGridClass?: string
  /** Mise en avant sur /destinations (bloc populaire) */
  popularFeatured?: boolean
  popularDescription?: string
}

export const DESTINATION_REGIONS: { id: DestinationRegion | 'all'; label: string; labelEn: string }[] = [
  { id: 'all', label: 'Tout voir', labelEn: 'All' },
  { id: 'europe', label: 'Europe', labelEn: 'Europe' },
  { id: 'americas', label: 'Amériques', labelEn: 'Americas' },
  { id: 'caribbean', label: 'Caraïbes', labelEn: 'Caribbean' },
  { id: 'asia', label: 'Asie', labelEn: 'Asia' },
  { id: 'africa', label: 'Afrique', labelEn: 'Africa' },
  { id: 'oceania', label: 'Océanie', labelEn: 'Oceania' },
]

export const DESTINATIONS: DestinationDef[] = [
  {
    slug: 'france',
    name: 'France',
    nameEn: 'France',
    subregions: "Côte d'Azur, Bretagne, Corse",
    subregionsEn: "French Riviera, Brittany, Corsica",
    region: 'europe',
    country: 'France',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
    popularFeatured: true,
    popularDescription:
      "Des yachts d'exception pour une navigation inoubliable le long de la Riviera et des côtes françaises.",
  },
  {
    slug: 'italie',
    name: 'Italie',
    nameEn: 'Italy',
    subregions: 'Sardaigne, Sicile, Amalfi',
    subregionsEn: 'Sardinia, Sicily, Amalfi Coast',
    region: 'europe',
    country: 'Italie',
    image: '/view-luxurious-cruise-ship (1).jpg',
  },
  {
    slug: 'espagne',
    name: 'Espagne',
    nameEn: 'Spain',
    subregions: 'Baléares, Costa Brava, Canaries',
    subregionsEn: 'Balearics, Costa Brava, Canary Islands',
    region: 'europe',
    country: 'Espagne',
    image: '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
  },
  {
    slug: 'croatie',
    name: 'Croatie',
    nameEn: 'Croatia',
    subregions: 'Split, Hvar, Dubrovnik',
    subregionsEn: 'Split, Hvar, Dubrovnik',
    region: 'europe',
    country: 'Croatie',
    image: '/view-luxurious-cruise-ship (2).jpg',
    badge: 'NOUVEAU',
  },
  {
    slug: 'grece',
    name: 'Grèce',
    nameEn: 'Greece',
    subregions: 'Cyclades, Îles ioniennes',
    subregionsEn: 'Cyclades, Ionian Islands',
    region: 'europe',
    country: 'Grèce',
    image: '/view-luxurious-cruise-ship (3).jpg',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-2 sm:col-start-8 row-span-1',
  },
  {
    slug: 'portugal',
    name: 'Portugal',
    nameEn: 'Portugal',
    subregions: 'Algarve, Lisbonne, Madère',
    subregionsEn: 'Algarve, Lisbon, Madeira',
    region: 'europe',
    country: 'Portugal',
    image: '/boat-navigating-through-canyon.jpg',
  },
  {
    slug: 'turquie',
    name: 'Turquie',
    nameEn: 'Turkey',
    subregions: 'Göcek, Bodrum, Antalya',
    subregionsEn: 'Göcek, Bodrum, Antalya',
    region: 'europe',
    country: 'Turquie',
    image: '/view-luxurious-yacht.jpg',
  },
  {
    slug: 'etats-unis',
    name: 'États-Unis',
    nameEn: 'United States',
    subregions: 'Floride, Californie, Hawaii',
    subregionsEn: 'Florida, California, Hawaii',
    region: 'americas',
    country: 'États-Unis',
    image: '/miami-bayside-landscape.jpg',
  },
  {
    slug: 'mexique',
    name: 'Mexique',
    nameEn: 'Mexico',
    subregions: 'Riviera Maya, Cancún',
    subregionsEn: 'Riviera Maya, Cancún',
    region: 'americas',
    country: 'Mexique',
    image: '/view-luxurious-cruise-ship.jpg',
  },
  {
    slug: 'bahamas',
    name: 'Bahamas',
    nameEn: 'Bahamas',
    subregions: 'Nassau, Exumas',
    subregionsEn: 'Nassau, Exumas',
    region: 'caribbean',
    country: 'Bahamas',
    image: '/miami-bayside-landscape.jpg',
    badge: 'PREMIUM',
  },
  {
    slug: 'martinique',
    name: 'Martinique',
    nameEn: 'Martinique',
    subregions: 'Le Marin, Fort-de-France',
    subregionsEn: 'Le Marin, Fort-de-France',
    region: 'caribbean',
    country: 'Martinique',
    image: '/view-luxurious-yacht (1).jpg',
  },
  {
    slug: 'thailande',
    name: 'Thaïlande',
    nameEn: 'Thailand',
    subregions: 'Phuket, Koh Samui, Krabi',
    subregionsEn: 'Phuket, Koh Samui, Krabi',
    region: 'asia',
    country: 'Thaïlande',
    image: '/ai-generated-boat-picture.jpg',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-3 sm:col-start-10 sm:row-span-2 row-span-1 min-h-[420px] sm:min-h-0',
  },
  {
    slug: 'indonesie',
    name: 'Indonésie',
    nameEn: 'Indonesia',
    subregions: 'Bali, Komodo, Raja Ampat',
    subregionsEn: 'Bali, Komodo, Raja Ampat',
    region: 'asia',
    country: 'Indonésie',
    image: '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
  },
  {
    slug: 'maroc',
    name: 'Maroc',
    nameEn: 'Morocco',
    subregions: 'Agadir, Essaouira',
    subregionsEn: 'Agadir, Essaouira',
    region: 'africa',
    country: 'Maroc',
    image: '/boat-navigating-through-canyon.jpg',
  },
  {
    slug: 'australie',
    name: 'Australie',
    nameEn: 'Australia',
    subregions: 'Sydney, Whitsundays',
    subregionsEn: 'Sydney, Whitsundays',
    region: 'oceania',
    country: 'Australie',
    image: '/view-luxurious-yacht-water.jpg',
  },
  {
    slug: 'saint-tropez',
    name: 'Saint-Tropez',
    nameEn: 'Saint-Tropez',
    subregions: "Golfe de Saint-Tropez",
    subregionsEn: 'Gulf of Saint-Tropez',
    region: 'europe',
    locations: ['Saint-Tropez', 'Grimaud'],
    image: '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-7 row-span-1',
    popularFeatured: true,
  },
  {
    slug: 'corse',
    name: 'Corse',
    nameEn: 'Corsica',
    subregions: 'Ajaccio, Bonifacio, Calvi',
    subregionsEn: 'Ajaccio, Bonifacio, Calvi',
    region: 'europe',
    locations: ['Ajaccio', 'Corse', 'Bonifacio', 'Calvi', 'Bastia'],
    image: '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
    popularFeatured: true,
  },
  {
    slug: 'cote-azur',
    name: "Côte d'Azur",
    nameEn: 'French Riviera',
    subregions: 'Nice, Cannes, Antibes',
    subregionsEn: 'Nice, Cannes, Antibes',
    region: 'europe',
    locations: ['Nice', 'Cannes', 'Antibes', 'Marseille', 'Saint-Tropez'],
    image: '/view-luxurious-cruise-ship (1).jpg',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-7 sm:row-start-2 row-span-1',
  },
  {
    slug: 'bretagne',
    name: 'Bretagne',
    nameEn: 'Brittany',
    subregions: 'Brest, Lorient, La Rochelle',
    subregionsEn: 'Brest, Lorient, La Rochelle',
    region: 'europe',
    locations: ['Brest', 'Lorient', 'La Rochelle', 'Vannes'],
    image: '/boat-navigating-through-canyon.jpg',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-2 sm:col-start-8 sm:row-start-2 row-span-1',
  },
  {
    slug: 'mediterranee',
    name: 'Méditerranée',
    nameEn: 'Mediterranean',
    subregions: "France, Italie, Espagne, Croatie, Grèce",
    subregionsEn: 'France, Italy, Spain, Croatia, Greece',
    region: 'europe',
    countries: ['France', 'Italie', 'Espagne', 'Croatie', 'Grèce', 'Turquie'],
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
  },
  {
    slug: 'caraibes',
    name: 'Caraïbes',
    nameEn: 'Caribbean',
    subregions: 'Bahamas, Martinique, Mexique',
    subregionsEn: 'Bahamas, Martinique, Mexico',
    region: 'caribbean',
    countries: ['Bahamas', 'Martinique', 'Mexique', 'République dominicaine'],
    image: '/miami-bayside-landscape.jpg',
  },
]

export function getDestinationBySlug(slug: string): DestinationDef | undefined {
  const normalized = slug.toLowerCase().trim()
  return DESTINATIONS.find((d) => d.slug === normalized)
}

/** Paramètres de recherche API pour une destination */
export function getDestinationSearchParams(def: DestinationDef): {
  country?: string
  countries?: string[]
  locations?: string[]
  location?: string
} {
  if (def.country) return { country: def.country }
  if (def.countries?.length) return { countries: def.countries }
  if (def.locations?.length) return { locations: def.locations }
  return { location: def.name }
}

export const CATALOG_DESTINATIONS = DESTINATIONS.filter((d) => d.country || d.countries)

export const POPULAR_DESTINATIONS = DESTINATIONS.filter((d) => d.popularFeatured)

/** Résolution d'un slug URL (ou repli sur recherche ville/port libre) */
export function resolveDestinationSlug(slug: string): DestinationDef {
  const known = getDestinationBySlug(slug)
  if (known) return known

  const decoded = decodeURIComponent(slug.replace(/-/g, ' ')).trim()
  const title = decoded.replace(/\b\w/g, (l) => l.toUpperCase())
  return {
    slug,
    name: title,
    nameEn: title,
    subregions: '',
    subregionsEn: '',
    region: 'europe',
    locations: [decoded],
    image: '/view-luxurious-yacht-water.jpg',
  }
}

export const HOME_DESTINATIONS = DESTINATIONS.filter((d) => d.homeFeatured)
