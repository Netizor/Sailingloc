import type { Boat } from '../types'
import { BoatStatus, BoatType, MotorizationType, UserRole } from '../types'

const GALLERY_FALLBACK = [
  '/view-luxurious-yacht-water.jpg',
  '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
  '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
  '/view-luxurious-yacht.jpg',
]

/** Équipements de navigation & sécurité communs à tous les bateaux SailingLoc */
const NAV_SAFETY = [
  'GPS & traceur de cartes',
  'VHF fixe + VHF portable',
  'Pilote automatique',
  'Guindeau électrique',
  'Gilets de sauvetage (tous passagers)',
  'Radeau de survie',
  'Extincteurs & trousse de secours',
  'Annexe + moteur hors-bord',
]

/** Équipements de confort à bord */
const COMFORT = [
  'Cuisine équipée (gazinière, four)',
  'Réfrigérateur / glacière',
  'Eau chaude & douche',
  'Literie et linge de maison fournis',
  'Wi-Fi 4G à bord',
  'Sonorisation Bluetooth',
  'Prises USB & convertisseur 220V',
]

/** Équipements loisirs & extérieur */
const LEISURE = [
  'Bimini / taud de soleil',
  'Coussins de bain de soleil',
  'Kit snorkeling (masques & tubas)',
  'Paddle (SUP)',
  'Douchette de pont',
]

const TYPE_LABELS: Record<BoatType, string> = {
  [BoatType.SAILBOAT]: 'voilier monocoque',
  [BoatType.MOTORBOAT]: 'bateau à moteur',
  [BoatType.CATAMARAN]: 'catamaran',
  [BoatType.INFLATABLE]: 'pneumatique',
  [BoatType.YACHT]: 'yacht',
  [BoatType.PONTOON]: 'péniche',
  [BoatType.DINGHY]: 'dériveur',
}

const enrichDescription = (boat: Boat) => {
  const typeLabel = TYPE_LABELS[boat.type] ?? 'bateau'
  const skipperText = boat.withSkipper
    ? `L'option skipper est particulièrement recommandée si vous souhaitez une sortie sans stress : il prépare l'itinéraire selon la météo, gère les manoeuvres au port, choisit les mouillages adaptés et peut vous conseiller sur les restaurants, criques et pauses baignade. C'est aussi une excellente solution si vous n'avez pas le permis ou si vous voulez simplement profiter du bateau avec vos invités.`
    : `La location se fait sans skipper, en autonomie. Elle s'adresse aux plaisanciers qui disposent du permis adapté et d'une expérience suffisante pour gérer la navigation, l'accostage et la sécurité à bord. Un briefing complet est prévu avant le départ : fonctionnement du bateau, zones conseillées, carburant, équipements de sécurité et procédure de retour.`

  return `${boat.description}

Ce ${typeLabel} est pensé pour une réservation simple et rassurante. Avant l'embarquement, le propriétaire valide avec vous le programme souhaité, le niveau d'expérience du groupe et les conditions météo afin de proposer un départ cohérent et sécurisé. Vous savez exactement ce qui est inclus, ce qu'il faut prévoir à bord et comment se déroule la prise en main.

Côté confort, le bateau dispose de ${boat.cabins} cabine${boat.cabins > 1 ? 's' : ''}, d'espaces extérieurs pour se détendre, d'un coin repas convivial et d'équipements pratiques pour passer une journée ou plusieurs nuits à bord. Les rangements, la cuisine, l'eau douce, les prises et les équipements de navigation permettent de voyager avec sérénité, même pour une première croisière.

${skipperText}

Pour préparer votre réservation, indiquez le nombre de passagers, la durée souhaitée, votre expérience nautique et le style de sortie recherché : journée baignade, coucher de soleil, week-end en mer, croisière familiale ou navigation sportive. Le propriétaire pourra ainsi confirmer les meilleures dates, adapter le programme et vous répondre rapidement avec des conseils personnalisés.

Le bateau est adapté aux groupes qui recherchent une expérience soignée, claire et professionnelle : photos vérifiées, équipements détaillés, disponibilités visibles sur le calendrier et propriétaire joignable avant la réservation pour lever les derniers doutes.`
}

