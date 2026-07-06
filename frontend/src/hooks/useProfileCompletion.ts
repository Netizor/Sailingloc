import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'
import { UserRole } from '../types'

export interface ProfileIssue {
  key:         string
  title:       string
  description: string
  // Action principale : lien ou callback
  actionLabel: string
  actionType:  'navigate' | 'callback'
  actionTo?:   string    // si navigate
  actionFn?:   () => void // si callback
}

export interface ProfileCompletion {
  /** L'utilisateur peut effectuer les actions de locataire (réserver) */
  canBook: boolean
  /** L'utilisateur peut publier/modifier un bateau (propriétaire) */
  canManageBoat: boolean
  /** Problèmes détectés, dans l'ordre d'importance */
  issues: ProfileIssue[]
  /** Raccourci : profil entièrement complété pour le rôle courant */
  isComplete: boolean
}

/**
 * Centralise les règles de complétude de profil.
 * Utilisé pour griser des boutons ou afficher une modale bloquante.
 */
export function useProfileCompletion(): ProfileCompletion {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const resendMutation = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => toast.success(t('profileCompletion.emailSent')),
    onError: () => toast.error(t('profileCompletion.emailSendFailed')),
  })

  if (!user) {
    return { canBook: false, canManageBoat: false, issues: [], isComplete: false }
  }

  const isEmailVerified = !!user.emailVerifiedAt
  const hasPhone        = !!user.phone
  const isOwner         = user.role === UserRole.OWNER || user.role === UserRole.ADMIN

  // Issues uniquement pour les propriétaires (la réservation n'est pas bloquée)
  const issues: ProfileIssue[] = []

  if (isOwner) {
    if (!isEmailVerified) {
      issues.push({
        key:         'email',
        title:       t('profileCompletion.emailNotVerified'),
        description: t('profileCompletion.emailNotVerifiedDesc'),
        actionLabel: t('profileCompletion.resendEmail'),
        actionType:  'callback',
        actionFn:    () => resendMutation.mutate(),
      })
    }

    if (!hasPhone) {
      issues.push({
        key:         'phone',
        title:       t('profileCompletion.phoneMissing'),
        description: t('profileCompletion.phoneMissingDesc'),
        actionLabel: t('profileCompletion.completeProfile'),
        actionType:  'navigate',
        actionTo:    '/mon-espace/profil',
      })
    }
  }

  // Un locataire peut toujours réserver - seuls les propriétaires ont des pré-requis
  const canBook        = true
  const canManageBoat  = isOwner ? (isEmailVerified && hasPhone) : true
  const isComplete     = issues.length === 0

  return { canBook, canManageBoat, issues, isComplete }
}
