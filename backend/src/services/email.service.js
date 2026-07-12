import nodemailer from 'nodemailer'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.MAIL_FROM || user

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP non configuré — vérifiez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env',
    )
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,   // true uniquement pour le port SSL direct
    auth: { user, pass },
    tls: { rejectUnauthorized: false },  // évite les erreurs de cert en dev
  })

  return { transporter, from }
}

async function sendMail({ to, subject, html, replyTo }) {
  const { transporter, from } = createTransporter()

  try {
    const info = await transporter.sendMail({
      from: `SailingLoc <${from}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    return info
  } catch (err) {
    // Enrichit le message d'erreur avec le contexte SMTP
    const detail = err?.response || err?.message || String(err)
    throw new Error(`Échec envoi SMTP vers ${to} : ${detail}`)
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Emails publics ────────────────────────────────────────

export async function sendContactMessage({ firstName, lastName, email, subject, message }) {
  const to = process.env.RESEND_TO_EMAIL || process.env.CONTACT_EMAIL || process.env.MAIL_FROM || process.env.SMTP_USER
  const safe = {
    firstName: escapeHtml(firstName),
    lastName:  escapeHtml(lastName),
    email:     escapeHtml(email),
    subject:   escapeHtml(subject),
    message:   escapeHtml(message).replace(/\n/g, '<br>'),
  }
  await sendMail({
    to,
    replyTo: email,
    subject: `[Contact] ${safe.subject} – ${safe.firstName} ${safe.lastName}`,
    html: `
      <h2>Nouveau message de contact</h2>
      <ul>
        <li><strong>Nom :</strong> ${safe.firstName} ${safe.lastName}</li>
        <li><strong>Email :</strong> ${safe.email}</li>
        <li><strong>Objet :</strong> ${safe.subject}</li>
      </ul>
      <p>${safe.message}</p>
    `,
  })
}

export async function sendContactConfirmation({ firstName, email, subject, message }) {
  const safe = {
    firstName: escapeHtml(firstName),
    subject:   escapeHtml(subject),
    message:   escapeHtml(message).replace(/\n/g, '<br>'),
  }
  await sendMail({
    to: email,
    subject: 'Nous avons bien reçu votre message – SailingLoc',
    html: `
      <h2>Bonjour ${safe.firstName},</h2>
      <p>Merci de nous avoir contactés. Voici un récapitulatif de votre demande :</p>
      <ul><li><strong>Objet :</strong> ${safe.subject}</li></ul>
      <p>${safe.message}</p>
      <p>Notre équipe vous répondra dans les meilleurs délais.</p>
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
    confirmed:   { subject: 'Réservation confirmée – SailingLoc',           intro: 'Votre réservation a été confirmée !' },
    cancelled:   { subject: 'Réservation annulée – SailingLoc',             intro: 'Une réservation a été annulée.' },
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
