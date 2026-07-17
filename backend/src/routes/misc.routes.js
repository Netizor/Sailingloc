import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import rateLimit from 'express-rate-limit'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'
import { verifyAccessToken } from '../lib/jwt.js'
import { sendContactMessage, sendContactConfirmation } from '../services/email.service.js'

// ═══════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════
export const contactRouter = Router()

const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: 'Trop de messages envoyés. Réessayez plus tard.' } })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

contactRouter.post('/', contactLimiter, async (req, res) => {
  console.log('[Contact] POST reçu')

  // Honeypot anti-bot (nom volontairement non autofill)
  if (typeof req.body?.company_url_hp === 'string' && req.body.company_url_hp.trim() !== '') {
    console.log('[Contact] honeypot rempli → faux succès (pas d\'envoi)')
    return res.status(201).json({ success: true, message: 'Message envoyé' })
  }

  const { firstName, lastName, email, subject, message } = req.body
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Tous les champs sont requis' })
  }
  if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ message: 'Email invalide' })
  if (message.trim().length < 10) {
    return res.status(400).json({ message: 'Le message doit contenir au moins 10 caractères' })
  }

  const payload = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  }

  try {
    await sendContactMessage(payload)
    console.log('[Contact] email équipe envoyé')
  } catch (error) {
    console.error('[Contact] Erreur envoi email:', error)
    return res.status(500).json({ success: false, message: 'Impossible d\'envoyer le message pour le moment' })
  }

  try {
    await sendContactConfirmation(payload)
    console.log('[Contact] email confirmation envoyé')
  } catch (error) {
    console.error('[Contact] Erreur envoi email de confirmation:', error)
  }

  return res.status(201).json({ success: true, message: 'Message envoyé' })
})

import { notifyAdmins } from '../services/notifications.service.js'

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
export const notificationsRouter = Router()

notificationsRouter.get('/unread-count', authenticate, async (req, res) => {
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('is_read', false)
  return res.json({ count: count || 0 })
})

notificationsRouter.get('/', authenticate, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 20)
  const [{ data, count }, { count: unreadCount }] = await Promise.all([
    supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', req.user.id).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('is_read', false),
  ])
  return res.json({ notifications: data || [], unreadCount: unreadCount || 0, pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } })
})

notificationsRouter.get('/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('notifications')
    .select('*').eq('id', req.params.id).eq('user_id', req.user.id).single()
  if (error || !data) return res.status(404).json({ message: 'Notification introuvable' })
  if (!data.is_read) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id)
    data.is_read = true
  }
  return res.json(data)
})

notificationsRouter.patch('/:id/read', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
  if (error || !data) return res.status(404).json({ message: 'Notification introuvable' })
  return res.json(data)
})

notificationsRouter.patch('/read-all', authenticate, async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id)
  return res.json({ message: 'Toutes marquées comme lues' })
})

notificationsRouter.delete('/:id', authenticate, async (req, res) => {
  await supabase.from('notifications').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  return res.json({ message: 'Supprimée' })
})

// ═══════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════
export const reviewsRouter = Router()

reviewsRouter.post('/', authenticate, async (req, res) => {
  const { bookingId, type, rating, comment } = req.body
  if (!bookingId || !type || !rating || !comment) return res.status(400).json({ message: 'bookingId, type, rating et comment requis' })
  if (!['RENTER_TO_BOAT','OWNER_TO_RENTER'].includes(type)) return res.status(400).json({ message: 'Type invalide' })
  if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Note entre 1 et 5' })

  const { data: booking } = await supabase.from('bookings').select('*, boats(owner_id)').eq('id', bookingId).single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  if (booking.status !== 'COMPLETED') return res.status(400).json({ message: 'Seules les réservations terminées peuvent être notées' })

  const { data: existing } = await supabase.from('reviews').select('id').eq('booking_id', bookingId).eq('author_id', req.user.id).single()
  if (existing) return res.status(409).json({ message: 'Vous avez déjà laissé un avis' })

  const { data: review, error } = await supabase.from('reviews').insert({
    booking_id: bookingId,
    boat_id: type === 'RENTER_TO_BOAT' ? booking.boat_id : null,
    author_id: req.user.id,
    target_user_id: type === 'OWNER_TO_RENTER' ? booking.renter_id : null,
    type, rating, comment: comment.trim(),
    is_published: true,
  }).select('*, users!author_id(id, first_name, last_name, avatar)').single()

  if (error) return res.status(500).json({ message: error.message })

  if (type === 'RENTER_TO_BOAT' && booking.boat_id) {
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('boat_id', booking.boat_id).eq('type', 'RENTER_TO_BOAT').eq('is_published', true)
    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await supabase.from('boats').update({ average_rating: Math.round(avg * 10) / 10, review_count: allReviews.length }).eq('id', booking.boat_id)
    }
  }

  notifyAdmins(
    'NEW_REVIEW',
    'Nouvel avis',
    `Avis ${rating}/5 posté sur la réservation #${bookingId}`,
    { reviewId: review.id, bookingId, boatId: booking.boat_id }
  ).catch(() => {})

  return res.status(201).json(review)
})

