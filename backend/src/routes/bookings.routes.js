import { Router } from 'express'
import Stripe from 'stripe'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'
import { sendBookingNotification } from '../services/email.service.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10')

// ─── Helper ────────────────────────────────────────────────
function formatBooking(b) {
  return {
    id: b.id,
    status: b.status,
    startDate: b.start_date,
    endDate: b.end_date,
    totalPrice: b.total_price,
    serviceFee: b.service_fee,
    withSkipper: b.with_skipper,
    skipperFee: b.skipper_fee,
    cancellationReason: b.cancellation_reason,
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
      avatar: b.renters.avatar,
    } : null,
  }
}

/** Calcule le prix total en tenant compte des prix saisonniers */
async function calculatePrice(boat, startDate, endDate, withSkipper) {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  const days  = Math.round((end - start) / (1000 * 60 * 60 * 24))
  if (days <= 0) throw new Error('Dates invalides')

  // Prix saisonniers
  const { data: seasonal } = await supabase
    .from('seasonal_prices')
    .select('*')
    .eq('boat_id', boat.id)
    .lte('start_date', end.toISOString().slice(0, 10))
    .gte('end_date', start.toISOString().slice(0, 10))

  let basePrice = 0
  for (let d = 0; d < days; d++) {
    const date = new Date(start)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().slice(0, 10)
    const match = (seasonal || []).find(s => s.start_date <= dateStr && s.end_date >= dateStr)
    basePrice += match ? parseFloat(match.price_per_day) : parseFloat(boat.price_per_day)
  }

  const skipperFee  = (withSkipper && boat.with_skipper && boat.skipper_price) ? parseFloat(boat.skipper_price) * days : 0
  const serviceFee  = Math.round(basePrice * PLATFORM_FEE_PERCENT) / 100
  const totalPrice  = basePrice + skipperFee + serviceFee

  return { basePrice, skipperFee, serviceFee, totalPrice, days }
}

// ─── POST /bookings ────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const user = req.user
  const { boatId, startDate, endDate, withSkipper } = req.body

  if (!boatId || !startDate || !endDate) {
    return res.status(400).json({ message: 'boatId, startDate et endDate sont requis' })
  }

  const { data: boat } = await supabase.from('boats').select('*').eq('id', boatId).single()
  if (!boat) return res.status(404).json({ message: 'Bateau introuvable' })
  if (boat.status !== 'active') return res.status(400).json({ message: 'Ce bateau n\'est pas disponible à la réservation' })
  if (boat.owner_id === user.id) return res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre bateau' })

  const start = new Date(startDate)
  const end   = new Date(endDate)
  if (isNaN(start) || isNaN(end)) return res.status(400).json({ message: 'Dates invalides' })
  if (start >= end) return res.status(400).json({ message: 'La date de fin doit être après la date de début' })
  if (start < new Date()) return res.status(400).json({ message: 'Impossible de réserver dans le passé' })

  // Vérifier disponibilité
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('boat_id', boatId)
    .in('status', ['PENDING', 'CONFIRMED'])
    .lt('start_date', endDate)
    .gt('end_date', startDate)

  if (existingBookings && existingBookings.length > 0) {
    return res.status(409).json({ message: 'Ces dates ne sont plus disponibles' })
  }

  // Vérifier disponibilités propriétaire
  const { data: blocked } = await supabase
    .from('availabilities')
    .select('id')
    .eq('boat_id', boatId)
    .eq('type', 'BLOCKED')
    .lt('start_date', endDate)
    .gt('end_date', startDate)

  if (blocked && blocked.length > 0) {
    return res.status(409).json({ message: 'Ces dates sont bloquées par le propriétaire' })
  }

  let pricing
  try { pricing = await calculatePrice(boat, startDate, endDate, Boolean(withSkipper)) }
  catch (e) { return res.status(400).json({ message: e.message }) }

  const { data: booking, error } = await supabase.from('bookings').insert({
    boat_id: boatId,
    renter_id: user.id,
    start_date: startDate,
    end_date: endDate,
    with_skipper: Boolean(withSkipper),
    skipper_fee: pricing.skipperFee,
    service_fee: pricing.serviceFee,
    total_price: pricing.totalPrice,
    status: 'PENDING',
  }).select('*, boats(id, title, images, city, port, owner_id)').single()

  if (error) return res.status(500).json({ message: error.message })

  // Notifier le propriétaire
  try {
    const { data: owner } = await supabase.from('users').select('email, first_name').eq('id', boat.owner_id).single()
    if (owner) {
      await sendBookingNotification(owner.email, owner.first_name, {
        type: 'new_request',
        boatTitle: boat.title,
        startDate,
        endDate,
      })
    }
  } catch {}

  return res.status(201).json(formatBooking(booking))
})

