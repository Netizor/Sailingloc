import React, { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Users,
  Ship,
  X,
  Heart,
  Share2,
  Flag,
  AlertTriangle,
  Star,
  ArrowRight,
  UserCheck,
  Navigation,
  Radio,
  Compass,
  LifeBuoy,
  Waves,
  Utensils,
  Refrigerator,
  ShowerHead,
  BedDouble,
  Wifi,
  Music,
  Sun,
  Snowflake,
  Zap,
  Wind,
  Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { boatsApi } from '../api/boats.api'
import { bookingsApi } from '../api/bookings.api'
import { availabilityApi } from '../api/availability.api'
import { checkFavorite, addFavorite, removeFavorite } from '../api/favorites.api'
import { getBoatReviews } from '../api/reviews.api'
import { useAuthStore } from '../store/auth.store'
import type { Boat, Review } from '../types'
import { BoatType, UserRole } from '../types'
import { BOAT_TYPE_LABELS } from '../lib/labels'
import { getBoatEquipment, getEnrichedDescription } from '../lib/boatContent'
import { reportBoat } from '../api/reports.api'
import type { ReportReason } from '../api/reports.api'
import { getDemoBoat } from '../data/demoBoats'
import BoatDetailGallery from '../components/boats/BoatDetailGallery'
import BoatAvailabilityCalendar from '../components/boats/BoatAvailabilityCalendar'
import BoatOwnerCard from '../components/boats/BoatOwnerCard'
import BookingForm, { BookingFormData } from '../components/bookings/BookingForm'
import StripePaymentModal from '../components/bookings/StripePaymentModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const DEMO_REVIEWS: Partial<Review>[] = [
  {
    id: 9001,
    rating: 5,
    comment: 'Une expérience formidable ! Le propriétaire était super accueillant et le voilier en parfait état. Nous reviendrons sans hésiter.',
    createdAt: '2024-04-12',
    reviewer: { id: 1, firstName: 'Marc-Antoine', lastName: 'D.', email: '', role: UserRole.RENTER, kycVerified: true, isActive: true, createdAt: '' },
  },
  {
    id: 9002,
    rating: 5,
    comment: 'Week-end parfait en famille. Le bateau est spacieux, bien équipé et idéalement situé. Communication fluide avec le propriétaire.',
    createdAt: '2024-03-28',
    reviewer: { id: 2, firstName: 'Sophie', lastName: 'L.', email: '', role: UserRole.RENTER, kycVerified: true, isActive: true, createdAt: '' },
  },
]

// Associe chaque équipement à une icône pertinente (recherche par mot-clé)
const EQUIPMENT_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /gps|traceur|cartes/i, icon: Navigation },
  { match: /vhf|radio/i, icon: Radio },
  { match: /pilote|guindeau|enrouleur|lazy|génois/i, icon: Compass },
  { match: /gilet|radeau|extincteur|secours|sécurit/i, icon: LifeBuoy },
  { match: /annexe|hors-bord|jet|jouets|nautiques|trampolines/i, icon: Waves },
  { match: /cuisine|four|gazini|barbecue/i, icon: Utensils },
  { match: /frigo|réfrig|glaci/i, icon: Refrigerator },
  { match: /eau chaude|douche|dessalinisateur/i, icon: ShowerHead },
  { match: /literie|linge|cabine/i, icon: BedDouble },
  { match: /wi-fi|wifi/i, icon: Wifi },
  { match: /son|bluetooth|musique/i, icon: Music },
  { match: /solaire|soleil|bimini|taud|flybridge/i, icon: Sun },
  { match: /clim/i, icon: Snowflake },
  { match: /usb|220v|convertisseur|générateur|électr/i, icon: Zap },
  { match: /paddle|sup|snorkeling|masque/i, icon: Wind },
]

const getEquipmentIcon = (name: string): LucideIcon =>
  EQUIPMENT_ICONS.find((e) => e.match.test(name))?.icon ?? Check

