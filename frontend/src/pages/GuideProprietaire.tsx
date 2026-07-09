import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Anchor,
  Camera,
  CalendarDays,
  CreditCard,
  Star,
  CheckCircle,
  FileText,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Étapes pour mettre un bateau en location ─────────────────────────────────

// #1 - Référence de composant au lieu de JSX pré-rendu dans les données
interface Step {
  number: string
  icon: LucideIcon
  title: string
  desc: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Anchor,
    title: 'Créez votre compte propriétaire',
    desc: 'Inscrivez-vous gratuitement et sélectionnez le rôle "Propriétaire". Complétez votre profil avec vos informations et votre RIB pour préparer les futurs versements.',
  },
  {
    number: '02',
    icon: Camera,
    title: 'Publiez votre annonce',
    desc: 'Renseignez les caractéristiques de votre bateau (type, longueur, capacité, équipements) et ajoutez de belles photos. Une annonce complète attire 3× plus de locataires.',
  },
  {
    number: '03',
    icon: CalendarDays,
    title: 'Gérez vos disponibilités',
    desc: "Définissez votre calendrier de disponibilités, vos tarifs (journée, semaine) et votre politique d'annulation. Vous restez maître de votre planning à tout moment.",
  },
  {
    number: '04',
    icon: CreditCard,
    title: 'Recevez vos paiements',
    desc: "Dès qu'une réservation est confirmée, le paiement locataire est sécurisé via Stripe. Consultez vos revenus dans l'espace dédié.",
  },
  {
    number: '05',
    icon: Star,
    title: 'Construisez votre réputation',
    desc: 'Les avis des locataires boostent la visibilité de votre annonce. Un profil bien noté peut multiplier ses revenus par 2 en quelques mois.',
  },
]

// ─── Checklist documents requis ───────────────────────────────────────────────

const DOCUMENTS = [
  'Carte de circulation / Acte de francisation du bateau',
  "Pièce d'identité en cours de validité du propriétaire",
  "Attestation d'assurance navigation valide (responsabilité civile + dommages)",
  'Photos récentes du bateau (extérieur, intérieur, cockpit)',
  'Certificat de conformité ou procès-verbal de visite (si applicable)',
  'IBAN pour les futurs virements (Stripe Connect — phase 2)',
]

// ─── Estimateur de revenus ────────────────────────────────────────────────────

const DAILY_RATES: Record<string, number> = {
  'Semi-rigide': 120,
  'Bateau à moteur': 250,
  Voilier: 350,
  Catamaran: 600,
}

// #10 - Constantes nommées pour les valeurs magiques du calcul
/** Taux de commission prélevé par SailingLoc sur chaque location */
const PLATFORM_COMMISSION = 0.15
/** Durée indicative de la saison nautique (en mois) */
const SEASON_MONTHS = 10

// ─── Page Guide propriétaire ──────────────────────────────────────────────────

const GuideProprietaire: React.FC = () => {
  // #6 - Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle('Guide propriétaire')

  const [boatType, setBoatType] = useState('Voilier')
  const [daysPerMonth, setDaysPerMonth] = useState(8)

  const dailyRate = DAILY_RATES[boatType] ?? 350
  // #10 - Utilisation des constantes nommées
  const monthlyNet = Math.round(dailyRate * daysPerMonth * (1 - PLATFORM_COMMISSION))
  const yearlyNet = monthlyNet * SEASON_MONTHS

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* #2 - Hero extrait en composant partagé PageHero */}
      <PageHero
        icon={TrendingUp}
        badge="Guide propriétaire"
        title="Louez votre bateau, gagnez en sérénité"
        subtitle="Tout ce qu'il faut savoir pour mettre votre bateau en location sur SailingLoc et maximiser vos revenus."
      >
        <div className="mt-8">
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 bg-white text-ocean-800 font-semibold px-7 py-3 rounded-xl hover:bg-ocean-50 transition-colors text-sm"
          >
            Devenir propriétaire - c'est gratuit
          </Link>
        </div>
      </PageHero>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Étapes */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            5 étapes pour commencer à louer
          </h2>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex items-start gap-5"
              >
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <span className="text-2xl font-black text-ocean-200 dark:text-ocean-700">{step.number}</span>
                  <div className="bg-ocean-50 dark:bg-ocean-900/30 p-2 rounded-xl">
                    {/* #1 - Instanciation à la volée depuis la référence de composant */}
                    <step.icon size={22} className="text-ocean-600 dark:text-ocean-400" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{step.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Estimateur de revenus */}
        <section id="revenus" className="scroll-mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
                <TrendingUp size={20} className="text-ocean-700 dark:text-ocean-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Estimez vos revenus</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Type de bateau */}
              <div>
                {/* #5 - htmlFor/id pour l'accessibilité WCAG 2.1 */}
                <label htmlFor="boat-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Type de bateau
                </label>
                <select
                  id="boat-type"
                  value={boatType}
                  onChange={(e) => setBoatType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent bg-white dark:bg-gray-900"
                >
                  {Object.keys(DAILY_RATES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jours par mois */}
              <div>
                {/* #5 - htmlFor/id + attributs ARIA sur le range */}
                <label htmlFor="days-per-month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Jours loués par mois : <span className="text-ocean-700 dark:text-ocean-400 font-bold">{daysPerMonth}</span>
                </label>
                <input
                  id="days-per-month"
                  type="range"
                  min={1}
                  max={25}
                  value={daysPerMonth}
                  aria-valuenow={daysPerMonth}
                  aria-valuemin={1}
                  aria-valuemax={25}
                  onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                  className="w-full accent-ocean-600"
                />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                  <span>1 j</span>
                  <span>25 j</span>
                </div>
              </div>
            </div>

            {/* Résultats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tarif journalier moyen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dailyRate} €</p>
              </div>
              <div className="bg-ocean-50 dark:bg-ocean-900/30 rounded-xl p-4 text-center border border-ocean-100 dark:border-ocean-800">
                <p className="text-xs text-ocean-600 dark:text-ocean-400 mb-1">Revenus nets / mois</p>
                <p className="text-2xl font-bold text-ocean-800 dark:text-ocean-300">{monthlyNet} €</p>
              </div>
              <div className="bg-ocean-700 rounded-xl p-4 text-center">
                <p className="text-xs text-ocean-100 mb-1">Revenus nets / an ({SEASON_MONTHS} mois)</p>
                <p className="text-2xl font-bold text-white">{yearlyNet.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              * Estimation indicative après déduction de la commission SailingLoc (~{PLATFORM_COMMISSION * 100} %).
              Hors charges liées au bateau (entretien, port, assurance).
            </p>
          </div>
        </section>

        {/* Checklist documents */}
        <section>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
                <FileText size={20} className="text-ocean-700 dark:text-ocean-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Documents requis</h2>
            </div>
            <ul className="space-y-3">
              {DOCUMENTS.map((doc) => (
                <li key={doc} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={17} className="shrink-0 text-ocean-500 mt-0.5" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl border border-ocean-100 dark:border-ocean-800 p-10">
          <Anchor size={36} className="text-ocean-600 dark:text-ocean-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Prêt à louer votre bateau ?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            L'inscription est gratuite et sans engagement. Publiez votre première annonce en moins
            de 15 minutes.
          </p>
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            Créer mon compte propriétaire
          </Link>
        </section>
      </div>
    </div>
  )
}

export default GuideProprietaire
