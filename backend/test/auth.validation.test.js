import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  isValidEmail,
  validatePassword,
  resolveRole,
  parseHibpResponse,
  formatUser,
} = await import('../src/routes/auth.routes.js')

// ─── isValidEmail ─────────────────────────────────────────────
test('isValidEmail accepte un email correctement formé', () => {
  assert.equal(isValidEmail('ada@example.com'), true)
})

test('isValidEmail rejette un email sans arobase', () => {
  assert.equal(isValidEmail('ada.example.com'), false)
})

test('isValidEmail rejette un email sans domaine', () => {
  assert.equal(isValidEmail('ada@example'), false)
})

test('isValidEmail rejette un email avec des espaces', () => {
  assert.equal(isValidEmail('ada lovelace@example.com'), false)
})

// ─── validatePassword ───────────────────────────────────────
test('validatePassword refuse un mot de passe trop court (< 12 caractères)', () => {
  assert.match(validatePassword('Aa1!aaaa'), /entre 12 et 128 caractères/)
})

test('validatePassword refuse un mot de passe trop long (> 128 caractères)', () => {
  const tooLong = 'Aa1!' + 'a'.repeat(126) // 130 caractères
  assert.match(validatePassword(tooLong), /entre 12 et 128 caractères/)
})

test('validatePassword refuse un mot de passe sans majuscule', () => {
  assert.match(validatePassword('password123!'), /majuscule/)
})

test('validatePassword refuse un mot de passe sans minuscule', () => {
  assert.match(validatePassword('PASSWORD123!'), /majuscule/) // même message générique
})

test('validatePassword refuse un mot de passe sans chiffre', () => {
  assert.match(validatePassword('Passwordabc!'), /majuscule/)
})

test('validatePassword refuse un mot de passe sans caractère spécial', () => {
  assert.match(validatePassword('Password1234'), /majuscule/)
})

test('validatePassword accepte un mot de passe conforme (12+, maj/min/chiffre/spécial)', () => {
  assert.equal(validatePassword('Password123!'), null)
})

test('validatePassword rejette un mot de passe vide ou absent', () => {
  assert.match(validatePassword(''), /entre 12 et 128 caractères/)
  assert.match(validatePassword(undefined), /entre 12 et 128 caractères/)
})

// ─── resolveRole (sécurité : pas d'auto-attribution ADMIN) ──
test('resolveRole conserve RENTER et OWNER', () => {
  assert.equal(resolveRole('RENTER'), 'RENTER')
  assert.equal(resolveRole('OWNER'), 'OWNER')
})

test('resolveRole retombe sur RENTER si le rôle est absent', () => {
  assert.equal(resolveRole(undefined), 'RENTER')
})

test('resolveRole empêche un utilisateur de s\'auto-attribuer le rôle ADMIN à l\'inscription', () => {
  assert.equal(resolveRole('ADMIN'), 'RENTER')
})

test('resolveRole ignore une valeur arbitraire ou une tentative d\'injection', () => {
  assert.equal(resolveRole('superadmin'), 'RENTER')
  assert.equal(resolveRole({ toString: () => 'ADMIN' }), 'RENTER')
})

// ─── parseHibpResponse (API Have I Been Pwned, k-anonymity) ──
test('parseHibpResponse détecte un mot de passe compromis présent dans la liste', () => {
  const body = 'ABCDEF1234567890ABCDEF1234567890ABC:3\r\n0000000000000000000000000000000000:0'
  const result = parseHibpResponse(body, 'ABCDEF1234567890ABCDEF1234567890ABC')
  assert.equal(result.compromised, true)
  assert.equal(result.count, 3)
})

test('parseHibpResponse renvoie compromised=false si le suffixe est absent de la liste', () => {
  const body = '0000000000000000000000000000000000:0\r\n1111111111111111111111111111111111:42'
  const result = parseHibpResponse(body, 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')
  assert.equal(result.compromised, false)
  assert.equal(result.count, 0)
})

// ─── formatUser ───────────────────────────────────────────────
test('formatUser marque kycVerified=true si kyc_status est APPROVED', () => {
  const dto = formatUser({ id: 1, kyc_status: 'APPROVED', is_blocked: false })
  assert.equal(dto.kycVerified, true)
})

test('formatUser marque kycVerified=false si aucun KYC validé', () => {
  const dto = formatUser({ id: 1, kyc_status: 'PENDING', is_blocked: false })
  assert.equal(dto.kycVerified, false)
})

test('formatUser dérive isActive de is_blocked (inversé)', () => {
  assert.equal(formatUser({ id: 1, is_blocked: true }).isActive, false)
  assert.equal(formatUser({ id: 1, is_blocked: false }).isActive, true)
})

test('formatUser met sailorCvStatus à NOT_SUBMITTED par défaut', () => {
  assert.equal(formatUser({ id: 1 }).sailorCvStatus, 'NOT_SUBMITTED')
})

test('formatUser ne renvoie jamais le mot de passe haché', () => {
  const dto = formatUser({ id: 1, email: 'ada@example.com', password: '$2a$12$hashedvalue' })
  assert.equal('password' in dto, false)
})
