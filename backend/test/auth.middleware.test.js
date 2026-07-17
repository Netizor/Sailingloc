import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const supabase = (await import('../src/lib/supabase.js')).default
const { signAccessToken } = await import('../src/lib/jwt.js')
const { authenticate, requireRole, optionalAuth } = await import(
  '../src/middleware/auth.middleware.js'
)

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
  return res
}

/** Mock la chaîne Supabase .from().select().eq().single() */
function mockSupabaseUser({ data, error = null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data, error }),
  }
  supabase.from = () => chain
}

test('authenticate refuse sans Authorization', async () => {
  const req = { headers: {} }
  const res = mockRes()
  let nextCalled = false
  await authenticate(req, res, () => { nextCalled = true })
  assert.equal(res.statusCode, 401)
  assert.equal(nextCalled, false)
})

test('authenticate refuse un token invalide', async () => {
  const req = { headers: { authorization: 'Bearer fake.token.here' } }
  const res = mockRes()
  let nextCalled = false
  await authenticate(req, res, () => { nextCalled = true })
  assert.equal(res.statusCode, 401)
  assert.equal(nextCalled, false)
})

test('authenticate refuse si utilisateur introuvable', async () => {
  mockSupabaseUser({ data: null, error: { message: 'not found' } })
  const token = signAccessToken({ sub: 'missing-user' })
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = mockRes()
  let nextCalled = false
  await authenticate(req, res, () => { nextCalled = true })
  assert.equal(res.statusCode, 401)
  assert.equal(nextCalled, false)
})

test('authenticate refuse un compte bloque', async () => {
  mockSupabaseUser({
    data: { id: 'u1', role: 'RENTER', is_blocked: true },
  })
  const token = signAccessToken({ sub: 'u1' })
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = mockRes()
  let nextCalled = false
  await authenticate(req, res, () => { nextCalled = true })
  assert.equal(res.statusCode, 403)
  assert.equal(nextCalled, false)
})

test('authenticate accepte un token valide', async () => {
  const user = { id: 'u42', role: 'RENTER', is_blocked: false, email: 'a@b.c' }
  mockSupabaseUser({ data: user })
  const token = signAccessToken({ sub: 'u42' })
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = mockRes()
  let nextCalled = false
  await authenticate(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.deepEqual(req.user, user)
})

test('requireRole refuse si pas d utilisateur', () => {
  const middleware = requireRole('ADMIN')
  const req = {}
  const res = mockRes()
  let nextCalled = false
  middleware(req, res, () => { nextCalled = true })
  assert.equal(res.statusCode, 401)
  assert.equal(nextCalled, false)
})

test('requireRole refuse un role non autorise', () => {
  const middleware = requireRole('ADMIN')
  const req = { user: { role: 'RENTER' } }
  const res = mockRes()
  let nextCalled = false
  middleware(req, res, () => { nextCalled = true })
  assert.equal(res.statusCode, 403)
  assert.equal(nextCalled, false)
})

test('requireRole accepte un role autorise', () => {
  const middleware = requireRole('ADMIN', 'OWNER')
  const req = { user: { role: 'OWNER' } }
  const res = mockRes()
  let nextCalled = false
  middleware(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
})

test('optionalAuth continue sans token', async () => {
  const req = { headers: {} }
  const res = mockRes()
  let nextCalled = false
  await optionalAuth(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.equal(req.user, undefined)
})

test('optionalAuth attache l utilisateur si token valide', async () => {
  const user = { id: 'u7', role: 'OWNER', is_blocked: false, email: 'o@b.c' }
  mockSupabaseUser({ data: user })
  const token = signAccessToken({ sub: 'u7' })
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = mockRes()
  let nextCalled = false
  await optionalAuth(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.deepEqual(req.user, user)
})