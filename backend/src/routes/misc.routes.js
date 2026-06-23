import { Router } from 'express'
import jwt from 'jsonwebtoken'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

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
  const { data, count } = await supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', req.user.id).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
  return res.json({ notifications: data || [], unreadCount: count || 0, pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } })
})

notificationsRouter.patch('/:id/read', authenticate, async (req, res) => {
  const { data } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
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
  if (!bookingId || !type || !rating) return res.status(400).json({ message: 'bookingId, type et rating requis' })
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
    type, rating, comment: comment?.trim() ?? '',
  }).select().single()

  if (error) { console.error('[reviews insert]', error.message, error.details); return res.status(500).json({ message: error.message }) }

  if (type === 'RENTER_TO_BOAT' && booking.boat_id) {
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('boat_id', booking.boat_id).eq('type', 'RENTER_TO_BOAT').eq('is_published', true)
    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await supabase.from('boats').update({ average_rating: Math.round(avg * 10) / 10, review_count: allReviews.length }).eq('id', booking.boat_id)
    }
  }
  return res.status(201).json(review)
})

reviewsRouter.get('/mine', authenticate, async (req, res) => {
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, booking_id')
    .eq('author_id', req.user.id)
  const reviews = data || []
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null
  return res.json({
    count: reviews.length,
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    bookingIds: reviews.map((r) => r.booking_id),
  })
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

reviewsRouter.get('/admin/stats', authenticate, requireRole('ADMIN'), async (req, res) => {
  const [total, hidden, published] = await Promise.all([
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('reviews').select('rating').eq('is_published', true),
  ])
  const ratings = (published.data || []).map((r) => r.rating)
  const avgRating = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : null
  return res.json({
    total: total.count || 0,
    hiddenCount: hidden.count || 0,
    avgRating,
  })
})

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

  const updates = { is_published: isPublished }
  if (adminNote !== undefined) updates.admin_note = adminNote || null

  const { data, error } = await supabase.from('reviews').update(updates).eq('id', req.params.id).select().single()
  if (error) { console.error('[reviews patch]', error.message); return res.status(500).json({ message: error.message }) }

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

function convKey(u1, u2) {
  return `${Math.min(u1, u2)}-${Math.max(u1, u2)}`
}

function parseKey(key) {
  const parts = (key || '').split('-').map(Number)
  if (parts.length !== 2 || !parts[0] || !parts[1] || isNaN(parts[0]) || isNaN(parts[1])) return null
  return parts
}

function fmtMsg(msg, key) {
  const out = {
    id: msg.id,
    conversationId: key,
    senderId: msg.sender_id,
    content: msg.content,
    isRead: msg.is_read ?? true,
    createdAt: msg.created_at,
  }
  if ('boat_id' in msg) out.boatId = msg.boat_id ?? null
  return out
}

messagesRouter.get('/unread-count', authenticate, async (req, res) => {
  const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', req.user.id).eq('is_read', false)
  return res.json({ count: count || 0 })
})

messagesRouter.get('/conversations', authenticate, async (req, res) => {
  const userId = req.user.id

  const { data: msgs } = await supabase.from('messages')
    .select('*, sender:users!sender_id(id, first_name, last_name, avatar), recipient:users!recipient_id(id, first_name, last_name, avatar)')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  const convMap = new Map()
  for (const msg of (msgs || [])) {
    const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
    const key = convKey(userId, otherId)
    if (!convMap.has(key)) {
      const other = msg.sender_id === userId ? msg.recipient : msg.sender
      convMap.set(key, { key, other, lastMsg: msg, allMsgs: [msg] })
    } else {
      convMap.get(key).allMsgs.push(msg)
    }
  }

  const conversations = []
  for (const [key, conv] of convMap) {
    const unreadCount = conv.allMsgs.filter(m => m.recipient_id === userId && !m.is_read).length
    const o = conv.other
    conversations.push({
      id: key,
      participants: [
        { id: userId },
        o ? { id: o.id, firstName: o.first_name, lastName: o.last_name, avatar: o.avatar } : null,
      ].filter(Boolean),
      lastMessage: {
        id: conv.lastMsg.id,
        conversationId: key,
        senderId: conv.lastMsg.sender_id,
        content: conv.lastMsg.content,
        isRead: conv.lastMsg.is_read,
        boatId: conv.lastMsg.boat_id ?? null,
        createdAt: conv.lastMsg.created_at,
      },
      unreadCount,
      createdAt: conv.lastMsg.created_at,
      updatedAt: conv.lastMsg.created_at,
    })
  }

  conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return res.json({ conversations })
})

messagesRouter.get('/conversation/:key', authenticate, async (req, res) => {
  const users = parseKey(req.params.key)
  if (!users) return res.status(400).json({ message: 'Clé de conversation invalide' })
  const [u1, u2] = users
  if (req.user.id !== u1 && req.user.id !== u2) return res.status(403).json({ message: 'Accès refusé' })

  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 30)

  const { data, count } = await supabase.from('messages')
    .select('*', { count: 'exact' })
    .or(`and(sender_id.eq.${u1},recipient_id.eq.${u2}),and(sender_id.eq.${u2},recipient_id.eq.${u1})`)
    .order('created_at', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  // Mark incoming messages as read
  const otherId = req.user.id === u1 ? u2 : u1
  await supabase.from('messages').update({ is_read: true })
    .eq('sender_id', otherId).eq('recipient_id', req.user.id).eq('is_read', false)

  const key = req.params.key
  const total = count || 0
  return res.json({ data: (data || []).map(m => fmtMsg(m, key)), page, limit, total, totalPages: Math.ceil(total / limit) })
})

messagesRouter.get('/stream/:key', async (req, res) => {
  const token = req.query.token
  if (!token) return res.status(401).end()

  let userId
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    userId = decoded.sub ?? decoded.id ?? decoded.userId
    if (!userId) throw new Error('no id in token')
  } catch {
    return res.status(401).end()
  }

  const users = parseKey(req.params.key)
  if (!users) return res.status(400).end()
  const [u1, u2] = users
  if (userId !== u1 && userId !== u2) return res.status(403).end()

  let lastId = parseInt(req.query.lastId || '0')
  let closed = false

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  res.write(': connected\n\n')

  req.on('close', () => { closed = true })

  const POLL_MS  = 2000
  const MAX_MS   = 28000
  let elapsed    = 0
  const key      = req.params.key

  const poll = async () => {
    if (closed || res.writableEnded) return
    try {
      const { data } = await supabase.from('messages')
        .select('*')
        .or(`and(sender_id.eq.${u1},recipient_id.eq.${u2}),and(sender_id.eq.${u2},recipient_id.eq.${u1})`)
        .gt('id', lastId)
        .order('id', { ascending: true })

      if (data?.length) {
        lastId = Math.max(...data.map(m => m.id))
        res.write(`data: ${JSON.stringify(data.map(m => fmtMsg(m, key)))}\n\n`)
      }
    } catch { /* poll error silencieux */ }

    elapsed += POLL_MS
    if (!closed && elapsed < MAX_MS) {
      setTimeout(poll, POLL_MS)
    } else if (!res.writableEnded) {
      res.end()
    }
  }

  setTimeout(poll, POLL_MS)
})

messagesRouter.post('/', authenticate, async (req, res) => {
  const { recipientId, receiverId, content, boatId } = req.body
  const targetId = recipientId ?? receiverId
  if (!targetId || !content?.trim()) return res.status(400).json({ message: 'recipientId et content requis' })
  if (String(targetId) === String(req.user.id)) return res.status(400).json({ message: 'Impossible de vous envoyer un message' })

  const insertData = { sender_id: req.user.id, recipient_id: targetId, content: content.trim() }
  if (boatId != null) insertData.boat_id = boatId

  const { data: msg, error } = await supabase.from('messages').insert(insertData).select().single()

  if (error) return res.status(500).json({ message: error.message })

  const key = convKey(req.user.id, Number(targetId))
  return res.status(201).json(fmtMsg(msg, key))
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

availabilityRouter.get('/:boatId', async (req, res) => {
  const { boatId } = req.params
  const from = req.query.from || new Date().toISOString().slice(0, 10)
  const to   = req.query.to   || new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [{ data: periods }, { data: bookings }] = await Promise.all([
    supabase.from('availabilities').select('start_date, end_date')
      .eq('boat_id', boatId).lte('start_date', to).gte('end_date', from),
    supabase.from('bookings').select('id, start_date, end_date')
      .eq('boat_id', boatId).in('status', ['CONFIRMED', 'PENDING'])
      .lte('start_date', to).gte('end_date', from),
  ])

  const dateMap = new Map()

  for (const p of (periods || [])) {
    const end = new Date(p.end_date)
    for (let d = new Date(p.start_date); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      if (key >= from && key <= to) dateMap.set(key, { isAvailable: false, bookingId: null })
    }
  }

  for (const b of (bookings || [])) {
    const end = new Date(b.end_date)
    for (let d = new Date(b.start_date); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      if (key >= from && key <= to) dateMap.set(key, { isAvailable: false, bookingId: String(b.id) })
    }
  }

  return res.json({
    availability: Array.from(dateMap, ([date, info]) => ({ date, ...info })),
  })
})

availabilityRouter.post('/:boatId', authenticate, async (req, res) => {
  const { boatId } = req.params
  const { dates, isAvailable } = req.body
  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ message: 'dates requis' })
  }

  const { data: boat } = await supabase.from('boats').select('owner_id').eq('id', boatId).single()
  if (!boat || (boat.owner_id !== req.user.id && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  await supabase.from('availabilities').delete().eq('boat_id', boatId).in('start_date', dates)

  if (!isAvailable) {
    const records = dates.map((date) => ({ boat_id: Number(boatId), start_date: date, end_date: date, type: 'BLOCKED' }))
    const { error } = await supabase.from('availabilities').insert(records)
    if (error) return res.status(500).json({ message: error.message })
  }

  return res.json({ message: 'Disponibilités mises à jour' })
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

adminRouter.get('/users', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const search = (req.query.search || '').trim()
  const role = req.query.role

  let query = supabase
    .from('users')
    .select('id, email, role, first_name, last_name, phone, avatar, bio, is_blocked, email_verified_at, created_at', { count: 'exact' })

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }
  if (role) query = query.eq('role', role)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const users = await Promise.all((data || []).map(async (u) => {
    const { count: boatsCount } = await supabase.from('boats').select('id', { count: 'exact', head: true }).eq('owner_id', u.id)
    return formatAdminUser({ ...u, boats_count: boatsCount || 0 })
  }))

  return res.json({ data: users, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
})

adminRouter.get('/users/:id', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, role, first_name, last_name, phone, avatar, bio, is_blocked, email_verified_at, created_at')
    .eq('id', req.params.id)
    .single()
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

  const [{ count: boatsCount }, { count: bookingsCount }] = await Promise.all([
    supabase.from('boats').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('renter_id', user.id),
  ])

  return res.json(formatAdminUser({ ...user, boats_count: boatsCount || 0, bookings_count: bookingsCount || 0 }))
})

adminRouter.patch('/users/:id/block', async (req, res) => {
  const blocked = req.body.blocked ?? !req.body.isActive
  await supabase.from('users').update({ is_blocked: Boolean(blocked) }).eq('id', req.params.id)
  return res.json({ message: `Utilisateur ${blocked ? 'bloqué' : 'débloqué'}` })
})

adminRouter.patch('/users/:id', async (req, res) => {
  const updates = {}
  if (req.body.isActive !== undefined) updates.is_blocked = !req.body.isActive
  if (req.body.role) {
    if (!['RENTER', 'OWNER', 'ADMIN'].includes(req.body.role)) return res.status(400).json({ message: 'Rôle invalide' })
    updates.role = req.body.role
  }
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Aucune modification' })
  await supabase.from('users').update(updates).eq('id', req.params.id)
  return res.json({ message: 'Utilisateur mis à jour' })
})

adminRouter.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['RENTER', 'OWNER', 'ADMIN'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' })
  await supabase.from('users').update({ role }).eq('id', req.params.id)
  return res.json({ message: 'Rôle mis à jour' })
})

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

const TO_DB_STATUS   = { PENDING: 'pending', PROCESSED: 'resolved', DISMISSED: 'dismissed' }
const FROM_DB_STATUS = { pending: 'PENDING', resolved: 'PROCESSED', dismissed: 'DISMISSED' }

adminRouter.get('/reports', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 15)
  const status = req.query.status

  let query = supabase.from('reports').select('*', { count: 'exact' })
  if (status) query = query.eq('status', TO_DB_STATUS[status] || status.toLowerCase())

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
      status: FROM_DB_STATUS[r.status] || 'PENDING',
      adminNote: r.admin_note,
      createdAt: r.created_at,
      processedAt: r.processed_at,
    }
  }))

  return res.json({ data: reports, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
})

adminRouter.patch('/reports/:id', async (req, res) => {
  const { status, adminNote } = req.body
  const updates = {}
  if (status) updates.status = TO_DB_STATUS[status] || status.toLowerCase()
  if (adminNote !== undefined) updates.admin_note = adminNote

  const { error } = await supabase.from('reports').update(updates).eq('id', req.params.id)
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ message: 'Signalement mis à jour' })
})

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════
export const reportsRouter = Router()

reportsRouter.post('/', authenticate, async (req, res) => {
  const { targetType, targetId, reason, description } = req.body
  if (!targetType || !targetId || !reason) return res.status(400).json({ message: 'targetType, targetId et reason requis' })
  const { error } = await supabase.from('reports').insert({
    reporter_id: req.user.id,
    target_type: targetType.toLowerCase(),
    target_id: String(targetId),
    reason,
    description: description ?? null,
    status: 'pending',
  })
  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json({ message: 'Signalement créé' })
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