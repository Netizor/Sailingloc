import { Router } from 'express'
import Stripe from 'stripe'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10')

function formatBooking(b) {
  return {
    id: b.id,
    boatId: b.boat_id,
    renterId: b.renter_id,
    startDate: b.start_date,
    endDate: b.end_date,
    withSkipper: b.with_skipper,
    platformFee: b.service_fee,
    depositAmount: b.deposit_amount,
    totalAmount: b.total_price,
    status: b.status,
    cancellationReason: b.cancellation_reason,
    stripePaymentIntentId: b.stripe_payment_intent_id,
    createdAt: b.created_at,
    boat: b.boats ? {
      id: b.boats.id,
      title: b.boats.title,
      images: b.boats.images,
      city: b.boats.city,
      port: b.boats.port,
      dailyRate: b.boats.price_per_day,
    } : null,
    renter: b.renters ? {
      id: b.renters.id,
      firstName: b.renters.first_name,
      lastName: b.renters.last_name,
      avatar: b.renters.avatar,
    } : null,
  }
}

async function calculatePrice(boat, startDate, endDate, withSkipper) {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  const days  = Math.round((end - start) / (1000 * 60 * 60 * 24))
  if (days <= 0) throw new Error('Dates invalides')

  const basePrice  = parseFloat(boat.price_per_day) * days
  const skipperFee = (withSkipper && boat.with_skipper && boat.skipper_price) ? parseFloat(boat.skipper_price) * days : 0
  const serviceFee = Math.round(basePrice * PLATFORM_FEE_PERCENT) / 100
  const totalPrice = basePrice + skipperFee + serviceFee

  return { basePrice, skipperFee, serviceFee, totalPrice, days }
}

// ─── POST /bookings ────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { boatId, startDate, endDate, withSkipper } = req.body
  if (!boatId || !startDate || !endDate) return res.status(400).json({ message: 'boatId, startDate et endDate requis' })

  const { data: boat } = await supabase.from('boats').select('*').eq('id', boatId).single()
  if (!boat) return res.status(404).json({ message: 'Bateau introuvable' })
  if (boat.status !== 'active') return res.status(400).json({ message: 'Ce bateau n\'est pas disponible' })
  if (boat.owner_id === req.user.id) return res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre bateau' })

  const start = new Date(startDate)
  const end   = new Date(endDate)
  if (isNaN(start) || isNaN(end) || start >= end) return res.status(400).json({ message: 'Dates invalides' })

  const { data: conflict } = await supabase.from('bookings').select('id').eq('boat_id', boatId).in('status', ['PENDING','CONFIRMED']).lt('start_date', endDate).gt('end_date', startDate)
  if (conflict && conflict.length > 0) return res.status(409).json({ message: 'Ces dates ne sont plus disponibles' })

  let pricing
  try { pricing = await calculatePrice(boat, startDate, endDate, Boolean(withSkipper)) }
  catch (e) { return res.status(400).json({ message: e.message }) }

  const { data: booking, error } = await supabase.from('bookings').insert({
    boat_id: boatId,
    renter_id: req.user.id,
    start_date: startDate,
    end_date: endDate,
    with_skipper: Boolean(withSkipper),
    skipper_fee: pricing.skipperFee,
    service_fee: pricing.serviceFee,
    total_price: pricing.totalPrice,
    status: 'PENDING',
  }).select('*, boats(id, title, images, city, port, price_per_day)').single()

  if (error) return res.status(500).json({ message: error.message })
  return res.status(201).json(formatBooking(booking))
})

// ─── GET /bookings/renter ──────────────────────────────────
router.get('/renter', authenticate, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 10)

  let query = supabase.from('bookings')
    .select('*, boats(id, title, images, city, port, price_per_day)', { count: 'exact' })
    .eq('renter_id', req.user.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (req.query.status) query = query.eq('status', req.query.status)

  const { data, count, error } = await query
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ data: (data || []).map(formatBooking), total: count || 0, page, limit })
})

