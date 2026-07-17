/**
 * Service email — utilise Resend si RESEND_API_KEY est défini,
 * sinon tombe sur un log console (utile en dev sans config email).
 *
 * .env acceptés :
 * - MAIL_FROM ou EMAIL_FROM  (ex: "SailingLoc <noreply@domaine>" ou "noreply@domaine")
 * - CONTACT_EMAIL ou RESEND_TO_EMAIL  (destinataire formulaire contact)
 */

const RAW_FROM =
  process.env.MAIL_FROM ||
  process.env.EMAIL_FROM ||
  'noreply@sailingloc.fr'

/** Resend accepte "Name <email@x>" ou juste "email@x" — on ne re-wrappe pas. */
function resolveFromAddress(raw) {
  const value = String(raw || '').trim()
  if (!value) return 'noreply@sailingloc.fr'
  if (value.includes('<') && value.includes('>')) return value
  return `SailingLoc <${value}>`
}

const MAIL_FROM = resolveFromAddress(RAW_FROM)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const CONTACT_TO =
  process.env.CONTACT_EMAIL ||
  process.env.RESEND_TO_EMAIL ||
  null

const NAVY = '#003366'
const OCEAN = '#2563FF'

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendMail({ to, subject, html, replyTo }) {
  if (process.env.RESEND_API_KEY) {
    const payload = {
      from: MAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Resend error:', err)
      throw new Error(`Échec envoi email Resend : ${err}`)
    }
    return
  }

  // Fallback dev : afficher dans les logs
  console.log(`[Email DEV] to=${to} | subject=${subject}${replyTo ? ` | replyTo=${replyTo}` : ''}`)
  console.log(html.replace(/<[^>]+>/g, '').substring(0, 300))
}

export async function sendContactMessage({ name, email, subject, message }) {
  const to = CONTACT_TO
  if (!to) throw new Error('CONTACT_EMAIL (ou RESEND_TO_EMAIL) non configuré')

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    subject: escapeHtml(subject),
    message: escapeHtml(message).replace(/\n/g, '<br>'),
  }

  await sendMail({
    to,
    replyTo: email,
    subject: `[Contact SailingLoc] ${subject} - ${name}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:${NAVY};color:#fff;padding:16px 20px">
          <h1 style="margin:0;font-size:18px">Nouveau message de contact</h1>
        </div>
        <div style="padding:20px;color:#111827;background:#fff">
          <p style="margin:0 0 12px"><strong style="color:${NAVY}">Nom :</strong> ${safe.name}</p>
          <p style="margin:0 0 12px"><strong style="color:${NAVY}">Email :</strong>
            <a href="mailto:${safe.email}" style="color:${OCEAN}">${safe.email}</a>
          </p>
          <p style="margin:0 0 12px"><strong style="color:${NAVY}">Sujet :</strong> ${safe.subject}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
          <p style="margin:0 0 8px"><strong style="color:${NAVY}">Message :</strong></p>
          <p style="margin:0;line-height:1.5">${safe.message}</p>
        </div>
      </div>
    `,
  })
}

export async function sendContactConfirmation({ name, email, subject }) {
  const safeName = escapeHtml(name)
  const safeSubject = escapeHtml(subject)

  await sendMail({
    to: email,
    subject: 'Nous avons bien reçu votre message – SailingLoc',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:${NAVY};color:#fff;padding:16px 20px">
          <h1 style="margin:0;font-size:18px">SailingLoc</h1>
        </div>
        <div style="padding:20px;color:#111827;background:#fff">
          <p style="margin:0 0 12px">Bonjour ${safeName},</p>
          <p style="margin:0 0 12px">Nous avons bien reçu votre message concernant <strong>${safeSubject}</strong>.</p>
          <p style="margin:0 0 12px">Notre équipe vous répondra sous <strong>48 h</strong>.</p>
          <p style="margin:0;color:#6b7280;font-size:13px">Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
        <div style="background:#EEF3FB;padding:12px 20px;font-size:12px;color:${NAVY}">
          <a href="${FRONTEND_URL}" style="color:${OCEAN};text-decoration:none">sailingloc.fr</a>
        </div>
      </div>
    `,
  })
}

export async function sendEmailVerification(to, firstName, token) {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`
  await sendMail({
    to,
    subject: 'Vérifiez votre adresse email – SailingLoc',
    html: `
      <h2>Bonjour ${firstName},</h2>
      <p>Merci de vous être inscrit sur SailingLoc. Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
      <p><a href="${link}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Vérifier mon email</a></p>
      <p>Ce lien est valable 24 heures.</p>
      <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
    `,
  })
}

export async function sendPasswordReset(to, firstName, token) {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`
  await sendMail({
    to,
    subject: 'Réinitialisation de votre mot de passe – SailingLoc',
    html: `
      <h2>Bonjour ${firstName},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p><a href="${link}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  })
}

export async function sendBookingNotification(to, firstName, { type, boatTitle, startDate, endDate }) {
  const messages = {
    confirmed: { subject: 'Réservation confirmée – SailingLoc', intro: 'Votre réservation a été confirmée !' },
    cancelled: { subject: 'Réservation annulée – SailingLoc', intro: 'Une réservation a été annulée.' },
    new_request: { subject: 'Nouvelle demande de réservation – SailingLoc', intro: 'Vous avez reçu une nouvelle demande de réservation.' },
  }
  const msg = messages[type] || { subject: 'Mise à jour de réservation', intro: 'Votre réservation a été mise à jour.' }
  await sendMail({
    to,
    subject: msg.subject,
    html: `
      <h2>Bonjour ${firstName},</h2>
      <p>${msg.intro}</p>
      <ul>
        <li><strong>Bateau :</strong> ${boatTitle}</li>
        <li><strong>Du :</strong> ${startDate}</li>
        <li><strong>Au :</strong> ${endDate}</li>
      </ul>
      <p><a href="${FRONTEND_URL}/dashboard" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir mes réservations</a></p>
    `,
  })
}
