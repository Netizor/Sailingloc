import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import supabase from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) return cb(new Error('Format accepté : JPG, PNG ou WebP'))
    cb(null, true)
  },
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function formatUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
    kycVerified: Boolean(user.kyc_verified_at || user.kyc_status === 'APPROVED'),
    isActive: !user.is_blocked,
    sailingExperienceYears: user.sailing_experience_years,
    sailingQualifications: user.sailing_qualifications,
    sailingAreas: user.sailing_areas,
    sailorBio: user.sailor_bio,
    sailorCvStatus: user.sailor_cv_status || 'NOT_SUBMITTED',
    sailorCvDoc: user.sailor_cv_doc,
    sailorCvSubmittedAt: user.sailor_cv_submitted_at,
    sailorCvReviewedAt: user.sailor_cv_reviewed_at,
    sailorCvRejectionReason: user.sailor_cv_rejection_reason,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

function formatBoatSummary(boat) {
  return {
    id: boat.id,
    ownerId: boat.owner_id,
    title: boat.title,
    description: boat.description,
    type: boat.type,
    images: boat.images || [],
    city: boat.city,
    port: boat.port,
    country: boat.country,
    dailyRate: boat.price_per_day,
    rating: boat.average_rating || 0,
    reviewCount: boat.review_count || 0,
    status: boat.status,
    createdAt: boat.created_at,
  }
}

function formatReview(review) {
  return {
    id: review.id,
    bookingId: review.booking_id,
    boatId: review.boat_id,
    reviewerId: review.author_id,
    revieweeId: review.target_user_id,
    type: review.type,
    rating: review.rating,
    comment: review.comment,
    isPublished: true,
    createdAt: review.created_at,
    reviewer: review.author ? {
      id: review.author.id,
      firstName: review.author.first_name,
      lastName: review.author.last_name,
      avatar: review.author.avatar,
    } : null,
    boat: review.boats ? {
      id: review.boats.id,
      title: review.boats.title,
    } : null,
  }
}

// ─── PATCH /users/profile ──────────────────────────────────
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const {
      firstName, lastName, phone, bio,
      sailingExperienceYears, sailingQualifications, sailingAreas, sailorBio,
    } = req.body
    const updates = {}

    if (firstName !== undefined) {
      if (firstName.trim().length > 100) return res.status(400).json({ message: 'firstName trop long (100 max)' })
      updates.first_name = firstName.trim()
    }
    if (lastName !== undefined) {
      if (lastName.trim().length > 100) return res.status(400).json({ message: 'lastName trop long (100 max)' })
      updates.last_name = lastName.trim()
    }
    if (phone !== undefined) {
      if (phone && !/^\+?[\d\s\-().]{0,20}$/.test(phone)) return res.status(400).json({ message: 'Numéro de téléphone invalide' })
      updates.phone = phone.trim()
    }
    if (bio !== undefined) {
      if (bio.length > 2000) return res.status(400).json({ message: 'bio trop longue (2000 max)' })
      updates.bio = bio.trim()
    }
    if (sailingExperienceYears !== undefined) {
      if (sailingExperienceYears === null || sailingExperienceYears === '') {
        updates.sailing_experience_years = null
      } else {
        const years = Number(sailingExperienceYears)
        if (!Number.isInteger(years) || years < 0 || years > 100) {
          return res.status(400).json({ message: "Années d'expérience invalides (0 à 100)" })
        }
        updates.sailing_experience_years = years
      }
    }
    if (sailingQualifications !== undefined) {
      if (sailingQualifications && sailingQualifications.length > 2000) return res.status(400).json({ message: 'Qualifications trop longues (2000 max)' })
      updates.sailing_qualifications = sailingQualifications ? sailingQualifications.trim() : null
    }
    if (sailingAreas !== undefined) {
      if (sailingAreas && sailingAreas.length > 2000) return res.status(400).json({ message: 'Zones de navigation trop longues (2000 max)' })
      updates.sailing_areas = sailingAreas ? sailingAreas.trim() : null
    }
    if (sailorBio !== undefined) {
      if (sailorBio && sailorBio.length > 4000) return res.status(400).json({ message: 'CV de marin trop long (4000 max)' })
      updates.sailor_bio = sailorBio ? sailorBio.trim() : null
    }

    updates.updated_at = new Date().toISOString()
    const { data: user, error } = await supabase.from('users').update(updates).eq('id', req.user.id).select().single()
    if (error) return res.status(500).json({ message: error.message })

    return res.json({ user: formatUser(user) })
  } catch (err) {
    next(err)
  }
})