reviewsRouter.get('/boat/:boatId', async (req, res) => {
  const { data, count } = await supabase.from('reviews').select('*, users!author_id(id, first_name, last_name, avatar)', { count: 'exact' }).eq('boat_id', req.params.boatId).eq('type', 'RENTER_TO_BOAT').eq('is_published', true).order('created_at', { ascending: false }).limit(20)
  return res.json({ data: data || [], total: count || 0 })
})

function formatAdminReview(r) {
  return {
    id: r.id,
    bookingId: r.booking_id,
    boatId: r.boat_id,
    reviewerId: r.author_id,
    rating: r.rating,
    comment: r.comment,
    type: r.type,
    isPublished: r.is_published ?? true,
    adminNote: r.admin_note ?? null,
    createdAt: r.created_at,
    reviewer: r.author ? {
      id: r.author.id,
      firstName: r.author.first_name,
      lastName: r.author.last_name,
      avatar: r.author.avatar,
    } : null,
    boatTitle: r.boats?.title ?? null,
    boat: r.boats ? { id: r.boats.id, title: r.boats.title } : null,
  }
}

reviewsRouter.get('/admin', authenticate, requireRole('ADMIN'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 15)
  const status = req.query.status // 'published' | 'hidden'

  let query = supabase
    .from('reviews')
    .select('*, author:users!author_id(id, first_name, last_name, avatar), boats(id, title)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status === 'published') query = query.eq('is_published', true)
  else if (status === 'hidden') query = query.eq('is_published', false)

  const { data, count } = await query
  return res.json({ data: (data || []).map(formatAdminReview), total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
})

reviewsRouter.patch('/admin/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { isPublished, adminNote } = req.body
  if (typeof isPublished !== 'boolean') return res.status(400).json({ message: 'isPublished (boolean) requis' })

  const { data: existing } = await supabase.from('reviews').select('boat_id, type, is_published').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ message: 'Avis introuvable' })

  const updates = { is_published: isPublished, updated_at: new Date().toISOString() }
  if (adminNote !== undefined) updates.admin_note = adminNote || null

  const { data, error } = await supabase.from('reviews').update(updates).eq('id', req.params.id)
    .select('*, author:users!author_id(id, first_name, last_name, avatar), boats(id, title)').single()
  if (error) return res.status(500).json({ message: error.message })

  // Recalculer la note du bateau si l'état de publication change
  if (existing.boat_id && existing.type === 'RENTER_TO_BOAT' && existing.is_published !== isPublished) {
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('boat_id', existing.boat_id).eq('type', 'RENTER_TO_BOAT').eq('is_published', true)
    const avg = allReviews?.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0
    await supabase.from('boats').update({ average_rating: Math.round(avg * 10) / 10, review_count: allReviews?.length || 0 }).eq('id', existing.boat_id)
  }

  return res.json(formatAdminReview(data))
})

reviewsRouter.delete('/admin/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { data: review } = await supabase.from('reviews').select('boat_id, type').eq('id', req.params.id).single()
  if (!review) return res.status(404).json({ message: 'Avis introuvable' })

  const { error } = await supabase.from('reviews').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ message: error.message })

  if (review.boat_id && review.type === 'RENTER_TO_BOAT') {
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('boat_id', review.boat_id).eq('type', 'RENTER_TO_BOAT').eq('is_published', true)
    const avg = allReviews?.length
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0
    await supabase.from('boats').update({
      average_rating: Math.round(avg * 10) / 10,
      review_count: allReviews?.length || 0,
    }).eq('id', review.boat_id)
  }

  return res.json({ message: 'Avis supprimé' })
})

// ═══════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════
export const messagesRouter = Router()

// Conversation ID = "${minUserId}-${maxUserId}" — stable, no separate table needed
function buildConvId(a, b) {
  return `${Math.min(Number(a), Number(b))}-${Math.max(Number(a), Number(b))}`
}

function parseConvId(convId, myId) {
  const parts = String(convId).split('-').map(Number)
  if (parts.length !== 2 || parts.some(isNaN)) return null
  const [a, b] = parts
  if (a === myId) return b
  if (b === myId) return a
  return null
}

function formatMsg(msg) {
  return {
    id: msg.id,
    conversationId: buildConvId(msg.sender_id, msg.recipient_id),
    senderId: msg.sender_id,
    content: msg.content,
    isRead: msg.is_read ?? false,
    boatId: msg.boat_id ?? null,
    createdAt: msg.created_at,
  }
}

messagesRouter.get('/unread-count', authenticate, async (req, res) => {
  const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', req.user.id).eq('is_read', false)
  return res.json({ count: count || 0 })
})

messagesRouter.get('/conversations', authenticate, async (req, res) => {
  const { data: msgs } = await supabase.from('messages')
    .select('*, sender:users!sender_id(id, first_name, last_name, avatar), recipient:users!recipient_id(id, first_name, last_name, avatar)')
    .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false })

  const convMap = new Map()
  for (const msg of (msgs || [])) {
    const otherId = msg.sender_id === req.user.id ? msg.recipient_id : msg.sender_id
    const convId = buildConvId(req.user.id, otherId)
    if (!convMap.has(convId)) {
      const other = msg.sender_id === req.user.id ? msg.recipient : msg.sender
      convMap.set(convId, {
        id: convId,
        participants: [
          { id: req.user.id },
          { id: other?.id, firstName: other?.first_name, lastName: other?.last_name, avatar: other?.avatar },
        ],
        lastMessage: formatMsg(msg),
        unreadCount: 0,
        createdAt: msg.created_at,
        updatedAt: msg.created_at,
      })
    }
  }

  const { data: unread } = await supabase.from('messages')
    .select('sender_id')
    .eq('recipient_id', req.user.id)
    .eq('is_read', false)
  for (const u of (unread || [])) {
    const convId = buildConvId(req.user.id, u.sender_id)
    if (convMap.has(convId)) convMap.get(convId).unreadCount++
  }

  return res.json({ conversations: Array.from(convMap.values()) })
})

