import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  validateRegisterInput,
  validateLoginAccount,
  isTokenExpired,
  validateStoredToken,
  buildAccountAnonymization,
  buildHibpHashParts,
} = await import('../src/routes/auth.routes.js')

// ─── validateRegisterInput ───────────────────────────────────
test('validateRegisterInput exige les 4 champs obligatoires', () => {
  assert.match(validateRegisterInput({}), /requis/)
  assert.match(validateRegisterInput({ email: 'a@b.co', password: 'x', firstName: 'Ada' }), /requis/)
})

test('validateRegisterInput refuse un email mal formé', () => {
  assert.equal(
    validateRegisterInput({
      email: 'pas-un-email',
      password: 'Password123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    }),
    'Format email invalide',
  )
})

test('validateRegisterInput refuse un mot de passe faible', () => {
  assert.match(
    validateRegisterInput({
      email: 'ada@example.com',
      password: 'short',
      firstName: 'Ada',
      lastName: 'Lovelace',
    }),
    /12 et 128/,
  )
})

test('validateRegisterInput accepte un payload conforme', () => {
  assert.equal(
    validateRegisterInput({
      email: 'ada@example.com',
      password: 'Password123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    }),
    null,
  )
})

// ─── validateLoginAccount ────────────────────────────────────
test('validateLoginAccount masque l\'inexistance du compte', () => {
  assert.equal(validateLoginAccount(null), 'Identifiants incorrects')
})

test('validateLoginAccount bloque un compte suspendu', () => {
  assert.match(validateLoginAccount({ id: 1, is_blocked: true }), /suspendu/)
})

test('validateLoginAccount accepte un compte actif', () => {
  assert.equal(validateLoginAccount({ id: 1, is_blocked: false }), null)
})

// ─── isTokenExpired / validateStoredToken ────────────────────
test('isTokenExpired détecte un token expiré ou sans date', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')
  assert.equal(isTokenExpired(null, now), true)
  assert.equal(isTokenExpired('2026-07-20T11:00:00.000Z', now), true)
  assert.equal(isTokenExpired('2026-07-20T13:00:00.000Z', now), false)
})

test('validateStoredToken refuse un token absent ou expiré', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')
  assert.equal(validateStoredToken(null, now), 'Token invalide ou expiré')
  assert.equal(
    validateStoredToken({ expires_at: '2026-07-20T11:00:00.000Z' }, now),
    'Token invalide ou expiré',
  )
})

test('validateStoredToken accepte un token encore valide', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')
  assert.equal(
    validateStoredToken({ expires_at: '2026-07-20T13:00:00.000Z' }, now),
    null,
  )
})

// ─── buildAccountAnonymization (RGPD) ────────────────────────
test('buildAccountAnonymization efface les données personnelles identifiantes', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')
  const payload = buildAccountAnonymization('user-42', now)
  assert.equal(payload.email, 'deleted_user-42@sailingloc.deleted')
  assert.equal(payload.password, '')
  assert.equal(payload.first_name, 'Compte')
  assert.equal(payload.last_name, 'supprimé')
  assert.equal(payload.phone, null)
  assert.equal(payload.bio, null)
  assert.equal(payload.avatar, null)
  assert.equal(payload.is_blocked, true)
  assert.equal(payload.updated_at, now.toISOString())
})

// ─── buildHibpHashParts (k-anonymity) ─────────────────────────
test('buildHibpHashParts découpe le SHA-1 en préfixe 5 + suffixe', () => {
  const password = 'Password123!'
  const full = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
  const { prefix, suffix } = buildHibpHashParts(password)
  assert.equal(prefix.length, 5)
  assert.equal(prefix + suffix, full)
  assert.equal(suffix.length, 35)
})
