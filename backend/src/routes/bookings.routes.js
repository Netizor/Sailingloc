import { Router } from 'express'
import Stripe from 'stripe'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'
import { sendCancellationEmail } from '../services/email.service.js'
import { notifyAdmins, notifyUser } from '../services/notifications.service.js'

const router = Router()
// Valide uniquement les vraies clés (sk_test_XXX ou sk_live_XXX avec ≥20 chars)
const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey && /^sk_(test|live)_[a-zA-Z0-9]{20,}$/.test(stripeKey)
  ? new Stripe(stripeKey)
  : null
const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10')

function computeDays(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}

function formatBooking(b, hasReview = false) {
  const totalDays = computeDays(b.start_date, b.end_date)
  const dailyRate = b.boats?.price_per_day != null ? parseFloat(b.boats.price_per_day) : 0
  const skipperFee = parseFloat(b.skipper_fee || 0)
  const serviceFee = parseFloat(b.service_fee || 0)
  const totalAmount = parseFloat(b.total_price || 0)
  const subtotal = Math.max(0, totalAmount - serviceFee - skipperFee) || dailyRate * totalDays
  const depositAmount = b.deposit_amount != null
    ? parseFloat(b.deposit_amount)
    : (b.boats?.deposit != null ? parseFloat(b.boats.deposit) : 0)

  return {
    id: b.id,
    boatId: b.boat_id,
    renterId: b.renter_id,
    ownerId: b.boats?.owner_id ?? null,
    startDate: b.start_date,
    endDate: b.end_date,
    totalDays,
    withSkipper: b.with_skipper,
    dailyRate,
    subtotal,
    platformFee: serviceFee,
    depositAmount,
    totalAmount,
    status: b.status,
    hasReview,
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
      depositAmount: b.boats.deposit,
    } : null,
    owner: b.boats?.users ? {
      id: b.boats.users.id,
      firstName: b.boats.users.first_name,
      lastName: b.boats.users.last_name,
      avatar: b.boats.users.avatar,
    } : null,
    renter: b.renters ? {
      id: b.renters.id,
      firstName: b.renters.first_name,
      lastName: b.renters.last_name,
      email: b.renters.email,
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

  const needsLicense = !withSkipper && boat.required_license && boat.required_license !== 'NONE'
  if (needsLicense) {
    const { data: renter } = await supabase
      .from('users')
      .select('sailing_qualifications, sailor_cv_status, sailor_cv_doc')
      .eq('id', req.user.id)
      .single()
    const hasQualifications = Boolean(renter?.sailing_qualifications?.trim())
    const hasApprovedCv = renter?.sailor_cv_status === 'APPROVED' && Boolean(renter?.sailor_cv_doc)
    if (!hasQualifications && !hasApprovedCv) {
      return res.status(403).json({
        message: 'Un permis bateau est requis pour ce bateau. Renseignez vos qualifications nautiques ou uploadez votre permis dans votre profil.',
      })
    }
  }

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

  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR')
  const notifBody = `Réservation pour "${booking.boats?.title || 'un bateau'}" du ${fmtDate(startDate)} au ${fmtDate(endDate)}`
  const notifData = { bookingId: booking.id, boatId }

  // Notifier le propriétaire du bateau
  notifyUser(boat.owner_id, 'BOOKING_REQUEST', 'Nouvelle demande de réservation', notifBody, notifData).catch(() => {})

  // Notifier les admins
  notifyAdmins('BOOKING_REQUEST', 'Nouvelle réservation', notifBody, notifData).catch(() => {})

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

  const bookings = data || []
  const bookingIds = bookings.map((b) => b.id)
  const { data: reviewed } = bookingIds.length
    ? await supabase.from('reviews').select('booking_id').eq('author_id', req.user.id).in('booking_id', bookingIds)
    : { data: [] }
  const reviewedIds = new Set((reviewed || []).map((r) => r.booking_id))

  return res.json({
    data: bookings.map((b) => formatBooking(b, reviewedIds.has(b.id))),
    total: count || 0,
    page,
    limit,
  })
})

