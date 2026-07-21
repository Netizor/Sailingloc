export type TestimonialCategory = 'renter' | 'owner'

export interface LocalizedText {
  fr: string
  en: string
}

export interface Testimonial {
  id: number
  name: string
  role: LocalizedText
  location: string
  boat?: LocalizedText
  text: LocalizedText
  rating: number
  avatar: string
  category: TestimonialCategory
  date: LocalizedText
}

export const TESTIMONIAL_STATS = {
  averageRating: 4.9,
  totalReviews: 1247,
  satisfactionRate: 98,
  portsCount: 52,
} as const

/**
 * Pick the localized value matching the current i18n language.
 * Defaults to English unless the language starts with "fr".
 */
export function pickLocale<T extends LocalizedText | undefined>(
  value: T,
  lang: string,
): string | undefined {
  if (!value) return undefined
  return lang.startsWith('fr') ? value.fr : value.en
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Sophie Martin',
    role: { fr: 'Locataire vérifiée', en: 'Verified renter' },
    location: 'Marseille',
    boat: { fr: 'Voilier Dufour 382', en: 'Dufour 382 sailboat' },
    text: {
      fr: "Une expérience incroyable ! Le propriétaire était très accueillant, le voilier en parfait état et la réservation s'est faite sans effort. Nous avons navigué vers les Calanques sans aucun stress.",
      en: 'An amazing experience! The owner was very welcoming, the sailboat was in perfect condition and booking was effortless. We sailed to the Calanques stress-free.',
    },
    rating: 5,
    avatar: 'SM',
    category: 'renter',
    date: { fr: 'Mars 2026', en: 'March 2026' },
  },
  {
    id: 2,
    name: 'Thomas Leroy',
    role: { fr: 'Propriétaire', en: 'Owner' },
    location: 'La Rochelle',
    boat: { fr: 'Catamaran Lagoon 40', en: 'Lagoon 40 catamaran' },
    text: {
      fr: "Première location via SailingLoc. La réservation s'est déroulée sans accroc, les tarifs étaient transparents et le paiement sécurisé. Mon bateau est loué 14 semaines par an sans que j'aie à tout gérer.",
      en: 'First rental through SailingLoc. Booking was smooth, pricing was transparent and payment was secure. My boat is rented 14 weeks a year without me having to manage everything.',
    },
    rating: 5,
    avatar: 'TL',
    category: 'owner',
    date: { fr: 'Février 2026', en: 'February 2026' },
  },
  {
    id: 3,
    name: 'Claire Bernard',
    role: { fr: 'Locataire vérifiée', en: 'Verified renter' },
    location: 'Nice',
    boat: { fr: 'Semi-rigide Zodiac Medline', en: 'Zodiac Medline RIB' },
    text: {
      fr: "Le skipper était exceptionnel et très pédagogue. Un week-end inoubliable en Méditerranée avec des enfants ravis. Je recommande à 100%.",
      en: 'The skipper was outstanding and very educational. An unforgettable weekend on the Mediterranean with delighted kids. I recommend it 100%.',
    },
    rating: 5,
    avatar: 'CB',
    category: 'renter',
    date: { fr: 'Janvier 2026', en: 'January 2026' },
  },
  {
    id: 4,
    name: 'Marc Dubois',
    role: { fr: 'Propriétaire', en: 'Owner' },
    location: 'Brest',
    boat: { fr: 'Voilier Beneteau Oceanis 46', en: 'Beneteau Oceanis 46 sailboat' },
    text: {
      fr: "Interface claire, support réactif et locataires sérieux. SailingLoc m'a aidé à valoriser mon bateau tout en gardant le contrôle total de mon calendrier.",
      en: 'Clear interface, responsive support and serious renters. SailingLoc helped me monetize my boat while keeping full control of my calendar.',
    },
    rating: 5,
    avatar: 'MD',
    category: 'owner',
    date: { fr: 'Décembre 2025', en: 'December 2025' },
  },
  {
    id: 5,
    name: 'Emilie Rousseau',
    role: { fr: 'Locataire vérifiée', en: 'Verified renter' },
    location: 'Cannes',
    boat: { fr: 'Yacht Azimut 55', en: 'Azimut 55 yacht' },
    text: {
      fr: "Un service haut de gamme du début à la fin. L'équipe SailingLoc a répondu à toutes nos questions avant le départ. La caution a été restituée rapidement.",
      en: 'Premium service from start to finish. The SailingLoc team answered all our questions before departure. The deposit was returned quickly.',
    },
    rating: 5,
    avatar: 'ER',
    category: 'renter',
    date: { fr: 'Novembre 2025', en: 'November 2025' },
  },
  {
    id: 6,
    name: 'Julien Petit',
    role: { fr: 'Locataire vérifié', en: 'Verified renter' },
    location: 'Ajaccio',
    boat: { fr: 'Catamaran Fountaine Pajot', en: 'Fountaine Pajot catamaran' },
    text: {
      fr: "Une magnifique navigation en Corse. L'annonce correspondait parfaitement aux photos, le bateau était impeccable et le propriétaire très réactif par message. On reviendra l'été prochain.",
      en: 'Beautiful sailing in Corsica. The listing matched the photos, the boat was spotless and the owner was responsive by message. We will be back next summer.',
    },
    rating: 5,
    avatar: 'JP',
    category: 'renter',
    date: { fr: 'Octobre 2025', en: 'October 2025' },
  },
  {
    id: 7,
    name: 'Nathalie Girard',
    role: { fr: 'Propriétaire', en: 'Owner' },
    location: 'Saint-Malo',
    boat: { fr: 'Voilier Jeanneau Sun Odyssey', en: 'Jeanneau Sun Odyssey sailboat' },
    text: {
      fr: "J'hésitais à louer mon bateau entre particuliers. SailingLoc m'a rassurée grâce à l'assurance, la vérification des locataires et un vrai support humain.",
      en: 'I was hesitant to rent my boat peer-to-peer. SailingLoc reassured me with insurance, renter verification and real human support.',
    },
    rating: 4,
    avatar: 'NG',
    category: 'owner',
    date: { fr: 'Septembre 2025', en: 'September 2025' },
  },
  {
    id: 8,
    name: 'Alexandre Moreau',
    role: { fr: 'Locataire vérifié', en: 'Verified renter' },
    location: 'Toulon',
    boat: { fr: 'Bateau à moteur Jeanneau Leader', en: 'Jeanneau Leader motorboat' },
    text: {
      fr: "Parfait pour une sortie en famille. Réservé en 5 minutes, l'accueil au port était simple. Excellent rapport qualité-prix.",
      en: 'Perfect for a family day out. Booked in 5 minutes, check-in at the marina was simple. Excellent value for money.',
    },
    rating: 5,
    avatar: 'AM',
    category: 'renter',
    date: { fr: 'Août 2025', en: 'August 2025' },
  },
  {
    id: 9,
    name: 'Isabelle Laurent',
    role: { fr: 'Propriétaire', en: 'Owner' },
    location: 'Lorient',
    boat: { fr: 'Voilier Bavaria Cruiser', en: 'Bavaria Cruiser sailboat' },
    text: {
      fr: "Trois saisons de location et toujours aussi satisfaite. Les revenus couvrent l'entretien et une partie de l'assurance. Une plateforme sérieuse et professionnelle.",
      en: 'Three rental seasons and still just as happy. The income covers maintenance and part of the insurance. A serious, professional platform.',
    },
    rating: 5,
    avatar: 'IL',
    category: 'owner',
    date: { fr: 'Juillet 2025', en: 'July 2025' },
  },
]

export const FEATURED_TESTIMONIAL = TESTIMONIALS[4]
