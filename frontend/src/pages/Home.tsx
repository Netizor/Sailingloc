import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  CalendarCheck,
  Navigation,
  Anchor,
  Star,
  TrendingUp,
  Users,
  MapPin,
  ArrowRight,
  Quote,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/boats/SearchBar'
import BoatCard from '../components/boats/BoatCard'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import type { SearchParams } from '../components/boats/SearchBar'
import type { Boat } from '../types'
import { boatsApi } from '../api/boats.api'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=1800&q=85&auto=format&fit=crop'

// Les témoignages sont volontairement conservés en français (témoignages d'utilisateurs réels)
const testimonials = [
  {
    id: 1,
    name: 'Sophie M.',
    location: 'Paris',
    text: 'Une expérience formidable ! Le propriétaire était super accueillant et le voilier en parfait état. On recommande à 100%.',
    rating: 5,
    avatar: 'SM',
  },
  {
    id: 2,
    name: 'Thomas L.',
    location: 'Lyon',
    text: 'Première location de bateau grâce à SailingLoc. La réservation était simple, le prix transparent. Parfait pour des vacances en famille.',
    rating: 5,
    avatar: 'TL',
  },
  {
    id: 3,
    name: 'Claire B.',
    location: 'Bordeaux',
    text: 'Le skipper fourni était exceptionnel, très pédagogue. Un weekend inoubliable sur la Méditerranée.',
    rating: 5,
    avatar: 'CB',
  },
  {
    id: 4,
    name: 'Marc D.',
    location: 'Marseille',
    text: "Catamaran impeccable, communication au top avec le propriétaire. Le processus de réservation était fluide et rassurant. Une semaine de rêve !",
    rating: 5,
    avatar: 'MD',
  },
  {
    id: 5,
    name: 'Lucie R.',
    location: 'Nice',
    text: "J'avais quelques doutes avant de réserver, mais tout s'est parfaitement passé. Le bateau à moteur était en excellent état, idéal pour explorer les criques.",
    rating: 5,
    avatar: 'LR',
  },
  {
    id: 6,
    name: 'Antoine V.',
    location: 'Toulon',
    text: "Super plateforme ! On a trouvé notre voilier en quelques minutes et la location s'est déroulée sans accroc. À refaire sans hésitation.",
    rating: 5,
    avatar: 'AV',
  },
]

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const steps = [
    {
      icon: <Search size={28} />,
      number: '01',
      title: t('home.step1Title'),
      desc: t('home.step1Desc'),
    },
    {
      icon: <CalendarCheck size={28} />,
      number: '02',
      title: t('home.step2Title'),
      desc: t('home.step2Desc'),
    },
    {
      icon: <Navigation size={28} />,
      number: '03',
      title: t('home.step3Title'),
      desc: t('home.step3Desc'),
    },
  ]

  const { data: featuredBoats, isLoading: isLoadingBoats } = useQuery<Boat[]>({
    queryKey: ['boats', 'featured'],
    queryFn: async () => {
      const result = await boatsApi.list({ limit: 6, sort: 'rating_desc' })
      return result.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleSearch = (params: SearchParams) => {
    const qs = new URLSearchParams()
    if (params.location) qs.set('location', params.location)
    if (params.startDate) qs.set('startDate', params.startDate)
    if (params.endDate) qs.set('endDate', params.endDate)
    if (params.capacity) qs.set('capacity', String(params.capacity))
    navigate(`/bateaux?${qs.toString()}`)
  }

  return (
    <div className="flex flex-col">
      <Helmet>
        <title>SailingLoc — Location de bateaux entre particuliers</title>
        <meta name="description" content="Louez un voilier, catamaran ou bateau à moteur entre particuliers dans les plus beaux ports de France et d'Europe." />
        <meta property="og:title" content="SailingLoc — Location de bateaux entre particuliers" />
        <meta property="og:description" content="Louez un voilier, catamaran ou bateau à moteur entre particuliers dans les plus beaux ports de France et d'Europe." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[600px] lg:min-h-[700px] flex items-center"
        aria-label="Bannière principale"
      >
        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Voilier sur la mer"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/70 via-ocean-900/60 to-ocean-900/80" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full px-4 py-1.5 text-sm mb-6 border border-white/20">
              <Anchor size={14} />
              {t('home.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl">
              {t('home.heroSubtitle')}
            </p>
          </div>

          {/* Search bar */}
          <SearchBar
            onSearch={handleSearch}
            className="max-w-5xl"
          />
        </div>
      </section>

      {/* ─── Stats bar ────────────────────────────────────────────────────── */}
      <section className="bg-ocean-700 text-white py-5" aria-label="Statistiques">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-ocean-600">
            {[
              { icon: <Anchor size={18} />, value: '250+', label: t('home.statsBoats') },
              { icon: <MapPin size={18} />, value: '45+', label: t('home.statsPorts') },
              { icon: <Users size={18} />, value: '1 200+', label: t('home.statsRenters') },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-1">
                <span className="text-ocean-300">{stat.icon}</span>
                <div className="text-center sm:text-left">
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-ocean-300 leading-tight">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section
        id="comment-ca-marche"
        className="py-20 bg-white dark:bg-gray-900"
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              id="how-it-works-title"
              className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            >
              {t('home.howTitle')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              {t('home.howSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] right-[-50%] h-px border-t-2 border-dashed border-ocean-200 z-0" />
                )}
                <div className="relative z-10 h-20 w-20 rounded-2xl bg-ocean-50 dark:bg-ocean-900/30 border-2 border-ocean-100 dark:border-ocean-800 flex items-center justify-center text-ocean-600 dark:text-ocean-400 mb-5 group-hover:bg-ocean-100 group-hover:border-ocean-300 transition-all shadow-sm">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-ocean-700 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured boats ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800" aria-labelledby="featured-boats-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2
                id="featured-boats-title"
                className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2"
              >
                {t('home.popularBoats')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{t('home.popularSubtitle')}</p>
            </div>
            <Link
              to="/bateaux"
              className="flex items-center gap-1.5 text-ocean-700 font-medium text-sm hover:text-ocean-900 transition-colors whitespace-nowrap"
            >
              {t('home.seeAllBoats')}
              <ArrowRight size={15} />
            </Link>
          </div>

          {isLoadingBoats ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : featuredBoats && featuredBoats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBoats.map((boat) => (
                <BoatCard key={boat.id} boat={boat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <Anchor size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t('home.noBoats')}</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/bateaux')}
              rightIcon={<ArrowRight size={16} />}
            >
              {t('home.exploreBoats')}
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-gray-900 overflow-hidden" aria-labelledby="testimonials-title">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="text-center">
            <h2
              id="testimonials-title"
              className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3"
            >
              {t('home.testimonialsTitle')}
            </h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
              ))}
              <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm font-medium">{t('home.testimonialsRating')}</span>
            </div>
          </div>
        </div>

        {/* Scrolling track — full viewport width */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div className="testimonials-track flex gap-6 px-6 pb-4">
              {/* Cards duplicated for seamless loop — hidden from screen readers */}
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  aria-hidden={i >= testimonials.length ? 'true' : undefined}
                  className="flex-shrink-0 w-[90vw] sm:w-[340px] bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-4 hover:shadow-md hover:border-ocean-100 transition-shadow duration-200"
                >
                  <Quote size={24} className="text-ocean-200 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-ocean-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t.location}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={13} fill="currentColor" strokeWidth={0} className="text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .testimonials-track {
            width: max-content;
            animation: testimonials-marquee 35s linear infinite;
          }
          .testimonials-track:hover {
            animation-play-state: paused;
          }
          @keyframes testimonials-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .testimonials-track {
              animation: none;
            }
          }
        `}</style>
      </section>

      {/* ─── Owner CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #0284c7 100%)',
        }}
        aria-labelledby="owner-cta-title"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm mb-5 text-white/80">
                <TrendingUp size={14} />
                {t('home.ownerBadge')}
              </div>
              <h2
                id="owner-cta-title"
                className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
              >
                {t('home.ownerTitle')}
              </h2>
              <p className="text-white/75 text-lg mb-8 leading-relaxed max-w-xl">
                {t('home.ownerDesc')}
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  t('home.ownerPerk1'),
                  t('home.ownerPerk2'),
                  t('home.ownerPerk3'),
                  t('home.ownerPerk4'),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-white/85 text-sm">
                    <span className="h-5 w-5 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center flex-shrink-0">
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/inscription')}
                rightIcon={<ArrowRight size={16} />}
              >
                {t('nav.becomeOwner')}
              </Button>
            </div>
            <div className="flex-shrink-0 lg:w-80">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-white">
                <p className="text-sm text-white/60 mb-1">{t('home.estimatedRevenue')}</p>
                <p className="text-4xl font-bold mb-4">2 400 €</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/70">{t('home.rentalDays')}</span>
                    <span className="font-medium">2 000 €</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/70">{t('home.skipperOptional')}</span>
                    <span className="font-medium">+ 400 €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">{t('home.platformFee')}</span>
                    <span className="font-medium text-orange-300">- 10 %</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-4">
                  {t('home.estimationNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