const MONTH_LABELS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function ownerEarnings(booking) {
  const total = parseFloat(booking.total_price || 0)
  const serviceFee = parseFloat(booking.service_fee || 0)
  return Math.round((total - serviceFee) * 100) / 100
}

function bookingInYear(booking, year) {
  const d = new Date(booking.start_date)
  return d.getFullYear() === year
}

// ─── GET /bookings/owner/revenues ───────────────────────────
router.get('/owner/revenues', authenticate, async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear()
  const boatIdFilter = req.query.boatId ? parseInt(req.query.boatId) : null

  const { data: myBoats } = await supabase.from('boats').select('id, title, images, price_per_day').eq('owner_id', req.user.id)
  const boats = myBoats || []
  const boatIds = boats.map(b => b.id)
  if (boatIds.length === 0) {
    return res.json({
      summary: {
        totalEarnings: 0, thisMonthEarnings: 0, pendingEarnings: 0,
        completedEarnings: 0, confirmedEarnings: 0,
        totalBookings: 0, completedBookings: 0, confirmedBookings: 0,
      },
      byMonth: MONTH_LABELS_FR.map((label, i) => ({
        month: `${year}-${String(i + 1).padStart(2, '0')}`,
        label: `${label} ${year}`,
        earnings: 0,
        bookings: 0,
      })),
      byBoat: [],
      recentBookings: [],
    })
  }

  let query = supabase.from('bookings')
    .select('*, boats(id, title, images, city, port, price_per_day, owner_id), renters:users!renter_id(id, first_name, last_name, avatar)')
    .in('boat_id', boatIds)
    .in('status', ['PENDING', 'CONFIRMED', 'COMPLETED'])

  if (boatIdFilter) query = query.eq('boat_id', boatIdFilter)

  const { data: allBookings, error } = await query
  if (error) return res.status(500).json({ message: error.message })

  const yearBookings = (allBookings || []).filter(b => bookingInYear(b, year))
  const now = new Date()

  const confirmed = yearBookings.filter(b => b.status === 'CONFIRMED')
  const completed = yearBookings.filter(b => b.status === 'COMPLETED')
  const pending = yearBookings.filter(b => b.status === 'PENDING')
  const paidBookings = [...confirmed, ...completed]

  const thisMonthBookings = paidBookings.filter(b => {
    const d = new Date(b.start_date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

  const byMonth = MONTH_LABELS_FR.map((label, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const monthBookings = paidBookings.filter(b => {
      const d = new Date(b.start_date)
      return d.getFullYear() === year && d.getMonth() === i
    })
    return {
      month: monthStr,
      label: `${label} ${year}`,
      earnings: Math.round(monthBookings.reduce((s, b) => s + ownerEarnings(b), 0) * 100) / 100,
      bookings: monthBookings.length,
    }
  })

  const boatMap = new Map(boats.map(b => [b.id, b]))
  const byBoatMap = new Map()
  for (const b of paidBookings) {
    const boat = boatMap.get(b.boat_id)
    if (!boat) continue
    const entry = byBoatMap.get(b.boat_id) || {
      boatId: b.boat_id,
      boatTitle: boat.title,
      boatImage: boat.images?.[0] || null,
      earnings: 0,
      bookings: 0,
      totalDays: 0,
    }
    entry.earnings += ownerEarnings(b)
    entry.bookings += 1
    entry.totalDays += computeDays(b.start_date, b.end_date)
    byBoatMap.set(b.boat_id, entry)
  }

  const byBoat = [...byBoatMap.values()].map(b => ({
    ...b,
    earnings: Math.round(b.earnings * 100) / 100,
    averageDailyRate: b.totalDays > 0 ? Math.round((b.earnings / b.totalDays) * 100) / 100 : 0,
  })).sort((a, b) => b.earnings - a.earnings)

  const recentBookings = paidBookings
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(formatBooking)

  return res.json({
    summary: {
      totalEarnings: Math.round(paidBookings.reduce((s, b) => s + ownerEarnings(b), 0) * 100) / 100,
      thisMonthEarnings: Math.round(thisMonthBookings.reduce((s, b) => s + ownerEarnings(b), 0) * 100) / 100,
      pendingEarnings: Math.round(pending.reduce((s, b) => s + ownerEarnings(b), 0) * 100) / 100,
      completedEarnings: Math.round(completed.reduce((s, b) => s + ownerEarnings(b), 0) * 100) / 100,
      confirmedEarnings: Math.round(confirmed.reduce((s, b) => s + ownerEarnings(b), 0) * 100) / 100,
      totalBookings: paidBookings.length,
      completedBookings: completed.length,
      confirmedBookings: confirmed.length,
    },
    byMonth,
    byBoat,
    recentBookings,
  })
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

  const bookings = data || []
  const bookingIds = bookings.map((b) => b.id)
  const { data: reviewed } = bookingIds.length
    ? await supabase.from('reviews').select('booking_id').eq('author_id', req.user.id).in('booking_id', bookingIds)
    : { data: [] }
  const reviewedIds = new Set((reviewed || []).map((r) => r.booking_id))

  return res.json({
    data: bookings.map((b) => formatBooking(b, reviewedIds.has(b.id))),
    total: count || 0,
    page,
    limit,
  })
})

// ─── GET /bookings/:id ─────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const { data: booking } = await supabase.from('bookings')
    .select('*, boats(*, users(id, first_name, last_name, avatar)), renters:users!renter_id(id, first_name, last_name, email, avatar)')
    .eq('id', req.params.id).single()

  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

  const isRenter = booking.renter_id === req.user.id
  const isOwner  = booking.boats?.owner_id === req.user.id
  if (!isRenter && !isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

  const { data: existingReview } = await supabase.from('reviews')
    .select('id').eq('booking_id', booking.id).eq('author_id', req.user.id).maybeSingle()

  return res.json(formatBooking(booking, !!existingReview))
})

// ─── PATCH /bookings/:id/status ────────────────────────────
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status, action, cancellationReason } = req.body

  // Supporte { action: 'accept'|'reject' } et { status: '...' }
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

  // Seul le propriétaire ou l'admin peut confirmer manuellement (sans paiement Stripe)
  if (finalStatus === 'CONFIRMED' && !booking.stripe_payment_intent_id && !isOwner && req.user.role !== 'ADMIN') {
    return res.status(400).json({ message: 'Impossible de confirmer sans paiement enregistré.' })
  }
  // Bloquer la transition si déjà annulé ou terminé
  if (['CANCELLED','COMPLETED'].includes(booking.status) && finalStatus !== booking.status) {
    return res.status(400).json({ message: 'Cette réservation ne peut plus être modifiée.' })
  }

  const updates = { status: finalStatus, updated_at: new Date().toISOString() }
  if (cancellationReason) updates.cancellation_reason = cancellationReason

  const { data: updated, error } = await supabase.from('bookings').update(updates).eq('id', req.params.id).select('*, boats(id, title, images, city, port, price_per_day)').single()
  if (error) return res.status(500).json({ message: error.message })

  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR')
  const boatTitle = updated.boats?.title || 'un bateau'
  const period = `du ${fmtDate(updated.start_date)} au ${fmtDate(updated.end_date)}`
  const notifData = { bookingId: updated.id, boatId: updated.boat_id }

  if (finalStatus === 'CONFIRMED') {
    notifyUser(updated.renter_id, 'BOOKING_CONFIRMED', 'Réservation acceptée', `Votre réservation pour "${boatTitle}" ${period} a été acceptée.`, notifData).catch(() => {})
  } else if (finalStatus === 'CANCELLED') {
    notifyUser(updated.renter_id, 'BOOKING_CANCELLED', 'Réservation refusée', `Votre réservation pour "${boatTitle}" ${period} a été refusée par le propriétaire.`, notifData).catch(() => {})
  } else if (finalStatus === 'COMPLETED') {
    notifyUser(updated.renter_id, 'BOOKING_COMPLETED', 'Réservation terminée', `Votre réservation pour "${boatTitle}" est terminée. Laissez un avis !`, notifData).catch(() => {})
  }

  return res.json(formatBooking(updated))
})

