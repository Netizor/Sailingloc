export type TestimonialCategory = 'renter' | 'owner'

export interface Testimonial {
  id: number
  name: string
  role: string
  location: string
  boat?: string
  text: string
  rating: number
  avatar: string
  category: TestimonialCategory
  date: string
}

export const TESTIMONIAL_STATS = {
  averageRating: 4.9,
  totalReviews: 1247,
  satisfactionRate: 98,
  portsCount: 52,
} as const

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Sophie Martin',
    role: 'Locataire vérifiée',
    location: 'Marseille',
    boat: 'Voilier Dufour 382',
    text: 'Une expérience formidable ! Le propriétaire était super accueillant, le voilier en parfait état et la réservation ultra simple. Nous avons navigué jusqu\'aux Calanques sans stress.',
    rating: 5,
    avatar: 'SM',
    category: 'renter',
    date: 'Mars 2026',
  },
  {
    id: 2,
    name: 'Thomas Leroy',
    role: 'Propriétaire',
    location: 'La Rochelle',
    boat: 'Catamaran Lagoon 40',
    text: 'Première location via SailingLoc. La réservation était fluide, le prix transparent et le paiement sécurisé. Mon bateau est loué 14 semaines par an sans que je m\'en occupe.',
    rating: 5,
    avatar: 'TL',
    category: 'owner',
    date: 'Février 2026',
  },
  {
    id: 3,
    name: 'Claire Bernard',
    role: 'Locataire vérifiée',
    location: 'Nice',
    boat: 'Semi-rigide Zodiac Medline',
    text: 'Le skipper était exceptionnel, très pédagogue. Un week-end inoubliable sur la Méditerranée avec des enfants ravis. Je recommande à 100 %.',
    rating: 5,
    avatar: 'CB',
    category: 'renter',
    date: 'Janvier 2026',
  },
  {
    id: 4,
    name: 'Marc Dubois',
    role: 'Propriétaire',
    location: 'Brest',
    boat: 'Voilier Beneteau Oceanis 46',
    text: 'Interface claire, support réactif et locataires sérieux. SailingLoc m\'a permis de rentabiliser mon bateau tout en gardant la main sur mon calendrier.',
    rating: 5,
    avatar: 'MD',
    category: 'owner',
    date: 'Décembre 2025',
  },
  {
    id: 5,
    name: 'Émilie Rousseau',
    role: 'Locataire vérifiée',
    location: 'Cannes',
    boat: 'Yacht Azimut 55',
    text: 'Service premium du début à la fin. L\'équipe SailingLoc a répondu à toutes nos questions avant le départ. La caution a été restituée rapidement.',
    rating: 5,
    avatar: 'ER',
    category: 'renter',
    date: 'Novembre 2025',
  },
  {
    id: 6,
    name: 'Julien Petit',
    role: 'Locataire vérifié',
    location: 'Ajaccio',
    boat: 'Catamaran Fountaine Pajot',
    text: 'Navigation en Corse magnifique. Annonce fidèle aux photos, bateau impeccable et propriétaire disponible par message. Nous reviendrons l\'été prochain.',
    rating: 5,
    avatar: 'JP',
    category: 'renter',
    date: 'Octobre 2025',
  },
  {
    id: 7,
    name: 'Nathalie Girard',
    role: 'Propriétaire',
    location: 'Saint-Malo',
    boat: 'Voilier Jeanneau Sun Odyssey',
    text: 'J\'hésitais à louer mon bateau entre particuliers. SailingLoc m\'a rassurée avec l\'assurance, la vérification des locataires et un suivi humain.',
    rating: 4,
    avatar: 'NG',
    category: 'owner',
    date: 'Septembre 2025',
  },
  {
    id: 8,
    name: 'Alexandre Moreau',
    role: 'Locataire vérifié',
    location: 'Toulon',
    boat: 'Bateau à moteur Jeanneau Leader',
    text: 'Parfait pour une sortie en famille. Réservation en 5 minutes, check-in au port très simple. Le rapport qualité-prix est excellent.',
    rating: 5,
    avatar: 'AM',
    category: 'renter',
    date: 'Août 2025',
  },
  {
    id: 9,
    name: 'Isabelle Laurent',
    role: 'Propriétaire',
    location: 'Lorient',
    boat: 'Voilier Bavaria Cruiser',
    text: 'Trois saisons de location et toujours aussi satisfaite. Les revenus couvrent l\'entretien et une partie de l\'assurance. Plateforme sérieuse et professionnelle.',
    rating: 5,
    avatar: 'IL',
    category: 'owner',
    date: 'Juillet 2025',
  },
]

export const FEATURED_TESTIMONIAL = TESTIMONIALS[4]