// ─── POST /users/sailor-cv/document ────────────────────────
router.post('/sailor-cv/document', authenticate, upload.single('document'), async (req, res, next) => {
  try {
    if (!['OWNER', 'ADMIN'].includes(req.user.role)) return res.status(403).json({ message: 'Réservé aux propriétaires' })
    if (!req.file) return res.status(400).json({ message: 'Aucun justificatif fourni' })

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(req.file.mimetype)) return res.status(400).json({ message: 'Format accepté : PDF, JPG ou PNG' })

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sailingloc/sailor-cv', resource_type: 'auto' },
        (err, r) => err ? reject(err) : resolve(r)
      )
      stream.end(req.file.buffer)
    })

    const submittedAt = new Date().toISOString()
    const { data: user, error } = await supabase
      .from('users')
      .update({
        sailor_cv_doc: result.secure_url,
        sailor_cv_status: 'PENDING',
        sailor_cv_submitted_at: submittedAt,
        sailor_cv_reviewed_at: null,
        sailor_cv_rejection_reason: null,
        updated_at: submittedAt,
      })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })
    return res.status(201).json({ user: formatUser(user) })
  } catch (err) {
    next(err)
  }
})

// ─── PATCH /users/password ─────────────────────────────────
router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword et newPassword requis' })
    if (newPassword.length < 12 || newPassword.length > 128) return res.status(400).json({ message: 'Le mot de passe doit contenir entre 12 et 128 caractères' })
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.' })
    }

    const { data: userWithPw } = await supabase.from('users').select('password').eq('id', req.user.id).single()
    const valid = await bcrypt.compare(currentPassword, userWithPw.password)
    if (!valid) return res.status(400).json({ message: 'Mot de passe actuel incorrect' })

    const hashed = await bcrypt.hash(newPassword, 12)
    await supabase.from('users').update({ password: hashed }).eq('id', req.user.id)
    return res.json({ message: 'Mot de passe modifié' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /users/avatar ────────────────────────────────────
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' })

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sailingloc/avatars', resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
        (err, r) => (err ? reject(err) : resolve(r))
      )
      stream.end(req.file.buffer)
    })

    const { data: user, error } = await supabase
      .from('users')
      .update({ avatar: result.secure_url })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) return res.status(500).json({ message: error.message })
    return res.json({ avatar: result.secure_url, user: formatUser(user) })
  } catch (err) {
    next(err)
  }
})

