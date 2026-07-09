import api from '../lib/axios'
import type { Boat, Review, User } from '../types'

export interface PublicProfile {
  user: Partial<User>
  boats: Partial<Boat>[]
  reviews: Partial<Review>[]
  rating: number
  reviewCount: number
}

/**
 * Met à jour les informations personnelles de l'utilisateur connecté.
 */
export const updateProfile = async (
  data: Partial<Pick<User,
    'firstName' | 'lastName' | 'phone' | 'bio' |
    'sailingExperienceYears' | 'sailingQualifications' | 'sailingAreas' | 'sailorBio'
  >>,
): Promise<User> => {
  const { data: res } = await api.patch<{ user: User }>('/users/profile', data)
  return res.user
}

/**
 * Change le mot de passe de l'utilisateur connecté.
 * Renvoie une erreur 400 si currentPassword est incorrect.
 */
export const changePassword = async (data: {
  currentPassword: string
  newPassword: string
}): Promise<void> => {
  await api.patch('/users/password', data)
}

/**
 * Upload une nouvelle photo de profil (multipart/form-data).
 * Renvoie l'utilisateur mis à jour avec la nouvelle URL d'avatar.
 */
export const uploadAvatar = async (file: File): Promise<User> => {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await api.post<{ user: User }>('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.user
}

export const uploadSailorCvDocument = async (file: File): Promise<User> => {
  const formData = new FormData()
  formData.append('document', file)
  const { data } = await api.post<{ user: User }>('/users/sailor-cv/document', formData)
  return data.user
}

/**
 * Récupère le profil public d'un propriétaire (bateaux + avis reçus).
 */
export const getPublicProfile = async (id: number): Promise<PublicProfile> => {
  const { data } = await api.get<PublicProfile>(`/users/${id}/profile`)
  return data
}

/**
 * RGPD Art. 20 - Export de toutes les données personnelles de l'utilisateur connecté.
 * Renvoie un objet JSON téléchargeable côté client.
 */
export const exportMyData = async (): Promise<object> => {
  const { data } = await api.get<object>('/users/me/export')
  return data
}

/**
 * RGPD Art. 17 - Suppression du compte (anonymisation des données personnelles).
 * L'utilisateur doit être déconnecté immédiatement après.
 */
export const deleteAccount = async (): Promise<void> => {
  await api.delete('/auth/account')
}
