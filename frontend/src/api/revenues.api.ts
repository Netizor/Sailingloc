import api from '../lib/axios'
import type { OwnerRevenuesResponse, RevenueFilterParams } from '../types'

/**
 * Récupère les revenus agrégés du propriétaire connecté :
 * résumé global, CA mensuel sur l'année demandée, répartition par bateau
 * et dernières réservations confirmées/terminées.
 */
export const getOwnerRevenues = async (
  params: RevenueFilterParams = {},
): Promise<OwnerRevenuesResponse> => {
  const { data } = await api.get<OwnerRevenuesResponse>('/bookings/owner/revenues', { params })
  return data
}
