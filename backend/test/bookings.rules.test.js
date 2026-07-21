import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  validateBookingDates,
  renterMeetsLicenseRequirement,
  canAccessBooking,
  resolveBookingStatusUpdate,
  validateBookingStatusChange,
  validateBookingCancellation,
  validatePaymentConfirmation,
  buildOwnerRevenuesSummary,
} = await import('../src/routes/bookings.routes.js')

// ─── validateBookingDates ────────────────────────────────────
test('validateBookingDates refuse dates absentes, invalides ou inversées', () => {
  assert.equal(validateBookingDates('bad', '2026-08-04'), 'Dates invalides')
  assert.equal(validateBookingDates('2026-08-04', '2026-08-01'), 'Dates invalides')
  assert.equal(validateBookingDates('2026-08-01', '2026-08-01'), 'Dates invalides')
})

test('validateBookingDates accepte une plage valide', () => {
  assert.equal(validateBookingDates('2026-08-01', '2026-08-04'), null)
})

// ─── renterMeetsLicenseRequirement (permis bateau) ───────────
test('renterMeetsLicenseRequirement laisse passer si skipper ou permis non requis', () => {
  assert.equal(renterMeetsLicenseRequirement({ required_license: 'COASTAL' }, {}, true), true)
  assert.equal(renterMeetsLicenseRequirement({ required_license: 'NONE' }, {}, false), true)
  assert.equal(renterMeetsLicenseRequirement({ required_license: null }, {}, false), true)
})

test('renterMeetsLicenseRequirement exige qualifications ou CV permis approuvé', () => {
  const boat = { required_license: 'COASTAL' }
  assert.equal(renterMeetsLicenseRequirement(boat, {}, false), false)
  assert.equal(
    renterMeetsLicenseRequirement(boat, { sailing_qualifications: '  Permis côtier  ' }, false),
    true,
  )
  assert.equal(
    renterMeetsLicenseRequirement(boat, { sailor_cv_status: 'PENDING', sailor_cv_doc: 'url' }, false),
    false,
  )
  assert.equal(
    renterMeetsLicenseRequirement(boat, { sailor_cv_status: 'APPROVED', sailor_cv_doc: 'https://doc' }, false),
    true,
  )
})

// ─── canAccessBooking ────────────────────────────────────────
test('canAccessBooking autorise locataire, propriétaire et admin', () => {
  const booking = { renter_id: 'r1', boats: { owner_id: 'o1' } }
  assert.equal(canAccessBooking(booking, { id: 'r1', role: 'RENTER' }), true)
  assert.equal(canAccessBooking(booking, { id: 'o1', role: 'OWNER' }), true)
  assert.equal(canAccessBooking(booking, { id: 'a1', role: 'ADMIN' }), true)
  assert.equal(canAccessBooking(booking, { id: 'x', role: 'RENTER' }), false)
})

// ─── resolveBookingStatusUpdate / validateBookingStatusChange ─
test('resolveBookingStatusUpdate mappe accept/reject', () => {
  assert.equal(resolveBookingStatusUpdate({ action: 'accept' }), 'CONFIRMED')
  assert.equal(resolveBookingStatusUpdate({ action: 'reject' }), 'CANCELLED')
  assert.equal(resolveBookingStatusUpdate({ status: 'COMPLETED' }), 'COMPLETED')
})

test('validateBookingStatusChange refuse un statut inconnu', () => {
  assert.equal(
    validateBookingStatusChange({
      booking: { status: 'PENDING', boats: { owner_id: 'o1' } },
      finalStatus: 'PENDING',
      user: { id: 'o1', role: 'OWNER' },
    }),
    'Statut invalide',
  )
})

test('validateBookingStatusChange bloque confirmation sans paiement pour le locataire', () => {
  assert.match(
    validateBookingStatusChange({
      booking: { status: 'PENDING', stripe_payment_intent_id: null, boats: { owner_id: 'o1' } },
      finalStatus: 'CONFIRMED',
      user: { id: 'r1', role: 'RENTER' },
    }),
    /sans paiement/,
  )
})

test('validateBookingStatusChange autorise le propriétaire à confirmer sans Stripe', () => {
  assert.equal(
    validateBookingStatusChange({
      booking: { status: 'PENDING', stripe_payment_intent_id: null, boats: { owner_id: 'o1' } },
      finalStatus: 'CONFIRMED',
      user: { id: 'o1', role: 'OWNER' },
    }),
    null,
  )
})

test('validateBookingStatusChange bloque une réservation déjà CANCELLED/COMPLETED', () => {
  assert.match(
    validateBookingStatusChange({
      booking: { status: 'CANCELLED', boats: { owner_id: 'o1' } },
      finalStatus: 'CONFIRMED',
      user: { id: 'o1', role: 'OWNER' },
    }),
    /ne peut plus être modifiée/,
  )
})

