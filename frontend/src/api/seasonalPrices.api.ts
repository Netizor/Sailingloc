import api from '../lib/axios'

export interface SeasonalPrice {
  id: number
  boatId: number
  label: string
  startDate: string
  endDate: string
  dailyRate: number
  createdAt: string
}

export interface SeasonalPricePayload {
  label: string
  startDate: string
  endDate: string
  dailyRate: number
}

/** Liste les prix saisonniers d'un bateau */
export const getSeasonalPrices = async (boatId: number): Promise<SeasonalPrice[]> => {
  const { data } = await api.get<{ seasonalPrices: SeasonalPrice[] }>(
    `/boats/${boatId}/seasonal-prices`
  )
  return data.seasonalPrices
}

/** Crée un nouveau tarif saisonnier */
export const createSeasonalPrice = async (
  boatId: number,
  payload: SeasonalPricePayload
): Promise<SeasonalPrice> => {
  const { data } = await api.post<{ seasonalPrice: SeasonalPrice }>(
    `/boats/${boatId}/seasonal-prices`,
    payload
  )
  return data.seasonalPrice
}

/** Met à jour un tarif saisonnier */
export const updateSeasonalPrice = async (
  boatId: number,
  id: number,
  payload: Partial<SeasonalPricePayload>
): Promise<SeasonalPrice> => {
  const { data } = await api.patch<{ seasonalPrice: SeasonalPrice }>(
    `/boats/${boatId}/seasonal-prices/${id}`,
    payload
  )
  return data.seasonalPrice
}

/** Supprime un tarif saisonnier */
export const deleteSeasonalPrice = async (boatId: number, id: number): Promise<void> => {
  await api.delete(`/boats/${boatId}/seasonal-prices/${id}`)
}
