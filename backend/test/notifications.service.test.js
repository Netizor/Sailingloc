import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const supabase = (await import('../src/lib/supabase.js')).default
const { notifyUser, notifyAdmins } = await import('../src/services/notifications.service.js')

test('notifyUser insert une notification', async () => {
  let inserted = null
  supabase.from = (table) => {
    assert.equal(table, 'notifications')
    return {
      insert: async (row) => {
        inserted = row
        return { data: row, error: null }
      },
    }
  }

  await notifyUser('user-1', 'booking', 'Titre', 'Corps', { bookingId: 9 })

  assert.deepEqual(inserted, {
    user_id: 'user-1',
    type: 'booking',
    title: 'Titre',
    body: 'Corps',
    data: { bookingId: 9 },
    is_read: false,
  })
})

test('notifyAdmins ne fait rien s il n y a aucun admin', async () => {
  let insertCalled = false
  supabase.from = (table) => {
    if (table === 'users') {
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      }
    }
    return {
      insert: async () => {
        insertCalled = true
        return { data: null, error: null }
      },
    }
  }

  await notifyAdmins('alert', 'Titre', 'Corps')
  assert.equal(insertCalled, false)
})

test('notifyAdmins insert une notif par admin', async () => {
  let inserted = null
  supabase.from = (table) => {
    if (table === 'users') {
      return {
        select: () => ({
          eq: async () => ({
            data: [{ id: 'admin-1' }, { id: 'admin-2' }],
            error: null,
          }),
        }),
      }
    }
    assert.equal(table, 'notifications')
    return {
      insert: async (rows) => {
        inserted = rows
        return { data: rows, error: null }
      },
    }
  }

  await notifyAdmins('kyc', 'KYC', 'Nouveau dossier', { id: 1 })

  assert.equal(inserted.length, 2)
  assert.equal(inserted[0].user_id, 'admin-1')
  assert.equal(inserted[1].user_id, 'admin-2')
  assert.equal(inserted[0].type, 'kyc')
  assert.equal(inserted[0].is_read, false)
})