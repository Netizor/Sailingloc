import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapPin, Anchor } from 'lucide-react'

// Ports populaires (à enrichir avec l'API si disponible)
const POPULAR_PORTS = [
  { slug: 'marseille',       label: 'Marseille',        region: 'PACA', emoji: '⛵' },
  { slug: 'nice',            label: 'Nice',             region: 'PACA', emoji: '🌊' },
  { slug: 'saint-tropez',    label: 'Saint-Tropez',     region: 'PACA', emoji: '☀️' },
  { slug: 'cannes',          label: 'Cannes',           region: 'PACA', emoji: '🎭' },
  { slug: 'antibes',         label: 'Antibes',          region: 'PACA', emoji: '⚓' },
  { slug: 'toulon',          label: 'Toulon',           region: 'PACA', emoji: '🛥️' },
  { slug: 'la-rochelle',     label: 'La Rochelle',      region: 'Atlantique', emoji: '🌅' },
  { slug: 'brest',           label: 'Brest',            region: 'Bretagne', emoji: '🌬️' },
  { slug: 'bordeaux',        label: 'Bordeaux',         region: 'Atlantique', emoji: '🍷' },
  { slug: 'sete',            label: 'Sète',             region: 'Méditerranée', emoji: '🎣' },
  { slug: 'ajaccio',         label: 'Ajaccio',          region: 'Corse', emoji: '🏝️' },
  { slug: 'bastia',          label: 'Bastia',           region: 'Corse', emoji: '🌺' },
]

const Destinations: React.FC = () => (
  <>
    <Helmet>
      <title>Destinations — SailingLoc</title>
      <meta name="description" content="Découvrez les plus beaux ports de France pour votre prochaine aventure en mer : Marseille, Nice, Saint-Tropez, La Rochelle…" />
      <meta property="og:title" content="Destinations de navigation — SailingLoc" />
      <meta property="og:description" content="Explorez nos destinations de navigation en France et louez un bateau facilement." />
      <meta property="og:type" content="website" />
    </Helmet>
  <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
    {/* Hero */}
    <div className="bg-ocean-700 text-white py-14 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <Anchor size={40} className="mx-auto mb-4 text-ocean-300" />
        <h1 className="text-2xl sm:text-4xl font-bold mb-3">Nos destinations</h1>
        <p className="text-ocean-200 text-lg">
          Découvrez les plus beaux ports de France pour votre prochaine aventure en mer.
        </p>
      </div>
    </div>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POPULAR_PORTS.map(({ slug, label, region, emoji }) => (
          <Link
            key={slug}
            to={`/destinations/${slug}`}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 hover:border-ocean-300 dark:hover:border-ocean-700 hover:shadow-md transition-all duration-200 flex items-center gap-4"
          >
            <div className="h-14 w-14 rounded-xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-ocean-100 dark:group-hover:bg-ocean-800/40 transition-colors">
              {emoji}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                {label}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin size={11} />
                {region}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
          Vous ne trouvez pas votre port ?
        </p>
        <Link
          to="/bateaux"
          className="inline-flex items-center gap-2 text-sm font-medium text-ocean-700 dark:text-ocean-400 hover:text-ocean-900 border border-ocean-200 dark:border-ocean-700 hover:border-ocean-400 px-4 py-2 rounded-lg transition-colors"
        >
          <Anchor size={14} />
          Recherche libre par port
        </Link>
      </div>
    </div>
  </div>
  </>
)

export default Destinations
