import api from '../lib/axios'

export const CONTACT_SUBJECTS = [
  'location',
  'mise en location',
  'probleme-reservation',
  'autre',
] as const

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

/** Clés i18n sans espaces (le value API reste CONTACT_SUBJECTS) */
export const CONTACT_SUBJECT_I18N: Record<ContactSubject, string> = {
  location: 'location',
  'mise en location': 'listBoat',
  'probleme-reservation': 'bookingIssue',
  autre: 'autre',
}

export interface ContactPayload {
  name: string
  email: string
  subject: ContactSubject
  message: string
  /** Honeypot anti-spam — doit rester vide */
  website?: string
}

/** Envoie un message depuis le formulaire de contact. */
export const sendContactMessage = async (payload: ContactPayload): Promise<void> => {
  await api.post('/contact', payload)
}