const DEMO_BOATS_BASE: Boat[] = [
  {
    id: 101,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: "L'Émeraude des Mers",
    description: `Embarquez à bord de L'Émeraude des Mers, un catamaran spacieux et stable idéal pour naviguer en famille ou entre amis au départ de Marseille. Ses deux coques offrent une plateforme large et sécurisante, parfaite pour les enfants comme pour les navigateurs les moins aguerris.

À bord, 5 cabines doubles et 12 couchages permettent d'accueillir un grand groupe dans un vrai confort : carré lumineux, cuisine entièrement équipée et vastes bains de soleil sur les trampolines avant. Le cockpit extérieur, protégé par un bimini, devient le cœur de vie de vos journées en mer.

Idéal pour explorer les Calanques de Marseille à Cassis, les îles du Frioul et la Côte Bleue lors de sorties à la journée ou de croisières de plusieurs jours. Ce catamaran est proposé avec skipper professionnel : vous profitez pleinement de la navigation, il s'occupe de tout (itinéraire, mouillages, sécurité).`,
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
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Panneaux solaires', 'Climatisation'],
    lat: 43.2965,
    lng: 5.3698,
  },
  {
    id: 102,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Le Zenith',
    description: `Le Zenith est un voilier monocoque élégant et performant, basé à Ajaccio au cœur de la Corse. Conçu pour allier plaisir de la voile et confort, il conviendra aussi bien aux passionnés de navigation qu'aux vacanciers en quête d'évasion.

Ses 3 cabines et 8 couchages, sa cuisine complète et son carré chaleureux en font une base de vie idéale pour une croisière d'une semaine. Le pont dégagé et le cockpit spacieux invitent à la détente entre deux bords de voile.

Depuis Ajaccio, mettez le cap sur les Îles Sanguinaires, le golfe de Porto classé à l'UNESCO ou les eaux turquoise de la réserve de Scandola. Voilier proposé avec skipper : profitez d'un équipier expérimenté qui connaît parfaitement les plus beaux mouillages de l'île de Beauté.`,
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
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Lazy bag & enrouleur de génois'],
    lat: 41.9192,
    lng: 8.7386,
  },
  {
    id: 103,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: "L'Horizon Bleu - Oceanis 51.1",
    description: `Découvrez la Côte d'Azur à bord de ce Beneteau Oceanis 51.1 flambant neuf. Conçu pour le confort et la performance, ce navire offre un espace de vie inégalé tant à l'intérieur qu'à l'extérieur. Le cockpit spacieux est idéal pour les dîners au coucher du soleil, tandis que les 5 cabines luxueuses garantissent des nuits paisibles au mouillage.

Équipé des dernières technologies de navigation et de panneaux solaires, L'Horizon Bleu est parfaitement autonome pour des croisières prolongées vers les îles d'Hyères ou la Corse. La cuisine haut de gamme, la climatisation et la literie premium transforment chaque traversée en séjour d'exception.

Notre skipper professionnel local peut vous accompagner pour vous faire découvrir les criques secrètes inaccessibles par la terre. Idéal pour un groupe d'amis ou deux familles souhaitant vivre une aventure en mer haut de gamme au départ de Saint-Tropez.`,
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
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Panneaux solaires', 'Climatisation', 'Dessalinisateur'],
    lat: 43.2727,
    lng: 6.6407,
  },
  {
    id: 104,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Ocean Breeze',
    description: `Ocean Breeze est un catamaran moderne et facile à manœuvrer, parfait pour une location en toute liberté au départ de Nice. Sa conception équilibrée et sa faible gîte en font un choix rassurant pour les skippers titulaires d'un permis souhaitant naviguer en autonomie.

Avec 4 cabines doubles, 10 couchages et de généreux espaces extérieurs, il offre tout le confort nécessaire pour une escapade en famille sur la Riviera. Cuisine équipée, eau chaude, bains de soleil et coin repas ombragé : tout est pensé pour profiter du soleil méditerranéen.

Naviguez vers Villefranche-sur-Mer, Cap-Ferrat, la baie de Beaulieu ou poussez jusqu'aux îles de Lérins. Ce bateau est proposé sans skipper (location seule) : un permis côtier et une expérience de la navigation sont requis. Un briefing complet est assuré au départ.`,
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
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Panneaux solaires'],
    lat: 43.7102,
    lng: 7.262,
  },
  {
    id: 105,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Vent du Large',
    description: `Vent du Large est un voilier convivial et maniable, idéal pour découvrir la navigation ou partager une belle sortie en petit comité au départ de La Rochelle. Sa taille raisonnable de 11,2 m le rend agréable à mener tout en offrant un vrai confort à bord.

Ses 2 cabines et 6 couchages, sa cuisine fonctionnelle et son cockpit accueillant conviennent parfaitement à un couple, une petite famille ou un groupe d'amis. Un excellent rapport qualité-prix pour s'initier à la croisière côtière.

Explorez les îles de Ré, d'Aix et d'Oléron, ou laissez-vous porter jusqu'au majestueux Fort Boyard. Voilier proposé avec skipper : idéal pour les débutants qui souhaitent apprendre, ou pour se laisser guider vers les plus beaux mouillages du pertuis charentais.`,
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
    equipment: [...NAV_SAFETY, ...COMFORT, 'Bimini / taud de soleil', 'Kit snorkeling (masques & tubas)'],
    lat: 46.1603,
    lng: -1.1511,
  },
  {
    id: 106,
    ownerId: 1,
    owner: { id: 1, firstName: 'Jean-Marc', lastName: 'T.', email: '', role: UserRole.OWNER, kycVerified: true, isActive: true, createdAt: '2019-03-15' },
    title: 'Majestic Star',
    description: `Majestic Star est un yacht à moteur d'exception qui incarne le luxe et le raffinement de la navigation en Méditerranée. Long de 18,5 m, il déploie des volumes impressionnants et des finitions haut de gamme pour une expérience digne des plus grandes croisières privées.

À bord, 4 cabines élégantes, un salon panoramique climatisé, un flybridge avec bain de soleil et un vaste cockpit arrière pour recevoir vos invités. Cuisine professionnelle, sonorisation immersive et prestations sur mesure : tout est réuni pour un séjour inoubliable au départ de Saint-Tropez.

Rejoignez rapidement les criques de Pampelonne, la baie de Cavalaire ou les îles d'Or grâce à sa motorisation puissante. Yacht proposé avec skipper professionnel (et équipage sur demande) pour un service irréprochable, de l'accueil à bord jusqu'au dernier coucher de soleil.`,
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
    equipment: [...NAV_SAFETY, ...COMFORT, ...LEISURE, 'Climatisation', 'Flybridge', 'Jet ski / jouets nautiques', 'Générateur'],
    lat: 43.2727,
    lng: 6.6407,
  },
]

export const DEMO_BOATS: Boat[] = DEMO_BOATS_BASE.map((boat) => ({
  ...boat,
  description: enrichDescription(boat),
}))

export function getDemoBoat(id: number): Boat | undefined {
  return DEMO_BOATS.find((b) => b.id === id)
}