messagesRouter.get('/conversation/:conversationId', authenticate, async (req, res) => {
  const otherId = parseConvId(req.params.conversationId, req.user.id)
  if (!otherId) return res.status(400).json({ message: 'conversationId invalide' })
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 30)
  const { data: msgs, count } = await supabase.from('messages')
    .select('*', { count: 'exact' })
    .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${req.user.id})`)
    .order('created_at', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)
  await supabase.from('messages').update({ is_read: true })
    .eq('sender_id', otherId).eq('recipient_id', req.user.id)
  return res.json({
    data: (msgs || []).map(formatMsg),
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
})

// SSE global — notifie le destinataire de tout nouveau message reçu (toutes conversations)
messagesRouter.get('/stream', async (req, res) => {
  const token = req.query.token
  if (!token) return res.status(401).json({ message: 'Token manquant' })
  let userId
  try {
    const payload = verifyAccessToken(token)
    const { data: u } = await supabase.from('users').select('id').eq('id', payload.sub).single()
    if (!u) return res.status(401).json({ message: 'Utilisateur introuvable' })
    userId = u.id
  } catch {
    return res.status(401).json({ message: 'Token invalide' })
  }

  // Initialise lastId au max existant pour n'envoyer que les nouveaux messages
  let lastId = parseInt(req.query.lastId) || 0
  if (lastId === 0) {
    const { data: lastMsg } = await supabase.from('messages')
      .select('id').eq('recipient_id', userId)
      .order('id', { ascending: false }).limit(1).maybeSingle()
    lastId = lastMsg?.id ?? 0
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const interval = setInterval(async () => {
    const { data: newMsgs } = await supabase.from('messages')
      .select('*')
      .eq('recipient_id', userId)
      .gt('id', lastId)
      .order('id', { ascending: true })
    if (newMsgs?.length) {
      lastId = Math.max(...newMsgs.map(m => m.id))
      res.write(`data: ${JSON.stringify(newMsgs.map(formatMsg))}\n\n`)
    }
  }, 2000)

  req.on('close', () => clearInterval(interval))
})

// SSE par conversation — EventSource ne peut pas envoyer d'en-têtes, auth via ?token=
messagesRouter.get('/stream/:conversationId', async (req, res) => {
  const token = req.query.token
  if (!token) return res.status(401).json({ message: 'Token manquant' })
  let userId
  try {
    const payload = verifyAccessToken(token)
    const { data: u } = await supabase.from('users').select('id').eq('id', payload.sub).single()
    if (!u) return res.status(401).json({ message: 'Utilisateur introuvable' })
    userId = u.id
  } catch {
    return res.status(401).json({ message: 'Token invalide' })
  }

  const otherId = parseConvId(req.params.conversationId, userId)
  if (!otherId) return res.status(400).json({ message: 'conversationId invalide' })

  let lastId = parseInt(req.query.lastId) || 0

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const interval = setInterval(async () => {
    const { data: newMsgs } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
      .gt('id', lastId)
      .order('created_at', { ascending: true })
    if (newMsgs?.length) {
      lastId = Math.max(...newMsgs.map(m => m.id))
      res.write(`data: ${JSON.stringify(newMsgs.map(formatMsg))}\n\n`)
    }
  }, 2000)

  req.on('close', () => clearInterval(interval))
})

messagesRouter.post('/', authenticate, async (req, res) => {
  const { recipientId, content } = req.body
  if (!recipientId || !content?.trim()) return res.status(400).json({ message: 'recipientId et content requis' })
  if (String(recipientId) === String(req.user.id)) return res.status(400).json({ message: 'Impossible de vous envoyer un message' })
  const { data: msg, error } = await supabase.from('messages').insert({
    sender_id: req.user.id, recipient_id: Number(recipientId), content: content.trim(),
  }).select('*').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(formatMsg(msg))
})

// ═══════════════════════════════════════════════════════════
// FAVORIS
// ═══════════════════════════════════════════════════════════
export const favoritesRouter = Router()

favoritesRouter.get('/', authenticate, async (req, res) => {
  const { data } = await supabase.from('favorites').select('*, boats(id, title, images, city, port, price_per_day, average_rating, type, capacity)').eq('user_id', req.user.id)
  return res.json({ favorites: (data || []).map(f => ({ id: f.id, boatId: f.boat_id, boat: f.boats, createdAt: f.created_at })) })
})

favoritesRouter.get('/check/:boatId', authenticate, async (req, res) => {
  const { data } = await supabase.from('favorites').select('id').eq('user_id', req.user.id).eq('boat_id', req.params.boatId).single()
  return res.json({ isFavorite: !!data })
})

favoritesRouter.post('/', authenticate, async (req, res) => {
  const { boatId } = req.body
  if (!boatId) return res.status(400).json({ message: 'boatId requis' })
  const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', req.user.id).eq('boat_id', boatId).single()
  if (existing) return res.status(409).json({ message: 'Déjà dans les favoris' })

  const { data, error } = await supabase.from('favorites').insert({ user_id: req.user.id, boat_id: boatId }).select('*, boats(id, title, images, city, port, price_per_day)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json({ favorited: true, favorite: data })
})

favoritesRouter.delete('/:boatId', authenticate, async (req, res) => {
  await supabase.from('favorites').delete().eq('user_id', req.user.id).eq('boat_id', req.params.boatId)
  return res.json({ message: 'Retiré des favoris' })
})

// ═══════════════════════════════════════════════════════════
// DISPONIBILITÉS
// ═══════════════════════════════════════════════════════════
export const availabilityRouter = Router()

function addDaysStr(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function eachDateStr(from, to) {
  const dates = []
  let cur = from
  while (cur <= to) {
    dates.push(cur)
    cur = addDaysStr(cur, 1)
  }
  return dates
}

availabilityRouter.get('/:boatId', async (req, res) => {
  const boatId = req.params.boatId
  const today = new Date().toISOString().slice(0, 10)
  const from = req.query.from || today
  const to = req.query.to || addDaysStr(today, 180)

  const [{ data: blocks }, { data: bookings }] = await Promise.all([
    supabase
      .from('availabilities')
      .select('start_date, end_date, type')
      .eq('boat_id', boatId)
      .lte('start_date', to)
      .gte('end_date', from),
    supabase
      .from('bookings')
      .select('id, start_date, end_date')
      .eq('boat_id', boatId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .lt('start_date', to)
      .gt('end_date', from),
  ])

  const blockedSet = new Set()
  for (const block of blocks || []) {
    for (const d of eachDateStr(block.start_date, block.end_date)) {
      if (d >= from && d <= to) blockedSet.add(d)
    }
  }

  const bookedMap = new Map()
  for (const booking of bookings || []) {
    let cur = booking.start_date
    while (cur < booking.end_date) {
      if (cur >= from && cur <= to) bookedMap.set(cur, String(booking.id))
      cur = addDaysStr(cur, 1)
    }
  }

  const availability = eachDateStr(from, to).map((date) => {
    const bookingId = bookedMap.get(date) ?? null
    if (bookingId) {
      return { date, isAvailable: false, bookingId }
    }
    if (blockedSet.has(date)) {
      return { date, isAvailable: false, bookingId: null }
    }
    return { date, isAvailable: true, bookingId: null }
  })

  return res.json({ availability })
})

availabilityRouter.post('/:boatId', authenticate, async (req, res) => {
  const boatId = req.params.boatId
  const { dates, isAvailable } = req.body
  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ message: 'dates requis' })
  }

  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', boatId).single()
  if (!boat || (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  if (isAvailable) {
    for (const date of dates) {
      await supabase
        .from('availabilities')
        .delete()
        .eq('boat_id', boatId)
        .lte('start_date', date)
        .gte('end_date', date)
    }
  } else {
    const rows = dates.map((date) => ({
      boat_id: boatId,
      start_date: date,
      end_date: date,
      type: 'BLOCKED',
    }))
    const { error } = await supabase.from('availabilities').insert(rows)
    if (error) return res.status(500).json({ message: error.message })
  }

  return res.json({ message: 'Disponibilités mises à jour' })
})

availabilityRouter.post('/', authenticate, async (req, res) => {
  const { boatId, startDate, endDate, type } = req.body
  if (!boatId || !startDate || !endDate) return res.status(400).json({ message: 'boatId, startDate et endDate requis' })

  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', boatId).single()
  if (!boat || (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Accès refusé' })

  const { data, error } = await supabase.from('availabilities').insert({ boat_id: boatId, start_date: startDate, end_date: endDate, type: type || 'BLOCKED' }).select().single()
  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(data)
})

availabilityRouter.delete('/:id', authenticate, async (req, res) => {
  const { data: avail } = await supabase.from('availabilities').select('*, boats(owner_id)').eq('id', req.params.id).single()
  if (!avail || (avail.boats?.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Accès refusé' })
  await supabase.from('availabilities').delete().eq('id', req.params.id)
  return res.json({ message: 'Supprimé' })
})

// ═══════════════════════════════════════════════════════════
// PRIX SAISONNIERS
// ═══════════════════════════════════════════════════════════
export const seasonalPricesRouter = Router()

seasonalPricesRouter.get('/:boatId', async (req, res) => {
  const { data } = await supabase.from('seasonal_prices').select('*').eq('boat_id', req.params.boatId)
  return res.json({ data: data || [] })
})

seasonalPricesRouter.post('/', authenticate, async (req, res) => {
  const { boatId, startDate, endDate, pricePerDay, label } = req.body
  if (!boatId || !startDate || !endDate || !pricePerDay) return res.status(400).json({ message: 'Champs requis manquants' })
  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', boatId).single()
  if (!boat || (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Accès refusé' })
  const { data, error } = await supabase.from('seasonal_prices').insert({ boat_id: boatId, start_date: startDate, end_date: endDate, price_per_day: parseFloat(pricePerDay), label }).select().single()
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
// ADMIN
// ═══════════════════════════════════════════════════════════
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function formatAdminUser(u) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    role: u.role,
    phone: u.phone,
    avatar: u.avatar,
    bio: u.bio,
    sailingExperienceYears: u.sailing_experience_years,
    sailingQualifications: u.sailing_qualifications,
    sailingAreas: u.sailing_areas,
    sailorBio: u.sailor_bio,
    sailorCvStatus: u.sailor_cv_status || 'NOT_SUBMITTED',
    sailorCvDoc: u.sailor_cv_doc,
    sailorCvSubmittedAt: u.sailor_cv_submitted_at,
    sailorCvReviewedAt: u.sailor_cv_reviewed_at,
    sailorCvRejectionReason: u.sailor_cv_rejection_reason,
    kycVerified: Boolean(u.kyc_verified_at || u.kyc_status === 'APPROVED'),
    kycStatus: u.kyc_status || 'NOT_SUBMITTED',
    kycFrontDoc: u.kyc_front_doc || null,
    kycBackDoc: u.kyc_back_doc || null,
    kycSubmittedAt: u.kyc_submitted_at || null,
    kycReviewedAt: u.kyc_reviewed_at || u.kyc_verified_at || null,
    kycRejectionReason: u.kyc_rejection_reason || null,
    kycDocumentExpiresAt: u.kyc_document_expires_at || null,
    isActive: !u.is_blocked,
    emailVerifiedAt: u.email_verified_at,
    createdAt: u.created_at,
    boatsCount: u.boats_count ?? 0,
  }
}

function formatAdminBoat(b) {
  return {
    id: b.id,
    title: b.title,
    status: (b.status || 'draft').toUpperCase(),
    type: b.type,
    city: b.city,
    port: b.port,
    dailyRate: parseFloat(b.price_per_day || 0),
    ownerId: b.owner_id,
    images: b.images || [],
    rating: b.average_rating || 0,
    reviewCount: b.review_count || 0,
    createdAt: b.created_at,
    owner: b.users ? {
      id: b.users.id,
      firstName: b.users.first_name,
      lastName: b.users.last_name,
    } : null,
  }
}

function formatAdminBooking(b) {
  const days = b.start_date && b.end_date
    ? Math.round((new Date(b.end_date) - new Date(b.start_date)) / (1000 * 60 * 60 * 24))
    : 0
  return {
    id: b.id,
    boatId: b.boat_id,
    renterId: b.renter_id,
    startDate: b.start_date,
    endDate: b.end_date,
    totalDays: days,
    totalAmount: parseFloat(b.total_price || 0),
    status: b.status,
    stripePaymentIntentId: b.stripe_payment_intent_id,
    createdAt: b.created_at,
    boat: b.boats ? {
      id: b.boats.id,
      title: b.boats.title,
      images: b.boats.images,
      city: b.boats.city,
      port: b.boats.port,
    } : null,
    renter: b.renters ? {
      id: b.renters.id,
      firstName: b.renters.first_name,
      lastName: b.renters.last_name,
      email: b.renters.email,
    } : null,
    owner: b.owners ? {
      id: b.owners.id,
      firstName: b.owners.first_name,
      lastName: b.owners.last_name,
    } : null,
  }
}

function normalizeBoatStatus(status) {
  const map = {
    ACTIVE: 'active', PUBLISHED: 'active',
    INACTIVE: 'inactive', SUSPENDED: 'inactive',
    DRAFT: 'draft',
  }
  const key = String(status || '').toUpperCase()
  return map[key] || status
}

async function buildDashboardStats() {
  const year = new Date().getFullYear()
  const yearStart = `${year}-01-01`

  const [users, allBoats, activeBoats, bookings, allBookingsYear, reviews] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('boats').select('id', { count: 'exact', head: true }),
    supabase.from('boats').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('created_at, total_price, service_fee, status').gte('created_at', yearStart),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
  ])

  const paidStatuses = ['CONFIRMED', 'COMPLETED']
  const yearRows = allBookingsYear.data || []
  const totalRevenue = yearRows
    .filter((b) => paidStatuses.includes(b.status))
    .reduce((s, b) => s + parseFloat(b.total_price || 0), 0)
  const platformRevenue = yearRows
    .filter((b) => paidStatuses.includes(b.status))
    .reduce((s, b) => s + parseFloat(b.service_fee || 0), 0)

  const revenueByMonth = MONTH_LABELS.map((month, i) => {
    const monthBookings = yearRows.filter((b) => {
      const d = new Date(b.created_at)
      return d.getMonth() === i && paidStatuses.includes(b.status)
    })
    return {
      month,
      revenue: Math.round(monthBookings.reduce((s, b) => s + parseFloat(b.service_fee || 0), 0) * 100) / 100,
      bookings: monthBookings.length,
    }
  })

  return {
    totalUsers: users.count || 0,
    totalBoats: allBoats.count || 0,
    activeBoats: activeBoats.count || 0,
    totalBookings: bookings.count || 0,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    platformRevenue: Math.round(platformRevenue * 100) / 100,
    pendingReviews: reviews.count || 0,
    revenueByMonth,
    bookingsByMonth: revenueByMonth.map(({ month, bookings: count }) => ({ month, bookings: count })),
  }
}

export const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN'))

adminRouter.get('/dashboard', async (req, res) => {
  return res.json(await buildDashboardStats())
})

adminRouter.get('/stats', async (req, res) => {
  return res.json(await buildDashboardStats())
})

// ─── Utilisateurs ───────────────────────────────────────────
adminRouter.get('/users', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const search = (req.query.search || '').trim()
  const role = req.query.role

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }
  if (role) query = query.eq('role', role)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) return res.status(500).json({ message: error.message })

  const users = await Promise.all((data || []).map(async (u) => {
    const { count: boatsCount } = await supabase.from('boats').select('id', { count: 'exact', head: true }).eq('owner_id', u.id)
    return formatAdminUser({ ...u, boats_count: boatsCount || 0 })
  }))

  return res.json({ data: users, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
})

adminRouter.get('/users/:id', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

  const [{ count: boatsCount }, { count: bookingsCount }] = await Promise.all([
    supabase.from('boats').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('renter_id', user.id),
  ])

  return res.json(formatAdminUser({ ...user, boats_count: boatsCount || 0, bookings_count: bookingsCount || 0 }))
})

adminRouter.post('/users', async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body
  if (!firstName || !lastName || !email) return res.status(400).json({ message: 'Prénom, nom et email requis' })
  const normalizedEmail = email.toLowerCase().trim()
  const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('email', normalizedEmail)
  if (count > 0) return res.status(409).json({ message: 'Email déjà utilisé' })
  const assignedRole = ['RENTER', 'OWNER', 'ADMIN'].includes(role) ? role : 'RENTER'
  const rawPwd = (password || '').trim() || `Sail${Math.random().toString(36).slice(2, 8)}A1!`
  const hashedPassword = await bcrypt.hash(rawPwd, 12)
  const { data: newUser, error } = await supabase.from('users').insert({
    email: normalizedEmail, password: hashedPassword,
    first_name: firstName, last_name: lastName,
    role: assignedRole, phone: phone || null,
    terms_accepted_at: new Date().toISOString(),
  }).select('*').single()
  if (error) return res.status(500).json({ message: error.message })
  const verifToken = uuidv4()
  await supabase.from('email_verification_tokens').insert({
    token: verifToken, user_id: newUser.id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
  try { await sendEmailVerification(newUser.email, newUser.first_name, verifToken) } catch {}
  return res.status(201).json(formatAdminUser({ ...newUser, boats_count: 0 }))
})

adminRouter.patch('/users/:id/verify-email', async (req, res) => {
  const { data: user } = await supabase.from('users').select('id, email_verified_at').eq('id', req.params.id).single()
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })
  if (user.email_verified_at) return res.status(409).json({ message: 'Email déjà vérifié' })
  await supabase.from('users').update({ email_verified_at: new Date().toISOString() }).eq('id', req.params.id)
  await supabase.from('email_verification_tokens').delete().eq('user_id', req.params.id)
  return res.json({ message: 'Email vérifié' })
})

adminRouter.delete('/users/:id', async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' })
  const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
    .eq('renter_id', req.params.id).in('status', ['PENDING', 'CONFIRMED'])
  if (count > 0) return res.status(409).json({ message: `${count} réservation(s) active(s) — annulez-les d'abord` })
  const { error } = await supabase.from('users').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ message: 'Utilisateur supprimé' })
})

