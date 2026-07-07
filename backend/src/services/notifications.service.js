import supabase from '../lib/supabase.js'

/**
 * Insère une notification pour chaque utilisateur ADMIN.
 * Fire-and-forget : appelez avec .catch(() => {}) pour ne pas bloquer la réponse.
 */
export async function notifyAdmins(type, title, body, data = {}) {
  const { data: admins } = await supabase.from('users').select('id').eq('role', 'ADMIN')
  if (!admins?.length) return
  await supabase.from('notifications').insert(
    admins.map(a => ({ user_id: a.id, type, title, body, data, is_read: false }))
  )
}
