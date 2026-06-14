import React from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Users, Newspaper, Briefcase, Mail } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { usePageTitle } from '../hooks/usePageTitle'

// ─── Données fictives ─────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  {
    initials: 'LM',
    name: 'Lucas Martin',
    role: 'Co-fondateur & CEO',
    bio: 'Passionné de voile depuis l\'enfance, Lucas a navigué sur tous les océans avant de créer SailingLoc pour partager cette passion.',
  },
  {
    initials: 'SC',
    name: 'Sophie Caron',
    role: 'Co-fondatrice & CTO',
    bio: "Ingénieure logiciel avec 10 ans d'expérience, Sophie pilote l'ensemble de la plateforme technique de SailingLoc.",
  },
  {
    initials: 'AR',
    name: 'Antoine Roux',
    role: 'Directeur des Opérations',
    bio: 'Antoine coordonne les relations avec les ports et les propriétaires de bateaux partenaires à travers la France.',
  },
  {
    initials: 'CL',
    name: 'Camille Lefèvre',
    role: 'Responsable Marketing',
    bio: 'Camille développe la communauté SailingLoc et imagine les campagnes qui font découvrir la plaisance au plus grand nombre.',
  },
]

const PRESS_ITEMS = [
  {
    date: '15 janvier 2026',
    title: 'SailingLoc lève 2 M€ pour accélérer son développement',
    outlet: 'Le Figaro Économie',
  },
  {
    date: '3 octobre 2025',
    title: 'La location de bateaux entre particuliers décolle en France',
    outlet: 'Le Monde',
  },
  {
    date: '18 juin 2025',
    title: 'SailingLoc : la startup qui veut démocratiser la navigation de plaisance',
    outlet: 'Challenges',
  },
]

const JOB_OFFERS = [
  {
    title: 'Développeur·se Full-Stack (React / Symfony)',
    type: 'CDI - Marseille / Remote',
    desc: "Rejoignez l'équipe tech pour construire les nouvelles fonctionnalités de la plateforme.",
  },
  {
    title: 'Chargé·e de partenariats portuaires',
    type: 'CDI - France entière',
    desc: 'Développez notre réseau de ports partenaires et accompagnez les propriétaires de bateaux.',
  },
  {
    title: 'Community Manager',
    type: 'Alternance - Marseille',
    desc: 'Animez nos réseaux sociaux et construisez la communauté des passionnés de voile SailingLoc.',
  },
]

// ─── Page À propos ─────────────────────────────────────────────────────────────

const APropos: React.FC = () => {
  // #6 - Titre de l'onglet pour le SEO et l'accessibilité
  usePageTitle('À propos de SailingLoc')

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
    {/* #2 - Hero extrait en composant partagé PageHero */}
    <PageHero
      icon={Anchor}
      badge="Notre histoire"
      title="À propos de SailingLoc"
      subtitle="La plateforme qui connecte locataires et propriétaires de bateaux en France et en Europe."
    />

    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {/* Mission */}
      <section id="a-propos" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
            <Anchor size={20} className="text-ocean-700 dark:text-ocean-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notre mission</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <p>
            SailingLoc est né d'un constat simple : des milliers de bateaux restent à quai chaque
            été, tandis que des passionnés de mer rêvent de naviguer sans pouvoir se payer un bateau.
            Notre mission est de connecter ces deux mondes.
          </p>
          <p>
            Fondée en 2024 à Marseille, SailingLoc est une plateforme de location de bateaux entre
            particuliers opérant dans plus de 50 ports français. Nous proposons voiliers, catamarans,
            bateaux à moteur et semi-rigides, pour toutes les expériences nautiques.
          </p>
          <p>
            Notre ambition : démocratiser la plaisance en rendant la mer accessible à tous, de façon
            sécurisée, simple et abordable. Chaque location est couverte par une assurance partenaire
            et chaque annonce est vérifiée par notre équipe.
          </p>
        </div>
      </section>

      {/* Équipe */}
      <section id="equipe" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
            <Users size={20} className="text-ocean-700 dark:text-ocean-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">L'équipe</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex items-start gap-4"
            >
              {/* Avatar initiales */}
              <div className="shrink-0 w-12 h-12 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold">
                {member.initials}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</p>
                <p className="text-xs text-ocean-600 dark:text-ocean-400 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Presse */}
      <section id="presse" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
            <Newspaper size={20} className="text-ocean-700 dark:text-ocean-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Presse</h2>
        </div>
        <div className="space-y-4">
          {PRESS_ITEMS.map((item) => (
            <div
              key={item.title}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex items-start gap-4"
            >
              <div className="shrink-0 text-xs text-gray-400 dark:text-gray-500 font-medium pt-0.5 min-w-[110px]">
                {item.date}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{item.title}</p>
                <p className="text-xs text-ocean-600 dark:text-ocean-400">{item.outlet}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Pour toute demande presse, contactez-nous à{' '}
          <a
            href="mailto:presse@sailingloc.fr"
            className="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 underline underline-offset-2"
          >
            presse@sailingloc.fr
          </a>
          .
        </p>
      </section>

      {/* Carrières */}
      <section id="carrieres" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-ocean-100 dark:bg-ocean-800/40 p-2.5 rounded-xl">
            <Briefcase size={20} className="text-ocean-700 dark:text-ocean-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Carrières</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Rejoignez une équipe passionnée qui réinvente la plaisance. Voici nos postes ouverts :
        </p>
        <div className="space-y-4">
          {JOB_OFFERS.map((job) => (
            <div
              key={job.title}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{job.title}</p>
                <span className="shrink-0 text-xs bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 border border-ocean-200 dark:border-ocean-700 px-2.5 py-1 rounded-full font-medium">
                  {job.type}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{job.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-ocean-50 dark:bg-ocean-900/30 rounded-2xl p-6 flex items-center gap-4 border border-ocean-100 dark:border-ocean-800">
          <Mail size={24} className="shrink-0 text-ocean-600 dark:text-ocean-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">Candidature spontanée</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vous ne trouvez pas le poste idéal ?{' '}
              <Link
                to="/contact"
                className="text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 underline underline-offset-2"
              >
                Contactez-nous
              </Link>{' '}
              avec votre CV et votre lettre de motivation.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
  )
}

export default APropos