adminRouter.patch('/users/:id/block', async (req, res) => {
  const blocked = req.body.blocked ?? !req.body.isActive
  await supabase.from('users').update({ is_blocked: Boolean(blocked) }).eq('id', req.params.id)
  return res.json({ message: `Utilisateur ${blocked ? 'bloqué' : 'débloqué'}` })
})

const ROLE_HIERARCHY = { RENTER: 0, OWNER: 1, ADMIN: 2 }

// ── Rôles (CRUD) ───────────────────────────────────────────
adminRouter.get('/roles', async (req, res) => {
  const { data, error } = await supabase
    .from('roles').select('*')
    .order('is_system', { ascending: false })
    .order('created_at')
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ data: data || [] })
})

adminRouter.post('/roles', async (req, res) => {
  const { name, label, description, color } = req.body
  if (!name || !label) return res.status(400).json({ message: 'name et label requis' })
  const normalized = name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const { data, error } = await supabase.from('roles').insert({
    name: normalized, label, description: description || '', color: color || 'gray', is_system: false,
  }).select().single()
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ message: error.message })
  return res.status(201).json(data)
})

adminRouter.patch('/roles/:id', async (req, res) => {
  const { label, description, color } = req.body
  const updates = {}
  if (label !== undefined) updates.label = label
  if (description !== undefined) updates.description = description
  if (color !== undefined) updates.color = color
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Aucune modification' })
  const { data, error } = await supabase.from('roles').update(updates).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(data)
})

