/**
 * Catalogue des destinations (pays et spots) aligné sur les champs `country` / `city` / `port` en BDD.
 */
import destinationPexelsImages from './destination-pexels-images.json'

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
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-5',
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
    homeGridClass: 'col-span-12 sm:col-span-4',
    popularFeatured: true,
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
    homeGridClass: 'col-span-12 sm:col-span-3',
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
    slug: 'malte',
    name: 'Malte',
    nameEn: 'Malta',
    subregions: 'La Valette, Gozo, Comino',
    subregionsEn: 'Valletta, Gozo, Comino',
    region: 'europe',
    country: 'Malte',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'NOUVEAU',
  },
  {
    slug: 'maldives',
    name: 'Maldives',
    nameEn: 'Maldives',
    subregions: 'Malé, Ari Atoll, Baa Atoll',
    subregionsEn: 'Malé, Ari Atoll, Baa Atoll',
    region: 'asia',
    country: 'Maldives',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-3',
    popularFeatured: true,
    popularDescription:
      "Lagons turquoise et yachts d'exception au cœur de l'océan Indien.",
  },
  {
    slug: 'seychelles',
    name: 'Seychelles',
    nameEn: 'Seychelles',
    subregions: 'Mahé, Praslin, La Digue',
    subregionsEn: 'Mahé, Praslin, La Digue',
    region: 'africa',
    country: 'Seychelles',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
  },
  {
    slug: 'emirats-arabes-unis',
    name: 'Émirats arabes unis',
    nameEn: 'United Arab Emirates',
    subregions: 'Dubaï, Abu Dhabi',
    subregionsEn: 'Dubai, Abu Dhabi',
    region: 'asia',
    country: 'Émirats arabes unis',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
  },
  {
    slug: 'monaco',
    name: 'Monaco',
    nameEn: 'Monaco',
    subregions: 'Port Hercule, Monte-Carlo',
    subregionsEn: 'Port Hercule, Monte Carlo',
    region: 'europe',
    country: 'Monaco',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
  },
  {
    slug: 'costa-rica',
    name: 'Costa Rica',
    nameEn: 'Costa Rica',
    subregions: 'Guanacaste, Papagayo',
    subregionsEn: 'Guanacaste, Papagayo',
    region: 'americas',
    country: 'Costa Rica',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'NOUVEAU',
  },
  {
    slug: 'republique-dominicaine',
    name: 'République dominicaine',
    nameEn: 'Dominican Republic',
    subregions: 'Punta Cana, Samaná',
    subregionsEn: 'Punta Cana, Samaná',
    region: 'caribbean',
    country: 'République dominicaine',
    image: '/view-luxurious-yacht-water.jpg',
  },
  {
    slug: 'maurice',
    name: 'Maurice',
    nameEn: 'Mauritius',
    subregions: 'Grand Baie, Île aux Cerfs',
    subregionsEn: 'Grand Baie, Île aux Cerfs',
    region: 'africa',
    country: 'Maurice',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'NOUVEAU',
  },
  {
    slug: 'polynesie-francaise',
    name: 'Polynésie française',
    nameEn: 'French Polynesia',
    subregions: 'Bora Bora, Tahiti, Moorea',
    subregionsEn: 'Bora Bora, Tahiti, Moorea',
    region: 'oceania',
    country: 'Polynésie française',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'PREMIUM',
    homeFeatured: true,
    homeGridClass: 'col-span-12 sm:col-span-4',
    popularFeatured: true,
  },
  {
    slug: 'cap-vert',
    name: 'Cap-Vert',
    nameEn: 'Cape Verde',
    subregions: 'Sal, São Vicente',
    subregionsEn: 'Sal, São Vicente',
    region: 'africa',
    country: 'Cap-Vert',
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'NOUVEAU',
  },
  {
    slug: 'sri-lanka',
    name: 'Sri Lanka',
    nameEn: 'Sri Lanka',
    subregions: 'Mirissa, Galle, Trincomalee',
    subregionsEn: 'Mirissa, Galle, Trincomalee',
    region: 'asia',
    country: 'Sri Lanka',
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
    homeGridClass: 'col-span-12 sm:col-span-5',
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
    popularFeatured: true,
  },
]

export function getDestinationBySlug(slug: string): DestinationDef | undefined {
  const normalized = slug.toLowerCase().trim()
  return DESTINATIONS.find((d) => d.slug === normalized)
}

/** Photo Pexels curatée (1 bateau, sans personnes) ou repli sur l'image statique */
export function getDestinationImage(def: DestinationDef): string {
  const curated = destinationPexelsImages[def.slug as keyof typeof destinationPexelsImages]
  return curated?.url ?? def.image
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
