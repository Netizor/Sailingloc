import React, { useMemo, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'all' | 'reservations' | 'paiements' | 'proprietaires' | 'securite'

interface FaqQuestion {
  // Identifiant stable pour la clé React et les refs ARIA
  id: string
  question: string
  answer: string
  category: Exclude<Category, 'all'>
}

// ─── Données ──────────────────────────────────────────────────────────────────

const FAQ_DATA: FaqQuestion[] = [
  // Réservations
  {
    id: 'res-comment-reserver',
    category: 'reservations',
    question: 'Comment réserver un bateau sur SailingLoc ?',
    answer:
      'Inscrivez-vous, puis recherchez un bateau (port, dates, nombre de personnes) en France, en Europe ou à l\'international. Choisissez une annonce et cliquez sur « Réserver » : vous êtes guidé jusqu\'au paiement sécurisé. La réservation confirmée constitue un contrat de location entre vous et le propriétaire.',
  },
  {
    id: 'res-contrat',
    category: 'reservations',
    question: 'Comment fonctionnent les contrats de location ?',
    answer:
      'SailingLoc est une plateforme de location entre particuliers inscrits uniquement. Toute réservation confirmée établit un contrat de location entre le locataire et le propriétaire. SailingLoc agit comme intermédiaire et ne remplace pas les obligations de chaque partie.',
  },
  {
    id: 'res-annuler',
    category: 'reservations',
    question: 'Puis-je annuler ma réservation ?',
    answer:
      'Oui, vous pouvez annuler depuis votre espace "Mes réservations". Les conditions de remboursement dépendent de la politique d\'annulation choisie par le propriétaire (flexible, modérée ou stricte) et du délai avant le départ.',
  },
  {
    id: 'res-refus',
    category: 'reservations',
    question: 'Que se passe-t-il si le propriétaire refuse ma demande ?',
    answer:
      'En cas de refus, aucun montant n\'est débité et votre demande est clôturée. Vous recevez une notification et pouvez immédiatement rechercher un autre bateau. SailingLoc ne facture rien en cas de refus.',
  },
  {
    id: 'res-delai',
    category: 'reservations',
    question: 'Combien de temps à l\'avance dois-je réserver ?',
    answer:
      'Il n\'y a pas de délai minimum imposé par SailingLoc, mais chaque propriétaire peut définir un préavis minimal (par exemple 24 h ou 48 h). Ce délai est affiché sur l\'annonce. Nous recommandons de réserver au moins une semaine à l\'avance en haute saison.',
  },
  {
    id: 'res-modifier-dates',
    category: 'reservations',
    question: 'Puis-je modifier les dates après validation ?',
    answer:
      'La modification de dates après confirmation nécessite l\'accord du propriétaire. Contactez-le via la messagerie intégrée. Si un accord est trouvé, la réservation sera annulée et recréée avec les nouvelles dates, selon la politique d\'annulation en vigueur.',
  },

  // Paiements
  {
    id: 'pai-modes',
    category: 'paiements',
    question: 'Quels modes de paiement sont acceptés ?',
    answer:
      'SailingLoc accepte les principales cartes bancaires (Visa, Mastercard, American Express) via Stripe, notre partenaire de paiement sécurisé. Les virements bancaires et espèces ne sont pas acceptés sur la plateforme.',
  },
  {
    id: 'pai-debit',
    category: 'paiements',
    question: 'Quand suis-je débité ?',
    answer:
      'Le montant total est débité en ligne via Stripe dès que vous confirmez votre réservation. La réservation passe automatiquement au statut « Confirmée » après paiement réussi.',
  },
  {
    id: 'pai-caution',
    category: 'paiements',
    question: 'Comment fonctionne la caution ?',
    answer:
      'Le propriétaire peut définir un montant de caution dans son annonce. Ce montant est affiché à titre informatif : la gestion concrète (empreinte bancaire ou dépôt) se fait directement entre locataire et propriétaire avant le départ.',
  },
  {
    id: 'pai-remboursement',
    category: 'paiements',
    question: 'Puis-je obtenir un remboursement en cas d\'annulation ?',
    answer:
      'Oui, sous réserve de la politique d\'annulation du propriétaire. En politique flexible, vous êtes remboursé intégralement jusqu\'à 24 h avant le départ. En politique stricte, seuls 50 % peuvent être remboursés. Les frais de service SailingLoc sont non remboursables.',
  },
  {
    id: 'pai-frais',
    category: 'paiements',
    question: 'Quels sont les frais de service ?',
    answer:
      'SailingLoc encaisse 10 % de chaque transaction confirmée. Le montant exact des frais de service est toujours affiché clairement avant la confirmation de réservation.',
  },

  // Propriétaires
  {
    id: 'pro-mettre-en-location',
    category: 'proprietaires',
    question: 'Comment mettre mon bateau en location ?',
    answer:
      'Créez un compte particulier, sélectionnez le rôle « Propriétaire », puis ajoutez votre bateau (type, capacité, équipements, tarif, photos). Après vérification, votre annonce est publiée : vous louez uniquement à d\'autres particuliers inscrits, via un contrat de location établi à chaque réservation.',
  },
  {
    id: 'pro-documents',
    category: 'proprietaires',
    question: 'Quels documents sont requis pour publier une annonce ?',
    answer:
      'Vous devez fournir les documents d\'immatriculation du bateau, votre pièce d\'identité, et une attestation d\'assurance navigation valide. Ces documents sont vérifiés par notre équipe avant la mise en ligne de votre annonce.',
  },
  {
    id: 'pro-commissions',
    category: 'proprietaires',
    question: 'Comment sont calculées les commissions SailingLoc ?',
    answer:
      'SailingLoc encaisse 10 % de chaque transaction confirmée. Le détail est affiché avant validation de la réservation et dans votre espace propriétaire (revenus).',
  },
  {
    id: 'pro-paiements',
    category: 'proprietaires',
    question: 'Comment et quand reçois-je mes paiements ?',
    answer:
      'Le locataire paie en ligne via Stripe lors de la réservation. Le versement au propriétaire est suivi dans l\'espace « Revenus ». Les virements automatiques via Stripe Connect sont prévus en phase 2.',
  },
  {
    id: 'pro-bloquer-dates',
    category: 'proprietaires',
    question: 'Puis-je bloquer des dates sur mon calendrier ?',
    answer:
      'Oui, depuis votre espace propriétaire, accédez à "Disponibilités" pour chaque bateau. Vous pouvez bloquer des périodes pour usage personnel, entretien ou toute autre raison. Ces dates n\'apparaîtront pas comme disponibles pour les locataires.',
  },

  // Sécurité
  {
    id: 'sec-assurance',
    category: 'securite',
    question: 'Les bateaux sont-ils couverts par une assurance ?',
    answer:
      'Chaque propriétaire doit fournir une assurance navigation valide couvrant la location à tiers. SailingLoc vérifie ces documents avant la mise en ligne et collabore avec des partenaires assurance. Vérifiez aussi les conditions de couverture avec le propriétaire avant le départ.',
  },
  {
    id: 'sec-dommages',
    category: 'securite',
    question: 'Que se passe-t-il en cas de dommage pendant la location ?',
    answer:
      'En cas de dommage, signalez-le immédiatement via la messagerie et remplissez le formulaire d\'incident disponible dans votre réservation. SailingLoc sert de médiateur entre locataire et propriétaire. La caution éventuelle est gérée directement entre les parties selon les constats.',
  },
  {
    id: 'sec-verification-locataires',
    category: 'securite',
    question: 'Comment SailingLoc vérifie-t-il les locataires ?',
    answer:
      'Seuls les utilisateurs inscrits peuvent réserver. Lors de l\'inscription, les locataires doivent fournir une pièce d\'identité valide. Un système d\'évaluation permet aux propriétaires de consulter les avis laissés par d\'autres membres. Les profils non vérifiés sont signalés aux propriétaires.',
  },
  {
    id: 'sec-permis',
    category: 'securite',
    question: 'Un permis bateau est-il obligatoire ?',
    answer:
      'Cela dépend du type de bateau et de la zone de navigation. Pour les bateaux de plus de 6 CV en mer ou sur les lacs réglementés, un permis plaisance est obligatoire. Le propriétaire indique dans son annonce si un permis est requis.',
  },
  {
    id: 'sec-verification-proprietaires',
    category: 'securite',
    question: 'SailingLoc vérifie-t-il l\'identité des propriétaires ?',
    answer:
      'Oui. Avant toute publication d\'annonce, les propriétaires sont soumis à une vérification d\'identité et de documents (pièce d\'identité, titre de propriété ou contrat de gérance du bateau, assurance). Ce processus garantit la fiabilité des annonces publiées.',
  },
]

// ─── Onglets de catégorie ─────────────────────────────────────────────────────

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'reservations', label: 'Réservations' },
  { key: 'paiements', label: 'Paiements' },
  { key: 'proprietaires', label: 'Propriétaires' },
  { key: 'securite', label: 'Sécurité' },
]

