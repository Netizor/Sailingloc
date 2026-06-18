import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import supabase from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

function formatUser(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone,
    avatar: u.avatar,
    bio: u.bio,
    emailVerifiedAt: u.email_verified_at,
    createdAt: u.created_at,
  }
}

// ─── PATCH /users/profile ──────────────────────────────────
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, bio } = req.body
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

    updates.updated_at = new Date().toISOString()
    const { data: user, error } = await supabase.from('users').update(updates).eq('id', req.user.id).select().single()
    if (error) return res.status(500).json({ message: error.message })

    return res.json({ user: formatUser(user) })
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
        (err, r) => err ? reject(err) : resolve(r)
      )
      stream.end(req.file.buffer)
    })

    const { data: user, error } = await supabase
      .from('users').update({ avatar: result.secure_url }).eq('id', req.user.id).select().single()
    if (error) return res.status(500).json({ message: error.message })

    return res.json({ user: formatUser(user) })
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
      { data: user },
      { data: bookings },
      { data: reviews },
      { data: boats },
      { data: messages },
    ] = await Promise.all([
      supabase.from('users').select('id, email, first_name, last_name, phone, bio, avatar, role, created_at, updated_at').eq('id', userId).single(),
      supabase.from('bookings').select('id, boat_id, start_date, end_date, total_amount, status, created_at').eq('renter_id', userId),
      supabase.from('reviews').select('id, boat_id, rating, comment, type, created_at').eq('reviewer_id', userId),
      supabase.from('boats').select('id, title, city, status, created_at').eq('owner_id', userId),
      supabase.from('messages').select('id, content, created_at, conversation_id').eq('sender_id', userId),
    ])

    return res.json({
      exportedAt: new Date().toISOString(),
      profile: user,
      bookings: bookings || [],
      reviews: reviews || [],
      boats: boats || [],
      messages: messages || [],
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /users/:id/profile ────────────────────────────────
router.get('/:id/profile', async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar, bio, created_at, role')
      .eq('id', req.params.id)
      .single()

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const { data: boats, count: totalBoats } = await supabase
      .from('boats')
      .select('id, title, images, city, price_per_day, average_rating', { count: 'exact' })
      .eq('owner_id', req.params.id)
      .eq('status', 'active')
      .limit(6)

    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:users!reviewer_id(id, first_name, last_name, avatar)')
      .eq('reviewee_id', req.params.id)
      .eq('type', 'OWNER')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    const publishedReviews = reviews || []
    const rating = publishedReviews.length
      ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) / publishedReviews.length
      : 0

    return res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.created_at,
        role: user.role,
      },
      boats: boats || [],
      totalBoats: totalBoats || 0,
      reviews: publishedReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewer: r.reviewer ? {
          id: r.reviewer.id,
          firstName: r.reviewer.first_name,
          lastName: r.reviewer.last_name,
          avatar: r.reviewer.avatar,
        } : null,
      })),
      rating: Math.round(rating * 10) / 10,
      reviewCount: publishedReviews.length,
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
