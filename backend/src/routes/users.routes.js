import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import supabase from '../lib/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// ─── PATCH /users/profile ──────────────────────────────────
router.patch('/profile', authenticate, async (req, res) => {
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

  return res.json({ user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name, phone: user.phone, avatar: user.avatar, bio: user.bio } })
})

// ─── PATCH /users/password ─────────────────────────────────
router.patch('/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword et newPassword requis' })
  if (newPassword.length < 12) return res.status(400).json({ message: 'Minimum 12 caractères' })

  const { data: userWithPw } = await supabase.from('users').select('password').eq('id', req.user.id).single()
  const valid = await bcrypt.compare(currentPassword, userWithPw.password)
  if (!valid) return res.status(400).json({ message: 'Mot de passe actuel incorrect' })

  const hashed = await bcrypt.hash(newPassword, 12)
  await supabase.from('users').update({ password: hashed }).eq('id', req.user.id)
  return res.json({ message: 'Mot de passe modifié' })
})

// ─── POST /users/avatar ────────────────────────────────────
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' })

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sailingloc/avatars', resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
      (err, r) => err ? reject(err) : resolve(r)
    )
    stream.end(req.file.buffer)
  })

  await supabase.from('users').update({ avatar: result.secure_url }).eq('id', req.user.id)
  return res.json({ avatar: result.secure_url })
})

// ─── GET /users/:id/public ─────────────────────────────────
router.get('/:id/public', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, first_name, last_name, avatar, bio, created_at, role')
    .eq('id', req.params.id)
    .single()

  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

  const { data: boats, count: boatsCount } = await supabase
    .from('boats')
    .select('id, title, images, city, price_per_day, average_rating', { count: 'exact' })
    .eq('owner_id', req.params.id)
    .eq('status', 'active')
    .limit(6)

  return res.json({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.created_at,
    boats: boats || [],
    totalBoats: boatsCount || 0,
  })
})

// ─── PATCH /users/role ─────────────────────────────────────
// Permet à un RENTER de devenir OWNER (onboarding)
router.patch('/role', authenticate, async (req, res) => {
  const { role } = req.body
  if (!['OWNER', 'RENTER'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' })

  const { data: user, error } = await supabase
    .from('users').update({ role }).eq('id', req.user.id).select().single()
  if (error) return res.status(500).json({ message: error.message })

  return res.json({ role: user.role })
})

export default router
