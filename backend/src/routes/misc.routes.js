import { Router } from 'express'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

// ═══════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════
export const reviewsRouter = Router()

reviewsRouter.post('/', authenticate, async (req, res) => {
  const { bookingId, type, rating, comment } = req.body
  if (!bookingId || !type || !rating || !comment) return res.status(400).json({ message: 'bookingId, type, rating et comment requis' })
  if (!['RENTER_TO_BOAT', 'OWNER_TO_RENTER'].includes(type)) return res.status(400).json({ message: 'Type invalide' })
  if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Note entre 1 et 5' })

  const { data: booking } = await supabase.from('bookings').select('*, boats(owner_id)').eq('id', bookingId).single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  if (booking.status !== 'COMPLETED') return res.status(400).json({ message: 'Seules les réservations terminées peuvent être notées' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id

  if (type === 'RENTER_TO_BOAT' && !isRenter) return res.status(403).json({ message: 'Accès refusé' })
  if (type === 'OWNER_TO_RENTER' && !isOwner)  return res.status(403).json({ message: 'Accès refusé' })

  const { data: existing } = await supabase.from('reviews').select('id').eq('booking_id', bookingId).eq('author_id', req.user.id).single()
  if (existing) return res.status(409).json({ message: 'Vous avez déjà laissé un avis pour cette réservation' })

  const { data: review, error } = await supabase.from('reviews').insert({
    booking_id: bookingId,
    boat_id: type === 'RENTER_TO_BOAT' ? booking.boat_id : null,
    author_id: req.user.id,
    target_user_id: type === 'OWNER_TO_RENTER' ? booking.renter_id : null,
    type,
    rating,
    comment: comment.trim(),
  }).select('*, users!author_id(id, first_name, last_name, avatar)').single()

  if (error) return res.status(500).json({ message: error.message })

  // Recalculer la note moyenne du bateau
  if (type === 'RENTER_TO_BOAT' && booking.boat_id) {
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('boat_id', booking.boat_id).eq('type', 'RENTER_TO_BOAT')
    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await supabase.from('boats').update({ average_rating: Math.round(avg * 10) / 10, review_count: allReviews.length }).eq('id', booking.boat_id)
    }
  }

  return res.status(201).json(review)
})

reviewsRouter.get('/boat/:boatId', async (req, res) => {
  const { data, count } = await supabase
    .from('reviews')
    .select('*, users!author_id(id, first_name, last_name, avatar)', { count: 'exact' })
    .eq('boat_id', req.params.boatId)
    .eq('type', 'RENTER_TO_BOAT')
    .order('created_at', { ascending: false })
    .range(0, 19)
  return res.json({ items: data || [], total: count || 0 })
})

// ═══════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════
export const messagesRouter = Router()

messagesRouter.get('/unread-count', authenticate, async (req, res) => {
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('recipient_id', req.user.id)
    .eq('is_read', false)
  return res.json({ count: count || 0 })
})

messagesRouter.get('/conversations', authenticate, async (req, res) => {
  // Récupère tous les messages impliquant l'user et groupe par conversation
  const { data: msgs } = await supabase
    .from('messages')
    .select('*, sender:users!sender_id(id, first_name, last_name, avatar), recipient:users!recipient_id(id, first_name, last_name, avatar)')
    .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false })

  // Dédoublonnage par conversation (couple sender/recipient)
  const seen = new Map()
  for (const msg of (msgs || [])) {
    const otherId = msg.sender_id === req.user.id ? msg.recipient_id : msg.sender_id
    const key = [req.user.id, otherId].sort().join('-')
    if (!seen.has(key)) seen.set(key, msg)
  }

  return res.json({ conversations: Array.from(seen.values()) })
})

