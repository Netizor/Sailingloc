import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ConciergeBell,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

const STATS = [
  { value: '150+', label: 'Unités en gestion' },
  { value: '4.9/5', label: 'Note Propriétaires' },
  { value: '12M€', label: 'Revenus Générés' },
  { value: '24h', label: 'Support Propriétaire' },
]

const STEPS = [
  {
    number: 1,
    title: 'Évaluation gratuite',
    desc: 'Nos experts analysent le potentiel locatif de votre unité sous 48h.',
  },
  {
    number: 2,
    title: 'Mise en ligne',
    desc: 'Shooting photo professionnel et annonce optimisée pour le référencement.',
  },
  {
    number: 3,
    title: 'Gagnez & Naviguez',
    desc: 'Percevez des revenus tout en conservant vos dates pour naviguer.',
  },
]

const DevenirProprietaire: React.FC = () => {
  const navigate = useNavigate()
  usePageTitle('Devenir Propriétaire')

  const goToAuth = () => navigate('/devenir-proprietaire/commencer')

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative min-h-[520px] sm:min-h-[600px] flex items-center">
        <img
          src="/view-luxurious-yacht-water.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div className="relative z-10 w-full px-[10%] py-20">
          <span className="inline-block text-[11px] font-bold tracking-widest text-brand-blue bg-white/95 px-3 py-1 rounded-md uppercase mb-5">
            Exclusivité &amp; Sérénité
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-2xl leading-tight mb-4">
            Optimisez la gestion de votre unité d'exception.
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            Rejoignez SailingLoc et transformez votre passion nautique en un investissement serein et performant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={goToAuth}
              className="px-8 py-3.5 text-sm font-semibold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-xl transition-colors"
            >
              Commencer
            </button>
            <a
              href="#pourquoi"
              className="px-8 py-3.5 text-sm font-semibold text-white border-2 border-white/60 hover:bg-white/10 rounded-xl transition-colors text-center"
            >
              En savoir plus
            </a>
          </div>
        </div>
      </section>

      {/* Pourquoi SailingLoc */}
      <section id="pourquoi" className="px-[10%] py-16 sm:py-20 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Pourquoi confier votre bateau à SailingLoc ?
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Une gestion clé en main, des revenus optimisés et une tranquillité d'esprit totale pour les propriétaires exigeants.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden min-h-[320px] group">
            <img
              src="/view-luxurious-cruise-ship.jpg"
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <TrendingUp size={28} className="mb-3 text-brand-blue" />
              <h3 className="text-xl font-bold mb-2">Revenus Locatifs Optimisés</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Algorithmes de tarification dynamique pour maximiser votre rentabilité selon la saison et la demande.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex-1">
              <ShieldCheck size={28} className="text-brand-navy mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Locations Sécurisées</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Sélection rigoureuse des locataires, assurance navigation et paiements sécurisés via Stripe.
              </p>
            </div>
            <div className="bg-brand-teal rounded-2xl p-8 flex-1 text-white">
              <ConciergeBell size={28} className="mb-4 text-white/90" />
              <h3 className="text-lg font-bold mb-2">Conciergerie Dédiée</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Maintenance, accueil des locataires et gestion opérationnelle prise en charge par nos équipes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="bg-brand-navy py-12">
        <div className="px-[10%] grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Parcours */}
      <section className="px-[10%] py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
          Votre parcours vers la sérénité
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center"
            >
              <div className="h-12 w-12 rounded-full bg-brand-navy text-white text-lg font-bold flex items-center justify-center mx-auto mb-5">
                {step.number}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-[10%] pb-20">
        <div className="bg-gray-50 rounded-3xl border border-gray-100 p-10 sm:p-14 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Prêt à hisser les voiles du succès ?
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            Rejoignez la flotte la plus prestigieuse de la Méditerranée et commencez dès aujourd'hui.
          </p>
          <button
            type="button"
            onClick={goToAuth}
            className="inline-flex items-center gap-2 px-10 py-4 text-sm font-semibold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-xl transition-colors"
          >
            Commencer maintenant
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  )
}

export default DevenirProprietaire