// ─── POST /bookings/:id/cancel ─────────────────────────────
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { cancellationReason } = req.body
    if (!cancellationReason?.trim()) return res.status(400).json({ message: 'Le motif d\'annulation est requis' })

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, boats(id, title, owner_id, users(id, email, first_name)), renters:users!renter_id(id, email, first_name)')
      .eq('id', req.params.id)
      .single()

    if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })

    const isRenter = booking.renter_id === req.user.id
    const isOwner  = booking.boats?.owner_id === req.user.id
    if (!isRenter && !isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' })

    if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cette réservation ne peut plus être annulée' })
    }

    const now = new Date()
    const startDate = new Date(booking.start_date)
    if (startDate <= now) {
      return res.status(400).json({ message: 'Impossible d\'annuler une réservation déjà commencée' })
    }

    // ── Politique de remboursement ──────────────────────────
    const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))
    let refundPercent = 0
    if (isOwner || req.user.role === 'ADMIN') {
      refundPercent = 100 // Propriétaire annule → remboursement total
    } else if (daysUntilStart > 7) {
      refundPercent = 100
    } else if (daysUntilStart >= 2) {
      refundPercent = 50
    }
    const refundAmount = Math.round(booking.total_price * refundPercent) / 100

    // ── Remboursement Stripe ────────────────────────────────
    if (stripe && booking.stripe_payment_intent_id && refundAmount > 0) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
        })
      } catch (stripeErr) {
        console.error('[Stripe] Erreur remboursement:', stripeErr.message)
      }
    }

    // ── Mise à jour BDD ─────────────────────────────────────
    const { data: updated, error } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED', cancellation_reason: cancellationReason.trim(), updated_at: now.toISOString() })
      .eq('id', req.params.id)
      .select('*, boats(id, title, images, city, port, price_per_day)')
      .single()

    if (error) return res.status(500).json({ message: error.message })

    // ── Notifications email ─────────────────────────────────
    const boatTitle   = booking.boats?.title ?? 'Bateau'
    const fmtDate     = (d) => new Date(d).toLocaleDateString('fr-FR')
    const emailData   = { boatTitle, startDate: fmtDate(booking.start_date), endDate: fmtDate(booking.end_date), reason: cancellationReason, refundAmount, cancelledByOwner: isOwner }

    try {
      const renterEmail = booking.renters?.email
      const ownerEmail  = booking.boats?.users?.email
      if (renterEmail) await sendCancellationEmail({ to: renterEmail, firstName: booking.renters?.first_name ?? 'Locataire', ...emailData, isRenter: true })
      if (ownerEmail)  await sendCancellationEmail({ to: ownerEmail,  firstName: booking.boats?.users?.first_name ?? 'Propriétaire', ...emailData, isRenter: false })
    } catch (emailErr) {
      console.error('[Email] Erreur envoi annulation:', emailErr.message)
    }

    const cancelTitle   = booking.boats?.title || 'un bateau'
    const cancelFmtDate = (d) => new Date(d).toLocaleDateString('fr-FR')
    const cancelPeriod  = `du ${cancelFmtDate(booking.start_date)} au ${cancelFmtDate(booking.end_date)}`
    const cancelData    = { bookingId: booking.id, boatId: booking.boat_id }

    if (isOwner) {
      notifyUser(booking.renter_id, 'BOOKING_CANCELLED', 'Réservation annulée', `Le propriétaire a annulé votre réservation pour "${cancelTitle}" ${cancelPeriod}.`, cancelData).catch(() => {})
    } else {
      const ownerId = booking.boats?.owner_id
      if (ownerId) notifyUser(ownerId, 'BOOKING_CANCELLED', 'Réservation annulée', `Un locataire a annulé sa réservation pour "${cancelTitle}" ${cancelPeriod}.`, cancelData).catch(() => {})
    }
    notifyAdmins('BOOKING_CANCELLED', 'Réservation annulée', `Réservation #${booking.id} annulée`, cancelData).catch(() => {})

    return res.json({ ...formatBooking(updated), refundAmount, refundPercent })
  } catch (err) {
    next(err)
  }
})

