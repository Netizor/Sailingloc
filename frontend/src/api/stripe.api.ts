import api from '../lib/axios'

export interface SavedPaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export const stripeApi = {
  /** Crée un SetupIntent pour sauvegarder une nouvelle carte. */
  createSetupIntent: async (): Promise<{ clientSecret: string }> => {
    const { data } = await api.post<{ clientSecret: string }>('/stripe/setup-intent')
    return data
  },

  /** Liste les cartes sauvegardées de l'utilisateur courant. */
  listPaymentMethods: async (): Promise<SavedPaymentMethod[]> => {
    const { data } = await api.get<{ paymentMethods: SavedPaymentMethod[] }>(
      '/stripe/payment-methods',
    )
    return data.paymentMethods
  },

  /** Supprime (détache) une carte sauvegardée. */
  detachPaymentMethod: async (id: string): Promise<void> => {
    await api.delete(`/stripe/payment-methods/${id}`)
  },
}
