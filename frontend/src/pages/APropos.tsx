import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Headphones,
  Map,
  Plane,
  ShieldCheck,
  Ship,
  Lock,
  Anchor,
  Utensils,
  Users,
  Clock,
  Star,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

const STATS = [
  { value: '52+', label: 'Ports partenaires' },
  { value: '4.9/5', label: 'Satisfaction clients' },
  { value: '24/7', label: 'Assistance dédiée' },
  { value: '100%', label: 'Paiements sécurisés' },
]

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Recherche & réservation',
    desc: 'Trouvez le bateau idéal, consultez les disponibilités et réservez en ligne en quelques clics.',
  },
  {
    step: '02',
    title: 'Confirmation & briefing',
    desc: 'Votre réservation est validée. Vous recevez toutes les informations pratiques avant le départ.',
  },
  {
    step: '03',
    title: 'Navigation sereine',
    desc: 'Embarquez en toute confiance : bateau vérifié, assurance incluse et support disponible.',
  },
  {
    step: '04',
    title: 'Conciergerie sur-mesure',
    desc: 'Chef à bord, itinéraires privés, transferts VIP — nous personnalisons chaque séjour.',
  },
]

const PLATFORM_SERVICES = [
  {
    icon: ShieldCheck,
    title: 'Assurance incluse',
    desc: 'Chaque location est couverte par notre partenaire assurance maritime.',
  },
  {
    icon: BadgeCheck,
    title: 'Bateaux vérifiés',
    desc: 'Annonces contrôlées et profils vérifiés pour une communauté de confiance.',
  },
  {
    icon: CreditCard,
    title: 'Paiement sécurisé',
    desc: 'Transactions protégées et caution gérée de façon transparente.',
  },
  {
    icon: Headphones,
    title: 'Support réactif',
    desc: 'Une équipe disponible avant, pendant et après votre navigation.',
  },
]

const OFFERS = [
  {
    name: 'Essentiel',
    tagline: 'L\'expérience SailingLoc',
    features: [
      'Réservation en ligne simplifiée',
      'Assurance location incluse',
      'Support client 7j/7',
      'Profils propriétaires vérifiés',
    ],
    highlight: false,
  },
  {
    name: 'Premium',
    tagline: 'Le confort en plus',
    features: [
      'Tout l\'offre Essentiel',
      'Skipper professionnel disponible',
      'Assistance météo & navigation',
      'Check-in prioritaire au port',
    ],
    highlight: true,
  },
  {
    name: 'Conciergerie',
    tagline: 'Sur-mesure & exclusif',
    features: [
      'Concierge dédié à votre séjour',
      'Chef gastronomique à bord',
      'Itinéraires & escales privées',
      'Logistique VIP terre-mer',
    ],
    highlight: false,
  },
]

