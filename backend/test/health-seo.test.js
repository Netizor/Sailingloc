import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://sailingloc.fr'

const supabase = (await import('../src/lib/supabase.js')).default
const { healthRouter, seoRouter } = await import('../src/routes/misc.routes.js')

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    header(key, value) {
      this.headers[key] = value
      return this
    },
    send(payload) {
      this.body = payload
      return this
    },
  }
  return res
}

function getHandler(router, path) {
  const layer = router.stack.find((l) => l.route?.path === path)
  assert.ok(layer, `route ${path} introuvable`)
  return layer.route.stack[0].handle
}

test('health retourne ok si Supabase repond', async () => {
  supabase.from = () => ({
    select: () => ({
      limit: async () => ({ data: [{ id: '1' }], error: null }),
    }),
  })

  const handler = getHandler(healthRouter, '/')
  const res = mockRes()
  await handler({}, res)

  assert.equal(res.body.status, 'ok')
  assert.ok(res.body.timestamp)
})

test('health retourne degraded si Supabase echoue', async () => {
  supabase.from = () => ({
    select: () => ({
      limit: async () => ({ data: null, error: { message: 'db down' } }),
    }),
  })

  const handler = getHandler(healthRouter, '/')
  const res = mockRes()
  await handler({}, res)

  assert.equal(res.body.status, 'degraded')
})

test('robots.txt autorise le crawl et pointe le sitemap', () => {
  const handler = getHandler(seoRouter, '/robots.txt')
  const res = mockRes()
  handler({}, res)

  assert.equal(res.headers['Content-Type'], 'text/plain')
  assert.match(res.body, /Allow: \//)
  assert.match(res.body, /Disallow: \/admin/)
  assert.match(res.body, /Sitemap: https:\/\/sailingloc\.fr\/sitemap\.xml/)
})