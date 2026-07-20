import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  formatKycStatus,
  parseDocumentExpiresAt,
  validateKycSubmitStatus,
  buildKycReviewUpdates,
  validateRenewalReason,
} = await import('../src/routes/kyc.routes.js')

// ─── formatKycStatus ─────────────────────────────────────────
test('formatKycStatus utilise kyc_status quand il est présent', () => {
  const dto = formatKycStatus({
    kyc_status: 'PENDING',
    kyc_submitted_at: '2026-07-01T10:00:00.000Z',
  })
  assert.equal(dto.status, 'PENDING')
  assert.equal(dto.submittedAt, '2026-07-01T10:00:00.000Z')
})

test('formatKycStatus dérive APPROVED depuis kyc_verified_at (legacy)', () => {
  const dto = formatKycStatus({
    kyc_verified_at: '2026-06-01T00:00:00.000Z',
  })
  assert.equal(dto.status, 'APPROVED')
  assert.equal(dto.reviewedAt, '2026-06-01T00:00:00.000Z')
})

test('formatKycStatus retombe sur NOT_SUBMITTED sans statut ni vérif', () => {
  assert.equal(formatKycStatus({}).status, 'NOT_SUBMITTED')
})

test('formatKycStatus expose le motif de refus et la date d\'expiration du document', () => {
  const dto = formatKycStatus({
    kyc_status: 'REJECTED',
    kyc_rejection_reason: 'Document illisible',
    kyc_document_expires_at: '2027-01-01T00:00:00.000Z',
    kyc_reviewed_at: '2026-07-10T12:00:00.000Z',
  })
  assert.equal(dto.rejectionReason, 'Document illisible')
  assert.equal(dto.documentExpiresAt, '2027-01-01T00:00:00.000Z')
  assert.equal(dto.reviewedAt, '2026-07-10T12:00:00.000Z')
})

// ─── parseDocumentExpiresAt ──────────────────────────────────
test('parseDocumentExpiresAt renvoie null si la valeur est absente', () => {
  assert.equal(parseDocumentExpiresAt(null), null)
  assert.equal(parseDocumentExpiresAt(''), null)
})

test('parseDocumentExpiresAt renvoie null si la date est invalide', () => {
  assert.equal(parseDocumentExpiresAt('not-a-date'), null)
})

test('parseDocumentExpiresAt normalise une date valide en ISO', () => {
  const iso = parseDocumentExpiresAt('2028-12-31')
  assert.ok(iso)
  assert.equal(new Date(iso).getFullYear(), 2028)
})

// ─── validateKycSubmitStatus (permis / identité obligatoire) ─
test('validateKycSubmitStatus bloque un dépôt si une vérification est déjà PENDING', () => {
  assert.match(validateKycSubmitStatus('PENDING'), /déjà en cours/)
})

test('validateKycSubmitStatus bloque un nouveau dépôt si déjà APPROVED', () => {
  assert.match(validateKycSubmitStatus('APPROVED'), /déjà vérifiée/)
})

test('validateKycSubmitStatus autorise le dépôt si NOT_SUBMITTED ou REJECTED', () => {
  assert.equal(validateKycSubmitStatus('NOT_SUBMITTED'), null)
  assert.equal(validateKycSubmitStatus('REJECTED'), null)
  assert.equal(validateKycSubmitStatus(undefined), null)
})

// ─── buildKycReviewUpdates (décision admin) ──────────────────
test('buildKycReviewUpdates refuse un statut hors APPROVED/REJECTED', () => {
  const result = buildKycReviewUpdates({ status: 'PENDING' })
  assert.equal(result.error, 'Statut invalide')
})

test('buildKycReviewUpdates exige un motif de refus pour REJECTED', () => {
  assert.equal(buildKycReviewUpdates({ status: 'REJECTED', rejectionReason: '  ' }).error, 'Motif de refus requis')
  assert.equal(buildKycReviewUpdates({ status: 'REJECTED' }).error, 'Motif de refus requis')
})

test('buildKycReviewUpdates prépare une approbation avec date de validité', () => {
  const reviewedAt = '2026-07-20T08:00:00.000Z'
  const result = buildKycReviewUpdates({
    status: 'APPROVED',
    documentExpiresAt: '2029-06-01',
    reviewedAt,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.updates.kyc_status, 'APPROVED')
  assert.equal(result.updates.kyc_verified_at, reviewedAt)
  assert.equal(result.updates.kyc_rejection_reason, null)
  assert.ok(result.updates.kyc_document_expires_at)
})

test('buildKycReviewUpdates refuse une date de validité invalide à l\'approbation', () => {
  const result = buildKycReviewUpdates({
    status: 'APPROVED',
    documentExpiresAt: 'invalid',
  })
  assert.equal(result.error, 'Date de validité invalide')
})

test('buildKycReviewUpdates efface l\'expiration et pose le motif en cas de refus', () => {
  const reviewedAt = '2026-07-20T08:00:00.000Z'
  const result = buildKycReviewUpdates({
    status: 'REJECTED',
    rejectionReason: '  Permis bateau expiré  ',
    reviewedAt,
  })
  assert.equal(result.updates.kyc_status, 'REJECTED')
  assert.equal(result.updates.kyc_verified_at, null)
  assert.equal(result.updates.kyc_rejection_reason, 'Permis bateau expiré')
  assert.equal(result.updates.kyc_document_expires_at, null)
})

// ─── validateRenewalReason ───────────────────────────────────
test('validateRenewalReason exige un motif non vide', () => {
  assert.equal(validateRenewalReason(''), 'Motif requis')
  assert.equal(validateRenewalReason('   '), 'Motif requis')
  assert.equal(validateRenewalReason(undefined), 'Motif requis')
})

test('validateRenewalReason accepte un motif renseigné', () => {
  assert.equal(validateRenewalReason('Pièce d\'identité expirée'), null)
})
