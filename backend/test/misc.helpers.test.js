import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://sailingloc.fr'

const {
  isContactHoneypotTriggered,
  validateContactForm,
  buildConvId,
  parseConvId,
  formatMsg,
  addDaysStr,
  eachDateStr,
  normalizeBoatStatus,
  normalizeRoleName,
  computeAdminYearRevenue,
} = await import('../src/routes/misc.routes.js')

// ─── Contact ─────────────────────────────────────────────────
test('isContactHoneypotTriggered détecte un honeypot rempli', () => {
  assert.equal(isContactHoneypotTriggered({ company_url_hp: 'http://spam' }), true)
  assert.equal(isContactHoneypotTriggered({ company_url_hp: '  ' }), false)
  assert.equal(isContactHoneypotTriggered({}), false)
})

test('validateContactForm refuse champs manquants, email invalide ou message trop court', () => {
  assert.equal(validateContactForm({}).error, 'Tous les champs sont requis')
  assert.equal(
    validateContactForm({
      firstName: 'Ada', lastName: 'L', email: 'bad', subject: 'Hi', message: '1234567890',
    }).error,
    'Email invalide',
  )
  assert.match(
    validateContactForm({
      firstName: 'Ada', lastName: 'L', email: 'a@b.co', subject: 'Hi', message: 'court',
    }).error,
    /10 caractères/,
  )
})

test('validateContactForm trimme et accepte un message valide', () => {
  const result = validateContactForm({
    firstName: '  Ada ',
    lastName: ' Lovelace ',
    email: ' ada@example.com ',
    subject: ' Location ',
    message: '  Bonjour, je souhaite louer un bateau.  ',
  })
  assert.equal(result.error, undefined)
  assert.equal(result.payload.firstName, 'Ada')
  assert.equal(result.payload.email, 'ada@example.com')
})

// ─── Messages / conversations ────────────────────────────────
test('buildConvId est stable quel que soit l\'ordre des ids', () => {
  assert.equal(buildConvId(10, 3), '3-10')
  assert.equal(buildConvId(3, 10), '3-10')
})

test('parseConvId renvoie l\'autre participant ou null', () => {
  assert.equal(parseConvId('3-10', 3), 10)
  assert.equal(parseConvId('3-10', 10), 3)
  assert.equal(parseConvId('3-10', 99), null)
  assert.equal(parseConvId('bad', 3), null)
})

test('formatMsg mappe un message snake_case → camelCase', () => {
  const dto = formatMsg({
    id: 1,
    sender_id: 3,
    recipient_id: 10,
    content: 'Hello',
    is_read: true,
    boat_id: 7,
    created_at: '2026-07-01T00:00:00.000Z',
  })
  assert.equal(dto.conversationId, '3-10')
  assert.equal(dto.senderId, 3)
  assert.equal(dto.isRead, true)
  assert.equal(dto.boatId, 7)
})

// ─── Disponibilités (dates) ──────────────────────────────────
test('addDaysStr ajoute des jours en YYYY-MM-DD', () => {
  assert.equal(addDaysStr('2026-08-01', 3), '2026-08-04')
})

test('eachDateStr énumère chaque jour inclus', () => {
  assert.deepEqual(eachDateStr('2026-08-01', '2026-08-03'), [
    '2026-08-01',
    '2026-08-02',
    '2026-08-03',
  ])
})

// ─── Admin ───────────────────────────────────────────────────
test('normalizeBoatStatus mappe les alias vers active/inactive/draft', () => {
  assert.equal(normalizeBoatStatus('PUBLISHED'), 'active')
  assert.equal(normalizeBoatStatus('SUSPENDED'), 'inactive')
  assert.equal(normalizeBoatStatus('DRAFT'), 'draft')
  assert.equal(normalizeBoatStatus('active'), 'active')
})

test('normalizeRoleName nettoie et majuscule le nom de rôle', () => {
  assert.equal(normalizeRoleName('super admin!'), 'SUPER_ADMIN_')
  assert.equal(normalizeRoleName('moderator'), 'MODERATOR')
})

test('computeAdminYearRevenue agrège CA total et commission plateforme', () => {
  const result = computeAdminYearRevenue([
    { status: 'CONFIRMED', total_price: 330, service_fee: 30 },
    { status: 'COMPLETED', total_price: 220, service_fee: 20 },
    { status: 'PENDING', total_price: 100, service_fee: 10 },
    { status: 'CANCELLED', total_price: 50, service_fee: 5 },
  ])
  assert.equal(result.totalRevenue, 550)
  assert.equal(result.platformRevenue, 50)
  assert.equal(result.paidCount, 2)
})
