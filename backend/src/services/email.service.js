/**
 * Service email — Resend si RESEND_API_KEY, sinon log console (dev).
 *
 * .env :
 * - MAIL_FROM ou EMAIL_FROM  (ex: "SailingLoc <noreply@domaine>")
 * - CONTACT_EMAIL ou RESEND_TO_EMAIL
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const NAVY = '#003366'
const OCEAN = '#2563FF'

function resolveFromAddress() {
  const raw =
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    'noreply@sailingloc.fr'
  const value = String(raw).trim()
  if (!value) return 'noreply@sailingloc.fr'
  if (value.includes('<') && value.includes('>')) return value
  return `SailingLoc <${value}>`
}

function resolveContactTo() {
  return process.env.CONTACT_EMAIL || process.env.RESEND_TO_EMAIL || null
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendMail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = resolveFromAddress()

  if (apiKey) {
    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }
    console.log(`[Email] Resend → to=${payload.to} from=${from} subject=${subject}`)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Resend error:', err)
      throw new Error(`Échec envoi email Resend : ${err}`)
    }
    const data = await res.json().catch(() => ({}))
    console.log('[Email] Resend OK', data?.id || '')
    return
  }

  console.log(`[Email DEV] (pas de RESEND_API_KEY) to=${to} | subject=${subject}${replyTo ? ` | replyTo=${replyTo}` : ''}`)
  console.log(html.replace(/<[^>]+>/g, '').substring(0, 300))
}

export async function sendContactMessage({ firstName, lastName, email, subject, message }) {
  const to = resolveContactTo()
  if (!to) throw new Error('CONTACT_EMAIL (ou RESEND_TO_EMAIL) non configuré')

  const name = `${firstName} ${lastName}`.trim()
  const safe = {
    firstName: escapeHtml(firstName),
    lastName: escapeHtml(lastName),
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
          <p style="margin:0 0 12px"><strong style="color:${NAVY}">Nom :</strong> ${safe.firstName} ${safe.lastName}</p>
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

export async function sendContactConfirmation({ firstName, email, subject }) {
  const safeName = escapeHtml(firstName)
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

export async function sendAccountDeletedEmail({ to, firstName }) {
  const safeName = escapeHtml(firstName || 'utilisateur')

  await sendMail({
    to,
    subject: 'Confirmation de suppression de compte – SailingLoc',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:${NAVY};color:#fff;padding:16px 20px">
          <h1 style="margin:0;font-size:18px">SailingLoc</h1>
        </div>
        <div style="padding:20px;color:#111827;background:#fff">
          <p style="margin:0 0 12px">Bonjour ${safeName},</p>
          <p style="margin:0 0 12px">Nous confirmons que votre compte SailingLoc a bien été <strong>supprimé</strong>.</p>
          <p style="margin:0 0 12px">Vos données personnelles ont été anonymisées conformément au RGPD.</p>
          <p style="margin:0 0 12px">Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement à
            <a href="mailto:sailingloc-entreprise@outlook.fr" style="color:${OCEAN}">sailingloc-entreprise@outlook.fr</a>.
          </p>
          <p style="margin:0;color:#6b7280;font-size:13px">Ceci est un message automatique.</p>
        </div>
        <div style="background:#EEF3FB;padding:12px 20px;font-size:12px;color:${NAVY}">
          <a href="${FRONTEND_URL}" style="color:${OCEAN};text-decoration:none">sailingloc.fr</a>
        </div>
      </div>
    `,
  })
}

export async function sendEmailVerification(to, firstName, token) {
  const link = `${FRONTEND_URL}/verifier-email?token=${token}`
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
  const link = `${FRONTEND_URL}/reinitialiser-mot-de-passe?token=${token}`
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

export async function sendCancellationEmail({
  to, firstName, boatTitle, startDate, endDate, reason, refundAmount, cancelledByOwner, isRenter,
}) {
  let intro, refundMsg

  if (isRenter) {
    intro = cancelledByOwner
      ? 'Le propriétaire a annulé votre réservation.'
      : 'Votre annulation a bien été prise en compte.'
    refundMsg = refundAmount > 0
      ? `<p><strong>Remboursement :</strong> ${refundAmount.toFixed(2)} € seront remboursés sous 5 à 10 jours ouvrés.</p>`
      : `<p>Selon nos conditions d'annulation, aucun remboursement n'est applicable pour cette date.</p>`
  } else {
    intro = cancelledByOwner
      ? 'Vous avez annulé la réservation suivante. Le locataire sera intégralement remboursé.'
      : 'Un locataire a annulé sa réservation.'
    refundMsg = refundAmount > 0 && cancelledByOwner
      ? `<p><strong>Remboursement locataire :</strong> ${refundAmount.toFixed(2)} € ont été remboursés automatiquement.</p>`
      : ''
  }

  await sendMail({
    to,
    subject: 'Réservation annulée – SailingLoc',
    html: `
      <h2>Bonjour ${firstName},</h2>
      <p>${intro}</p>
      <ul>
        <li><strong>Bateau :</strong> ${boatTitle}</li>
        <li><strong>Du :</strong> ${startDate}</li>
        <li><strong>Au :</strong> ${endDate}</li>
        <li><strong>Motif :</strong> ${reason}</li>
      </ul>
      ${refundMsg}
      <p><a href="${FRONTEND_URL}/mon-espace/reservations" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Mes réservations</a></p>
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
      <p><a href="${FRONTEND_URL}/mon-espace/reservations" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir mes réservations</a></p>
    `,
  })
}