// ─── POST /bookings/:id/payment-intent ────────────────────
router.post('/:id/payment-intent', authenticate, async (req, res, next) => {
  try {
    if (!stripe) return res.status(503).json({ message: 'Paiement en ligne non disponible — Stripe non configuré (ajoutez STRIPE_SECRET_KEY dans .env)' })

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

    await supabase.from('bookings').update({
      stripe_payment_intent_id: intent.id,
      updated_at: new Date().toISOString(),
    }).eq('id', booking.id).eq('status', 'PENDING')

    return res.json({ clientSecret: intent.client_secret, bookingId: booking.id, amount: booking.total_price })
  } catch (err) {
    if (err?.type === 'StripeAuthenticationError') {
      return res.status(503).json({ message: 'Clé Stripe invalide — vérifiez STRIPE_SECRET_KEY dans .env' })
    }
    next(err)
  }
})

// ─── POST /bookings/confirm-payment ───────────────────────
router.post('/confirm-payment', authenticate, async (req, res) => {
  const { bookingId, paymentIntentId } = req.body
  if (!bookingId || !paymentIntentId) return res.status(400).json({ message: 'bookingId et paymentIntentId requis' })
  if (!stripe) return res.status(503).json({ message: 'Stripe non configuré' })

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
  if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
  if (booking.renter_id !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })
  if (booking.status !== 'PENDING') return res.status(400).json({ message: 'Réservation déjà traitée' })

  let intent
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return res.status(400).json({ message: 'Paiement introuvable' })
  }

  if (intent.status !== 'succeeded') {
    return res.status(400).json({ message: 'Le paiement n\'a pas été confirmé par Stripe' })
  }
  if (intent.metadata?.bookingId !== String(bookingId)) {
    return res.status(400).json({ message: 'Ce paiement ne correspond pas à la réservation' })
  }
  const expectedAmount = Math.round(parseFloat(booking.total_price) * 100)
  if (intent.amount !== expectedAmount) {
    return res.status(400).json({ message: 'Montant du paiement incorrect' })
  }

  const { data: updated, error } = await supabase.from('bookings').update({
    status: 'CONFIRMED',
    stripe_payment_intent_id: paymentIntentId,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId).eq('status', 'PENDING').select('*, boats(id, title, images, city, port, price_per_day, owner_id)').single()

  if (error || !updated) return res.status(409).json({ message: 'Réservation déjà traitée ou introuvable' })

  const payFmtDate = (d) => new Date(d).toLocaleDateString('fr-FR')
  const payTitle = updated.boats?.title || 'un bateau'
  const payPeriod = `du ${payFmtDate(updated.start_date)} au ${payFmtDate(updated.end_date)}`
  const payData = { bookingId: updated.id, boatId: updated.boat_id }

  const ownerId = updated.boats?.owner_id
  if (ownerId) notifyUser(ownerId, 'PAYMENT_RECEIVED', 'Paiement reçu', `Paiement reçu pour "${payTitle}" ${payPeriod}.`, payData).catch(() => {})
  notifyUser(updated.renter_id, 'BOOKING_CONFIRMED', 'Réservation confirmée', `Votre réservation pour "${payTitle}" ${payPeriod} est confirmée. Bon voyage !`, payData).catch(() => {})

  return res.json(formatBooking(updated))
})

export default router