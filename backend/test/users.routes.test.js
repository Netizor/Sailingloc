import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coverage'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const {
  formatUser,
  buildProfileUpdates,
  validatePasswordChange,
  validateRoleChange,
} = await import('../src/routes/users.routes.js')

// ─── formatUser ──────────────────────────────────────────────
test('formatUser renvoie null si utilisateur absent', () => {
  assert.equal(formatUser(null), null)
})

test('formatUser mappe le profil sans exposer le mot de passe', () => {
  const dto = formatUser({
    id: 7,
    email: 'ada@example.com',
    role: 'RENTER',
    first_name: 'Ada',
    last_name: 'Lovelace',
    phone: '+33600000000',
    bio: 'Navigatrice',
    kyc_status: 'APPROVED',
    is_blocked: false,
    password: '$2a$12$secret',
    sailor_cv_status: 'PENDING',
    created_at: '2026-01-01T00:00:00.000Z',
  })
  assert.equal(dto.id, 7)
  assert.equal(dto.firstName, 'Ada')
  assert.equal(dto.kycVerified, true)
  assert.equal(dto.isActive, true)
  assert.equal(dto.sailorCvStatus, 'PENDING')
  assert.equal('password' in dto, false)
})

test('formatUser marque kycVerified=false si KYC non approuvé', () => {
  assert.equal(formatUser({ id: 1, kyc_status: 'PENDING', is_blocked: false }).kycVerified, false)
})

test('formatUser dérive isActive de is_blocked', () => {
  assert.equal(formatUser({ id: 1, is_blocked: true }).isActive, false)
})

test('formatUser met sailorCvStatus à NOT_SUBMITTED par défaut', () => {
  assert.equal(formatUser({ id: 1 }).sailorCvStatus, 'NOT_SUBMITTED')
})

// ─── buildProfileUpdates ─────────────────────────────────────
test('buildProfileUpdates accepte un profil valide et trim les champs', () => {
  const result = buildProfileUpdates({
    firstName: '  Ada  ',
    lastName: '  Lovelace ',
    phone: '+33 6 12 34 56 78',
    bio: '  Cap-Hornière  ',
    sailingExperienceYears: 5,
    sailingQualifications: '  Permis côtier  ',
    sailingAreas: '  Méditerranée  ',
    sailorBio: '  CV marin  ',
  })
  assert.equal(result.error, undefined)
  assert.equal(result.updates.first_name, 'Ada')
  assert.equal(result.updates.last_name, 'Lovelace')
  assert.equal(result.updates.phone, '+33 6 12 34 56 78')
  assert.equal(result.updates.bio, 'Cap-Hornière')
  assert.equal(result.updates.sailing_experience_years, 5)
  assert.equal(result.updates.sailing_qualifications, 'Permis côtier')
  assert.equal(result.updates.sailing_areas, 'Méditerranée')
  assert.equal(result.updates.sailor_bio, 'CV marin')
  assert.ok(result.updates.updated_at)
})

test('buildProfileUpdates refuse un prénom trop long', () => {
  assert.equal(buildProfileUpdates({ firstName: 'a'.repeat(101) }).error, 'firstName trop long (100 max)')
})

test('buildProfileUpdates refuse un nom trop long', () => {
  assert.equal(buildProfileUpdates({ lastName: 'b'.repeat(101) }).error, 'lastName trop long (100 max)')
})

test('buildProfileUpdates refuse un téléphone invalide', () => {
  assert.equal(buildProfileUpdates({ phone: 'not-a-phone!!!' }).error, 'Numéro de téléphone invalide')
})

test('buildProfileUpdates refuse une bio trop longue', () => {
  assert.equal(buildProfileUpdates({ bio: 'x'.repeat(2001) }).error, 'bio trop longue (2000 max)')
})

test('buildProfileUpdates refuse des années d\'expérience hors bornes', () => {
  assert.match(buildProfileUpdates({ sailingExperienceYears: -1 }).error, /expérience/)
  assert.match(buildProfileUpdates({ sailingExperienceYears: 101 }).error, /expérience/)
  assert.match(buildProfileUpdates({ sailingExperienceYears: 2.5 }).error, /expérience/)
})

test('buildProfileUpdates accepte de vider les années d\'expérience', () => {
  assert.equal(buildProfileUpdates({ sailingExperienceYears: null }).updates.sailing_experience_years, null)
  assert.equal(buildProfileUpdates({ sailingExperienceYears: '' }).updates.sailing_experience_years, null)
})

test('buildProfileUpdates refuse des qualifications / zones / CV trop longs', () => {
  assert.equal(buildProfileUpdates({ sailingQualifications: 'q'.repeat(2001) }).error, 'Qualifications trop longues (2000 max)')
  assert.equal(buildProfileUpdates({ sailingAreas: 'z'.repeat(2001) }).error, 'Zones de navigation trop longues (2000 max)')
  assert.equal(buildProfileUpdates({ sailorBio: 'c'.repeat(4001) }).error, 'CV de marin trop long (4000 max)')
})

// ─── validatePasswordChange (sécurité) ───────────────────────
test('validatePasswordChange exige currentPassword et newPassword', () => {
  assert.equal(validatePasswordChange({}), 'currentPassword et newPassword requis')
  assert.equal(validatePasswordChange({ currentPassword: 'x' }), 'currentPassword et newPassword requis')
})

test('validatePasswordChange refuse un nouveau mot de passe trop court', () => {
  assert.match(
    validatePasswordChange({ currentPassword: 'OldPass123!', newPassword: 'Aa1!short' }),
    /entre 12 et 128 caractères/,
  )
})

test('validatePasswordChange refuse un nouveau mot de passe trop long', () => {
  const tooLong = `Aa1!${'a'.repeat(126)}`
  assert.match(
    validatePasswordChange({ currentPassword: 'OldPass123!', newPassword: tooLong }),
    /entre 12 et 128 caractères/,
  )
})

test('validatePasswordChange refuse un mot de passe sans complexité suffisante', () => {
  assert.match(
    validatePasswordChange({ currentPassword: 'OldPass123!', newPassword: 'password1234' }),
    /majuscule/,
  )
})

test('validatePasswordChange accepte un nouveau mot de passe conforme', () => {
  assert.equal(
    validatePasswordChange({ currentPassword: 'OldPass123!', newPassword: 'NewSecure9!ab' }),
    null,
  )
})

// ─── validateRoleChange ──────────────────────────────────────
test('validateRoleChange accepte OWNER et RENTER', () => {
  assert.equal(validateRoleChange('OWNER'), null)
  assert.equal(validateRoleChange('RENTER'), null)
})

test('validateRoleChange refuse ADMIN ou une valeur arbitraire', () => {
  assert.equal(validateRoleChange('ADMIN'), 'Rôle invalide')
  assert.equal(validateRoleChange('superadmin'), 'Rôle invalide')
})