adminRouter.delete('/roles/:id', async (req, res) => {
  const { data: role } = await supabase.from('roles').select('is_system, name').eq('id', req.params.id).single()
  if (!role) return res.status(404).json({ message: 'Rôle introuvable' })
  if (role.is_system) return res.status(403).json({ message: 'Les rôles système ne peuvent pas être supprimés' })
  const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', role.name)
  if (count > 0) return res.status(409).json({ message: `${count} utilisateur(s) ont ce rôle — réattribuez-les d'abord` })
  await supabase.from('roles').delete().eq('id', req.params.id)
  return res.json({ message: 'Rôle supprimé' })
})

adminRouter.get('/role-stats', async (req, res) => {
  const [renters, owners, admins] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'RENTER'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'OWNER'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'ADMIN'),
  ])
  return res.json({ RENTER: renters.count || 0, OWNER: owners.count || 0, ADMIN: admins.count || 0 })
})

adminRouter.patch('/users/:id', async (req, res) => {
  const updates = {}
  const { firstName, lastName, email, phone, isActive, role } = req.body

  if (firstName !== undefined) updates.first_name = firstName
  if (lastName  !== undefined) updates.last_name  = lastName
  if (phone     !== undefined) updates.phone      = phone || null
  if (isActive  !== undefined) updates.is_blocked = !isActive

  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase().trim()
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true })
      .eq('email', normalizedEmail).neq('id', req.params.id)
    if (count > 0) return res.status(409).json({ message: 'Email déjà utilisé' })
    updates.email = normalizedEmail
  }

  if (role) {
    if (!['RENTER', 'OWNER', 'ADMIN'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' })
    if (String(req.params.id) === String(req.user.id) &&
        (ROLE_HIERARCHY[role] ?? 0) < (ROLE_HIERARCHY[req.user.role] ?? 0)) {
      return res.status(403).json({ message: 'Vous ne pouvez pas vous attribuer un rôle inférieur au vôtre' })
    }
    updates.role = role
  }

  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Aucune modification' })
  const { data: updated, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select('*').single()
  if (error) return res.status(500).json({ message: error.message })
  const { count: boatsCount } = await supabase.from('boats').select('id', { count: 'exact', head: true }).eq('owner_id', req.params.id)
  return res.json(formatAdminUser({ ...updated, boats_count: boatsCount || 0 }))
})

adminRouter.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['RENTER', 'OWNER', 'ADMIN'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' })
  await supabase.from('users').update({ role }).eq('id', req.params.id)
  return res.json({ message: 'Rôle mis à jour' })
})

