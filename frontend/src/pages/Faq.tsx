import React, { useMemo, useId, useState } from 'react'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'

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
      'Recherchez un bateau via notre moteur de recherche en indiquant votre port, vos dates et le nombre de personnes. Consultez les annonces disponibles, choisissez celle qui vous convient et cliquez sur "Réserver". Vous serez guidé étape par étape jusqu\'au paiement sécurisé.',
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
      'Le montant total est pré-autorisé lors de la réservation. Il est effectivement débité dès que le propriétaire confirme votre demande. Si la demande expire ou est refusée, l\'autorisation est annulée et aucune somme n\'est prélevée.',
  },
  {
    id: 'pai-caution',
    category: 'paiements',
    question: 'Comment fonctionne la caution ?',
    answer:
      'Une caution peut être définie par le propriétaire. Elle fait l\'objet d\'une pré-autorisation sur votre carte, sans débit réel, au moment de la confirmation. Elle est libérée automatiquement à la fin de la location si aucun dommage n\'est signalé.',
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
      'SailingLoc prélève des frais de service sur chaque transaction : environ 10 % à la charge du locataire et une commission prélevée sur le versement du propriétaire. Ces montants sont toujours affichés clairement avant la confirmation de réservation.',
  },

  // Propriétaires
  {
    id: 'pro-mettre-en-location',
    category: 'proprietaires',
    question: 'Comment mettre mon bateau en location ?',
    answer:
      'Créez un compte, sélectionnez le rôle "Propriétaire" puis accédez à votre espace propriétaire. Cliquez sur "Ajouter un bateau", renseignez les informations (type, capacité, équipements, tarif) et ajoutez des photos. Votre annonce sera visible dès validation.',
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
      'SailingLoc prélève une commission sur chaque réservation confirmée, déduite du montant reversé. Le taux est affiché dans votre espace propriétaire. Plus vous louez, plus vous pouvez bénéficier de tarifs préférentiels.',
  },
  {
    id: 'pro-paiements',
    category: 'proprietaires',
    question: 'Comment et quand reçois-je mes paiements ?',
    answer:
      'Les paiements sont versés sur votre compte bancaire via Stripe Connect dans les 2 à 5 jours ouvrés suivant la fin de la location. Vous pouvez consulter l\'historique de vos versements dans votre tableau de bord "Revenus".',
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
      'Chaque propriétaire doit fournir une assurance navigation valide couvrant la location à tiers. SailingLoc vérifie ces documents avant la mise en ligne. Nous vous recommandons de vérifier les conditions de couverture directement avec le propriétaire avant votre départ.',
  },
  {
    id: 'sec-dommages',
    category: 'securite',
    question: 'Que se passe-t-il en cas de dommage pendant la location ?',
    answer:
      'En cas de dommage, signalez-le immédiatement via la messagerie et remplissez le formulaire d\'incident disponible dans votre réservation. SailingLoc sert de médiateur entre locataire et propriétaire. La caution peut être partiellement ou totalement retenue selon les constats.',
  },
  {
    id: 'sec-verification-locataires',
    category: 'securite',
    question: 'Comment SailingLoc vérifie-t-il les locataires ?',
    answer:
      'Lors de l\'inscription, les locataires doivent fournir une pièce d\'identité valide. Un système d\'évaluation permet aux propriétaires de consulter les avis laissés par d\'autres membres. Les profils non vérifiés sont signalés aux propriétaires.',
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
      <section className="bg-gradient-to-br from-ocean-900 to-ocean-700 text-white py-20 px-4 text-center">
        <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <HelpCircle size={15} />
          Centre d'aide
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Questions fréquentes
        </h1>
        <p className="text-lg text-ocean-100 max-w-xl mx-auto">
          Retrouvez les réponses aux questions les plus posées sur SailingLoc.
          Vous ne trouvez pas ce que vous cherchez ? Contactez-nous.
        </p>
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
          <a
            href="mailto:contact@sailingloc.fr"
            className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  )
}

export default Faq
