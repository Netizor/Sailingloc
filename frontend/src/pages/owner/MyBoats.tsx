import React from 'react'
import { useNavigate } from 'react-router-dom'
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
import { formatPrice } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Stars from '../../components/ui/Stars'
import Spinner from '../../components/ui/Spinner'
import type { BadgeVariant } from '../../components/ui/Badge'

// Clés alignées sur les valeurs renvoyées par le backend (BoatStatus)
const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Publié', variant: 'success' },
  DRAFT: { label: 'Brouillon', variant: 'default' },
  INACTIVE: { label: 'Inactif', variant: 'default' },
  SUSPENDED: { label: 'Suspendu', variant: 'danger' },
  PENDING_REVIEW: { label: 'En révision', variant: 'warning' },
  REJECTED: { label: 'Rejeté', variant: 'danger' },
}

const MyBoats: React.FC = () => {
  const navigate = useNavigate()
  const { canManageBoat, issues } = useProfileCompletion()

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes bateaux</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {boats.length} annonce{boats.length !== 1 ? 's' : ''}
            </p>
          </div>
          <DisabledTooltip disabled={!canManageBoat} tooltip={blockedTooltip}>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/proprietaire/bateaux/nouveau')}
              leftIcon={<Plus size={16} />}
            >
              Ajouter un bateau
            </Button>
          </DisabledTooltip>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Erreur lors du chargement de vos bateaux.
          </div>
        ) : boats.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center mx-auto mb-5">
              <Anchor size={36} className="text-ocean-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Aucun bateau pour le moment
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto mb-8">
              Publiez votre premier bateau et commencez à générer des revenus dès aujourd&apos;hui.
            </p>
            <DisabledTooltip disabled={!canManageBoat} tooltip={blockedTooltip}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/proprietaire/bateaux/nouveau')}
                leftIcon={<Plus size={18} />}
              >
                Ajouter mon premier bateau
              </Button>
            </DisabledTooltip>
          </div>
        ) : (
          <div className="space-y-4">
            {boats.map((boat) => (
              <BoatManagementCard key={boat.id} boat={boat} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const BoatManagementCard: React.FC<{ boat: Boat }> = ({ boat }) => {
  const navigate = useNavigate()
  const status = statusConfig[boat.status ?? 'DRAFT'] ?? statusConfig['DRAFT']
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
            <span className="text-xs text-ocean-400">Pas de photo</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={status.variant} size="sm" dot>
                {status.label}
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
            <p className="text-xs text-gray-400 dark:text-gray-500">/ jour</p>
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
                Pas encore noté
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
              Voir annonce
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CalendarDays size={13} />}
              onClick={() => navigate(`/proprietaire/bateaux/${boat.id}/disponibilites`)}
            >
              Dispo.
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Tag size={13} />}
              onClick={() => navigate(`/proprietaire/bateaux/${boat.id}/tarifs`)}
            >
              Tarifs
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit2 size={13} />}
              onClick={() => navigate(`/proprietaire/bateaux/${boat.id}/editer`)}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyBoats
