import type { Boat } from '../types'
import { BoatStatus, BoatType, MotorizationType, UserRole } from '../types'

const GALLERY_FALLBACK = [
  '/view-luxurious-yacht-water.jpg',
  '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
  '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
  '/view-luxurious-yacht.jpg',
]

/** Shared navigation & safety equipment for all SailingLoc boats */
const NAV_SAFETY = [
  'GPS & chartplotter',
  'Fixed VHF + handheld VHF',
  'Autopilot',
  'Electric windlass',
  'Life jackets (all passengers)',
  'Life raft',
  'Fire extinguishers & first-aid kit',
  'Dinghy + outboard engine',
]

/** Onboard comfort equipment */
const COMFORT = [
  'Fully equipped galley (stove, oven)',
  'Fridge / cool box',
  'Hot water & shower',
  'Bedding and linens provided',
  'Onboard 4G Wi-Fi',
  'Bluetooth sound system',
  'USB outlets & 220V inverter',
]

/** Leisure & outdoor equipment */
const LEISURE = [
  'Bimini / sun awning',
  'Sunbathing cushions',
  'Snorkeling kit (masks & snorkels)',
  'Paddleboard (SUP)',
  'Deck shower',
]

const TYPE_LABELS_EN: Record<BoatType, string> = {
  [BoatType.SAILBOAT]: 'monohull sailboat',
  [BoatType.MOTORBOAT]: 'motorboat',
  [BoatType.CATAMARAN]: 'catamaran',
  [BoatType.INFLATABLE]: 'inflatable',
  [BoatType.YACHT]: 'yacht',
  [BoatType.PONTOON]: 'pontoon boat',
  [BoatType.DINGHY]: 'dinghy',
}

const TYPE_LABELS_FR: Record<BoatType, string> = {
  [BoatType.SAILBOAT]: 'voilier monocoque',
  [BoatType.MOTORBOAT]: 'bateau à moteur',
  [BoatType.CATAMARAN]: 'catamaran',
  [BoatType.INFLATABLE]: 'bateau pneumatique',
  [BoatType.YACHT]: 'yacht',
  [BoatType.PONTOON]: 'ponton',
  [BoatType.DINGHY]: 'annexe',
}

type LangCode = 'fr' | 'en'

/** Resolves an i18next language tag (e.g. "en-US") to our supported codes. */
export function resolveLang(lang: string): LangCode {
  return lang.startsWith('en') ? 'en' : 'fr'
}

type EnrichableBoat = Pick<Boat, 'type' | 'cabins' | 'withSkipper' | 'descriptionFr' | 'descriptionEn'>

const enrichDescription = (boat: EnrichableBoat, lang: LangCode): string => {
  const base = (lang === 'en' ? boat.descriptionEn : boat.descriptionFr) ?? ''
  const cabinsCount = boat.cabins

  if (lang === 'en') {
    const typeLabel = TYPE_LABELS_EN[boat.type] ?? 'boat'
    const skipperText = boat.withSkipper
      ? `The skipper option is especially recommended if you want a stress-free outing: they plan the route around the weather, handle harbor maneuvers, choose suitable anchorages, and can advise you on restaurants, coves, and swim stops. It is also an excellent solution if you do not hold a license or simply want to enjoy the boat with your guests.`
      : `This is a bareboat charter (no skipper). It is intended for boaters who hold the appropriate license and have enough experience to manage navigation, docking, and onboard safety. A full briefing is provided before departure: boat systems, recommended cruising areas, fuel, safety equipment, and return procedure.`

    return `${base}

This ${typeLabel} is designed for a simple, reassuring booking. Before boarding, the owner confirms your preferred itinerary, the group's experience level, and the weather conditions to ensure a coherent, safe departure. You know exactly what is included, what to bring onboard, and how the handover works.

For comfort, the boat has ${cabinsCount} cabin${cabinsCount > 1 ? 's' : ''}, outdoor spaces to relax, a welcoming dining area, and practical equipment for a day trip or several nights aboard. Storage, galley, fresh water, power outlets, and navigation gear let you cruise with peace of mind—even on a first charter.

${skipperText}

To prepare your booking, share the number of passengers, desired duration, your sailing experience, and the kind of outing you want: swim day, sunset cruise, weekend at sea, family cruise, or sporty sailing. The owner can then confirm the best dates, adapt the program, and reply quickly with personalized advice.

The boat suits groups looking for a polished, clear, professional experience: verified photos, detailed equipment lists, availability on the calendar, and an owner reachable before booking to answer any remaining questions.`
  }

  const typeLabel = TYPE_LABELS_FR[boat.type] ?? 'bateau'
  const skipperText = boat.withSkipper
    ? `L'option skipper est particulièrement recommandée si vous souhaitez une sortie sans stress : il prépare l'itinéraire en fonction de la météo, gère les manœuvres au port, choisit les mouillages adaptés et peut vous conseiller sur les restaurants, criques et pauses baignade. C'est aussi une excellente solution si vous n'avez pas le permis ou si vous souhaitez simplement profiter du bateau avec vos invités.`
    : `Il s'agit d'une location sans skipper (en autonomie). Elle s'adresse aux plaisanciers disposant du permis adapté et d'une expérience suffisante pour gérer la navigation, l'accostage et la sécurité à bord. Un briefing complet est assuré avant le départ : fonctionnement du bateau, zones de navigation conseillées, carburant, équipements de sécurité et procédure de retour.`

  return `${base}

Ce ${typeLabel} est pensé pour une réservation simple et rassurante. Avant l'embarquement, le propriétaire valide avec vous l'itinéraire souhaité, le niveau d'expérience du groupe et les conditions météo afin de garantir un départ cohérent et sécurisé. Vous savez exactement ce qui est inclus, ce qu'il faut prévoir à bord et comment se déroule la prise en main.

Côté confort, le bateau dispose de ${cabinsCount} cabine${cabinsCount > 1 ? 's' : ''}, d'espaces extérieurs pour se détendre, d'un coin repas convivial et d'équipements pratiques pour une journée ou plusieurs nuits à bord. Rangements, cuisine, eau douce, prises électriques et équipements de navigation permettent de naviguer en toute tranquillité, même pour une première location.

${skipperText}

Pour préparer votre réservation, indiquez le nombre de passagers, la durée souhaitée, votre expérience de la navigation et le type de sortie recherché : journée baignade, croisière au coucher du soleil, week-end en mer, croisière en famille ou navigation sportive. Le propriétaire pourra alors confirmer les meilleures dates, adapter le programme et vous répondre rapidement avec des conseils personnalisés.

Ce bateau convient aux groupes recherchant une expérience soignée, claire et professionnelle : photos vérifiées, liste d'équipements détaillée, disponibilités à jour sur le calendrier, et un propriétaire disponible avant réservation pour répondre à toutes vos questions.`
}

