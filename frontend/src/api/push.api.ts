import api from '../lib/axios'

/** Récupère la clé publique VAPID pour s'abonner au push. */
export const getVapidPublicKey = async (): Promise<string> => {
  const { data } = await api.get<{ vapidPublicKey: string }>('/push/vapid-key')
  return data.vapidPublicKey
}

/** Envoie l'abonnement push au backend pour le persister. */
export const subscribePush = async (subscription: PushSubscriptionJSON): Promise<void> => {
  await api.post('/push/subscribe', subscription)
}

/** Supprime l'abonnement push du backend. */
export const unsubscribePush = async (endpoint: string): Promise<void> => {
  await api.delete('/push/unsubscribe', { data: { endpoint } })
}
