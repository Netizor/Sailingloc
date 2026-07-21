import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://sailingloc.fr'
process.env.CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'support@sailingloc.test'

const supabase = (await import('../src/lib/supabase.js')).default
const {
  contactRouter,
  notificationsRouter,
  reviewsRouter,
  messagesRouter,
  favoritesRouter,
  availabilityRouter,
  seasonalPricesRouter,
  adminRouter,
  reportsRouter,
  seoRouter,
  formatAdminUser,
  formatAdminBoat,
  formatAdminBooking,
  formatAdminReview,
  buildDashboardStats,
} = await import('../src/routes/misc.routes.js')

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

function getHandler(router, path, method = 'get') {
  const layer = router.stack.find(
    (l) => l.route?.path === path && l.route.methods[method],
  )
  assert.ok(layer, `route ${method.toUpperCase()} ${path} introuvable`)
  const stack = layer.route.stack
  return stack[stack.length - 1].handle
}

function chain(result) {
  const c = {
    select() { return c },
    insert() { return c },
    update() { return c },
    delete() { return c },
    eq() { return c },
    neq() { return c },
    in() { return c },
    or() { return c },
    lt() { return c },
    gt() { return c },
    gte() { return c },
    lte() { return c },
    order() { return c },
    range() { return c },
    limit() { return c },
    single: async () => result,
    maybeSingle: async () => result,
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  return c
}

// ─── DTOs admin ──────────────────────────────────────────────
test('formatAdminUser mappe KYC et isActive', () => {
  const dto = formatAdminUser({
    id: 1,
    email: 'a@b.c',
    first_name: 'Ada',
    last_name: 'L',
    role: 'RENTER',
    kyc_status: 'APPROVED',
    is_blocked: false,
    boats_count: 2,
  })
  assert.equal(dto.kycVerified, true)
  assert.equal(dto.isActive, true)
  assert.equal(dto.boatsCount, 2)
  assert.equal(dto.firstName, 'Ada')
})

test('formatAdminBoat / formatAdminBooking / formatAdminReview', () => {
  assert.equal(formatAdminBoat({ id: 1, status: 'active', price_per_day: '120' }).status, 'ACTIVE')
  assert.equal(formatAdminBoat({ id: 1, status: 'active', price_per_day: '120' }).dailyRate, 120)
  assert.equal(
    formatAdminBooking({
      id: 9,
      start_date: '2026-08-01',
      end_date: '2026-08-04',
      total_price: 330,
      status: 'CONFIRMED',
    }).totalDays,
    3,
  )
  assert.equal(
    formatAdminReview({
      id: 1,
      rating: 5,
      comment: 'Top',
      is_published: true,
      author: { id: 2, first_name: 'Ada', last_name: 'L' },
    }).reviewer.firstName,
    'Ada',
  )
})

// ─── Contact ─────────────────────────────────────────────────
test('POST /contact honeypot → faux succès sans envoi', async () => {
  const handler = getHandler(contactRouter, '/', 'post')
  const res = mockRes()
  await handler({ body: { company_url_hp: 'http://bot' } }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.success, true)
})

test('POST /contact refuse un formulaire incomplet', async () => {
  const handler = getHandler(contactRouter, '/', 'post')
  const res = mockRes()
  await handler({ body: { firstName: 'Ada' } }, res)
  assert.equal(res.statusCode, 400)
})

test('POST /contact envoie le message (mode DEV)', async () => {
  const handler = getHandler(contactRouter, '/', 'post')
  const res = mockRes()
  await handler({
    body: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      subject: 'location',
      message: 'Bonjour, je souhaite louer un bateau.',
    },
  }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.success, true)
})

// ─── Notifications ───────────────────────────────────────────
test('GET /notifications/unread-count', async () => {
  supabase.from = () => ({
    select() {
      return {
        eq() {
          return {
            eq: async () => ({ count: 3, error: null }),
          }
        },
      }
    },
  })
  const handler = getHandler(notificationsRouter, '/unread-count', 'get')
  const res = mockRes()
  await handler({ user: { id: 'u1' }, query: {} }, res)
  assert.equal(res.body.count, 3)
})

test('PATCH /notifications/read-all', async () => {
  supabase.from = () => ({
    update() {
      return {
        eq: async () => ({ error: null }),
      }
    },
  })
  const handler = getHandler(notificationsRouter, '/read-all', 'patch')
  const res = mockRes()
  await handler({ user: { id: 'u1' } }, res)
  assert.match(res.body.message, /lues/i)
})

// ─── Reviews ─────────────────────────────────────────────────
test('POST /reviews refuse payload incomplet ou note hors bornes', async () => {
  const handler = getHandler(reviewsRouter, '/', 'post')
  let res = mockRes()
  await handler({ body: {}, user: { id: 'r1' } }, res)
  assert.equal(res.statusCode, 400)

  res = mockRes()
  await handler({
    body: { bookingId: 1, type: 'RENTER_TO_BOAT', rating: 9, comment: 'x' },
    user: { id: 'r1' },
  }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /1 et 5/)
})