const APropos: React.FC = () => {
  usePageTitle('Nos services - SailingLoc')

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#071d49]">
      {/* Hero */}
      <section
        className="relative min-h-[620px] bg-cover bg-center flex items-center px-8 lg:px-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(3,18,50,.25), rgba(3,18,50,.65)), url('/services-hero.jpg')",
        }}
      >
        <div className="max-w-xl text-white">
          <span className="inline-block bg-white/20 text-xs tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Exclusivité maritime
          </span>

          <h1 className="text-5xl lg:text-7xl font-serif font-bold leading-tight">
            L&apos;Art de Vivre
            <br />
            <span className="italic">Sans Compromis</span>
          </h1>

          <p className="mt-6 text-white/90 leading-relaxed">
            Notre conciergerie dédiée transforme chaque croisière en une
            expérience sur-mesure, anticipant vos moindres désirs pour une
            sérénité absolue en mer.
          </p>

          <a
            href="#services"
            className="mt-8 inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg text-sm font-bold uppercase transition-colors"
          >
            Découvrir nos services <ArrowDown size={16} />
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-20 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#071d49]">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform guarantees */}
      <section className="px-8 lg:px-20 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-teal-700 text-sm font-semibold uppercase tracking-wider mb-3">
              La promesse SailingLoc
            </p>
            <h2 className="text-3xl lg:text-4xl font-serif font-bold">
              Une plateforme pensée pour votre sérénité
            </h2>
            <p className="mt-4 text-gray-500">
              Au-delà de la conciergerie premium, chaque location bénéficie de garanties solides
              pour naviguer l&apos;esprit tranquille.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-[#f8f7ff] p-6 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 text-teal-700 mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-[#071d49] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-8 lg:px-20 py-20 bg-[#f3f2fb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-teal-700 text-sm font-semibold uppercase tracking-wider mb-3">
              Votre parcours
            </p>
            <h2 className="text-3xl lg:text-4xl font-serif font-bold">
              De la réservation à la mer
            </h2>
            <p className="mt-4 text-gray-500">
              Un accompagnement fluide à chaque étape, pour une expérience sans friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((item) => (
              <div
                key={item.step}
                className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
              >
                <span className="text-4xl font-serif font-bold text-teal-700/20">{item.step}</span>
                <h3 className="font-semibold text-[#071d49] mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium services bento */}
      <section id="services" className="px-8 lg:px-20 py-20 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-teal-700 text-sm font-semibold uppercase tracking-wider mb-3">
            Conciergerie premium
          </p>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold">
            Une Assistance à 360°
          </h2>
          <p className="mt-4 text-gray-500">
            De la gastronomie à la logistique technique, nous redéfinissons les
            standards du service premium en mer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div
            className="lg:col-span-2 min-h-[340px] rounded-xl overflow-hidden bg-cover bg-center flex items-end p-8 text-white"
            style={{
              backgroundImage:
                "linear-gradient(rgba(3,18,50,.10), rgba(3,18,50,.75)), url('/service-chef.jpg')",
            }}
          >
            <div>
              <Utensils className="mb-4" size={28} />
              <h3 className="text-2xl font-serif">Chef Gastronomique à Bord</h3>
              <p className="mt-2 text-sm text-white/85 max-w-md">
                Une table étoilée flottante. Nos chefs privés concoctent des
                menus personnalisés selon vos préférences et les arrivages locaux.
              </p>
            </div>
          </div>

          <div className="min-h-[340px] rounded-xl bg-[#eeeef6] border border-gray-200 p-8 flex flex-col justify-between">
            <Headphones size={34} className="text-[#071d49]" />
            <div>
              <h3 className="text-2xl font-serif">Assistance 24/7</h3>
              <p className="mt-3 text-sm text-gray-600">
                Un support technique et opérationnel disponible à tout
                instant. Qu&apos;il s&apos;agisse d&apos;un besoin technique ou d&apos;un conseil
                météo, nos experts veillent sur vous.
              </p>
            </div>
          </div>

          <div className="min-h-[340px] rounded-xl bg-[#071d49] text-white p-8 flex flex-col justify-between">
            <Plane size={34} />
            <div>
              <h3 className="text-2xl font-serif">Logistique VIP</h3>
              <p className="mt-3 text-sm text-white/80">
                Transferts en hélicoptère, chauffeurs privés à l&apos;embarquement
                et gestion des bagages pour une transition fluide entre terre
                et mer.
              </p>
            </div>
          </div>

          <div
            className="lg:col-span-2 min-h-[340px] rounded-xl overflow-hidden bg-cover bg-center flex items-end p-8 text-white"
            style={{
              backgroundImage:
                "linear-gradient(rgba(3,18,50,.10), rgba(3,18,50,.70)), url('/service-itinerary.jpg')",
            }}
          >
            <div>
              <Map className="mb-4" size={28} />
              <h3 className="text-2xl font-serif">Itinéraires sur Mesure</h3>
              <p className="mt-2 text-sm text-white/85 max-w-md">
                Criques secrètes, réservations dans les clubs de plage les
                plus prisés et escales culturelles privatisées. Nos
                planificateurs dessinent votre sillage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="px-8 lg:px-20 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-teal-700 text-sm font-semibold uppercase tracking-wider mb-3">
              Nos formules
            </p>
            <h2 className="text-3xl lg:text-4xl font-serif font-bold">
              Choisissez votre niveau de service
            </h2>
            <p className="mt-4 text-gray-500">
              De la location simple à l&apos;expérience concierge complète, adaptez votre séjour à vos envies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {OFFERS.map((offer) => (
              <div
                key={offer.name}
                className={[
                  'rounded-2xl p-8 flex flex-col',
                  offer.highlight
                    ? 'bg-[#071d49] text-white shadow-xl ring-2 ring-teal-600 scale-[1.02]'
                    : 'bg-[#f8f7ff] border border-gray-200',
                ].join(' ')}
              >
                {offer.highlight && (
                  <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-3 py-1 rounded-full mb-4">
                    Populaire
                  </span>
                )}
                <h3 className="text-xl font-serif font-bold">{offer.name}</h3>
                <p className={['text-sm mt-1 mb-6', offer.highlight ? 'text-white/70' : 'text-gray-500'].join(' ')}>
                  {offer.tagline}
                </p>
                <ul className="space-y-3 flex-1">
                  {offer.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <BadgeCheck
                        size={16}
                        className={['shrink-0 mt-0.5', offer.highlight ? 'text-teal-400' : 'text-teal-700'].join(' ')}
                      />
                      <span className={offer.highlight ? 'text-white/90' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={offer.highlight ? '/bateaux' : '/contact'}
                  className={[
                    'mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-colors',
                    offer.highlight
                      ? 'bg-white text-[#071d49] hover:bg-gray-100'
                      : 'bg-[#071d49] text-white hover:bg-[#0a2a5c]',
                  ].join(' ')}
                >
                  {offer.highlight ? 'Réserver un bateau' : 'Nous contacter'}
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Concierge quote */}
      <section className="px-8 lg:px-20 py-24 bg-[#f3f2fb]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="italic font-serif text-2xl text-[#071d49]">
              &ldquo;Le luxe n&apos;est pas une option, c&apos;est notre standard.&rdquo;
            </p>

            <p className="mt-6 text-gray-600 leading-relaxed">
              Parce que chaque navigation est unique, SailingLoc met à votre
              disposition un concierge dédié dès la confirmation de votre
              réservation. Notre réseau de partenaires nous permet de
              répondre aux demandes les plus exigeantes, de la livraison de vins
              rares au mouillage à l&apos;organisation d&apos;événements privés sur le
              pont.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Users, label: 'Concierges certifiés yachting' },
                { icon: Lock, label: 'Discrétion & confidentialité' },
                { icon: Clock, label: 'Réponse sous 2 h' },
                { icon: Star, label: '4.9/5 de satisfaction' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
                  <span className="bg-blue-100 text-blue-700 p-2.5 rounded-full shrink-0">
                    <Icon size={16} />
                  </span>
                  <p className="font-semibold text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <img
            src="/service-concierge.jpg"
            alt="Service conciergerie SailingLoc"
            className="rounded-xl shadow-2xl w-full h-[420px] object-cover"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20">
        <div className="max-w-3xl mx-auto bg-[#071d49] text-white rounded-xl shadow-2xl px-10 py-12 text-center relative overflow-hidden">
          <Anchor size={110} className="absolute right-8 top-6 text-white/10" />
          <Ship size={48} className="mx-auto mb-4 text-teal-400/60" />

          <h2 className="text-3xl font-serif">
            Prêt pour une expérience d&apos;exception ?
          </h2>

          <p className="mt-4 text-white/75 max-w-lg mx-auto">
            Explorez notre flotte ou contactez notre équipe conciergerie pour
            personnaliser votre prochain séjour en mer.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/bateaux"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-sm font-bold uppercase transition-colors"
            >
              Voir les bateaux
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/contact"
              className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-lg text-sm font-bold uppercase transition-colors"
            >
              Prendre rendez-vous
            </Link>

            <Link
              to="/temoignages"
              className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-lg text-sm font-bold uppercase transition-colors"
            >
              Témoignages
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default APropos
