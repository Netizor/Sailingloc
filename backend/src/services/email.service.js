import nodemailer from 'nodemailer'
import { Resend } from 'resend'

const MAIL_FROM = process.env.MAIL_FROM || 'noreply@sailingloc.fr'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const smtpHost = process.env.SMTP_HOST?.trim()
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const smtpUser = process.env.SMTP_USER?.trim()
const smtpPass = process.env.SMTP_PASS
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465

const resend = resendApiKey ? new Resend(resendApiKey) : null
const smtpTransport = smtpHost && smtpPort && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null

async function sendMail({ to, subject, html }) {
  let providerConfigured = Boolean(resend || smtpTransport)

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: MAIL_FROM,
        to,
        subject,
        html,
      })

      if (result?.error) {
        console.error('[Email] Resend error:', result.error)
      } else {
        return result
      }
    } catch (error) {
      console.error('[Email] Resend exception:', error)
    }
  }

  if (smtpTransport) {
    try {
      return await smtpTransport.sendMail({
        from: MAIL_FROM,
        to,
        subject,
        html,
      })
    } catch (error) {
      console.error('[Email] SMTP error:', error)
    }
  }

  if (!providerConfigured) {
    console.error('[Email] Aucun fournisseur configuré. Ajoutez RESEND_API_KEY ou SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS dans .env.')
  }
}

export async function sendEmailVerification(to, firstName, token) {
  const link = `${FRONTEND_URL}/verifier-email?token=${token}`;
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
  });
}

export async function sendPasswordReset(to, firstName, token) {
  const link = `${FRONTEND_URL}/reinitialiser-mot-de-passe?token=${token}`;
  await sendMail({
    to,
    subject: 'Réinitialisation de votre mot de passe – SailingLoc',
    html: `
      <h2>Bonjour ${firstName},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p><a href="${link}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
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
  });
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
  });
}