import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
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
  const { user, updateUser, setAuth, accessToken, refreshToken: rt } = useAuthStore()
  const navigate = useNavigate()

  // Mutation pour renvoyer l'email de vérification
  const resendMutation = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => toast.success('Email de vérification envoyé ! Consultez votre boite mail.'),
    onError:   () => toast.error('Envoi échoué. Réessayez dans quelques instants.'),
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
        title:       'Email non vérifié',
        description: 'Cliquez sur le lien envoyé lors de votre inscription pour vérifier votre adresse.',
        actionLabel: 'Renvoyer l\'email',
        actionType:  'callback',
        actionFn:    () => resendMutation.mutate(),
      })
    }

    if (!hasPhone) {
      issues.push({
        key:         'phone',
        title:       'Téléphone manquant',
        description: 'Un numéro de téléphone est obligatoire pour publier une annonce de bateau.',
        actionLabel: 'Compléter mon profil',
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
