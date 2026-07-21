import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
// Pas de vraie clé Stripe au chargement du module → stripe = null par défaut
delete process.env.STRIPE_SECRET_KEY

const supabase = (await import('../src/lib/supabase.js')).default
const bookingsRouter = (await import('../src/routes/bookings.routes.js')).default
const { __setStripeForTests } = await import('../src/routes/bookings.routes.js')

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

/** Dernier handler de la route (après authenticate). */
function getHandler(path, method = 'get') {
  const layer = bookingsRouter.stack.find(
    (l) => l.route?.path === path && l.route.methods[method],
  )
  assert.ok(layer, `route ${method.toUpperCase()} ${path} introuvable`)
  const stack = layer.route.stack
  return stack[stack.length - 1].handle
}

/** Chaîne Supabase thenable + .single(). */
function chain(result) {
  const c = {
    select() { return c },
    insert() { return c },
    update() { return c },
    delete() { return c },
    eq() { return c },
    neq() { return c },
    in() { return c },
    lt() { return c },
    gt() { return c },
    gte() { return c },
    lte() { return c },
    order() { return c },
    range() { return c },
    single: async () => result,
    maybeSingle: async () => result,
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  return c
}

test.afterEach(() => {
  __setStripeForTests(null)
})

// ─── POST /bookings ──────────────────────────────────────────
test('POST /bookings refuse sans boatId/dates', async () => {
  const handler = getHandler('/', 'post')
  const res = mockRes()
  await handler({ body: {}, user: { id: 'r1', role: 'RENTER' } }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /boatId/)
})

test('POST /bookings refuse si bateau introuvable', async () => {
  supabase.from = () => chain({ data: null, error: null })
  const handler = getHandler('/', 'post')
  const res = mockRes()
  await handler({
    body: { boatId: 1, startDate: '2026-08-01', endDate: '2026-08-04' },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 404)
})

test('POST /bookings refuse de réserver son propre bateau', async () => {
  supabase.from = () => chain({
    data: { id: 1, status: 'active', owner_id: 'r1', price_per_day: 100, required_license: 'NONE' },
    error: null,
  })
  const handler = getHandler('/', 'post')
  const res = mockRes()
  await handler({
    body: { boatId: 1, startDate: '2026-08-01', endDate: '2026-08-04' },
    user: { id: 'r1', role: 'OWNER' },
  }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /propre bateau/)
})

test('POST /bookings refuse sans permis quand requis', async () => {
  let call = 0
  supabase.from = (table) => {
    call += 1
    if (table === 'boats') {
      return chain({
        data: {
          id: 1, status: 'active', owner_id: 'o1', price_per_day: 100,
          required_license: 'COASTAL', with_skipper: false,
        },
        error: null,
      })
    }
    // users — pas de qualifications
    return chain({ data: { sailing_qualifications: null, sailor_cv_status: 'NOT_SUBMITTED' }, error: null })
  }
  const handler = getHandler('/', 'post')
  const res = mockRes()
  await handler({
    body: { boatId: 1, startDate: '2026-08-01', endDate: '2026-08-04', withSkipper: false },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 403)
  assert.match(res.body.message, /permis bateau/i)
  assert.ok(call >= 2)
})

test('POST /bookings crée une réservation PENDING', async () => {
  supabase.from = (table) => {
    if (table === 'boats') {
      return chain({
        data: {
          id: 7, status: 'active', owner_id: 'o1', price_per_day: 100,
          required_license: 'NONE', with_skipper: false,
        },
        error: null,
      })
    }
    if (table === 'bookings') {
      // conflict query puis insert
      return {
        select() {
          return {
            eq() { return this },
            in() { return this },
            lt() { return this },
            gt() {
              return Promise.resolve({ data: [], error: null })
            },
          }
        },
        insert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: {
                    id: 42,
                    boat_id: 7,
                    renter_id: 'r1',
                    start_date: '2026-08-01',
                    end_date: '2026-08-04',
                    with_skipper: false,
                    skipper_fee: 0,
                    service_fee: 30,
                    total_price: 330,
                    status: 'PENDING',
                    boats: { id: 7, title: 'Ocean One', price_per_day: 100 },
                  },
                  error: null,
                }),
              }
            },
          }
        },
      }
    }
    // notifications (notifyUser / notifyAdmins)
    return {
      select() {
        return {
          eq: async () => ({ data: [], error: null }),
        }
      },
      insert: async () => ({ data: null, error: null }),
    }
  }

  const handler = getHandler('/', 'post')
  const res = mockRes()
  await handler({
    body: { boatId: 7, startDate: '2026-08-01', endDate: '2026-08-04' },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.id, 42)
  assert.equal(res.body.status, 'PENDING')
  assert.equal(res.body.totalAmount, 330)
})

