import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Edit2,
  CalendarDays,
  ExternalLink,
  Anchor,
  Star,
  Tag,
} from 'lucide-react'
import { boatsApi } from '../../api/boats.api'
import type { Boat } from '../../types'
import Button from '../../components/ui/Button'
import DisabledTooltip from '../../components/ui/DisabledTooltip'
import { useProfileCompletion } from '../../hooks/useProfileCompletion'
import { formatPrice, getBoatStatusLabel } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Stars from '../../components/ui/Stars'
import Spinner from '../../components/ui/Spinner'
import DraftSection from '../../components/ui/DraftSection'
import type { BadgeVariant } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/auth.store'
import { UserRole } from '../../types'

const statusVariants: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  DRAFT: 'default',
  INACTIVE: 'default',
  SUSPENDED: 'danger',
  PENDING_REVIEW: 'warning',
  REJECTED: 'danger',
}

const MyBoats: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { canManageBoat, issues } = useProfileCompletion()
  const isAdmin = user?.role === UserRole.ADMIN

  // Message synthétique pour le tooltip des boutons bloqués
  const blockedTooltip = issues.map((i) => i.title).join(' · ')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner', 'boats'],
    queryFn: () => boatsApi.getMyBoats(),
    staleTime: 2 * 60 * 1000,
  })

  // Le backend renvoie une PaginatedResponse : la liste est dans `.data`
  const boats: Boat[] = data?.data ?? []

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('myBoats.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t('myBoats.listing', { count: boats.length })}
            </p>
          </div>
          <DisabledTooltip disabled={!canManageBoat} tooltip={blockedTooltip}>
            <button
              type="button"
              disabled={!canManageBoat}
              onClick={() => navigate('/proprietaire/bateaux/nouveau')}
              className="flex items-center gap-2 bg-brand-blue hover:bg-ocean-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-brand-blue/25 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              {t('layout.addBoat')}
            </button>
          </DisabledTooltip>
        </div>

        {/* Brouillons en cours */}
        <DraftSection type="boats" />

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            {t('myBoats.loadError')}
          </div>
        ) : boats.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center mx-auto mb-5">
              <Anchor size={36} className="text-ocean-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('owner.noBoats')}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto mb-6">
              {isAdmin ? t('myBoats.emptyAdmin') : t('owner.noBoatsHint')}
            </p>
            {isAdmin ? (
              <Button variant="primary" size="lg" onClick={() => navigate('/admin/bateaux')}>
                {t('myBoats.viewAllBoatsAdmin')}
              </Button>
            ) : (
              <DisabledTooltip disabled={!canManageBoat} tooltip={blockedTooltip}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/proprietaire/bateaux/nouveau')}
                  leftIcon={<Plus size={18} />}
                >
                  {t('owner.addFirstBoat')}
                </Button>
              </DisabledTooltip>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {boats.map((boat) => (
              <BoatManagementCard key={boat.id} boat={boat} />
            ))}
          </div>
        )}
    </div>
  )
}

const BoatManagementCard: React.FC<{ boat: Boat }> = ({ boat }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const statusKey = boat.status ?? 'DRAFT'
  const statusVariant = statusVariants[statusKey] ?? statusVariants.DRAFT
  const mainImage = boat.images?.[0]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="sm:w-44 h-44 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {mainImage ? (
          <img
            src={mainImage}
            alt={boat.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-ocean-50 dark:bg-ocean-900/30 gap-2">
            <Anchor size={28} className="text-ocean-300" />
            <span className="text-xs text-ocean-400">{t('myBoats.noPhoto')}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={statusVariant} size="sm" dot>
                {getBoatStatusLabel(statusKey)}
              </Badge>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">{boat.title}</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {boat.port}{boat.city ? `, ${boat.city}` : ''}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {/* Utilise le helper partagé pour la cohérence avec le reste de l'app */}
            <p className="text-lg font-bold text-orange-500">
              {formatPrice(boat.dailyRate)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('myBoats.perDay')}</p>
          </div>
        </div>

        {/* Rating + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {/* Le champ dans le type Boat est `rating`, pas `averageRating` */}
            {boat.rating != null && boat.rating > 0 ? (
              <>
                <Stars rating={boat.rating} size="sm" showValue />
                <span className="text-xs text-gray-400 dark:text-gray-500">({boat.reviewCount ?? 0})</span>
              </>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-1">
                <Star size={12} className="text-gray-300 dark:text-gray-600" />
                {t('myBoats.notRatedYet')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ExternalLink size={13} />}
              onClick={() => navigate(`/bateaux/${boat.id}`)}
            >
              {t('myBoats.viewListing')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CalendarDays size={13} />}
              onClick={() => navigate(`/proprietaire/bateaux/${boat.id}/disponibilites`)}
            >
              {t('myBoats.availability')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Tag size={13} />}
              onClick={() => navigate(`/proprietaire/bateaux/${boat.id}/tarifs`)}
            >
              {t('myBoats.prices')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit2 size={13} />}
              onClick={() => navigate(`/proprietaire/bateaux/${boat.id}/editer`)}
            >
              {t('myBoats.edit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyBoats
