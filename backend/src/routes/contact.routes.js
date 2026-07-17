import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  sendContactMessage,
  sendContactConfirmation,
} from '../services/email.service.js'

const router = Router()

const ALLOWED_SUBJECTS = [
  'location',
  'mise en location',
  'probleme-reservation',
  'autre',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de messages envoyés. Réessayez dans une heure.' },
})

function validateContactBody(body) {
  const errors = []
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (name.length < 2) errors.push('Le nom doit contenir au moins 2 caractères')
  if (name.length > 100) errors.push('Le nom ne peut pas dépasser 100 caractères')

  if (!email) errors.push("L'email est requis")
  else if (!EMAIL_RE.test(email)) errors.push('Format email invalide')
  else if (email.length > 254) errors.push("L'email ne peut pas dépasser 254 caractères")

  if (!ALLOWED_SUBJECTS.includes(subject)) {
    errors.push(
      `Sujet invalide. Valeurs autorisées : ${ALLOWED_SUBJECTS.join(', ')}`,
    )
  }

  if (message.length < 10) errors.push('Le message doit contenir au moins 10 caractères')
  if (message.length > 5000) errors.push('Le message ne peut pas dépasser 5000 caractères')

  return { errors, name, email, subject, message }
}

/**
 * POST /api/contact
 * Body: { name, email, subject, message, website? }
 * `website` = honeypot (si rempli → 200 sans envoyer)
 */
router.post('/', contactLimiter, async (req, res) => {
  try {
    // Honeypot anti-bot : répondre OK sans envoyer
    if (typeof req.body?.website === 'string' && req.body.website.trim() !== '') {
      return res.status(200).json({ message: 'Message envoyé' })
    }

    const { errors, name, email, subject, message } = validateContactBody(req.body || {})
    if (errors.length) {
      return res.status(400).json({ message: 'Données invalides', errors })
    }

    await sendContactMessage({ name, email, subject, message })
    await sendContactConfirmation({ name, email, subject })

    return res.status(200).json({ message: 'Message envoyé' })
  } catch (err) {
    console.error('[Contact]', err)
    return res.status(500).json({
      message: "Impossible d'envoyer le message pour le moment. Réessayez plus tard.",
    })
  }
})

export default router
