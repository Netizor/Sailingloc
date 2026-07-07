import type { Boat } from '../types'
import { BoatType } from '../types'
import { BOAT_TYPE_LABELS } from './labels'

/**
 * Contenu "métier" partagé pour la fiche bateau.
 *
 * Objectif : que la page de détail d'un bateau soit IDENTIQUE quelle que soit
 * sa provenance (API / base de données ou bateaux de démonstration). Les
 * bateaux issus de l'API ont parfois une description courte et peu d'équipements ;
 * on complète alors avec une base professionnelle cohérente, sans écraser les
 * informations déjà renseignées par le propriétaire.
 */

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

const COMFORT = [
  'Cuisine équipée (gazinière, four)',
  'Réfrigérateur / glacière',
  'Eau chaude & douche',
  'Literie et linge de maison fournis',
  'Wi-Fi 4G à bord',
  'Sonorisation Bluetooth',
  'Prises USB & convertisseur 220V',
]

const LEISURE = [
  'Bimini / taud de soleil',
  'Coussins de bain de soleil',
  'Kit snorkeling (masques & tubas)',
  'Paddle (SUP)',
  'Douchette de pont',
]

const TYPE_EXTRAS: Partial<Record<BoatType, string[]>> = {
  [BoatType.SAILBOAT]: ['Enrouleur de génois', 'Lazy bag', 'Panneaux solaires'],
  [BoatType.CATAMARAN]: ['Trampolines', 'Panneaux solaires', 'Climatisation'],
  [BoatType.MOTORBOAT]: ['Climatisation', 'Coussins de bain de soleil'],
  [BoatType.YACHT]: ['Climatisation', 'Flybridge', 'Générateur', 'Jouets nautiques'],
}

/**
 * Retourne une liste d'équipements complète et professionnelle pour un bateau.
 * Les équipements déjà renseignés sont conservés et placés en tête.
 */
export function getBoatEquipment(boat: Pick<Boat, 'type' | 'equipment'>): string[] {
  const existing = (boat.equipment ?? []).filter(Boolean)
  const base = [...NAV_SAFETY, ...COMFORT, ...LEISURE, ...(TYPE_EXTRAS[boat.type] ?? [])]
  return Array.from(new Set([...existing, ...base]))
}

type DescBoat = Pick<Boat, 'type' | 'cabins' | 'capacity' | 'withSkipper' | 'description'>

function skipperParagraph(boat: DescBoat): string {
  return boat.withSkipper
    ? `L'option skipper est particulièrement recommandée si vous souhaitez une sortie sans stress : il prépare l'itinéraire selon la météo, gère les manœuvres au port, choisit les mouillages adaptés et vous conseille sur les criques, pauses baignade et restaurants accessibles par la mer. C'est aussi la solution idéale si vous n'avez pas le permis ou si vous voulez simplement profiter du bateau avec vos invités.`
    : `La location se fait sans skipper, en autonomie. Elle s'adresse aux plaisanciers disposant du permis adapté et d'une expérience suffisante pour gérer la navigation, l'accostage et la sécurité à bord. Un briefing complet est prévu avant le départ : fonctionnement du bateau, zones conseillées, carburant, équipements de sécurité et procédure de retour.`
}

/**
 * Complète la description d'un bateau si elle est trop courte, afin d'obtenir
 * une fiche homogène et détaillée pour toutes les annonces.
 */
export function getEnrichedDescription(boat: DescBoat): string {
  const typeLabel = (BOAT_TYPE_LABELS[boat.type] ?? 'bateau').toLowerCase()
  const original = (boat.description ?? '').trim()

  // Description déjà riche : on n'ajoute rien.
  if (original.length >= 600) return original

  const cabins = boat.cabins && boat.cabins > 0 ? boat.cabins : Math.max(2, Math.floor(boat.capacity / 3))

  const extra = `Ce ${typeLabel} est pensé pour une réservation simple et rassurante. Avant l'embarquement, le propriétaire valide avec vous le programme souhaité, le niveau d'expérience du groupe et les conditions météo afin de proposer un départ cohérent et sécurisé. Vous savez exactement ce qui est inclus, ce qu'il faut prévoir à bord et comment se déroule la prise en main.

Côté confort, le bateau dispose de ${cabins} cabine${cabins > 1 ? 's' : ''}, d'espaces extérieurs pour se détendre, d'un coin repas convivial et d'équipements pratiques pour passer une journée ou plusieurs nuits à bord. Les rangements, la cuisine, l'eau douce, les prises et l'électronique de navigation permettent de voyager avec sérénité, même pour une première croisière.

${skipperParagraph(boat)}

Pour préparer votre réservation, indiquez le nombre de passagers, la durée souhaitée, votre expérience nautique et le style de sortie recherché : journée baignade, coucher de soleil, week-end en mer, croisière familiale ou navigation sportive. Le propriétaire pourra ainsi confirmer les meilleures dates, adapter le programme et vous répondre rapidement avec des conseils personnalisés.`

  return original ? `${original}\n\n${extra}` : extra
}
