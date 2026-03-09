import api from '../lib/axios'
import type { Favorite } from '../types'

/**
 * Fetch all boats the authenticated user has added to their favourites.
 * Backend returns { favorites: Favorite[] } after interceptor unwrapping.
 */
export const getFavorites = async (): Promise<Favorite[]> => {
  const { data } = await api.get<{ favorites: Favorite[] }>('/favorites')
  return data.favorites
}

/**
 * Add a boat to the authenticated user's favourites list.
 * Backend returns { favorited: boolean, favorite: Favorite } after interceptor unwrapping.
 */
export const addFavorite = async (boatId: number): Promise<Favorite> => {
  const { data } = await api.post<{ favorited: boolean; favorite: Favorite }>('/favorites', { boatId })
  return data.favorite
}

/**
 * Remove a boat from the authenticated user's favourites.
 * Uses the boatId (not the Favorite record ID) for a more intuitive API.
 */
export const removeFavorite = async (boatId: number): Promise<void> => {
  await api.delete(`/favorites/${boatId}`)
}

/**
 * Check whether the authenticated user has a specific boat in their favourites.
 */
export const checkFavorite = async (boatId: number): Promise<{ isFavorite: boolean }> => {
  const { data } = await api.get<{ isFavorite: boolean }>(`/favorites/check/${boatId}`)
  return data
}
