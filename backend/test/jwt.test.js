import test from 'node:test'
import assert from 'node:assert/strict'

// JWT_SECRET lu au chargement du module — défini avant l'import
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'

const { signAccessToken, verifyAccessToken, generateRefreshToken } = await import(
  '../src/lib/jwt.js'
)

test('signAccessToken + verifyAccessToken round-trip', () => {
  const token = signAccessToken({ sub: 'user-1', role: 'renter' })
  assert.equal(typeof token, 'string')
  assert.ok(token.split('.').length === 3)

  const decoded = verifyAccessToken(token)
  assert.equal(decoded.sub, 'user-1')
  assert.equal(decoded.role, 'renter')
})

test('verifyAccessToken rejette un token invalide', () => {
  assert.throws(() => verifyAccessToken('not.a.valid.token'), /jwt|invalid|malformed/i)
})

test('generateRefreshToken renvoie un UUID unique', () => {
  const a = generateRefreshToken()
  const b = generateRefreshToken()
  assert.match(a, /^[0-9a-f-]{36}$/i)
  assert.notEqual(a, b)
})
