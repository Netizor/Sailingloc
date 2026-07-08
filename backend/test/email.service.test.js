import test from 'node:test'
import assert from 'node:assert/strict'

const serviceUrl = new URL('../src/services/email.service.js?test=' + Date.now(), import.meta.url)

test('prefers SMTP when EMAIL_PROVIDER is smtp', async () => {
  process.env.EMAIL_PROVIDER = 'smtp'
  process.env.RESEND_API_KEY = ''
  process.env.SMTP_HOST = 'smtp.office365.com'
  process.env.SMTP_PORT = '587'
  process.env.SMTP_USER = 'contact@company.com'
  process.env.SMTP_PASS = 'secret'

  const mod = await import(serviceUrl.href)
  assert.equal(mod.resolveEmailProvider().provider, 'smtp')
})
