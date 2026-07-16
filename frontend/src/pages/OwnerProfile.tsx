import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Ship, Star, Calendar, MessageCircle, Anchor, Compass, ShieldCheck, Settings, BadgeCheck } from 'lucide-react'
import { getPublicProfile } from '../api/users.api'
import { formatDate } from '../lib/utils'
import { useAuthStore } from '../store/auth.store'
import { SETTINGS_ROUTE } from '../lib/profilePaths'
import BoatCard from '../components/boats/BoatCard'
import OwnerReviewsSection from '../components/owner/OwnerReviewsSection'
import Spinner from '../components/ui/Spinner'

const OwnerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser, isAuthenticated } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner-profile', id],
    queryFn: () => getPublicProfile(Number(id!)),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600 dark:text-gray-400 font-medium">Propriétaire introuvable.</p>
        <Link to="/bateaux" className="text-ocean-700 dark:text-ocean-400 text-sm font-medium hover:underline">
          Voir les bateaux disponibles
        </Link>
      </div>
    )
  }

  const { user: owner, boats, reviews, rating, reviewCount } = data
  const initials = `${owner.firstName?.[0] ?? ''}${owner.lastName?.[0] ?? ''}`.toUpperCase()
  const ownerName = `${owner.firstName} ${owner.lastName}`
  const isOwnProfile = isAuthenticated && currentUser?.id === Number(id)

  return (
    <>
    <Helmet>
      <title>{ownerName} - Propriétaire SailingLoc</title>
      <meta name="description" content={`Découvrez les bateaux de ${ownerName} sur SailingLoc. ${boats.length} annonce(s) disponible(s).`} />
      <meta property="og:title" content={`${ownerName} - Propriétaire SailingLoc`} />
      <meta property="og:description" content={`Louez un bateau chez ${ownerName} sur SailingLoc.`} />
      <meta property="og:type" content="profile" />
    </Helmet>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

        {isOwnProfile && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-50 dark:bg-ocean-900/25 text-ocean-700 dark:text-ocean-400 flex-shrink-0">
                <BadgeCheck size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Aperçu de votre profil public
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  Cette page est visible par les locataires qui consultent vos bateaux.
                </p>
              </div>
            </div>
            <Link
              to={SETTINGS_ROUTE}
              className="inline-flex items-center justify-center gap-2 self-start sm:self-center text-sm font-medium text-white bg-brand-navy hover:bg-[#002952] dark:bg-ocean-700 dark:hover:bg-ocean-600 rounded-xl px-4 py-2.5 transition-colors flex-shrink-0 shadow-sm"
            >
              <Settings size={15} />
              Modifier le profil
            </Link>
          </div>
        )}

        {/* En-tête profil */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {owner.avatar ? (
                <img
                  src={owner.avatar}
                  alt={`${owner.firstName} ${owner.lastName}`}
                  className="h-24 w-24 rounded-full object-cover border-4 border-ocean-100 dark:border-ocean-800"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-ocean-700 text-white flex items-center justify-center text-3xl font-bold border-4 border-ocean-100 dark:border-ocean-800">
                  {initials}
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {owner.firstName} {owner.lastName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 text-xs font-medium px-2.5 py-0.5 border border-ocean-100 dark:border-ocean-800">
                  <Ship size={12} />
                  Propriétaire
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                {reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{rating.toFixed(1)}</span>
                    <span>({reviewCount} avis)</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Ship size={14} />
                  {boats.length} bateau{boats.length > 1 ? 'x' : ''}
                </span>
                {owner.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Membre depuis {formatDate(owner.createdAt)}
                  </span>
                )}
              </div>

              {owner.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mt-3 max-w-prose">
                  {owner.bio}
                </p>
              )}

              {isAuthenticated && !isOwnProfile && (
                <div className="mt-4">
                  <Link
                    to={`/mon-espace/messages?to=${id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-200 dark:border-gray-600 hover:border-ocean-300 dark:hover:border-ocean-700 text-gray-700 dark:text-gray-300 hover:text-ocean-700 dark:hover:text-ocean-400 px-3 py-1.5 rounded-lg transition-colors bg-white dark:bg-gray-900"
                  >
                    <MessageCircle size={14} />
                    Contacter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avis des locataires - toujours visible */}
        <OwnerReviewsSection
          reviews={reviews}
          rating={rating}
          reviewCount={reviewCount}
        />

        {/* CV de marin */}
        {(owner.sailorBio || owner.sailingQualifications || owner.sailingAreas || owner.sailingExperienceYears != null) && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Anchor size={18} className="text-ocean-700 dark:text-ocean-400" />
              CV de marin
            </h2>

            <div className="mb-4">
              {owner.sailorCvStatus === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium px-3 py-1 border border-green-200 dark:border-green-800">
                  <ShieldCheck size={14} />
                  CV vérifié par SailingLoc
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-1 border border-gray-200 dark:border-gray-700">
                  Informations déclarées par le propriétaire
                </span>
              )}
            </div>

            {owner.sailingExperienceYears != null && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 text-sm font-medium px-3 py-1">
                  <Compass size={14} />
                  {owner.sailingExperienceYears} an{owner.sailingExperienceYears > 1 ? 's' : ''} d'expérience
                </span>
              </div>
            )}

            {owner.sailorBio && (
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 whitespace-pre-line">
                {owner.sailorBio}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {owner.sailingQualifications && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                    Permis & qualifications
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {owner.sailingQualifications}
                  </p>
                </div>
              )}
              {owner.sailingAreas && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                    Zones de navigation
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {owner.sailingAreas}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Bateaux du propriétaire */}
        {boats.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Ship size={18} className="text-ocean-700 dark:text-ocean-400" />
              Ses bateaux
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {boats.map((boat) => (
                <BoatCard key={boat.id} boat={boat as any} isFavorite={false} />
              ))}
            </div>
          </section>
        )}

        {reviews.length === 0 && boats.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Ship size={40} strokeWidth={1.5} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p>Ce propriétaire n'a pas encore de bateaux actifs.</p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default OwnerProfile