// ─── validateBookingCancellation ─────────────────────────────
test('validateBookingCancellation exige un motif et refuse après départ', () => {
  const booking = {
    status: 'CONFIRMED',
    renter_id: 'r1',
    boats: { owner_id: 'o1' },
    start_date: '2026-08-01',
  }
  const user = { id: 'r1', role: 'RENTER' }
  assert.match(
    validateBookingCancellation({ booking, user, cancellationReason: '  ', now: new Date('2026-07-01') }),
    /motif/,
  )
  assert.match(
    validateBookingCancellation({
      booking,
      user,
      cancellationReason: 'Météo',
      now: new Date('2026-08-02'),
    }),
    /déjà commencée/,
  )
})

test('validateBookingCancellation refuse CANCELLED/COMPLETED', () => {
  assert.match(
    validateBookingCancellation({
      booking: {
        status: 'COMPLETED',
        renter_id: 'r1',
        boats: { owner_id: 'o1' },
        start_date: '2026-08-01',
      },
      user: { id: 'r1', role: 'RENTER' },
      cancellationReason: 'Trop tard',
      now: new Date('2026-07-01'),
    }),
    /ne peut plus être annulée/,
  )
})

test('validateBookingCancellation accepte une annulation valide avant le départ', () => {
  assert.equal(
    validateBookingCancellation({
      booking: {
        status: 'CONFIRMED',
        renter_id: 'r1',
        boats: { owner_id: 'o1' },
        start_date: '2026-08-01',
      },
      user: { id: 'r1', role: 'RENTER' },
      cancellationReason: 'Changement de plans',
      now: new Date('2026-07-15'),
    }),
    null,
  )
})

// ─── validatePaymentConfirmation (Stripe) ────────────────────
test('validatePaymentConfirmation vérifie locataire, statut, intent et montant', () => {
  const booking = { renter_id: 'r1', status: 'PENDING', total_price: 330 }
  const user = { id: 'r1', role: 'RENTER' }
  const intent = {
    status: 'succeeded',
    amount: 33000,
    metadata: { bookingId: '42' },
  }

  assert.equal(validatePaymentConfirmation({ booking: null, user, bookingId: 42, intent }), 'Réservation introuvable')
  assert.equal(
    validatePaymentConfirmation({ booking, user: { id: 'x' }, bookingId: 42, intent }),
    'Accès refusé',
  )
  assert.equal(
    validatePaymentConfirmation({
      booking: { ...booking, status: 'CONFIRMED' },
      user,
      bookingId: 42,
      intent,
    }),
    'Réservation déjà traitée',
  )
  assert.equal(
    validatePaymentConfirmation({ booking, user, bookingId: 42, intent: null }),
    'Paiement introuvable',
  )
  assert.match(
    validatePaymentConfirmation({
      booking,
      user,
      bookingId: 42,
      intent: { ...intent, status: 'requires_payment_method' },
    }),
    /pas été confirmé/,
  )
  assert.match(
    validatePaymentConfirmation({
      booking,
      user,
      bookingId: 42,
      intent: { ...intent, metadata: { bookingId: '99' } },
    }),
    /ne correspond pas/,
  )
  assert.match(
    validatePaymentConfirmation({
      booking,
      user,
      bookingId: 42,
      intent: { ...intent, amount: 100 },
    }),
    /Montant/,
  )
  assert.equal(validatePaymentConfirmation({ booking, user, bookingId: 42, intent }), null)
})

// ─── buildOwnerRevenuesSummary ───────────────────────────────
test('buildOwnerRevenuesSummary agrège gains, mois et bateaux', () => {
  const boats = [
    { id: 1, title: 'Ocean One', images: ['a.jpg'] },
    { id: 2, title: 'Sea Two', images: [] },
  ]
  const bookings = [
    {
      boat_id: 1,
      status: 'CONFIRMED',
      start_date: '2026-03-10',
      end_date: '2026-03-13',
      total_price: 330,
      service_fee: 30,
      created_at: '2026-02-01T00:00:00.000Z',
    },
    {
      boat_id: 1,
      status: 'COMPLETED',
      start_date: '2026-07-01',
      end_date: '2026-07-04',
      total_price: 220,
      service_fee: 20,
      created_at: '2026-06-01T00:00:00.000Z',
    },
    {
      boat_id: 2,
      status: 'PENDING',
      start_date: '2026-08-01',
      end_date: '2026-08-05',
      total_price: 440,
      service_fee: 40,
      created_at: '2026-07-01T00:00:00.000Z',
    },
  ]

  const result = buildOwnerRevenuesSummary({
    boats,
    bookings,
    year: 2026,
    now: new Date('2026-07-15T12:00:00.000Z'),
  })

  // paid = CONFIRMED + COMPLETED → earnings 300 + 200 = 500
  assert.equal(result.summary.totalEarnings, 500)
  assert.equal(result.summary.confirmedBookings, 1)
  assert.equal(result.summary.completedBookings, 1)
  assert.equal(result.summary.pendingEarnings, 400)
  assert.equal(result.summary.thisMonthEarnings, 200) // COMPLETED en juillet
  assert.equal(result.byMonth[2].earnings, 300) // mars (index 2)
  assert.equal(result.byBoat[0].boatId, 1)
  assert.equal(result.byBoat[0].earnings, 500)
  assert.equal(result.byBoat[0].totalDays, 6) // 3 + 3
})