adminRouter.patch('/users/:id/sailor-cv', async (req, res) => {
  const { status, rejectionReason } = req.body
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Statut invalide' })
  if (status === 'REJECTED' && !rejectionReason?.trim()) return res.status(400).json({ message: 'Motif de refus requis' })

  const reviewedAt = new Date().toISOString()
  const { error } = await supabase
    .from('users')
    .update({
      sailor_cv_status: status,
      sailor_cv_reviewed_at: reviewedAt,
      sailor_cv_rejection_reason: status === 'REJECTED' ? rejectionReason.trim() : null,
      updated_at: reviewedAt,
    })
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ message: error.message })
  return res.json({ message: status === 'APPROVED' ? 'CV marin approuvé' : 'CV marin refusé' })
})

// ─── Bateaux ────────────────────────────────────────────────
adminRouter.get('/boats', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const search = (req.query.search || '').trim()
  const status = req.query.status ? normalizeBoatStatus(req.query.status) : null

  let query = supabase
    .from('boats')
    .select('*, users!owner_id(id, first_name, last_name)', { count: 'exact' })

  if (search) query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%`)
  if (status) query = query.eq('status', status)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  return res.json({
    data: (data || []).map(formatAdminBoat),
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
})

adminRouter.patch('/boats/:id/status', async (req, res) => {
  const status = normalizeBoatStatus(req.body.status)
  if (!['active', 'inactive', 'draft'].includes(status)) return res.status(400).json({ message: 'Statut invalide' })
  await supabase.from('boats').update({ status }).eq('id', req.params.id)
  return res.json({ message: 'Statut mis à jour' })
})

adminRouter.patch('/boats/:id/moderate', async (req, res) => {
  const status = normalizeBoatStatus(req.body.status)
  if (!['active', 'inactive', 'draft'].includes(status)) return res.status(400).json({ message: 'Statut invalide' })
  await supabase.from('boats').update({ status }).eq('id', req.params.id)
  return res.json({ message: 'Statut mis à jour' })
})

adminRouter.delete('/boats/:id', async (req, res) => {
  const { error } = await supabase.from('boats').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ message: 'Annonce supprimée' })
})

// ─── Réservations ───────────────────────────────────────────
adminRouter.get('/bookings', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const status = req.query.status

  let query = supabase
    .from('bookings')
    .select('*, boats(id, title, images, city, port, owner_id, users!owner_id(id, first_name, last_name)), renters:users!renter_id(id, first_name, last_name, email)', { count: 'exact' })

  if (status) query = query.eq('status', status)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const formatted = (data || []).map((b) => {
    const owners = b.boats?.users
    return formatAdminBooking({ ...b, owners })
  })

  return res.json({ data: formatted, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
})

adminRouter.get('/bookings/:id', async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, boats(id, title, images, city, port, owner_id, users!owner_id(id, first_name, last_name, email)), renters:users!renter_id(id, first_name, last_name, email, phone)')
    .eq('id', req.params.id)
    .single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  return res.json(formatAdminBooking({ ...booking, owners: booking.boats?.users }))
})

adminRouter.patch('/bookings/:id/status', async (req, res) => {
  const { status } = req.body
  const valid = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'DISPUTED']
  if (!valid.includes(status)) return res.status(400).json({ message: 'Statut invalide' })

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, boats(id, title, images, city, port, users!owner_id(id, first_name, last_name)), renters:users!renter_id(id, first_name, last_name, email)')
    .single()

  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatAdminBooking({ ...updated, owners: updated.boats?.users }))
})

// ─── Signalements ───────────────────────────────────────────
adminRouter.get('/reports', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 15)
  const status = req.query.status

  let query = supabase.from('reports').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const reports = await Promise.all((data || []).map(async (r) => {
    let boatTitle = '—'
    let reporterName = '—'
    if (r.target_type === 'boat' || r.target_type === 'BOAT') {
      const { data: boat } = await supabase.from('boats').select('title').eq('id', r.target_id).single()
      boatTitle = boat?.title || `Bateau #${r.target_id}`
    }
    const { data: reporter } = await supabase.from('users').select('first_name, last_name').eq('id', r.reporter_id).single()
    if (reporter) reporterName = `${reporter.first_name} ${reporter.last_name}`

    // Normalise les statuts legacy (resolved → PROCESSED, dismissed → DISMISSED, etc.)
    const STATUS_MAP = { resolved: 'PROCESSED', dismissed: 'DISMISSED', pending: 'PENDING' }
    const rawStatus = (r.status || '').toLowerCase()
    const normalizedStatus = STATUS_MAP[rawStatus] || (r.status || 'PENDING').toUpperCase()

    return {
      id: r.id,
      boatId: r.target_type === 'boat' || r.target_type === 'BOAT' ? Number(r.target_id) : null,
      boatTitle,
      targetType: r.target_type,
      targetId: r.target_id,
      reporterId: r.reporter_id,
      reporterName,
      reason: r.reason,
      details: r.description,
      status: normalizedStatus,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      processedAt: r.processed_at,
    }
  }))

  return res.json({ data: reports, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
})