messagesRouter.get('/:otherId', authenticate, async (req, res) => {
  const { data: msgs } = await supabase
    .from('messages')
    .select('*, sender:users!sender_id(id, first_name, last_name, avatar)')
    .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${req.params.otherId}),and(sender_id.eq.${req.params.otherId},recipient_id.eq.${req.user.id})`)
    .order('created_at', { ascending: true })

  // Marquer comme lu
  await supabase.from('messages').update({ is_read: true }).eq('sender_id', req.params.otherId).eq('recipient_id', req.user.id)

  return res.json({ messages: msgs || [] })
})

messagesRouter.post('/', authenticate, async (req, res) => {
  const { recipientId, content } = req.body
  if (!recipientId || !content?.trim()) return res.status(400).json({ message: 'recipientId et content requis' })
  if (recipientId === req.user.id) return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer un message' })
  if (content.length > 2000) return res.status(400).json({ message: 'Message trop long (2000 max)' })

  const { data: msg, error } = await supabase.from('messages').insert({
    sender_id: req.user.id,
    recipient_id: recipientId,
    content: content.trim(),
  }).select('*, sender:users!sender_id(id, first_name, last_name, avatar)').single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(msg)
})

// ═══════════════════════════════════════════════════════════
// FAVORIS
// ═══════════════════════════════════════════════════════════
export const favoritesRouter = Router()

favoritesRouter.get('/', authenticate, async (req, res) => {
  const { data } = await supabase
    .from('favorites')
    .select('*, boats(id, title, images, city, port, price_per_day, average_rating, type, capacity)')
    .eq('user_id', req.user.id)
  return res.json({ items: (data || []).map(f => ({ id: f.id, boat: f.boats, createdAt: f.created_at })) })
})

favoritesRouter.post('/:boatId', authenticate, async (req, res) => {
  const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', req.user.id).eq('boat_id', req.params.boatId).single()
  if (existing) return res.status(409).json({ message: 'Déjà dans les favoris' })

  const { error } = await supabase.from('favorites').insert({ user_id: req.user.id, boat_id: req.params.boatId })
  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json({ message: 'Ajouté aux favoris' })
})

favoritesRouter.delete('/:boatId', authenticate, async (req, res) => {
  await supabase.from('favorites').delete().eq('user_id', req.user.id).eq('boat_id', req.params.boatId)
  return res.json({ message: 'Retiré des favoris' })
})

// ═══════════════════════════════════════════════════════════
// DISPONIBILITÉS
// ═══════════════════════════════════════════════════════════
export const availabilityRouter = Router()

availabilityRouter.get('/:boatId', async (req, res) => {
  const { data } = await supabase
    .from('availabilities')
    .select('*')
    .eq('boat_id', req.params.boatId)
    .gte('end_date', new Date().toISOString().slice(0, 10))
  return res.json({ items: data || [] })
})

availabilityRouter.post('/', authenticate, async (req, res) => {
  const { boatId, startDate, endDate, type } = req.body
  if (!boatId || !startDate || !endDate) return res.status(400).json({ message: 'boatId, startDate et endDate requis' })

  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', boatId).single()
  if (!boat || (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Accès refusé' })

  const { data, error } = await supabase.from('availabilities').insert({
    boat_id: boatId,
    start_date: startDate,
    end_date: endDate,
    type: type || 'BLOCKED',
  }).select().single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(data)
})

availabilityRouter.delete('/:id', authenticate, async (req, res) => {
  const { data: avail } = await supabase
    .from('availabilities')
    .select('*, boats(owner_id)')
    .eq('id', req.params.id).single()

  if (!avail) return res.status(404).json({ message: 'Introuvable' })
  if (avail.boats?.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  await supabase.from('availabilities').delete().eq('id', req.params.id)
  return res.json({ message: 'Supprimé' })
})

// ═══════════════════════════════════════════════════════════
// PRIX SAISONNIERS
// ═══════════════════════════════════════════════════════════
export const seasonalPricesRouter = Router()

seasonalPricesRouter.get('/:boatId', async (req, res) => {
  const { data } = await supabase.from('seasonal_prices').select('*').eq('boat_id', req.params.boatId)
  return res.json({ items: data || [] })
})

seasonalPricesRouter.post('/', authenticate, async (req, res) => {
  const { boatId, startDate, endDate, pricePerDay, label } = req.body
  if (!boatId || !startDate || !endDate || !pricePerDay) return res.status(400).json({ message: 'Champs requis manquants' })

  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', boatId).single()
  if (!boat || (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Accès refusé' })

  const { data, error } = await supabase.from('seasonal_prices').insert({
    boat_id: boatId, start_date: startDate, end_date: endDate, price_per_day: parseFloat(pricePerDay), label,
  }).select().single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(data)
})

seasonalPricesRouter.delete('/:id', authenticate, async (req, res) => {
  const { data: sp } = await supabase.from('seasonal_prices').select('*, boats(owner_id)').eq('id', req.params.id).single()
  if (!sp || (sp.boats?.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Accès refusé' })
  await supabase.from('seasonal_prices').delete().eq('id', req.params.id)
  return res.json({ message: 'Supprimé' })
})

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
export const notificationsRouter = Router()

notificationsRouter.get('/', authenticate, async (req, res) => {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  return res.json({ items: data || [] })
})

notificationsRouter.patch('/:id/read', authenticate, async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id)
  return res.json({ message: 'Marquée comme lue' })
})

notificationsRouter.patch('/read-all', authenticate, async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id)
  return res.json({ message: 'Toutes marquées comme lues' })
})

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════
export const adminRouter = Router()

adminRouter.use(authenticate, requireRole('ADMIN'))

adminRouter.get('/users', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)

  const { data, count } = await supabase
    .from('users')
    .select('id, email, role, first_name, last_name, is_blocked, email_verified_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  return res.json({ items: data || [], total: count || 0, page, limit })
})

adminRouter.patch('/users/:id/block', async (req, res) => {
  const { blocked } = req.body
  await supabase.from('users').update({ is_blocked: Boolean(blocked) }).eq('id', req.params.id)
  return res.json({ message: `Utilisateur ${blocked ? 'bloqué' : 'débloqué'}` })
})

adminRouter.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['RENTER', 'OWNER', 'ADMIN'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' })
  await supabase.from('users').update({ role }).eq('id', req.params.id)
  return res.json({ message: 'Rôle mis à jour' })
})

adminRouter.get('/boats', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)

  const { data, count } = await supabase
    .from('boats')
    .select('id, title, status, type, city, price_per_day, owner_id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  return res.json({ items: data || [], total: count || 0, page, limit })
})

adminRouter.patch('/boats/:id/status', async (req, res) => {
  const { status } = req.body
  if (!['active', 'inactive', 'draft'].includes(status)) return res.status(400).json({ message: 'Statut invalide' })
  await supabase.from('boats').update({ status }).eq('id', req.params.id)
  return res.json({ message: 'Statut mis à jour' })
})

adminRouter.get('/stats', async (req, res) => {
  const [users, boats, bookings, revenue] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('boats').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('total_price').eq('status', 'CONFIRMED'),
  ])
  const totalRevenue = (revenue.data || []).reduce((s, b) => s + parseFloat(b.total_price || 0), 0)
  return res.json({
    totalUsers: users.count || 0,
    activeBoats: boats.count || 0,
    totalBookings: bookings.count || 0,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  })
})

// ─── Reports ───────────────────────────────────────────────
export const reportsRouter = Router()

reportsRouter.post('/', authenticate, async (req, res) => {
  const { targetType, targetId, reason, description } = req.body
  if (!targetType || !targetId || !reason) return res.status(400).json({ message: 'targetType, targetId et reason requis' })

  const { data, error } = await supabase.from('reports').insert({
    reporter_id: req.user.id,
    target_type: targetType,
    target_id: String(targetId),
    reason,
    description,
  }).select().single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(data)
})

// ─── Stripe webhook ────────────────────────────────────────
export const stripeWebhookRouter = Router()
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

stripeWebhookRouter.post('/webhook', express_raw_body_middleware, async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).send('Webhook signature invalide')
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    const bookingId = pi.metadata?.bookingId
    if (bookingId) {
      await supabase.from('bookings').update({
        status: 'CONFIRMED',
        stripe_payment_intent_id: pi.id,
        updated_at: new Date().toISOString(),
      }).eq('id', bookingId).eq('status', 'PENDING')
    }
  }

  return res.json({ received: true })
})

function express_raw_body_middleware(req, res, next) {
  let data = ''
  req.setEncoding('utf8')
  req.on('data', chunk => { data += chunk })
  req.on('end', () => { req.rawBody = data; next() })
}

// ─── SEO (sitemap, robots) ─────────────────────────────────
export const seoRouter = Router()

seoRouter.get('/sitemap.xml', async (req, res) => {
  const { data: boats } = await supabase.from('boats').select('id, updated_at').eq('status', 'active').limit(1000)
  const frontUrl = process.env.FRONTEND_URL || 'https://sailingloc.fr'
  const urls = [
    `<url><loc>${frontUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${frontUrl}/bateaux</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...(boats || []).map(b => `<url><loc>${frontUrl}/bateaux/${b.id}</loc><lastmod>${b.updated_at?.slice(0, 10)}</lastmod><priority>0.8</priority></url>`),
  ]
  res.header('Content-Type', 'application/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`)
})

seoRouter.get('/robots.txt', (req, res) => {
  const frontUrl = process.env.FRONTEND_URL || 'https://sailingloc.fr'
  res.header('Content-Type', 'text/plain')
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nSitemap: ${frontUrl}/sitemap.xml`)
})

// ─── Health check ──────────────────────────────────────────
export const healthRouter = Router()

healthRouter.get('/', async (req, res) => {
  const { error } = await supabase.from('users').select('id').limit(1)
  return res.json({
    status: error ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    supabase: error ? 'unreachable' : 'connected',
  })
})