// ─── GET /users/me/export ──────────────────────────────────
// DOIT être déclaré avant /:id/profile pour ne pas être capturé comme id='me'
router.get('/me/export', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id

    const [
      userResult,
      boatsResult,
      renterBookingsResult,
      reviewsAuthoredResult,
      reviewsReceivedResult,
      sentMessagesResult,
      receivedMessagesResult,
      favoritesResult,
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, role, first_name, last_name, phone, avatar, bio, kyc_status, kyc_front_doc, kyc_back_doc, kyc_submitted_at, kyc_reviewed_at, kyc_verified_at, kyc_rejection_reason, sailing_experience_years, sailing_qualifications, sailing_areas, sailor_bio, sailor_cv_status, sailor_cv_doc, sailor_cv_submitted_at, sailor_cv_reviewed_at, sailor_cv_rejection_reason, is_blocked, email_verified_at, created_at, updated_at')
        .eq('id', userId)
        .single(),
      supabase
        .from('boats')
        .select('id, title, description, type, city, port, country, price_per_day, status, created_at')
        .eq('owner_id', userId),
      supabase
        .from('bookings')
        .select('id, boat_id, renter_id, start_date, end_date, with_skipper, skipper_fee, service_fee, total_price, status, cancellation_reason, created_at, updated_at')
        .eq('renter_id', userId),
      supabase
        .from('reviews')
        .select('id, booking_id, boat_id, author_id, target_user_id, type, rating, comment, created_at')
        .eq('author_id', userId),
      supabase
        .from('reviews')
        .select('id, booking_id, boat_id, author_id, target_user_id, type, rating, comment, created_at')
        .eq('target_user_id', userId),
      supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, is_read, created_at')
        .eq('sender_id', userId),
      supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, is_read, created_at')
        .eq('recipient_id', userId),
      supabase
        .from('favorites')
        .select('id, user_id, boat_id, created_at')
        .eq('user_id', userId),
    ])

    if (userResult.error) return res.status(500).json({ message: userResult.error.message })

    const exportErrors = [
      boatsResult.error,
      renterBookingsResult.error,
      reviewsAuthoredResult.error,
      reviewsReceivedResult.error,
      sentMessagesResult.error,
      receivedMessagesResult.error,
      favoritesResult.error,
    ].filter(Boolean)

    if (exportErrors.length) return res.status(500).json({ message: exportErrors[0].message })

    const boatIds = (boatsResult.data || []).map((boat) => boat.id)
    const ownerBookingsResult = boatIds.length
      ? await supabase
        .from('bookings')
        .select('id, boat_id, renter_id, start_date, end_date, with_skipper, skipper_fee, service_fee, total_price, status, cancellation_reason, created_at, updated_at')
        .in('boat_id', boatIds)
      : { data: [] }

    if (ownerBookingsResult.error) return res.status(500).json({ message: ownerBookingsResult.error.message })

    return res.json({
      exportedAt: new Date().toISOString(),
      user: formatUser(userResult.data),
      boats: boatsResult.data || [],
      bookings: {
        asRenter: renterBookingsResult.data || [],
        asOwner: ownerBookingsResult.data || [],
      },
      reviews: {
        authored: reviewsAuthoredResult.data || [],
        received: reviewsReceivedResult.data || [],
      },
      messages: {
        sent: sentMessagesResult.data || [],
        received: receivedMessagesResult.data || [],
      },
      favorites: favoritesResult.data || [],
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /users/:id/profile ────────────────────────────────
router.get('/:id/profile', async (req, res, next) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, first_name, last_name, avatar, bio, sailing_experience_years, sailing_qualifications, sailing_areas, sailor_bio, sailor_cv_status, sailor_cv_doc, sailor_cv_submitted_at, sailor_cv_reviewed_at, sailor_cv_rejection_reason, is_blocked, created_at, updated_at')
      .eq('id', req.params.id)
      .single()

    if (userError || !user) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const { data: boats, error: boatsError } = await supabase
      .from('boats')
      .select('id, owner_id, title, description, type, images, city, port, country, price_per_day, average_rating, review_count, status, created_at')
      .eq('owner_id', req.params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (boatsError) return res.status(500).json({ message: boatsError.message })

    const boatIds = (boats || []).map((boat) => boat.id)
    const [reviewsQuery, ratingQuery] = boatIds.length
      ? await Promise.all([
        supabase
          .from('reviews')
          .select('*, author:users!author_id(id, first_name, last_name, avatar), boats(id, title)', { count: 'exact' })
          .in('boat_id', boatIds)
          .eq('type', 'RENTER_TO_BOAT')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('reviews')
          .select('rating')
          .in('boat_id', boatIds)
          .eq('type', 'RENTER_TO_BOAT'),
      ])
      : [{ data: [], count: 0, error: null }, { data: [], error: null }]

    if (reviewsQuery.error) return res.status(500).json({ message: reviewsQuery.error.message })
    if (ratingQuery.error) return res.status(500).json({ message: ratingQuery.error.message })

    const reviews = reviewsQuery.data || []
    const allRatings = ratingQuery.data || []
    const rating = allRatings.length
      ? Math.round((allRatings.reduce((sum, review) => sum + review.rating, 0) / allRatings.length) * 10) / 10
      : 0

    return res.json({
      user: formatUser(user),
      boats: (boats || []).map(formatBoatSummary),
      reviews: reviews.map(formatReview),
      rating,
      reviewCount: reviewsQuery.count || allRatings.length,
    })
  } catch (err) {
    next(err)
  }
})

// ─── PATCH /users/role ─────────────────────────────────────
router.patch('/role', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['OWNER', 'RENTER'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' })

    const { data: user, error } = await supabase
      .from('users').update({ role }).eq('id', req.user.id).select().single()
    if (error) return res.status(500).json({ message: error.message })

    return res.json({ role: user.role })
  } catch (err) {
    next(err)
  }
})

export default router