// ─── GET /bookings/:id ───────────────────────────────────────
test('GET /bookings/:id refuse un tiers', async () => {
  supabase.from = () => chain({
    data: { id: 1, renter_id: 'r1', boats: { owner_id: 'o1' } },
    error: null,
  })
  const handler = getHandler('/:id', 'get')
  const res = mockRes()
  await handler({ params: { id: '1' }, user: { id: 'x', role: 'RENTER' } }, res)
  assert.equal(res.statusCode, 403)
})

test('GET /bookings/:id renvoie la réservation au locataire', async () => {
  let reviewsCalled = false
  supabase.from = (table) => {
    if (table === 'reviews') {
      reviewsCalled = true
      return chain({ data: null, error: null })
    }
    return chain({
      data: {
        id: 1,
        boat_id: 7,
        renter_id: 'r1',
        start_date: '2026-08-01',
        end_date: '2026-08-04',
        skipper_fee: 0,
        service_fee: 30,
        total_price: 330,
        status: 'PENDING',
        boats: { id: 7, owner_id: 'o1', title: 'Ocean', price_per_day: 100 },
      },
      error: null,
    })
  }
  const handler = getHandler('/:id', 'get')
  const res = mockRes()
  await handler({ params: { id: '1' }, user: { id: 'r1', role: 'RENTER' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.id, 1)
  assert.equal(reviewsCalled, true)
})

// ─── PATCH /bookings/:id/status ──────────────────────────────
test('PATCH /bookings/:id/status accepte accept → CONFIRMED (owner)', async () => {
  let updatedStatus = null
  supabase.from = () => ({
    select() {
      return {
        eq() {
          return {
            single: async () => ({
              data: {
                id: 1,
                renter_id: 'r1',
                status: 'PENDING',
                stripe_payment_intent_id: null,
                boats: { owner_id: 'o1' },
              },
              error: null,
            }),
          }
        },
      }
    },
    update(payload) {
      updatedStatus = payload.status
      return {
        eq() {
          return {
            select() {
              return {
                single: async () => ({
                  data: {
                    id: 1,
                    boat_id: 7,
                    renter_id: 'r1',
                    start_date: '2026-08-01',
                    end_date: '2026-08-04',
                    status: 'CONFIRMED',
                    skipper_fee: 0,
                    service_fee: 30,
                    total_price: 330,
                    boats: { id: 7, title: 'Ocean', price_per_day: 100 },
                  },
                  error: null,
                }),
              }
            },
          }
        },
      }
    },
    insert: async () => ({ data: null, error: null }),
  })

  const handler = getHandler('/:id/status', 'patch')
  const res = mockRes()
  await handler({
    params: { id: '1' },
    body: { action: 'accept' },
    user: { id: 'o1', role: 'OWNER' },
  }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(updatedStatus, 'CONFIRMED')
  assert.equal(res.body.status, 'CONFIRMED')
})

// ─── POST /bookings/:id/cancel ───────────────────────────────
test('POST /bookings/:id/cancel sans motif → 400', async () => {
  supabase.from = () => chain({
    data: {
      id: 1,
      renter_id: 'r1',
      status: 'CONFIRMED',
      start_date: '2099-08-01',
      boats: { owner_id: 'o1' },
    },
    error: null,
  })
  const handler = getHandler('/:id/cancel', 'post')
  const res = mockRes()
  await handler({
    params: { id: '1' },
    body: {},
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 400)
  assert.match(res.body.message, /motif/i)
})

test('POST /bookings/:id/cancel annule et renvoie le remboursement', async () => {
  supabase.from = (table) => {
    if (table === 'bookings') {
      return {
        select() {
          return {
            eq() {
              return {
                single: async () => ({
                  data: {
                    id: 1,
                    boat_id: 7,
                    renter_id: 'r1',
                    status: 'CONFIRMED',
                    start_date: '2099-08-01',
                    end_date: '2099-08-04',
                    total_price: 200,
                    service_fee: 20,
                    skipper_fee: 0,
                    stripe_payment_intent_id: null,
                    boats: {
                      id: 7,
                      title: 'Ocean',
                      owner_id: 'o1',
                      price_per_day: 100,
                      users: { id: 'o1', email: 'o@test.com', first_name: 'Own' },
                    },
                    renters: { id: 'r1', email: 'r@test.com', first_name: 'Ren' },
                  },
                  error: null,
                }),
              }
            },
          }
        },
        update() {
          return {
            eq() {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        id: 1,
                        boat_id: 7,
                        renter_id: 'r1',
                        start_date: '2099-08-01',
                        end_date: '2099-08-04',
                        status: 'CANCELLED',
                        total_price: 200,
                        service_fee: 20,
                        skipper_fee: 0,
                        boats: { id: 7, title: 'Ocean', price_per_day: 100 },
                      },
                      error: null,
                    }),
                  }
                },
              }
            },
          }
        },
      }
    }
    return { insert: async () => ({ data: null, error: null }), select() { return { eq: async () => ({ data: [], error: null }) } } }
  }

  const handler = getHandler('/:id/cancel', 'post')
  const res = mockRes()
  await handler({
    params: { id: '1' },
    body: { cancellationReason: 'Changement de plans' },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.status, 'CANCELLED')
  assert.equal(res.body.refundPercent, 100) // > 7 jours
  assert.equal(res.body.refundAmount, 200)
})

