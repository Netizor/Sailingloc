import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Heart,
  Anchor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/boats/SearchBar'
import FeaturedBoatCard from '../components/boats/FeaturedBoatCard'
import EngagementSection from '../components/home/EngagementSection'
import TestimonialCard from '../components/testimonials/TestimonialCard'
import Spinner from '../components/ui/Spinner'
import type { SearchParams } from '../components/boats/SearchBar'
import type { Boat } from '../types'
import { BoatStatus, BoatType, MotorizationType } from '../types'
import { boatsApi } from '../api/boats.api'
import { getDestinationImage, HOME_DESTINATIONS } from '../data/destinations'
import { TESTIMONIALS } from '../data/testimonials'

type PopularBoatItem = {
  boat: Boat
  image: string
  badge?: 'PREMIUM' | 'NOUVEAU'
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

const POPULAR_BOATS: PopularBoatItem[] = [
  {
    boat: {
      id: 1,
      ownerId: 1,
      title: 'Oceanis 51.1',
      description: '',
      type: BoatType.SAILBOAT,
      capacity: 12,
      cabins: 5,
      motorizationType: MotorizationType.NONE,
      withSkipper: false,
      port: 'Marseille',
      city: 'Vieux Port',
      country: 'France',
      dailyRate: 1200,
      depositAmount: 0,
      status: BoatStatus.ACTIVE,
      rating: 4.9,
      reviewCount: 24,
      createdAt: '',
      images: ['/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg'],
    },
    image: '/andrii-denysenko-kcWrmRUOMc8-unsplash.jpg',
    badge: 'PREMIUM',
  },
  {
    boat: {
      id: 2,
      ownerId: 1,
      title: 'Lagoon 46',
      description: '',
      type: BoatType.CATAMARAN,
      capacity: 10,
      cabins: 4,
      motorizationType: MotorizationType.OUTBOARD,
      withSkipper: false,
      port: 'Nice',
      city: 'Marina',
      country: 'France',
      dailyRate: 1850,
      depositAmount: 0,
      status: BoatStatus.ACTIVE,
      rating: 4.8,
      reviewCount: 18,
      createdAt: '',
      images: ['/view-luxurious-yacht-water.jpg'],
    },
    image: '/view-luxurious-yacht-water.jpg',
    badge: 'NOUVEAU',
  },
  {
    boat: {
      id: 3,
      ownerId: 1,
      title: 'Azimut 60',
      description: '',
      type: BoatType.YACHT,
      capacity: 8,
      cabins: 3,
      motorizationType: MotorizationType.INBOARD,
      withSkipper: true,
      port: 'Cannes',
      city: 'Croisette',
      country: 'France',
      dailyRate: 3100,
      depositAmount: 0,
      status: BoatStatus.ACTIVE,
      rating: 5,
      reviewCount: 12,
      createdAt: '',
      images: ['/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg'],
    },
    image: '/marcin-ciszewski-Zexjl0v3MRU-unsplash.jpg',
  },
  {
    boat: {
      id: 4,
      ownerId: 1,
      title: 'Sun Odyssey 410',
      description: '',
      type: BoatType.SAILBOAT,
      capacity: 8,
      cabins: 3,
      motorizationType: MotorizationType.NONE,
      withSkipper: false,
      port: 'La Rochelle',
      city: 'Port des Minimes',
      country: 'France',
      dailyRate: 890,
      depositAmount: 0,
      status: BoatStatus.ACTIVE,
      rating: 4.7,
      reviewCount: 9,
      createdAt: '',
      images: ['/view-luxurious-yacht.jpg'],
    },
    image: '/view-luxurious-yacht.jpg',
  },
  {
    boat: {
      id: 5,
      ownerId: 1,
      title: 'Prestige 520',
      description: '',
      type: BoatType.MOTORBOAT,
      capacity: 10,
      cabins: 4,
      motorizationType: MotorizationType.INBOARD,
      withSkipper: false,
      port: 'Antibes',
      city: 'Port Vauban',
      country: 'France',
      dailyRate: 2200,
      depositAmount: 0,
      status: BoatStatus.ACTIVE,
      rating: 4.9,
      reviewCount: 15,
      createdAt: '',
      images: ['/view-luxurious-yacht (1).jpg'],
    },
    image: '/view-luxurious-yacht (1).jpg',
    badge: 'PREMIUM',
  },
  {
    boat: {
      id: 6,
      ownerId: 1,
      title: 'Bali 4.6',
      description: '',
      type: BoatType.CATAMARAN,
      capacity: 12,
      cabins: 5,
      motorizationType: MotorizationType.OUTBOARD,
      withSkipper: false,
      port: 'Saint-Tropez',
      city: 'Port Grimaud',
      country: 'France',
      dailyRate: 1950,
      depositAmount: 0,
      status: BoatStatus.ACTIVE,
      rating: 4.8,
      reviewCount: 21,
      createdAt: '',
      images: ['/ai-generated-boat-picture.jpg'],
    },
    image: '/ai-generated-boat-picture.jpg',
    badge: 'NOUVEAU',
  },
]

const IMAGES = {
  hero: '/miami-bayside-landscape.jpg',
  cta: '/view-luxurious-cruise-ship.jpg',
  boatFallback: '/ai-generated-boat-picture.jpg',
} as const

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [carouselIndex, setCarouselIndex] = useState(0)
  const { ref: testimonialsRef, inView: testimonialsInView } = useInView(0.18)

  const steps = [
    { icon: <Search size={36} strokeWidth={1.25} />, title: t('home.step1Title'), desc: t('home.step1Desc') },
    { icon: <Heart size={36} strokeWidth={1.25} />, title: t('home.step2Title'), desc: t('home.step2Desc') },
    { icon: <Anchor size={36} strokeWidth={1.25} />, title: t('home.step3Title'), desc: t('home.step3Desc') },
  ]

  const { data: featuredBoats, isLoading: isLoadingBoats } = useQuery<Boat[]>({
    queryKey: ['boats', 'featured'],
    queryFn: async () => {
      const result = await boatsApi.list({ limit: 6, sort: 'rating_desc' })
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const popularBoats: PopularBoatItem[] =
    featuredBoats && featuredBoats.length > 0
      ? featuredBoats.map((boat) => ({
          boat,
          image: boat.images?.[0] ?? IMAGES.boatFallback,
        }))
      : POPULAR_BOATS

  const visibleBoats = popularBoats.slice(carouselIndex, carouselIndex + 3)
  const canPrev = carouselIndex > 0
  const canNext = carouselIndex + 3 < popularBoats.length

  const handleSearch = (params: SearchParams) => {
    const qs = new URLSearchParams()
    if (params.location) qs.set('location', params.location)
    if (params.startDate) qs.set('startDate', params.startDate)
    if (params.boatType) qs.append('type', params.boatType)
    navigate(`/bateaux?${qs.toString()}`)
  }

  return (
    <div className="flex flex-col bg-white">
      <Helmet>
        <title>SailingLoc  Location de bateaux entre particuliers</title>
        <meta name="description" content="Louez un voilier, catamaran ou yacht d'exception dans les plus beaux ports de France et d'Europe." />
      </Helmet>

      {/* Hero - coucher de soleil */}
      <section className="relative min-h-[calc(100vh-72px)] flex flex-col" aria-label="Bannière principale">
        <div className="absolute inset-0 overflow-hidden">
          <img src={IMAGES.hero} alt="Marina au coucher du soleil" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pb-20">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold italic text-white leading-[1.2] mb-5 max-w-3xl">
            {t('home.heroTitle')}
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mb-8 sm:mb-10 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
          <div className="w-full max-w-5xl -mb-14 sm:-mb-16">
            <SearchBar hero onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Concept */}
      <section id="comment-ca-marche" className="pt-20 pb-14 bg-white" aria-labelledby="how-it-works-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#2563FF] text-sm font-medium mb-4">{t('home.conceptLabel')}</p>
            <h2 id="how-it-works-title" className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy">
              {t('home.howTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center px-4">
                <div className="text-brand-blue mb-6">{step.icon}</div>
                <h3 className="text-base font-bold text-brand-navy mb-3">{step.title}</h3>
                <p className="text-brand-slate text-sm leading-relaxed max-w-[260px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular boats */}
      <section className="py-14 bg-white" aria-labelledby="featured-boats-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 mb-10">
            <div>
              <h2 id="featured-boats-title" className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy mb-2">
                {t('home.popularBoats')}
              </h2>
              <p className="text-brand-slate text-sm">{t('home.popularSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                disabled={!canPrev}
                aria-label="Précédent"
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-brand-navy flex items-center justify-center disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCarouselIndex((i) => i + 1)}
                disabled={!canNext}
                aria-label="Suivant"
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-brand-navy flex items-center justify-center disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {isLoadingBoats ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleBoats.map(({ boat, image, badge }) => (
                <FeaturedBoatCard key={boat.id} boat={boat} image={image} badge={badge} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Destinations bento */}
      <section className="py-14 bg-white" aria-labelledby="destinations-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 id="destinations-title" className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy mb-2">
              {t('home.destinationsTitle')}
            </h2>
            <p className="text-brand-slate text-sm">{t('home.destinationsSubtitle')}</p>
          </div>

          <div className="grid grid-cols-12 auto-rows-[200px] sm:auto-rows-[220px] gap-4">
            {HOME_DESTINATIONS.map((dest) => {
              const image = getDestinationImage(dest)
              const label = i18n.language.startsWith('en') ? dest.nameEn : dest.name
              return (
                <Link
                  key={dest.slug}
                  to={`/destinations/${dest.slug}`}
                  className={`relative overflow-hidden rounded-2xl ${dest.homeGridClass ?? 'col-span-12'}`}
                >
                  <img
                    src={image}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-brand-navy/30" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-brand-navy/70 to-transparent">
                    <p className="font-serif text-xl font-bold text-white">{label}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <EngagementSection />

      {/* Testimonials */}
      <section ref={testimonialsRef} className="py-14 bg-[#f8f9fa]" aria-labelledby="testimonials-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 id="testimonials-title" className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy text-center mb-3">
              {t('home.testimonialsTitle')}
            </h2>
            <p className="text-brand-slate text-sm">{t('home.testimonialsRating')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.slice(0, 3).map((item, i) => (
              <TestimonialCard
                key={item.id}
                item={item}
                animated
                inView={testimonialsInView}
                style={{ transitionDelay: `${i * 120}ms` }}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/temoignages"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-blue transition-colors"
            >
              {t('home.testimonialsSeeAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="cta-title">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden min-h-[320px] flex items-center justify-center">
            <img src={IMAGES.cta} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/65" />
            <div className="relative z-10 text-center px-6 py-16 max-w-2xl">
              <h2 id="cta-title" className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
                {t('home.ctaTitle')}
              </h2>
              <p className="text-white/85 text-sm sm:text-base mb-10 leading-relaxed">
                {t('home.ctaSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/bateaux')}
                  className="px-8 py-3 text-sm font-medium text-white bg-[#2563FF] rounded-full whitespace-nowrap"
                >
                  {t('home.ctaRentBoat')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/devenir-proprietaire')}
                  className="px-8 py-3 text-sm font-medium text-white bg-[#003366] rounded-full whitespace-nowrap"
                >
                  {t('nav.becomeOwner')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
