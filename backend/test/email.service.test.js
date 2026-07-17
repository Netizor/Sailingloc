import test from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeHtml,
  sendContactMessage,
  sendContactConfirmation,
  sendAccountDeletedEmail,
  sendEmailVerification,
  sendPasswordReset,
  sendCancellationEmail,
  sendBookingNotification,
} from '../src/services/email.service.js'

test('escapeHtml échappe les caractères dangereux XSS', () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script>`),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
  )
  assert.equal(escapeHtml(`O'Brien & Co`), `O&#39;Brien &amp; Co`)
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(undefined), '')
})

test('sendContactMessage échoue si CONTACT_EMAIL non configuré', async () => {
  const prevContact = process.env.CONTACT_EMAIL
  const prevResendTo = process.env.RESEND_TO_EMAIL
  const prevKey = process.env.RESEND_API_KEY

  delete process.env.CONTACT_EMAIL
  delete process.env.RESEND_TO_EMAIL
  delete process.env.RESEND_API_KEY

  await assert.rejects(
    () =>
      sendContactMessage({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        subject: 'location',
        message: 'Bonjour',
      }),
    /CONTACT_EMAIL/,
  )

  process.env.CONTACT_EMAIL = prevContact
  process.env.RESEND_TO_EMAIL = prevResendTo
  process.env.RESEND_API_KEY = prevKey
})

test('sendContactMessage en mode DEV (sans Resend) envoie vers CONTACT_EMAIL', async () => {
  const prevContact = process.env.CONTACT_EMAIL
  const prevKey = process.env.RESEND_API_KEY

  process.env.CONTACT_EMAIL = 'support@sailingloc.test'
  delete process.env.RESEND_API_KEY

  await assert.doesNotReject(() =>
    sendContactMessage({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      subject: 'location',
      message: 'Line 1\nLine 2 <b>bold</b>',
    }),
  )

  process.env.CONTACT_EMAIL = prevContact
  process.env.RESEND_API_KEY = prevKey
})

test('sendContactConfirmation / verify / reset / delete en mode DEV', async () => {
  const prevKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  await assert.doesNotReject(() =>
    sendContactConfirmation({
      firstName: 'Ada',
      email: 'ada@example.com',
      subject: 'location',
    }),
  )
  await assert.doesNotReject(() =>
    sendEmailVerification('ada@example.com', 'Ada', 'token-abc'),
  )
  await assert.doesNotReject(() =>
    sendPasswordReset('ada@example.com', 'Ada', 'token-xyz'),
  )
  await assert.doesNotReject(() =>
    sendAccountDeletedEmail({ to: 'ada@example.com', firstName: 'Ada' }),
  )
  await assert.doesNotReject(() =>
    sendAccountDeletedEmail({ to: 'anon@example.com', firstName: null }),
  )

  process.env.RESEND_API_KEY = prevKey
})

test('sendCancellationEmail couvre les branches locataire / propriétaire', async () => {
  const prevKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  const base = {
    to: 'user@example.com',
    firstName: 'Ada',
    boatTitle: 'Ocean One',
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    reason: 'Météo',
  }

  await assert.doesNotReject(() =>
    sendCancellationEmail({
      ...base,
      isRenter: true,
      cancelledByOwner: true,
      refundAmount: 120.5,
    }),
  )
  await assert.doesNotReject(() =>
    sendCancellationEmail({
      ...base,
      isRenter: true,
      cancelledByOwner: false,
      refundAmount: 0,
    }),
  )
  await assert.doesNotReject(() =>
    sendCancellationEmail({
      ...base,
      isRenter: false,
      cancelledByOwner: true,
      refundAmount: 200,
    }),
  )
  await assert.doesNotReject(() =>
    sendCancellationEmail({
      ...base,
      isRenter: false,
      cancelledByOwner: false,
      refundAmount: 0,
    }),
  )

  process.env.RESEND_API_KEY = prevKey
})

test('sendBookingNotification gère types connus et inconnu', async () => {
  const prevKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  const payload = {
    boatTitle: 'Ocean One',
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  }

  for (const type of ['confirmed', 'cancelled', 'new_request', 'unknown']) {
    await assert.doesNotReject(() =>
      sendBookingNotification('ada@example.com', 'Ada', { type, ...payload }),
    )
  }

  process.env.RESEND_API_KEY = prevKey
})

test('sendMail via Resend (fetch mock) — succès et erreur', async () => {
  const prevKey = process.env.RESEND_API_KEY
  const prevFrom = process.env.MAIL_FROM
  const prevEmailFrom = process.env.EMAIL_FROM
  const originalFetch = globalThis.fetch

  process.env.RESEND_API_KEY = 're_test_key'
  process.env.MAIL_FROM = 'noreply@sailingloc.fr' // sans < > → formaté automatiquement
  delete process.env.EMAIL_FROM

  let lastBody
  globalThis.fetch = async (_url, opts) => {
    lastBody = JSON.parse(opts.body)
    return {
      ok: true,
      json: async () => ({ id: 'email_123' }),
      text: async () => '',
    }
  }

  await assert.doesNotReject(() =>
    sendPasswordReset('ada@example.com', 'Ada', 'tok'),
  )
  assert.equal(lastBody.from, 'SailingLoc <noreply@sailingloc.fr>')

  process.env.MAIL_FROM = 'SailingLoc <hello@sailingloc.fr>'
  await assert.doesNotReject(() =>
    sendPasswordReset('ada@example.com', 'Ada', 'tok'),
  )
  assert.equal(lastBody.from, 'SailingLoc <hello@sailingloc.fr>')

  globalThis.fetch = async () => ({
    ok: false,
    json: async () => ({}),
    text: async () => 'rate_limit',
  })

  await assert.rejects(
    () => sendPasswordReset('ada@example.com', 'Ada', 'tok'),
    /Resend/,
  )

  globalThis.fetch = originalFetch
  process.env.RESEND_API_KEY = prevKey
  process.env.MAIL_FROM = prevFrom
  process.env.EMAIL_FROM = prevEmailFrom
})
