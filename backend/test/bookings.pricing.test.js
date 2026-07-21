import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  computeDays,
  calculatePrice,
  calculateRefund,
  ownerEarnings,
  bookingInYear,
  formatBooking,
} = await import('../src/routes/bookings.routes.js')

function daysFromNow(now, days) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

// ─── computeDays ────────────────────────────────────────────
test('computeDays calcule le nombre de jours entre deux dates', () => {
  assert.equal(computeDays('2026-08-01', '2026-08-04'), 3)
})

test('computeDays renvoie au minimum 1 jour (même date de début et de fin)', () => {
  assert.equal(computeDays('2026-08-01', '2026-08-01'), 1)
})

// ─── calculatePrice (prix + commission plateforme 10%) ──────
test('calculatePrice calcule le prix de base et la commission plateforme (10%)', async () => {
  const boat = { price_per_day: 100, with_skipper: false }
  const pricing = await calculatePrice(boat, '2026-08-01', '2026-08-04', false)
  assert.equal(pricing.days, 3)
  assert.equal(pricing.basePrice, 300)
  assert.equal(pricing.skipperFee, 0)
  assert.equal(pricing.serviceFee, 30) // 10 % de 300
  assert.equal(pricing.totalPrice, 330)
})

test('calculatePrice ajoute le forfait skipper si demandé et proposé par le bateau', async () => {
  const boat = { price_per_day: 100, with_skipper: true, skipper_price: 50 }
  const pricing = await calculatePrice(boat, '2026-08-01', '2026-08-04', true)
  assert.equal(pricing.skipperFee, 150) // 50 €/jour * 3 jours
  assert.equal(pricing.totalPrice, 300 + 150 + 30)
})

test('calculatePrice ignore le skipper si le bateau ne le propose pas, même si demandé', async () => {
  const boat = { price_per_day: 100, with_skipper: false, skipper_price: 50 }
  const pricing = await calculatePrice(boat, '2026-08-01', '2026-08-04', true)
  assert.equal(pricing.skipperFee, 0)
})

test('calculatePrice rejette des dates invalides (fin avant ou égale au début)', async () => {
  const boat = { price_per_day: 100 }
  await assert.rejects(
    () => calculatePrice(boat, '2026-08-04', '2026-08-01', false),
    /Dates invalides/
  )
})

// ─── calculateRefund (politique d'annulation) ────────────────
test('calculateRefund rembourse 100% si le propriétaire ou l\'admin annule, quel que soit le délai', () => {
  const now = new Date()
  const startDate = daysFromNow(now, 1) // départ demain : 0% si c'était le locataire
  const { refundPercent, refundAmount } = calculateRefund({
    startDate, now, isOwnerOrAdmin: true, totalPrice: 200,
  })
  assert.equal(refundPercent, 100)
  assert.equal(refundAmount, 200)
})

test('calculateRefund rembourse 100% si le locataire annule plus de 7 jours avant le départ', () => {
  const now = new Date()
  const startDate = daysFromNow(now, 8)
  const { refundPercent } = calculateRefund({ startDate, now, isOwnerOrAdmin: false, totalPrice: 200 })
  assert.equal(refundPercent, 100)
})

test('calculateRefund rembourse 50% entre 2 et 7 jours avant le départ', () => {
  const now = new Date()
  const startDate = daysFromNow(now, 5)
  const { refundPercent, refundAmount } = calculateRefund({ startDate, now, isOwnerOrAdmin: false, totalPrice: 200 })
  assert.equal(refundPercent, 50)
  assert.equal(refundAmount, 100)
})

test('calculateRefund ne rembourse rien à moins de 2 jours du départ', () => {
  const now = new Date()
  const startDate = daysFromNow(now, 1)
  const { refundPercent, refundAmount } = calculateRefund({ startDate, now, isOwnerOrAdmin: false, totalPrice: 200 })
  assert.equal(refundPercent, 0)
  assert.equal(refundAmount, 0)
})

test('calculateRefund : à exactement 7 jours du départ, la règle applique 50% (pas 100%)', () => {
  const now = new Date()
  const startDate = daysFromNow(now, 7)
  const { refundPercent } = calculateRefund({ startDate, now, isOwnerOrAdmin: false, totalPrice: 200 })
  assert.equal(refundPercent, 50)
})

// ─── ownerEarnings (revenus reversés au propriétaire) ────────
test('ownerEarnings soustrait la commission plateforme du montant total', () => {
  assert.equal(ownerEarnings({ total_price: 330, service_fee: 30 }), 300)
})

test('ownerEarnings gère les valeurs manquantes sans planter', () => {
  assert.equal(ownerEarnings({}), 0)
})

// ─── bookingInYear ────────────────────────────────────────────
test('bookingInYear vérifie l\'année de la date de début de la réservation', () => {
  assert.equal(bookingInYear({ start_date: '2026-03-15' }, 2026), true)
  assert.equal(bookingInYear({ start_date: '2026-03-15' }, 2025), false)
})

// ─── formatBooking (DTO renvoyé au frontend) ─────────────────
test('formatBooking construit correctement l\'objet renvoyé au frontend', () => {
  const booking = {
    id: 42,
    boat_id: 7,
    renter_id: 'renter-1',
    start_date: '2026-08-01',
    end_date: '2026-08-04',
    with_skipper: false,
    service_fee: 30,
    skipper_fee: 0,
    total_price: 330,
    status: 'PENDING',
    boats: { id: 7, title: 'Voilier Test', price_per_day: 100, owner_id: 'owner-1' },
  }
  const dto = formatBooking(booking)
  assert.equal(dto.id, 42)
  assert.equal(dto.ownerId, 'owner-1')
  assert.equal(dto.totalDays, 3)
  assert.equal(dto.totalAmount, 330)
  assert.equal(dto.platformFee, 30)
  assert.equal(dto.hasReview, false)
})
