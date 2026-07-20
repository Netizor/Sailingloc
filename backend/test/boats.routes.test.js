import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  parseArrayParam,
  parseAvailabilityRange,
  parseListPagination,
  canManageBoat,
  canViewBoat,
  validateBoatStatus,
  validateBoatCreate,
  resolveDocumentField,
  summarizeDestinations,
  buildAutocompleteSuggestions,
  formatBoat,
} = await import('../src/routes/boats.routes.js')

// ─── parseArrayParam ─────────────────────────────────────────
test('parseArrayParam lit une valeur simple ou un tableau', () => {
  assert.deepEqual(parseArrayParam({ countries: 'France' }, 'countries'), ['France'])
  assert.deepEqual(parseArrayParam({ countries: ['France', 'Espagne'] }, 'countries'), ['France', 'Espagne'])
})

test('parseArrayParam accepte la clé avec [] (query string Express)', () => {
  assert.deepEqual(parseArrayParam({ 'countries[]': 'Italie' }, 'countries'), ['Italie'])
})

test('parseArrayParam renvoie [] si la clé est absente', () => {
  assert.deepEqual(parseArrayParam({}, 'countries'), [])
})

// ─── parseAvailabilityRange ──────────────────────────────────
test('parseAvailabilityRange renvoie null si dates absentes ou invalides', () => {
  assert.equal(parseAvailabilityRange(null, '2026-08-04'), null)
  assert.equal(parseAvailabilityRange('2026-08-04', '2026-08-01'), null)
  assert.equal(parseAvailabilityRange('bad', '2026-08-04'), null)
})

test('parseAvailabilityRange accepte une plage valide (début < fin)', () => {
  assert.deepEqual(parseAvailabilityRange('2026-08-01', '2026-08-04'), {
    startDate: '2026-08-01',
    endDate: '2026-08-04',
  })
})

// ─── parseListPagination ─────────────────────────────────────
test('parseListPagination applique les défauts et plafonne la limit', () => {
  assert.deepEqual(parseListPagination({}), { page: 1, limit: 12, from: 0 })
  assert.deepEqual(parseListPagination({ page: '3', limit: '10' }), { page: 3, limit: 10, from: 20 })
  assert.equal(parseListPagination({ limit: '999' }).limit, 50)
  assert.equal(parseListPagination({ page: '0' }).page, 1)
})

test('parseListPagination accepte un defaultLimit personnalisé (liste /my)', () => {
  assert.equal(parseListPagination({}, { defaultLimit: 10 }).limit, 10)
})

// ─── canManageBoat / canViewBoat (autorisations) ─────────────
test('canManageBoat autorise le propriétaire et l\'admin seulement', () => {
  const boat = { owner_id: 'owner-1' }
  assert.equal(canManageBoat(boat, { id: 'owner-1', role: 'OWNER' }), true)
  assert.equal(canManageBoat(boat, { id: 'admin-1', role: 'ADMIN' }), true)
  assert.equal(canManageBoat(boat, { id: 'renter-1', role: 'RENTER' }), false)
  assert.equal(canManageBoat(null, { id: 'owner-1' }), false)
})

test('canViewBoat laisse voir les bateaux active à tous', () => {
  assert.equal(canViewBoat({ status: 'active', owner_id: 'o1' }, null), true)
})

test('canViewBoat masque draft/inactive aux non-propriétaires', () => {
  const draft = { status: 'draft', owner_id: 'owner-1' }
  assert.equal(canViewBoat(draft, null), false)
  assert.equal(canViewBoat(draft, { id: 'renter-1', role: 'RENTER' }), false)
  assert.equal(canViewBoat(draft, { id: 'owner-1', role: 'OWNER' }), true)
  assert.equal(canViewBoat(draft, { id: 'admin-1', role: 'ADMIN' }), true)
})

// ─── validateBoatStatus / validateBoatCreate ─────────────────
test('validateBoatStatus n\'accepte que draft, active, inactive', () => {
  assert.equal(validateBoatStatus('active'), null)
  assert.equal(validateBoatStatus('draft'), null)
  assert.equal(validateBoatStatus('inactive'), null)
  assert.equal(validateBoatStatus('published'), 'Statut invalide')
})

test('validateBoatCreate exige seulement le titre en brouillon', () => {
  assert.equal(validateBoatCreate({}).error, 'Le titre est requis')
  assert.equal(validateBoatCreate({ title: 'Mon voilier', status: 'draft' }).boatStatus, 'draft')
})

test('validateBoatCreate exige les champs complets pour publier (active)', () => {
  const incomplete = validateBoatCreate({
    status: 'active',
    title: 'Voilier',
    description: 'Desc',
    type: 'SAILBOAT',
  })
  assert.match(incomplete.error, /requis pour publier/)

  const ok = validateBoatCreate({
    status: 'ACTIVE',
    title: 'Voilier',
    description: 'Desc',
    type: 'SAILBOAT',
    capacity: 6,
    dailyRate: 150,
    city: 'Marseille',
  })
  assert.equal(ok.error, undefined)
  assert.equal(ok.boatStatus, 'active')
})