const BoatDetail: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()

  const getTypeSpecLabel = (type: BoatType) => {
    if (type === BoatType.SAILBOAT) return t('boat.detail.monocoque')
    if (type === BoatType.CATAMARAN) return t('boat.type.CATAMARAN')
    return BOAT_TYPE_LABELS[type] ?? type
  }

  const getLuxuryTypeLabel = (type: BoatType) => {
    const base = BOAT_TYPE_LABELS[type] ?? type
    if (type === BoatType.YACHT || type === BoatType.SAILBOAT) return `${base} ${t('boat.detail.luxurySuffix')}`
    return base
  }

  const formatEuro = (amount: number) =>
    new Intl.NumberFormat(i18n.language.startsWith('en') ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount)
  const [descExpanded, setDescExpanded] = useState(false)
  const [bookingPanelOpen, setBookingPanelOpen] = useState(false)
  const [stripePayment, setStripePayment] = useState<{
    clientSecret: string
    bookingId: number
    amount: number
  } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('INAPPROPRIATE_CONTENT')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const {
    data: apiBoat,
    isLoading,
    isError,
  } = useQuery<Boat>({
    queryKey: ['boat', id],
    queryFn: () => boatsApi.getById(Number(id!)),
    enabled: !!id,
    retry: false,
  })

  const boat = apiBoat ?? getDemoBoat(Number(id))

  const { data: favData } = useQuery({
    queryKey: ['favorites', 'check', id],
    queryFn: () => checkFavorite(Number(id!)),
    enabled: !!id && isAuthenticated,
  })
  const isFavorite = favData?.isFavorite ?? false

  const addFavMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      qc.invalidateQueries({ queryKey: ['favorites', 'check', id] })
    },
  })
  const removeFavMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      qc.invalidateQueries({ queryKey: ['favorites', 'check', id] })
    },
  })

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: boat?.title ?? 'SailingLoc', url }).catch(() => null)
    } else {
      await navigator.clipboard.writeText(url)
      toast.success(t('boat.detail.linkCopied'))
    }
  }

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) { navigate('/connexion'); return }
    if (!boat) return
    if (isFavorite) removeFavMutation.mutate(boat.id)
    else addFavMutation.mutate(boat.id)
  }

  const { data: availData } = useQuery({
    queryKey: ['availability', Number(id)],
    queryFn: () => availabilityApi.getBoatAvailability(Number(id!)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
  const disabledDates = useMemo(
    () => [...(availData?.booked ?? []), ...(availData?.unavailable ?? [])],
    [availData],
  )

  const { data: reviewsData } = useQuery({
    queryKey: ['boat-reviews', id],
    queryFn: () => getBoatReviews(Number(id!)),
    enabled: !!id,
    retry: false,
  })
  const apiReviews = reviewsData?.data ?? []
  const reviewTotal = reviewsData?.total ?? boat?.reviewCount ?? 0
  const displayReviews = apiReviews.length > 0 ? apiReviews : DEMO_REVIEWS

  const reportMutation = useMutation({
    mutationFn: () => reportBoat({ boatId: boat!.id, reason: reportReason, details: reportDetails || undefined }),
    onSuccess: () => {
      setReportSent(true)
      toast.success(t('boat.detail.reportSent'))
    },
    onError: () => toast.error(t('boat.detail.reportError')),
  })

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData & { boatId: number }) => {
      const booking = await bookingsApi.create(data)
      const pi = await bookingsApi.createPaymentIntent(booking.id)
      return pi
    },
    onSuccess: (pi) => {
      setStripePayment(pi)
      setBookingPanelOpen(false)
    },
    onError: (err: { message?: string; response?: { data?: { message?: string } } }) => {
      const msg = err?.response?.data?.message ?? err?.message ?? t('boat.detail.bookingError')
      toast.error(msg)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Spinner size="lg" />
      </div>
    )
  }

  if ((isError && !boat) || !boat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 bg-[#f8f9fa]">
        <p className="text-xl font-semibold text-[#003366]">{t('boat.detail.notFound')}</p>
        <Button variant="secondary" onClick={() => navigate('/bateaux')}>
          {t('boat.detail.backToBoats')}
        </Button>
      </div>
    )
  }

  const handleBookingSubmit = async (data: BookingFormData) => {
    await bookingMutation.mutateAsync({ ...data, boatId: boat.id })
  }

  const locationLabel = boat.city ? `${boat.city}, ${boat.country}` : `${boat.port}, ${boat.country}`
  const description = getEnrichedDescription(boat)
  const shortDesc = description.length > 900 ? description.slice(0, 900) + '…' : description
  const equipment = getBoatEquipment(boat)
  const interestedCount = Math.max(48, boat.reviewCount * 14 + (boat.id % 37) * 3)

  const specs = [
    { label: t('boat.detail.specType'), value: getTypeSpecLabel(boat.type) },
    { label: t('boat.detail.specLength'), value: boat.length ? `${boat.length} m` : '' },
    { label: t('boat.detail.specCabins'), value: boat.cabins ? t('boat.detail.cabinsCount', { count: boat.cabins }) : '' },
    { label: t('boat.detail.specYear'), value: boat.year ? String(boat.year) : '' },
  ].filter((spec) => spec.value)

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 lg:pb-12">
      <Helmet>
        <title>{boat.title} - SailingLoc</title>
        <meta name="description" content={boat.description?.slice(0, 155) ?? t('boat.detail.rentMeta', { title: boat.title, port: boat.port })} />
        {boat.images?.[0] && <meta property="og:image" content={boat.images[0]} />}
      </Helmet>

      <div className="w-full px-[10%] py-8">
        {/* Galerie */}
        <BoatDetailGallery images={boat.images ?? []} title={boat.title} interestedCount={interestedCount} />

        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          {/* Colonne principale */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Titre + note */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] leading-tight">
                  {boat.title}
                </h1>
                <div className="flex items-center gap-2">
                  {boat.rating > 0 && (
                    <span className="flex items-center gap-1.5 bg-[#006875] text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                      <Star size={14} fill="white" strokeWidth={0} />
                      {boat.rating.toFixed(1)} ({boat.reviewCount} {t('boat.detail.reviews')})
                    </span>
                  )}
                  <button type="button" onClick={handleShare} aria-label={t('boat.detail.share')} className="p-2 rounded-full border border-gray-200 text-[#8A94A6] hover:text-[#2563FF]">
                    <Share2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    aria-label={isFavorite ? t('boat.detail.removeFavorite') : t('boat.detail.addFavorite')}
                    className={cn(
                      'p-2 rounded-full border transition-colors',
                      isFavorite ? 'bg-[#2563FF] border-[#2563FF] text-white' : 'border-gray-200 text-[#8A94A6]'
                    )}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-[#8A94A6]">
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#2563FF]" />
                  {locationLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Ship size={15} className="text-[#2563FF]" />
                  {getLuxuryTypeLabel(boat.type)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={15} className="text-[#2563FF]" />
                  {t('boat.detail.capacityPers', { count: boat.capacity })}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserCheck size={15} className="text-[#2563FF]" />
                  {boat.withSkipper ? t('boat.detail.withSkipperOptional') : t('boat.detail.withoutSkipper')}
                </span>
              </div>
            </div>

            {/* Specs bar */}
            <div className="bg-[#eef3fb] rounded-xl px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] mb-1">{spec.label}</p>
                  <p className="text-sm font-semibold text-[#003366]">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {description && (
              <section>
                <h2 className="text-lg font-bold text-[#003366] mb-4">{t('boat.detail.bookAdventure')}</h2>
                <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                  {descExpanded ? description : shortDesc}
                </p>
                {description.length > 900 && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#2563FF] hover:underline"
                  >
                    {descExpanded ? t('boat.detail.readLess') : t('boat.detail.readMore')}
                    <ArrowRight size={14} />
                  </button>
                )}
              </section>
            )}

            {/* Skipper & navigation */}
            <section>
              <h2 className="text-lg font-bold text-[#003366] mb-4">{t('boat.detail.skipperNav')}</h2>
              <div
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-5',
                  boat.withSkipper ? 'bg-[#eef3fb] border-[#2563FF]/20' : 'bg-amber-50 border-amber-100',
                )}
              >
                <UserCheck size={22} className={cn('flex-shrink-0 mt-0.5', boat.withSkipper ? 'text-[#2563FF]' : 'text-amber-500')} />
                <div>
                  <p className="text-sm font-semibold text-[#003366]">
                    {boat.withSkipper ? t('boat.detail.withSkipperPro') : t('boat.detail.withoutSkipperSelf')}
                  </p>
                  <p className="text-sm text-[#334155] mt-1 leading-relaxed">
                    {boat.withSkipper
                      ? t('boat.detail.withSkipperDesc', {
                          price: boat.skipperPrice
                            ? t('boat.detail.withSkipperDescPrice', { price: formatEuro(boat.skipperPrice) })
                            : '',
                        })
                      : t('boat.detail.withoutSkipperDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Équipements */}
            {equipment.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-[#003366] mb-4">{t('boat.detail.equipmentOnBoard')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {equipment.map((item) => {
                    const Icon = getEquipmentIcon(item)
                    return (
                      <div key={item} className="flex items-center gap-3 text-sm text-[#334155]">
                        <span className="flex-shrink-0 h-9 w-9 rounded-lg bg-[#eef3fb] flex items-center justify-center text-[#2563FF]">
                          <Icon size={18} />
                        </span>
                        {item}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Disponibilités */}
            <section>
              <h2 className="text-lg font-bold text-[#003366] mb-4">{t('boat.detail.availability')}</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <BoatAvailabilityCalendar boatId={boat.id} variant="detail" />
              </div>
            </section>

            {/* Avis */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#003366]">{t('boat.detail.travelerReviews')}</h2>
                {boat.rating > 0 && (
                  <span className="text-sm text-[#8A94A6]">
                    <span className="font-bold text-[#003366]">{boat.rating.toFixed(1)}/5</span>
                    {' '}{t('boat.detail.basedOnReviews', { count: reviewTotal })}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-[#eef3fb] text-[#003366] flex items-center justify-center text-sm font-bold">
                        {review.reviewer?.firstName?.[0]}
                        {review.reviewer?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#003366]">
                          {review.reviewer?.firstName} {review.reviewer?.lastName}
                        </p>
                        {review.createdAt && (
                          <p className="text-xs text-[#8A94A6]">{formatDate(review.createdAt)}</p>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-[#334155] italic leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {isAuthenticated && !reportSent && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#8A94A6] hover:text-red-500"
              >
                <Flag size={12} />
                {t('boat.detail.report')}
              </button>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[360px] flex-shrink-0 space-y-6">
            <div className="sticky top-24 space-y-6">
              <BookingForm
                boat={boat}
                onSubmit={handleBookingSubmit}
                loading={bookingMutation.isPending}
                disabledDates={disabledDates}
                bookedDates={availData?.booked ?? []}
                unavailableDates={availData?.unavailable ?? []}
                variant="detail"
              />
              <BoatOwnerCard
                boat={boat}
                onContact={() => {
                  if (!isAuthenticated) { navigate('/connexion'); return }
                  navigate(`/mon-espace/messages?to=${boat.ownerId}`)
                }}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-[10%] py-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-lg font-bold text-[#003366]">
            {formatEuro(boat.dailyRate)}
          </span>
          <span className="text-xs text-[#8A94A6]">{t('common.perDay')}</span>
        </div>
        <button
          type="button"
          onClick={() => setBookingPanelOpen(true)}
          className="sl-btn-navy flex-1 max-w-xs py-3 text-sm font-semibold rounded-xl"
        >
          {t('boat.detail.bookNow')}
        </button>
      </div>

      {/* Mobile booking panel */}
      {bookingPanelOpen && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBookingPanelOpen(false)} />
          <div className="relative mt-auto bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-[#003366]">{t('boat.detail.book')}</span>
              <button type="button" onClick={() => setBookingPanelOpen(false)} className="p-1.5 text-[#8A94A6]">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <BookingForm
                boat={boat}
                onSubmit={async (data) => {
                  await handleBookingSubmit(data)
                  setBookingPanelOpen(false)
                }}
                loading={bookingMutation.isPending}
                disabledDates={disabledDates}
                bookedDates={availData?.booked ?? []}
                unavailableDates={availData?.unavailable ?? []}
                variant="detail"
              />
            </div>
          </div>
        </div>
      )}

      {/* Signalement */}
      <Modal isOpen={reportOpen} onClose={() => { setReportOpen(false); setReportDetails('') }} title={t('boat.detail.reportModalTitle')} size="sm">
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{t('boat.detail.reportWarning')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">{t('boat.detail.reportReasonLabel')}</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#003366]"
            >
              <option value="INAPPROPRIATE_CONTENT">{t('boat.detail.reportReasonInappropriate')}</option>
              <option value="FRAUD">{t('boat.detail.reportReasonFraud')}</option>
              <option value="DUPLICATE">{t('boat.detail.reportReasonDuplicate')}</option>
              <option value="WRONG_CATEGORY">{t('boat.detail.reportReasonWrongCategory')}</option>
              <option value="OTHER">{t('boat.detail.reportReasonOther')}</option>
            </select>
          </div>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={3}
            placeholder={t('boat.detail.reportDetailsPlaceholder')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setReportOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" fullWidth onClick={() => reportMutation.mutate()} loading={reportMutation.isPending}>
              {t('boat.detail.reportSubmit')}
            </Button>
          </div>
        </div>
      </Modal>

      {stripePayment && (
        <StripePaymentModal
          clientSecret={stripePayment.clientSecret}
          bookingId={stripePayment.bookingId}
          amount={stripePayment.amount}
          boatTitle={boat.title}
          onSuccess={() => {
            setStripePayment(null)
            toast.success(t('boat.detail.paymentConfirmed'))
            navigate('/mon-espace/reservations')
          }}
          onClose={() => setStripePayment(null)}
        />
      )}
    </div>
  )
}

export default BoatDetail