const DEMO_BOATS_BASE: Boat[] = [
  {
    id: 101,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: "L'Émeraude des Mers",
    description: '',
    descriptionFr: `Embarquez à bord de L'Émeraude des Mers, un catamaran spacieux et stable, idéal pour naviguer en famille ou entre amis depuis Marseille. Ses deux coques offrent une plateforme large et rassurante, parfaite pour les enfants comme pour les navigateurs moins expérimentés.

À bord, 5 cabines doubles et 12 couchages accueillent un grand groupe dans un vrai confort : un salon lumineux, une cuisine entièrement équipée et de généreux espaces bain de soleil sur les trampolines avant. Le cockpit extérieur, ombragé par un bimini, devient le cœur de vos journées en mer.

Idéal pour explorer les Calanques de Marseille à Cassis, les îles du Frioul et la Côte Bleue, en journée ou lors de croisières de plusieurs jours. Ce catamaran est proposé avec un skipper professionnel : vous profitez de la navigation pendant qu'il s'occupe de tout (itinéraire, mouillages, sécurité).`,
    descriptionEn: `Step aboard L'Émeraude des Mers, a spacious, stable catamaran ideal for cruising with family or friends from Marseille. Its twin hulls create a wide, reassuring platform—perfect for children and less experienced sailors alike.

Onboard, 5 double cabins and 12 berths welcome a large group in real comfort: a bright saloon, fully equipped galley, and generous sunbathing areas on the forward trampolines. The outdoor cockpit, shaded by a bimini, becomes the heart of your days at sea.

Ideal for exploring the Calanques from Marseille to Cassis, the Frioul Islands, and the Côte Bleue on day trips or multi-day cruises. This catamaran is offered with a professional skipper: you enjoy the sailing while they handle everything (itinerary, anchorages, safety).`,
    type: BoatType.CATAMARAN,
    length: 14.2,
    year: 2022,
    capacity: 12,
    cabins: 5,
    motorizationType: MotorizationType.OUTBOARD,
    withSkipper: true,
    skipperPrice: 180,
    port: 'Marseille',
    city: 'Marseille',
    country: 'France',
    dailyRate: 540,
    depositAmount: 2000,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 32,
    createdAt: '2022-06-01',
    images: GALLERY_FALLBACK,
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Solar panels', 'Air conditioning'],
    lat: 43.2965,
    lng: 5.3698,
  },
  {
    id: 102,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Le Zenith',
    description: '',
    descriptionFr: `Le Zenith est un voilier monocoque élégant et performant, basé à Ajaccio, au cœur de la Corse. Conçu pour allier plaisir de la navigation et confort, il convient aussi bien aux marins passionnés qu'aux vacanciers en quête d'évasion.

Ses 3 cabines et 8 couchages, sa cuisine complète et son salon chaleureux en font une base de vie idéale pour une croisière d'une semaine. Le pont dégagé et le cockpit spacieux invitent à la détente entre deux virements.

Depuis Ajaccio, mettez le cap sur les îles Sanguinaires, le golfe de Porto classé à l'UNESCO, ou les eaux turquoise de la réserve de Scandola. Voilier proposé avec skipper : profitez d'un équipier expérimenté qui connaît par cœur les plus beaux mouillages de l'île.`,
    descriptionEn: `Le Zenith is an elegant, capable monohull sailboat based in Ajaccio, in the heart of Corsica. Built to balance sailing pleasure and comfort, it suits both passionate sailors and holidaymakers seeking escape.

Its 3 cabins and 8 berths, complete galley, and warm saloon make it an ideal liveaboard base for a week-long cruise. The clear deck and spacious cockpit invite relaxation between tacks.

From Ajaccio, set course for the Sanguinaires Islands, the UNESCO-listed Gulf of Porto, or the turquoise waters of the Scandola reserve. Sailboat offered with a skipper: enjoy an experienced crew member who knows the island's finest anchorages inside out.`,
    type: BoatType.SAILBOAT,
    length: 12.5,
    year: 2021,
    capacity: 8,
    cabins: 3,
    motorizationType: MotorizationType.NONE,
    withSkipper: true,
    skipperPrice: 150,
    port: 'Ajaccio',
    city: 'Corse',
    country: 'France',
    dailyRate: 780,
    depositAmount: 1500,
    status: BoatStatus.ACTIVE,
    rating: 4.8,
    reviewCount: 18,
    createdAt: '2021-04-10',
    images: GALLERY_FALLBACK,
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Lazy bag & genoa furler'],
    lat: 41.9192,
    lng: 8.7386,
  },
  {
    id: 103,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: "L'Horizon Bleu - Oceanis 51.1",
    description: '',
    descriptionFr: `Découvrez la Côte d'Azur à bord de ce tout nouveau Beneteau Oceanis 51.1. Conçu pour le confort et la performance, ce yacht offre un espace de vie incomparable, à l'intérieur comme à l'extérieur. Le cockpit spacieux est parfait pour les dîners au coucher du soleil, tandis que les 5 cabines luxueuses garantissent des nuits paisibles au mouillage.

Équipé des dernières technologies de navigation et de panneaux solaires, L'Horizon Bleu est totalement autonome pour de plus longues croisières vers les îles d'Hyères ou la Corse. La cuisine haut de gamme, la climatisation et la literie raffinée transforment chaque sortie en séjour d'exception.

Notre skipper professionnel local peut vous accompagner pour révéler des criques secrètes inaccessibles par la route. Idéal pour un groupe d'amis ou deux familles en quête d'une aventure maritime haut de gamme depuis Saint-Tropez.`,
    descriptionEn: `Discover the French Riviera aboard this brand-new Beneteau Oceanis 51.1. Designed for comfort and performance, this yacht offers unmatched living space both inside and out. The spacious cockpit is perfect for sunset dinners, while the 5 luxurious cabins ensure peaceful nights at anchor.

Equipped with the latest navigation technology and solar panels, L'Horizon Bleu is fully autonomous for longer cruises to the Hyères Islands or Corsica. The premium galley, air conditioning, and high-end bedding turn every passage into an exceptional stay.

Our local professional skipper can join you to reveal secret coves unreachable by land. Ideal for a group of friends or two families looking for a high-end sea adventure from Saint-Tropez.`,
    type: BoatType.SAILBOAT,
    length: 15.94,
    year: 2023,
    capacity: 10,
    cabins: 5,
    motorizationType: MotorizationType.INBOARD,
    withSkipper: true,
    skipperPrice: 200,
    port: 'Saint-Tropez',
    city: 'Saint-Tropez',
    country: 'France',
    dailyRate: 1250,
    depositAmount: 3000,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 24,
    createdAt: '2023-01-20',
    images: GALLERY_FALLBACK,
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Solar panels', 'Air conditioning', 'Watermaker'],
    lat: 43.2727,
    lng: 6.6407,
  },
  {
    id: 104,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Ocean Breeze',
    description: '',
    descriptionFr: `Ocean Breeze est un catamaran moderne et facile à manœuvrer, parfait pour une location sans skipper depuis Nice. Son design équilibré et sa faible gîte en font un choix rassurant pour les plaisanciers titulaires du permis qui souhaitent naviguer en toute autonomie.

Avec 4 cabines doubles, 10 couchages et de généreux espaces extérieurs, il offre tout ce qu'il faut pour une escapade en famille sur la Riviera. Cuisine équipée, eau chaude, coussins de bain de soleil et coin repas ombragé : tout est pensé pour profiter du soleil méditerranéen.

Naviguez jusqu'à Villefranche-sur-Mer, au Cap-Ferrat, à la baie de Beaulieu, ou poussez jusqu'aux îles de Lérins. Ce bateau est proposé sans skipper (location en autonomie uniquement) : un permis côtier et une expérience de navigation sont requis. Un briefing complet est assuré au départ.`,
    descriptionEn: `Ocean Breeze is a modern, easy-to-handle catamaran—perfect for bareboat charter from Nice. Its balanced design and low heel make it a reassuring choice for licensed skippers who want to sail independently.

With 4 double cabins, 10 berths, and generous outdoor spaces, it offers everything you need for a family escape on the Riviera. Equipped galley, hot water, sun pads, and a shaded dining area: everything is set up to enjoy the Mediterranean sun.

Cruise to Villefranche-sur-Mer, Cap-Ferrat, Beaulieu Bay, or push on to the Lérins Islands. This boat is offered without a skipper (bareboat only): a coastal license and sailing experience are required. A full briefing is provided at departure.`,
    type: BoatType.CATAMARAN,
    length: 13.8,
    year: 2022,
    capacity: 10,
    cabins: 4,
    motorizationType: MotorizationType.OUTBOARD,
    withSkipper: false,
    port: 'Nice',
    city: 'Nice',
    country: 'France',
    dailyRate: 650,
    depositAmount: 1800,
    status: BoatStatus.ACTIVE,
    rating: 4.7,
    reviewCount: 21,
    createdAt: '2022-08-05',
    images: GALLERY_FALLBACK,
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Solar panels'],
    lat: 43.7102,
    lng: 7.262,
  },
  {
    id: 105,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Vent du Large',
    description: '',
    descriptionFr: `Vent du Large est un voilier convivial et facile à manier, idéal pour découvrir la voile ou partager une belle sortie en petit comité depuis La Rochelle. Avec ses 11,2 m bien pensés, il est agréable à naviguer tout en offrant un vrai confort à bord.

Ses 2 cabines et 6 couchages, sa cuisine fonctionnelle et son cockpit accueillant conviennent à un couple, une petite famille ou un groupe d'amis. Un excellent rapport qualité-prix pour se lancer dans la croisière côtière.

Explorez les îles de Ré, d'Aix et d'Oléron, ou dérivez jusqu'au majestueux Fort Boyard. Voilier proposé avec skipper : parfait pour les débutants qui souhaitent apprendre, ou pour ceux qui préfèrent être guidés vers les plus beaux mouillages du Pertuis charentais.`,
    descriptionEn: `Vent du Large is a friendly, easy-handling sailboat—ideal for discovering sailing or sharing a lovely outing in a small group from La Rochelle. At a sensible 11.2 m, it is pleasant to sail while still offering real comfort onboard.

Its 2 cabins and 6 berths, functional galley, and welcoming cockpit suit a couple, a small family, or a group of friends. Excellent value for getting into coastal cruising.

Explore the islands of Ré, Aix, and Oléron, or drift toward majestic Fort Boyard. Sailboat offered with a skipper: perfect for beginners who want to learn, or for those happy to be guided to the finest anchorages of the Charente straits.`,
    type: BoatType.SAILBOAT,
    length: 11.2,
    year: 2020,
    capacity: 6,
    cabins: 2,
    motorizationType: MotorizationType.NONE,
    withSkipper: true,
    skipperPrice: 120,
    port: 'La Rochelle',
    city: 'La Rochelle',
    country: 'France',
    dailyRate: 420,
    depositAmount: 1000,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 27,
    createdAt: '2020-05-12',
    images: GALLERY_FALLBACK,
    equipment: [...NAV_SAFETY, ...COMFORT, 'Bimini / sun awning', 'Snorkeling kit (masks & snorkels)'],
    lat: 46.1603,
    lng: -1.1511,
  },
  {
    id: 106,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Majestic Star',
    description: '',
    descriptionFr: `Majestic Star est un yacht à moteur d'exception qui incarne le luxe et le raffinement en Méditerranée. Avec ses 18,5 m, il offre des volumes impressionnants et des finitions haut de gamme pour une expérience digne des plus belles croisières privées.

À bord : 4 cabines élégantes, un salon panoramique climatisé, un flybridge avec espace bain de soleil, et un vaste cockpit arrière pour recevoir. Cuisine professionnelle, système son immersif et service sur-mesure : tout est réuni pour un séjour inoubliable depuis Saint-Tropez.

Rejoignez rapidement les criques de Pampelonne, la baie de Cavalaire ou les îles d'Or grâce à ses moteurs puissants. Yacht proposé avec skipper professionnel (et équipage sur demande) pour un service impeccable, de l'accueil à bord jusqu'au dernier coucher de soleil.`,
    descriptionEn: `Majestic Star is an exceptional motor yacht that embodies luxury and refinement on the Mediterranean. At 18.5 m, it offers impressive volumes and high-end finishes for an experience worthy of the finest private cruises.

Onboard: 4 elegant cabins, an air-conditioned panoramic lounge, a flybridge with sunbathing area, and a large aft cockpit for entertaining. Professional galley, immersive sound system, and tailor-made service—everything for an unforgettable stay from Saint-Tropez.

Reach the coves of Pampelonne, Cavalaire Bay, or the Golden Islands quickly thanks to its powerful engines. Yacht offered with a professional skipper (and crew on request) for impeccable service from welcome aboard to the last sunset.`,
    type: BoatType.YACHT,
    length: 18.5,
    year: 2023,
    capacity: 8,
    cabins: 4,
    motorizationType: MotorizationType.INBOARD,
    withSkipper: true,
    skipperPrice: 250,
    port: 'Saint-Tropez',
    city: 'Saint-Tropez',
    country: 'France',
    dailyRate: 1850,
    depositAmount: 5000,
    status: BoatStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 11,
    createdAt: '2023-03-01',
    images: GALLERY_FALLBACK,
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Air conditioning', 'Flybridge', 'Jet ski / water toys', 'Generator'],
    lat: 43.2727,
    lng: 6.6407,
  },
]

export const DEMO_BOATS: Boat[] = DEMO_BOATS_BASE.map((boat) => ({
  ...boat,
  descriptionFr: enrichDescription(boat, 'fr'),
  descriptionEn: enrichDescription(boat, 'en'),
  description: enrichDescription(boat, 'en'),
}))

export function getDemoBoat(id: number): Boat | undefined {
  return DEMO_BOATS.find((b) => b.id === id)
}

/**
 * Returns the boat description localized for the given i18next language.
 * Falls back to `description` for non-demo (API) boats, which are single-language.
 */
export function getBoatDescription(
  boat: Pick<Boat, 'description' | 'descriptionFr' | 'descriptionEn'>,
  lang: string,
): string {
  const localized = resolveLang(lang) === 'en' ? boat.descriptionEn : boat.descriptionFr
  return localized ?? boat.description ?? ''
}