test('validateBoatCreate accepte pricePerDay en alias de dailyRate', () => {
  const ok = validateBoatCreate({
    status: 'active',
    title: 'Catamaran',
    description: 'Desc',
    type: 'CATAMARAN',
    capacity: 8,
    pricePerDay: 200,
    city: 'Ajaccio',
  })
  assert.equal(ok.boatStatus, 'active')
})

// ─── resolveDocumentField (docs légaux bateau) ───────────────
test('resolveDocumentField mappe les types légaux connus', () => {
  assert.equal(resolveDocumentField('insurance'), 'insurance_doc')
  assert.equal(resolveDocumentField('registration'), 'registration_doc')
  assert.equal(resolveDocumentField('license'), 'license_scan_doc')
  assert.equal(resolveDocumentField('contract'), 'contract_doc')
})

test('resolveDocumentField refuse un type inconnu', () => {
  assert.equal(resolveDocumentField('passport'), null)
  assert.equal(resolveDocumentField('document'), null)
})

// ─── summarizeDestinations ───────────────────────────────────
test('summarizeDestinations agrège les bateaux par pays avec image', () => {
  const countries = summarizeDestinations([
    { country: 'France', images: ['fr1.jpg'] },
    { country: 'France', images: ['fr2.jpg'] },
    { country: 'Espagne', images: [] },
    { country: null, images: ['default.jpg'] }, // null → France
  ])
  const france = countries.find((c) => c.country === 'France')
  const spain = countries.find((c) => c.country === 'Espagne')
  assert.equal(france.count, 3)
  assert.equal(france.image, 'fr1.jpg')
  assert.equal(spain.count, 1)
  assert.equal(spain.image, null)
})

test('summarizeDestinations gère une liste vide', () => {
  assert.deepEqual(summarizeDestinations([]), [])
  assert.deepEqual(summarizeDestinations(null), [])
})

// ─── buildAutocompleteSuggestions ────────────────────────────
test('buildAutocompleteSuggestions déduplique et limite à 8', () => {
  const suggestions = buildAutocompleteSuggestions({
    cities: [{ city: 'Marseille' }, { city: 'marseille' }, { city: 'Nice' }],
    ports: [{ port: 'Vieux-Port' }],
    countries: [{ country: 'France' }],
  })
  assert.equal(suggestions.filter((s) => s.label.toLowerCase() === 'marseille').length, 1)
  assert.ok(suggestions.some((s) => s.type === 'port' && s.label === 'Vieux-Port'))
  assert.ok(suggestions.some((s) => s.type === 'country'))
})

test('buildAutocompleteSuggestions coupe au-delà de la limite', () => {
  const cities = Array.from({ length: 12 }, (_, i) => ({ city: `City${i}` }))
  assert.equal(buildAutocompleteSuggestions({ cities }, 8).length, 8)
})

// ─── formatBoat ──────────────────────────────────────────────
test('formatBoat mappe snake_case → camelCase et le rating', () => {
  const dto = formatBoat({
    id: 1,
    owner_id: 'o1',
    title: 'Ocean One',
    price_per_day: 120,
    deposit: 500,
    with_skipper: true,
    skipper_price: 40,
    latitude: 43.3,
    longitude: 5.4,
    amenities: ['GPS'],
    average_rating: 4.5,
    review_count: 3,
    images: null,
    required_license: 'Côtier',
  })
  assert.equal(dto.ownerId, 'o1')
  assert.equal(dto.dailyRate, 120)
  assert.equal(dto.depositAmount, 500)
  assert.equal(dto.withSkipper, true)
  assert.equal(dto.skipperPrice, 40)
  assert.equal(dto.lat, 43.3)
  assert.equal(dto.lng, 5.4)
  assert.deepEqual(dto.equipment, ['GPS'])
  assert.deepEqual(dto.images, [])
  assert.equal(dto.rating, 4.5)
  assert.equal(dto.reviewCount, 3)
  assert.equal(dto.requiredLicense, 'Côtier')
  assert.equal(dto.owner, undefined)
})

test('formatBoat inclut le propriétaire si withOwner=true', () => {
  const dto = formatBoat({
    id: 2,
    owner_id: 'o2',
    users: {
      id: 'o2',
      first_name: 'Ada',
      last_name: 'Lovelace',
      avatar: null,
      bio: 'Skipper',
      sailing_experience_years: 10,
      sailor_cv_status: 'APPROVED',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  }, true)
  assert.equal(dto.owner.firstName, 'Ada')
  assert.equal(dto.owner.sailorCvStatus, 'APPROVED')
  assert.equal(dto.owner.sailingExperienceYears, 10)
})
