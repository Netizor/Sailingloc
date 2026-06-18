import api from '../lib/axios'
import type { PaginatedResponse, Review, ReviewCreateData } from '../types'

export type ReviewModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Fetch published RENTER_TO_BOAT reviews for a specific boat.
 */
export const getBoatReviews = async (
  boatId: number,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Review>> => {
  const { data } = await api.get<PaginatedResponse<Review>>(`/reviews/boat/${boatId}`, {
    params: { page, limit },
  })
  return data
}

/**
 * Submit a review for a completed booking.
 * type RENTER_TO_BOAT: renter reviews the boat
 * type OWNER_TO_RENTER: owner reviews the renter
 */
export const createReview = async (reviewData: ReviewCreateData): Promise<Review> => {
  const { data } = await api.post<Review>('/reviews', reviewData)
  return data
}

/**
 * Admin - liste paginée de tous les avis avec filtre optionnel sur moderationStatus.
 */
export const adminListReviews = async (
  params: { page?: number; limit?: number; status?: ReviewModerationStatus } = {},
): Promise<PaginatedResponse<Review>> => {
  const { data } = await api.get<PaginatedResponse<Review>>('/reviews/admin', { params })
  return data
}

/**
 * Admin - publie ou masque un avis.
 */
export const adminUpdateReview = async (
  id: number,
  payload: { isPublished: boolean; adminNote?: string },
): Promise<Review> => {
  const { data } = await api.patch<Review>(`/reviews/admin/${id}`, payload)
  return data
}
