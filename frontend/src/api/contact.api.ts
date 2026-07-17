import api from '../lib/axios'

export interface ContactPayload {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
  /** Honeypot anti-spam — doit rester vide */
  website?: string
}

/** Envoie un message depuis le formulaire de contact. */
export const sendContactMessage = async (payload: ContactPayload): Promise<void> => {
  await api.post('/contact', payload)
}