// ─── GET /bookings/owner ───────────────────────────────────
router.get('/owner', authenticate, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, parseInt(req.query.limit) || 10)

  const { data: myBoats } = await supabase.from('boats').select('id').eq('owner_id', req.user.id)
  const boatIds = (myBoats || []).map(b => b.id)
  if (boatIds.length === 0) return res.json({ data: [], total: 0, page, limit })

  let query = supabase.from('bookings')
    .select('*, boats(id, title, images, city, port, price_per_day), renters:users!renter_id(id, first_name, last_name, avatar)', { count: 'exact' })
    .in('boat_id', boatIds)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (req.query.status) query = query.eq('status', req.query.status)

  const { data, count, error } = await query
  if (error) return res.status(500).json({ message: error.message })
  return res.json({ data: (data || []).map(formatBooking), total: count || 0, page, limit })
})

// ─── GET /bookings/:id ─────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const { data: booking } = await supabase.from('bookings')
    .select('*, boats(*, users(id, first_name, last_name, avatar)), renters:users!renter_id(id, first_name, last_name, avatar)')
    .eq('id', req.params.id).single()

  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id
  if (!isRenter && !isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  return res.json(formatBooking(booking))
})

// ─── PATCH /bookings/:id/status ────────────────────────────
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status, action, cancellationReason } = req.body

  // Supporte aussi { action: 'accept'|'reject' } pour compatibilité frontend
  let finalStatus = status
  if (action === 'accept') finalStatus = 'CONFIRMED'
  if (action === 'reject') finalStatus = 'CANCELLED'

  const validStatuses = ['CONFIRMED','CANCELLED','COMPLETED','DISPUTED']
  if (!validStatuses.includes(finalStatus)) return res.status(400).json({ message: 'Statut invalide' })

  const { data: booking } = await supabase.from('bookings').select('*, boats(owner_id)').eq('id', req.params.id).single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id
  if (!isRenter && !isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const updates = { status: finalStatus, updated_at: new Date().toISOString() }
  if (cancellationReason) updates.cancellation_reason = cancellationReason

  const { data: updated, error } = await supabase.from('bookings').update(updates).eq('id', req.params.id).select('*, boats(id, title, images, city, port, price_per_day)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBooking(updated))
})

// ─── POST /bookings/:id/cancel ─────────────────────────────
router.post('/:id/cancel', authenticate, async (req, res) => {
  const { cancellationReason } = req.body
  const { data: booking } = await supabase.from('bookings').select('*, boats(owner_id)').eq('id', req.params.id).single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id
  if (!isRenter && !isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const { data: updated, error } = await supabase.from('bookings').update({ status: 'CANCELLED', cancellation_reason: cancellationReason, updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*, boats(id, title, images, city, port, price_per_day)').single()
  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBooking(updated))
})

// ─── POST /bookings/:id/payment-intent ────────────────────
router.post('/:id/payment-intent', authenticate, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe non configuré' })

  const { data: booking } = await supabase.from('bookings').select('*, boats(title)').eq('id', req.params.id).single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  if (booking.renter_id !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })
  if (booking.status !== 'PENDING') return res.status(400).json({ message: 'Statut invalide pour le paiement' })

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(booking.total_price * 100),
    currency: 'eur',
    metadata: { bookingId: String(booking.id) },
    description: `SailingLoc – ${booking.boats?.title || 'Réservation'}`,
  })

  return res.json({ clientSecret: intent.client_secret, bookingId: booking.id, amount: booking.total_price })
})

// ─── POST /bookings/confirm-payment ───────────────────────
router.post('/confirm-payment', authenticate, async (req, res) => {
  const { bookingId, paymentIntentId } = req.body
  if (!bookingId || !paymentIntentId) return res.status(400).json({ message: 'bookingId et paymentIntentId requis' })

  const { data: updated, error } = await supabase.from('bookings').update({
    status: 'CONFIRMED',
    stripe_payment_intent_id: paymentIntentId,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId).select('*, boats(id, title, images, city, port, price_per_day)').single()

  if (error) return res.status(500).json({ message: error.message })
  return res.json(formatBooking(updated))
})

export default router