// ─── POST /bookings/:id/payment-intent ────────────────────
router.post('/:id/payment-intent', authenticate, async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, boats(title)')
    .eq('id', req.params.id)
    .single()

  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  if (booking.renter_id !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })
  if (booking.status !== 'PENDING') return res.status(400).json({ message: 'Statut invalide pour le paiement' })

  const { data: renter } = await supabase.from('users').select('email').eq('id', req.user.id).single()

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(booking.total_price * 100),
    currency: 'eur',
    metadata: { bookingId: String(booking.id) },
    receipt_email: renter?.email,
    description: `SailingLoc – ${booking.boats?.title || 'Réservation'}`,
  })

  return res.json({ clientSecret: intent.client_secret, bookingId: booking.id, amount: booking.total_price })
})

// ─── POST /bookings/confirm-payment ───────────────────────
router.post('/confirm-payment', authenticate, async (req, res) => {
  const { bookingId, paymentIntentId } = req.body
  if (!bookingId || !paymentIntentId) return res.status(400).json({ message: 'bookingId et paymentIntentId requis' })

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, boats(title, owner_id)')
    .eq('id', bookingId)
    .single()

  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  if (booking.renter_id !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (intent.status !== 'succeeded' && intent.status !== 'processing') {
    return res.status(400).json({ message: 'Paiement non confirmé côté Stripe' })
  }

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      status: 'CONFIRMED',
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select('*, boats(id, title, images, city, port, owner_id)').single()

  if (error) return res.status(500).json({ message: error.message })

  // Notifier les deux parties
  try {
    const { data: renter } = await supabase.from('users').select('email, first_name').eq('id', booking.renter_id).single()
    const { data: owner }  = await supabase.from('users').select('email, first_name').eq('id', booking.boats?.owner_id).single()
    const boatTitle = booking.boats?.title || ''
    if (renter) await sendBookingNotification(renter.email, renter.first_name, { type: 'confirmed', boatTitle, startDate: booking.start_date, endDate: booking.end_date })
    if (owner)  await sendBookingNotification(owner.email,  owner.first_name,  { type: 'confirmed', boatTitle, startDate: booking.start_date, endDate: booking.end_date })
  } catch {}

  return res.json(formatBooking(updated))
})

// ─── GET /bookings/my (renter) ─────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 10)

  const { data, count, error } = await supabase
    .from('bookings')
    .select('*, boats(id, title, images, city, port)', { count: 'exact' })
    .eq('renter_id', req.user.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) return res.status(500).json({ message: error.message })
  return res.json({ items: (data || []).map(formatBooking), total: count || 0, page, limit })
})

// ─── GET /bookings/owner (propriétaire) ───────────────────
router.get('/owner', authenticate, requireRole('OWNER', 'ADMIN'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 10)

  // Récupérer les bateaux du propriétaire
  const { data: myBoats } = await supabase.from('boats').select('id').eq('owner_id', req.user.id)
  const boatIds = (myBoats || []).map(b => b.id)
  if (boatIds.length === 0) return res.json({ items: [], total: 0, page, limit })

  const { data, count, error } = await supabase
    .from('bookings')
    .select('*, boats(id, title, images, city, port), renters:users!renter_id(id, first_name, last_name, avatar)', { count: 'exact' })
    .in('boat_id', boatIds)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) return res.status(500).json({ message: error.message })
  return res.json({ items: (data || []).map(formatBooking), total: count || 0, page, limit })
})

// ─── GET /bookings/:id ─────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, boats(*, users(id, first_name, last_name, avatar)), renters:users!renter_id(id, first_name, last_name, avatar)')
    .eq('id', req.params.id)
    .single()

  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id
  const isAdmin  = req.user.role === 'ADMIN'

  if (!isRenter && !isOwner && !isAdmin) return res.status(403).json({ message: 'Accès refusé' })

  return res.json(formatBooking(booking))
})

// ─── PATCH /bookings/:id/status ────────────────────────────
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status, cancellationReason } = req.body
  const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'DISPUTED']
  if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Statut invalide' })

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, boats(owner_id, title)')
    .eq('id', req.params.id).single()

  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id
  const isAdmin  = req.user.role === 'ADMIN'

  if (!isRenter && !isOwner && !isAdmin) return res.status(403).json({ message: 'Accès refusé' })

  const updates = { status, updated_at: new Date().toISOString() }
  if (cancellationReason) updates.cancellation_reason = cancellationReason

  const { data: updated, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', req.params.id)
    .select('*, boats(id, title, images, city, port)').single()

  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBooking(updated))
})

export default router
