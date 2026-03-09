import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Anchor } from 'lucide-react'
import { getFavorites, removeFavorite } from '../../api/favorites.api'
import BoatCard from '../../components/boats/BoatCard'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import type { Boat } from '../../types'

const MyFavorites: React.FC = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: favorites, isLoading, isError } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 60 * 1000,
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-8">
          <Heart size={22} className="text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes favoris</h1>
          {favorites && favorites.length > 0 && (
            <span className="text-sm bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 rounded-full px-2.5 py-0.5 font-medium">
              {favorites.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Erreur lors du chargement de vos favoris.
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favorites.map((fav) => {
              const boat = fav.boat as Boat | undefined
              if (!boat) return null
              return (
                <BoatCard
                  key={fav.id}
                  boat={boat}
                  isFavorite
                  onFavoriteToggle={(boatId) => removeMutation.mutate(boatId)}
                />
              )
            })}
          </div>
        ) : (
          /* État vide */
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center">
            <Anchor size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">Aucun bateau en favoris</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Cliquez sur le cœur d'une annonce pour la sauvegarder ici.
            </p>
            <Button variant="primary" onClick={() => navigate('/bateaux')}>
              Explorer les bateaux
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyFavorites
