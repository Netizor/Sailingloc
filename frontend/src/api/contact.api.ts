import api from '../lib/axios'

export interface ContactPayload {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
  website?: string
}

/** Envoie un message depuis le formulaire de contact. */
export const sendContactMessage = async (payload: ContactPayload): Promise<void> => {
  const { website, ...rest } = payload
  await api.post('/contact', {
    ...rest,
    // honeypot côté API (ne doit jamais être rempli par un humain)
    company_url_hp: website || '',
  })
}