// ─── Paiement Stripe ─────────────────────────────────────────
test('POST /bookings/:id/payment-intent sans Stripe → 503', async () => {
  __setStripeForTests(null)
  const handler = getHandler('/:id/payment-intent', 'post')
  const res = mockRes()
  await handler({ params: { id: '1' }, user: { id: 'r1' } }, res)
  assert.equal(res.statusCode, 503)
  assert.match(res.body.message, /Stripe/i)
})

test('POST /bookings/confirm-payment refuse body incomplet', async () => {
  const handler = getHandler('/confirm-payment', 'post')
  const res = mockRes()
  await handler({ body: { bookingId: 1 }, user: { id: 'r1' } }, res)
  assert.equal(res.statusCode, 400)
})

test('POST /bookings/confirm-payment confirme après intent réussi', async () => {
  __setStripeForTests({
    paymentIntents: {
      retrieve: async () => ({
        status: 'succeeded',
        amount: 33000,
        metadata: { bookingId: '42' },
      }),
    },
  })

  supabase.from = () => ({
    select() {
      return {
        eq() {
          return {
            single: async () => ({
              data: {
                id: 42,
                renter_id: 'r1',
                status: 'PENDING',
                total_price: 330,
                boat_id: 7,
                start_date: '2026-08-01',
                end_date: '2026-08-04',
                skipper_fee: 0,
                service_fee: 30,
              },
              error: null,
            }),
          }
        },
      }
    },
    update() {
      return {
        eq() {
          return {
            eq() {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        id: 42,
                        boat_id: 7,
                        renter_id: 'r1',
                        start_date: '2026-08-01',
                        end_date: '2026-08-04',
                        status: 'CONFIRMED',
                        total_price: 330,
                        service_fee: 30,
                        skipper_fee: 0,
                        boats: {
                          id: 7, title: 'Ocean', price_per_day: 100, owner_id: 'o1',
                        },
                      },
                      error: null,
                    }),
                  }
                },
              }
            },
          }
        },
      }
    },
    insert: async () => ({ data: null, error: null }),
  })

  const handler = getHandler('/confirm-payment', 'post')
  const res = mockRes()
  await handler({
    body: { bookingId: 42, paymentIntentId: 'pi_test' },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.status, 'CONFIRMED')
  assert.equal(res.body.id, 42)
})

test('POST /bookings/:id/payment-intent crée un PaymentIntent', async () => {
  let createdAmount = null
  __setStripeForTests({
    paymentIntents: {
      create: async (args) => {
        createdAmount = args.amount
        return { id: 'pi_123', client_secret: 'secret_abc' }
      },
    },
  })

  supabase.from = () => ({
    select() {
      return {
        eq() {
          return {
            single: async () => ({
              data: {
                id: 42,
                renter_id: 'r1',
                status: 'PENDING',
                total_price: 330,
                boats: { title: 'Ocean' },
              },
              error: null,
            }),
          }
        },
      }
    },
    update() {
      return {
        eq() {
          return {
            eq: async () => ({ data: null, error: null }),
          }
        },
      }
    },
  })

  const handler = getHandler('/:id/payment-intent', 'post')
  const res = mockRes()
  await handler({
    params: { id: '42' },
    user: { id: 'r1', role: 'RENTER' },
  }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.clientSecret, 'secret_abc')
  assert.equal(res.body.bookingId, 42)
  assert.equal(createdAmount, 33000)
})
