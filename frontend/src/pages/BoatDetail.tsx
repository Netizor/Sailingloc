import React, { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Users,
  Ruler,
  BedDouble,
  Calendar,
  Zap,
  ShieldCheck,
  X,
  Heart,
  Share2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Flag,
  AlertTriangle,
} from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { boatsApi } from '../api/boats.api'
import { bookingsApi } from '../api/bookings.api'
import { availabilityApi } from '../api/availability.api'
import { checkFavorite, addFavorite, removeFavorite } from '../api/favorites.api'
import { getBoatReviews } from '../api/reviews.api'
import { useAuthStore } from '../store/auth.store'
import type { Boat } from '../types'
import { BOAT_TYPE_LABELS } from '../lib/labels'
import { reportBoat } from '../api/reports.api'
import type { ReportReason } from '../api/reports.api'
import SimilarBoats from '../components/boats/SimilarBoats'
import Modal from '../components/ui/Modal'
import ImageGallery from '../components/boats/ImageGallery'
import BoatAvailabilityCalendar from '../components/boats/BoatAvailabilityCalendar'
import BookingForm, { BookingFormData } from '../components/bookings/BookingForm'
import StripePaymentModal from '../components/bookings/StripePaymentModal'
import Stars from '../components/ui/Stars'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const BoatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const [showAllRules, setShowAllRules] = useState(false)
  const [bookingPanelOpen, setBookingPanelOpen] = useState(false)
  // État du flow Stripe (étape 2 : affichage formulaire de paiement)
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
    data: boat,
    isLoading,
    isError,
  } = useQuery<Boat>({
    queryKey: ['boat', id],
    queryFn: () => boatsApi.getById(Number(id!)),
    enabled: !!id,
  })

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

  // A5 — Partage d'annonce : Web Share API sur mobile, clipboard sinon
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: boat?.title ?? 'SailingLoc', url }).catch(() => null)
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié !')
    }
  }

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) { navigate('/connexion'); return }
    if (isFavorite) {
      removeFavMutation.mutate(boat!.id)
    } else {
      addFavMutation.mutate(boat!.id)
    }
  }

  // Disponibilités — même clé de cache que BoatAvailabilityCalendar pour éviter un double fetch
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
  })
  const reviews = reviewsData?.data ?? []
  const reviewTotal = reviewsData?.total ?? 0

  const reportMutation = useMutation({
    mutationFn: () => reportBoat({ boatId: boat!.id, reason: reportReason, details: reportDetails || undefined }),
    onSuccess: () => {
      setReportSent(true)
      toast.success('Signalement envoyé, merci !')
    },
    onError: () => toast.error('Erreur lors du signalement'),
  })

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData & { boatId: number }) => {
      // Étape 1 : créer la réservation (statut PENDING)
      const booking = await bookingsApi.create(data)
      // Étape 2 : créer le PaymentIntent Stripe et obtenir le clientSecret
      const pi = await bookingsApi.createPaymentIntent(booking.id)
      return pi
    },
    onSuccess: (pi) => {
      setStripePayment(pi)
      setBookingPanelOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Erreur lors de la réservation')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !boat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Bateau introuvable</p>
        <Button variant="secondary" onClick={() => navigate('/bateaux')}>
          Retour aux bateaux
        </Button>
      </div>
    )
  }

  const handleBookingSubmit = async (data: BookingFormData) => {
    await bookingMutation.mutateAsync({ ...data, boatId: boat.id })
  }

  const specs = [
    { icon: <Tag size={16} />, label: 'Type', value: BOAT_TYPE_LABELS[boat.type] ?? boat.type },
    { icon: <Ruler size={16} />, label: 'Longueur', value: boat.length ? `${boat.length} m` : 'N/A' },
    { icon: <Users size={16} />, label: 'Capacité', value: `${boat.capacity} personnes` },
    { icon: <BedDouble size={16} />, label: 'Cabines', value: String(boat.cabins ?? 'N/A') },
    { icon: <Calendar size={16} />, label: 'Année', value: String(boat.year ?? 'N/A') },
    { icon: <Zap size={16} />, label: 'Motorisation', value: boat.motorizationType ?? 'N/A' },
  ]

  const rules = boat.rules ? boat.rules.split('\n').filter(Boolean) : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Helmet>
        <title>{boat.title} — SailingLoc</title>
        <meta name="description" content={boat.description?.slice(0, 155) ?? `Louez ${boat.title} à ${boat.port}, ${boat.city}.`} />
        <meta property="og:title" content={`${boat.title} — SailingLoc`} />
        <meta property="og:description" content={boat.description?.slice(0, 155) ?? `Louez ${boat.title} à ${boat.port}, ${boat.city}.`} />
        <meta property="og:type" content="article" />
        {boat.images?.[0] && <meta property="og:image" content={boat.images[0]} />}
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* ─── Left / Main Content ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <ImageGallery images={boat.images ?? []} title={boat.title} />

            {/* Title + Location + Rating */}
            <div>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <Badge variant="info">{BOAT_TYPE_LABELS[boat.type] ?? boat.type}</Badge>
                {boat.withSkipper && <Badge variant="success">Avec skipper disponible</Badge>}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{boat.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {/* A5 — Bouton partage */}
                  <button
                    onClick={handleShare}
                    aria-label="Partager cette annonce"
                    className="flex-shrink-0 p-2.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-ocean-300 hover:text-ocean-500 hover:bg-ocean-50 dark:hover:bg-ocean-900/30 transition-all duration-150"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={handleFavoriteToggle}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    aria-pressed={isFavorite}
                    className={cn(
                      'flex-shrink-0 p-2.5 rounded-full border transition-all duration-150',
                      isFavorite
                        ? 'bg-orange-500 border-orange-500 text-white shadow'
                        : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50'
                    )}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-ocean-600" />
                  {boat.port}
                  {boat.city && `, ${boat.city}`}
                  {boat.country && `, ${boat.country}`}
                </span>
                {boat.rating != null && boat.rating > 0 && (
                  <span className="flex items-center gap-2">
                    <Stars rating={boat.rating} size="sm" showValue />
                    <span className="text-gray-400 dark:text-gray-500">({boat.reviewCount ?? 0} avis)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Specs grid */}
            <section aria-labelledby="specs-title">
              <h2 id="specs-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Caractéristiques
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-1.5"
                  >
                    <span className="text-ocean-600 dark:text-ocean-400">{spec.icon}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{spec.label}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{spec.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            {boat.description && (
              <section aria-labelledby="desc-title">
                <h2 id="desc-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Description
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {boat.description}
                  </p>
                </div>
              </section>
            )}

            {/* Equipment */}
            {boat.equipment && boat.equipment.length > 0 && (
              <section aria-labelledby="equip-title">
                <h2 id="equip-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Équipements
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex flex-wrap gap-2">
                    {boat.equipment.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 border border-ocean-100 dark:border-ocean-800 rounded-full px-3 py-1 text-sm"
                      >
                        <ShieldCheck size={12} />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Rules */}
            {rules.length > 0 && (
              <section aria-labelledby="rules-title">
                <h2 id="rules-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Règlement du bord
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                  <ul className="space-y-2">
                    {(showAllRules ? rules : rules.slice(0, 4)).map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-ocean-400 mt-1.5 flex-shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                  {rules.length > 4 && (
                    <button
                      onClick={() => setShowAllRules((v) => !v)}
                      className="mt-3 flex items-center gap-1 text-sm text-ocean-600 hover:text-ocean-800 font-medium"
                    >
                      {showAllRules ? (
                        <>
                          <ChevronUp size={14} /> Voir moins
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> Voir tout ({rules.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* A4 — Calendrier des disponibilités */}
            <section aria-labelledby="avail-title">
              <h2 id="avail-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Disponibilités
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <BoatAvailabilityCalendar boatId={boat.id} />
              </div>
            </section>

            {/* Owner profile */}
            {boat.owner && (
              <section aria-labelledby="owner-title">
                <h2 id="owner-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Votre propriétaire
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-5">
                  {/* C3 — Avatar cliquable vers le profil public */}
                  <Link to={`/proprietaires/${boat.ownerId}`} className="flex-shrink-0 group">
                    <div className="h-16 w-16 rounded-full bg-ocean-700 text-white flex items-center justify-center text-xl font-bold group-hover:ring-2 group-hover:ring-ocean-400 transition-all">
                      {boat.owner.firstName?.[0]}
                      {boat.owner.lastName?.[0]}
                    </div>
                  </Link>
                  <div>
                    {/* C3 — Nom cliquable vers le profil public */}
                    <Link
                      to={`/proprietaires/${boat.ownerId}`}
                      className="font-semibold text-gray-900 dark:text-gray-100 text-base hover:text-ocean-700 dark:hover:text-ocean-400 transition-colors"
                    >
                      {boat.owner.firstName} {boat.owner.lastName}
                    </Link>
                    {boat.owner.createdAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Membre depuis {formatDate(boat.owner.createdAt)}
                      </p>
                    )}
                  </div>
                  {/* Lien vers la messagerie — A6 */}
                  {isAuthenticated && (
                    <Link
                      to={`/mon-espace/messages?to=${boat.ownerId}`}
                      className="ml-auto flex items-center gap-1.5 text-sm text-ocean-700 hover:text-ocean-900 font-medium transition-colors flex-shrink-0"
                    >
                      <MessageCircle size={15} />
                      Contacter
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* Reviews */}
            {reviewTotal > 0 && (
              <section aria-labelledby="reviews-title">
                <h2 id="reviews-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Avis ({reviewTotal})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-ocean-100 dark:bg-ocean-800/40 text-ocean-700 dark:text-ocean-400 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {review.reviewer?.firstName?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {review.reviewer?.firstName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                          <Stars rating={review.rating} size="sm" />
                          {review.comment && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* C8 — Bateaux similaires */}
            <SimilarBoats currentBoatId={boat.id} boatType={boat.type} />

            {/* C13 — Signalement (utilisateur connecté uniquement) */}
            {isAuthenticated && !reportSent && (
              <div className="text-center py-2">
                <button
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Flag size={12} />
                  Signaler cette annonce
                </button>
              </div>
            )}

            {/* Mobile CTA button */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-lg font-bold text-orange-500">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(boat.dailyRate)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500"> / jour</span>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setBookingPanelOpen(true)}
                className="flex-1 max-w-xs"
              >
                Réserver
              </Button>
            </div>
          </div>

          {/* ─── Right / Booking form (desktop) ─────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <BookingForm
                boat={boat}
                onSubmit={handleBookingSubmit}
                loading={bookingMutation.isPending}
                disabledDates={disabledDates}
              />
            </div>
          </div>
        </div>
      </div>

      {/* C13 — Modal de signalement */}
      <Modal
        isOpen={reportOpen}
        onClose={() => { setReportOpen(false); setReportDetails('') }}
        title="Signaler cette annonce"
        size="sm"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Les signalements abusifs peuvent entraîner la suspension de votre compte.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motif</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white dark:bg-gray-800"
            >
              <option value="INAPPROPRIATE_CONTENT">Contenu inapproprié</option>
              <option value="FRAUD">Fraude ou escroquerie</option>
              <option value="DUPLICATE">Annonce en doublon</option>
              <option value="WRONG_CATEGORY">Mauvaise catégorie</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Détails <span className="text-gray-400 dark:text-gray-500 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
              placeholder="Décrivez le problème constaté…"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none dark:bg-gray-800"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setReportOpen(false); setReportDetails('') }}
              disabled={reportMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              fullWidth
              leftIcon={<Flag size={14} />}
              onClick={() => reportMutation.mutate()}
              loading={reportMutation.isPending}
            >
              Signaler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mobile booking panel */}
      {bookingPanelOpen && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setBookingPanelOpen(false)}
          />
          <div className="relative mt-auto bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Réserver ce bateau</span>
              <button
                onClick={() => setBookingPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                aria-label="Fermer"
              >
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Modale de paiement Stripe (étape 2 du flow réservation) */}
      {stripePayment && boat && (
        <StripePaymentModal
          clientSecret={stripePayment.clientSecret}
          bookingId={stripePayment.bookingId}
          amount={stripePayment.amount}
          boatTitle={boat.title}
          onSuccess={() => {
            setStripePayment(null)
            toast.success('Paiement confirmé ! Votre réservation est en cours.')
            navigate('/mon-espace/reservations')
          }}
          onClose={() => setStripePayment(null)}
        />
      )}
    </div>
  )
}

export default BoatDetail