test('POST /reviews refuse si réservation non COMPLETED', async () => {
  supabase.from = () => chain({
    data: { id: 1, status: 'CONFIRMED', boat_id: 7, boats: { owner_id: 'o1' } },
    error: null,
  })
  const handler = getHandler(reviewsRouter, '/', 'post')
  const res = mockRes()
  await handler({
    body: { bookingId: 1, type: 'RENTER_TO_BOAT', rating: 5, comment: 'Super' },
    user: { id: 'r1' },
  }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /terminées/)
})

test('GET /reviews/boat/:boatId', async () => {
  supabase.from = () => chain({ data: [{ id: 1, rating: 5 }], count: 1, error: null })
  const handler = getHandler(reviewsRouter, '/boat/:boatId', 'get')
  const res = mockRes()
  await handler({ params: { boatId: '7' } }, res)
  assert.equal(res.body.total, 1)
  assert.equal(res.body.data.length, 1)
})

// ─── Messages ────────────────────────────────────────────────
test('POST /messages refuse auto-message et champs manquants', async () => {
  const handler = getHandler(messagesRouter, '/', 'post')
  let res = mockRes()
  await handler({ body: {}, user: { id: 3 } }, res)
  assert.equal(res.statusCode, 400)

  res = mockRes()
  await handler({ body: { recipientId: 3, content: 'Hi' }, user: { id: 3 } }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /Impossible/)
})

test('POST /messages crée un message', async () => {
  supabase.from = () => ({
    insert() {
      return {
        select() {
          return {
            single: async () => ({
              data: {
                id: 10,
                sender_id: 3,
                recipient_id: 10,
                content: 'Hello',
                is_read: false,
                created_at: '2026-07-01T00:00:00.000Z',
              },
              error: null,
            }),
          }
        },
      }
    },
  })
  const handler = getHandler(messagesRouter, '/', 'post')
  const res = mockRes()
  await handler({
    body: { recipientId: 10, content: '  Hello  ' },
    user: { id: 3 },
  }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.content, 'Hello')
  assert.equal(res.body.conversationId, '3-10')
})

test('GET /messages/conversation/:id refuse un conversationId invalide', async () => {
  const handler = getHandler(messagesRouter, '/conversation/:conversationId', 'get')
  const res = mockRes()
  await handler({
    params: { conversationId: 'bad' },
    query: {},
    user: { id: 3 },
  }, res)
  assert.equal(res.statusCode, 400)
})

// ─── Favoris ─────────────────────────────────────────────────
test('GET /favorites', async () => {
  supabase.from = () => chain({
    data: [{
      id: 1,
      boat_id: 7,
      created_at: '2026-01-01',
      boats: { id: 7, title: 'Ocean' },
    }],
    error: null,
  })
  const handler = getHandler(favoritesRouter, '/', 'get')
  const res = mockRes()
  await handler({ user: { id: 'u1' } }, res)
  assert.equal(res.body.favorites[0].boatId, 7)
})

// ─── Disponibilités ──────────────────────────────────────────
test('GET /availability/:boatId fusionne blocs et réservations', async () => {
  supabase.from = (table) => {
    if (table === 'availabilities') {
      return chain({
        data: [{ start_date: '2026-08-02', end_date: '2026-08-02', type: 'BLOCKED' }],
        error: null,
      })
    }
    return chain({
      data: [{ id: 99, start_date: '2026-08-03', end_date: '2026-08-04' }],
      error: null,
    })
  }
  const handler = getHandler(availabilityRouter, '/:boatId', 'get')
  const res = mockRes()
  await handler({
    params: { boatId: '7' },
    query: { from: '2026-08-01', to: '2026-08-04' },
  }, res)

  const byDate = Object.fromEntries(res.body.availability.map((d) => [d.date, d]))
  assert.equal(byDate['2026-08-01'].isAvailable, true)
  assert.equal(byDate['2026-08-02'].isAvailable, false)
  assert.equal(byDate['2026-08-02'].bookingId, null)
  assert.equal(byDate['2026-08-03'].isAvailable, false)
  assert.equal(byDate['2026-08-03'].bookingId, '99')
})

test('POST /availability/:boatId refuse sans dates', async () => {
  const handler = getHandler(availabilityRouter, '/:boatId', 'post')
  const res = mockRes()
  await handler({
    params: { boatId: '7' },
    body: { dates: [] },
    user: { id: 'o1', role: 'OWNER' },
  }, res)
  assert.equal(res.statusCode, 400)
})

