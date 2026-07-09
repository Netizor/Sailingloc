import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { addFavorite, removeFavorite } from '../api/favorites.api'
import { useAuthStore } from '../store/auth.store'

export function useFavoriteBoat(isFavorite: boolean) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(t('favorites.added'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(t('favorites.removed'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const toggle = (boatId: number) => {
    if (!isAuthenticated) {
      navigate('/connexion')
      return
    }
    if (isFavorite) {
      removeMutation.mutate(boatId)
    } else {
      addMutation.mutate(boatId)
    }
  }

  return {
    toggle,
    isPending: addMutation.isPending || removeMutation.isPending,
  }
}
