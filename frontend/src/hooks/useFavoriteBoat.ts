import { useMemo, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites.api'
import { useAuthStore } from '../store/auth.store'

export function useFavoritesSet() {
  const { isAuthenticated } = useAuthStore()
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const favoriteIds = useMemo(
    () => new Set(favorites?.map((f) => f.boatId) ?? []),
    [favorites],
  )

  return { favoriteIds, isAuthenticated }
}

export function useFavoriteBoat(boatId: number) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { favoriteIds } = useFavoritesSet()

  const isFavorite = favoriteIds.has(boatId)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['favorites'] })
    qc.invalidateQueries({ queryKey: ['favorites', 'check', String(boatId)] })
  }

  const addMutation = useMutation({
    mutationFn: () => addFavorite(boatId),
    onSuccess: () => {
      invalidate()
      toast.success(t('favorites.added', { defaultValue: 'Ajouté aux favoris' }))
    },
    onError: () => toast.error(t('common.error')),
  })

  const removeMutation = useMutation({
    mutationFn: () => removeFavorite(boatId),
    onSuccess: () => {
      invalidate()
      toast.success(t('favorites.removed', { defaultValue: 'Retiré des favoris' }))
    },
    onError: () => toast.error(t('common.error')),
  })

  const toggle = (e?: MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!isAuthenticated) {
      navigate('/connexion')
      return
    }
    if (isFavorite) removeMutation.mutate()
    else addMutation.mutate()
  }

  return {
    isFavorite,
    isAuthenticated,
    toggle,
    isPending: addMutation.isPending || removeMutation.isPending,
  }
}