adminRouter.patch('/reports/:id', async (req, res) => {
  const { status, adminNote } = req.body
  const updates = { processed_at: new Date().toISOString() }
  if (status) updates.status = status
  if (adminNote !== undefined) updates.admin_note = adminNote

  const { data, error } = await supabase.from('reports').update(updates).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ message: 'Signalement mis à jour', id: data.id })
})

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════
export const reportsRouter = Router()

reportsRouter.post('/', authenticate, async (req, res) => {
  const { targetType, targetId, reason, description } = req.body
  if (!targetType || !targetId || !reason) return res.status(400).json({ message: 'targetType, targetId et reason requis' })
  const { data, error } = await supabase.from('reports').insert({ reporter_id: req.user.id, target_type: targetType, target_id: String(targetId), reason, description }).select().single()
  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(data)
})

// ═══════════════════════════════════════════════════════════
// HEALTH + SEO
// ═══════════════════════════════════════════════════════════
export const healthRouter = Router()
healthRouter.get('/', async (req, res) => {
  const { error } = await supabase.from('users').select('id').limit(1)
  return res.json({ status: error ? 'degraded' : 'ok', timestamp: new Date().toISOString() })
})

export const seoRouter = Router()
seoRouter.get('/sitemap.xml', async (req, res) => {
  const { data: boats } = await supabase.from('boats').select('id, updated_at').eq('status', 'active').limit(1000)
  const frontUrl = process.env.FRONTEND_URL || 'https://sailingloc.fr'
  const urls = [
    `<url><loc>${frontUrl}/</loc><priority>1.0</priority></url>`,
    `<url><loc>${frontUrl}/bateaux</loc><priority>0.9</priority></url>`,
    ...(boats || []).map(b => `<url><loc>${frontUrl}/bateaux/${b.id}</loc><priority>0.8</priority></url>`),
  ]
  res.header('Content-Type', 'application/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`)
})
seoRouter.get('/robots.txt', (req, res) => {
  const frontUrl = process.env.FRONTEND_URL || 'https://sailingloc.fr'
  res.header('Content-Type', 'text/plain')
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nSitemap: ${frontUrl}/sitemap.xml`)
})

// ═══════════════════════════════════════════════════════════
// STRIPE WEBHOOK
// ═══════════════════════════════════════════════════════════
export const stripeWebhookRouter = Router()
import Stripe from 'stripe'

stripeWebhookRouter.post('/webhook', (req, res, next) => {
  let data = ''
  req.setEncoding('utf8')
  req.on('data', chunk => { data += chunk })
  req.on('end', async () => {
    if (!process.env.STRIPE_SECRET_KEY) return res.json({ received: true })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    let event
    try {
      event = stripe.webhooks.constructEvent(data, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
      return res.status(400).send('Webhook invalide')
    }
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object
      if (pi.metadata?.bookingId) {
        await supabase.from('bookings').update({ status: 'CONFIRMED', stripe_payment_intent_id: pi.id }).eq('id', pi.metadata.bookingId).eq('status', 'PENDING')
      }
    }
    return res.json({ received: true })
  })
})