test('POST /availability refuse un non-propriétaire', async () => {
  supabase.from = () => chain({ data: { owner_id: 'o1' }, error: null })
  const handler = getHandler(availabilityRouter, '/', 'post')
  const res = mockRes()
  await handler({
    body: { boatId: 7, startDate: '2026-08-01', endDate: '2026-08-02' },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 403)
})

// ─── Prix saisonniers ────────────────────────────────────────
test('GET /seasonal-prices/:boatId', async () => {
  supabase.from = () => chain({ data: [{ id: 1, price_per_day: 200 }], error: null })
  const handler = getHandler(seasonalPricesRouter, '/:boatId', 'get')
  const res = mockRes()
  await handler({ params: { boatId: '7' } }, res)
  assert.equal(res.body.data[0].price_per_day, 200)
})

test('POST /seasonal-prices refuse champs manquants', async () => {
  const handler = getHandler(seasonalPricesRouter, '/', 'post')
  const res = mockRes()
  await handler({ body: { boatId: 1 }, user: { id: 'o1' } }, res)
  assert.equal(res.statusCode, 400)
})

// ─── Reports ─────────────────────────────────────────────────
test('POST /reports refuse payload incomplet', async () => {
  const handler = getHandler(reportsRouter, '/', 'post')
  const res = mockRes()
  await handler({ body: { reason: 'spam' }, user: { id: 'u1' } }, res)
  assert.equal(res.statusCode, 400)
})

test('POST /reports crée un signalement', async () => {
  supabase.from = () => ({
    insert() {
      return {
        select() {
          return {
            single: async () => ({
              data: { id: 5, reason: 'spam', target_type: 'BOAT' },
              error: null,
            }),
          }
        },
      }
    },
  })
  const handler = getHandler(reportsRouter, '/', 'post')
  const res = mockRes()
  await handler({
    body: { targetType: 'BOAT', targetId: 7, reason: 'spam', description: 'x' },
    user: { id: 'u1' },
  }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.id, 5)
})

// ─── Admin dashboard ─────────────────────────────────────────
test('buildDashboardStats agrège les compteurs', async () => {
  supabase.from = (table) => {
    if (table === 'bookings') {
      return {
        select(cols) {
          if (typeof cols === 'string' && cols.includes('created_at')) {
            return {
              gte: async () => ({
                data: [
                  { created_at: '2026-03-01', total_price: 330, service_fee: 30, status: 'CONFIRMED' },
                  { created_at: '2026-03-02', total_price: 100, service_fee: 10, status: 'PENDING' },
                ],
                error: null,
              }),
            }
          }
          return {
            then: (resolve) => resolve({ count: 4, error: null }),
          }
        },
      }
    }
    return {
      select() {
        return {
          eq() {
            return {
              then: (resolve) => resolve({ count: 2, error: null }),
            }
          },
          then: (resolve) => resolve({ count: 10, error: null }),
        }
      },
    }
  }

  const stats = await buildDashboardStats()
  assert.equal(stats.totalUsers, 10)
  assert.equal(stats.totalRevenue, 330)
  assert.equal(stats.platformRevenue, 30)
  assert.ok(Array.isArray(stats.revenueByMonth))
  assert.equal(stats.revenueByMonth.length, 12)
})

test('GET /admin/dashboard', async () => {
  supabase.from = () => ({
    select() {
      return {
        eq() {
          return { then: (r) => r({ count: 1, error: null }) }
        },
        gte: async () => ({ data: [], error: null }),
        then: (r) => r({ count: 1, error: null }),
      }
    },
  })
  const handler = getHandler(adminRouter, '/dashboard', 'get')
  const res = mockRes()
  await handler({ user: { id: 'a1', role: 'ADMIN' } }, res)
  assert.ok('totalUsers' in res.body)
  assert.ok('platformRevenue' in res.body)
})

test('PATCH /admin/users/:id/block', async () => {
  supabase.from = () => ({
    update() {
      return {
        eq: async () => ({ error: null }),
      }
    },
  })
  const handler = getHandler(adminRouter, '/users/:id/block', 'patch')
  const res = mockRes()
  await handler({
    params: { id: 'u1' },
    body: { blocked: true },
    user: { id: 'a1', role: 'ADMIN' },
  }, res)
  assert.match(res.body.message, /bloqué/)
})

test('POST /admin/roles refuse name/label manquants', async () => {
  const handler = getHandler(adminRouter, '/roles', 'post')
  const res = mockRes()
  await handler({ body: { name: 'MOD' }, user: { id: 'a1', role: 'ADMIN' } }, res)
  assert.equal(res.statusCode, 400)
})

// ─── SEO sitemap ─────────────────────────────────────────────
test('GET /sitemap.xml liste les bateaux actifs', async () => {
  supabase.from = () => chain({
    data: [{ id: 7, updated_at: '2026-01-01' }],
    error: null,
  })
  const handler = getHandler(seoRouter, '/sitemap.xml', 'get')
  const res = mockRes()
  await handler({}, res)
  assert.equal(res.headers['Content-Type'], 'application/xml')
  assert.match(res.body, /bateaux\/7/)
  assert.match(res.body, /sailingloc\.fr/)
})
