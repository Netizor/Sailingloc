import { Router } from 'express'
import webpush from 'web-push'
import supabase from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

function initWebPush() {
  const pub  = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT || 'mailto:admin@sailingloc.fr'
  if (pub && priv) {
    webpush.setVapidDetails(subj, pub, priv)
    return true
  }
  return false
}

// ─── GET /push/vapid-key ─────────────────────────────────────
router.get('/vapid-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) return res.status(503).json({ message: 'Push non configuré sur le serveur' })
  return res.json({ vapidPublicKey: key })
})

// ─── POST /push/subscribe ────────────────────────────────────
router.post('/subscribe', authenticate, async (req, res) => {
  if (!initWebPush()) return res.status(503).json({ message: 'Push non configuré sur le serveur' })

  const { endpoint, keys, expirationTime } = req.body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: 'Abonnement push invalide' })
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id:         req.user.id,
    endpoint,
    p256dh:          keys.p256dh,
    auth:            keys.auth,
    expiration_time: expirationTime ?? null,
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'endpoint' })

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json({ ok: true })
})

// ─── DELETE /push/unsubscribe ────────────────────────────────
router.delete('/unsubscribe', authenticate, async (req, res) => {
  const { endpoint } = req.body
  if (!endpoint) return res.status(400).json({ message: 'endpoint requis' })

  await supabase.from('push_subscriptions')
    .delete()
    .eq('user_id', req.user.id)
    .eq('endpoint', endpoint)

  return res.json({ ok: true })
})

// ─── Utilitaire : envoyer une notif push à un user ───────────
export async function sendPushToUser(userId, payload) {
  if (!initWebPush()) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const message = JSON.stringify(payload)
  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message,
      ).catch(async err => {
        // Subscription expirée ou révoquée → on la supprime
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}

export default router