// ─── Composant accordéon ──────────────────────────────────────────────────────

interface FaqItemProps {
  question: string
  answer: string
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false)
  // Identifiant unique stable pour relier le bouton à son panneau (WAI-ARIA accordion)
  const panelId = useId()

  return (
    <div className="py-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 text-left group"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
          {question}
        </span>
        {/* Rotation 180° à l'ouverture via CSS grid trick */}
        <ChevronDown
          size={20}
          className={`shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Animation CSS grid : grid-rows-[0fr] → grid-rows-[1fr] */}
      <div
        id={panelId}
        role="region"
        aria-label={question}
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page FAQ ─────────────────────────────────────────────────────────────────

const Faq: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('all')

  usePageTitle('FAQ - SailingLoc')

  // Mémoïsation du filtrage pour éviter un recalcul à chaque rendu
  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? FAQ_DATA
        : FAQ_DATA.filter((item) => item.category === activeCategory),
    [activeCategory],
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Hero */}
      <section className="relative min-h-[420px] sm:min-h-[480px] flex items-center justify-center text-center px-4">
        <img
          src="/boat-navigating-through-canyon.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071d49]/80 via-[#071d49]/65 to-[#071d49]/85" />
        <div className="relative z-10 max-w-2xl py-20 text-white">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <HelpCircle size={15} />
            Centre d'aide
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-4">
            Questions fréquentes
          </h1>
          <p className="text-lg text-white/85 leading-relaxed">
            Réservations, contrats entre particuliers, paiements et sécurité :
            les réponses essentielles pour louer ou proposer un bateau sur SailingLoc.
            Vous ne trouvez pas ce que vous cherchez ?{' '}
            <Link to="/contact" className="text-teal-300 hover:text-teal-200 underline underline-offset-2">
              Contactez-nous
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Onglets de catégorie - même style que OwnerBookings, sémantique ARIA tablist */}
        <div
          role="tablist"
          aria-label="Catégories de questions"
          className="flex flex-wrap gap-1 mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl p-1 w-fit"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeCategory === tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeCategory === tab.key
                  ? 'bg-ocean-700 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Accordéon */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700 px-6">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <FaqItem key={item.id} question={item.question} answer={item.answer} />
            ))
          ) : (
            // Garde défensive : affiché si une catégorie venait à être vide
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Aucune question dans cette catégorie.
            </p>
          )}
        </div>

        {/* CTA de fin de page */}
        <div className="mt-10 bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl p-8 text-center border border-ocean-100 dark:border-ocean-800">
          <MessageCircle size={32} className="text-ocean-600 dark:text-ocean-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Notre équipe est disponible pour vous aider du lundi au vendredi, de 9 h à 18 h.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Faq
