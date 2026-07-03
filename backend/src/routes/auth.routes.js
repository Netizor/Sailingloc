import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import rateLimit from 'express-rate-limit'
import supabase from '../lib/supabase.js'
import { signAccessToken, generateRefreshToken, verifyAccessToken } from '../lib/jwt.js'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  sendEmailVerification,
  sendPasswordReset,
} from '../services/email.service.js'

const router = Router()

// Rate limiters
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: 'Trop de tentatives. Réessayez dans une heure.' } })
const resetLimiter    = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: 'Trop de tentatives. Réessayez dans une heure.' } })
const loginLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' } })

// ─── Helper ────────────────────────────────────────────────
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
    kycVerified: Boolean(u.kyc_verified_at || u.kyc_status === 'APPROVED'),
    isActive: !u.is_blocked,
    emailVerifiedAt: u.email_verified_at,
    termsAcceptedAt: u.terms_accepted_at,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }
}

// ─── POST /auth/register ───────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'email, password, firstName et lastName sont requis' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Format email invalide' })
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir entre 12 et 128 caractères' })
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.' })
  }

  const allowedRoles = ['RENTER', 'OWNER']
  const userRole = allowedRoles.includes(role) ? role : 'RENTER'

  // Vérifier si email déjà utilisé
  const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single()
  if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé' })

  const hashedPassword = await bcrypt.hash(password, 12)

  const { data: user, error } = await supabase.from('users').insert({
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    role: userRole,
    terms_accepted_at: new Date().toISOString(),
  }).select().single()

  if (error) return res.status(500).json({ message: 'Erreur lors de la création du compte' })

  // Token de vérification email (24h)
  const verifToken = uuidv4()
  await supabase.from('email_verification_tokens').insert({
    token: verifToken,
    user_id: user.id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  try { await sendEmailVerification(user.email, user.first_name, verifToken) } catch {}

  const accessToken  = signAccessToken({ sub: user.id, role: user.role })
  const refreshToken = generateRefreshToken()
  await supabase.from('refresh_tokens').insert({
    token: refreshToken,
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return res.status(201).json({ accessToken, refreshToken, user: formatUser(user) })
})

// ─── POST /auth/login ──────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'email et password requis' })

  const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single()
  if (!user) return res.status(401).json({ message: 'Identifiants incorrects' })
  if (user.is_blocked) return res.status(403).json({ message: 'Compte suspendu. Contactez le support.' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' })

  const accessToken  = signAccessToken({ sub: user.id, role: user.role })
  const refreshToken = generateRefreshToken()
  await supabase.from('refresh_tokens').insert({
    token: refreshToken,
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return res.json({ accessToken, refreshToken, user: formatUser(user) })
})

// ─── POST /auth/logout ─────────────────────────────────────
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await supabase.from('refresh_tokens').delete().eq('token', refreshToken)
  }
  return res.json({ message: 'Déconnecté' })
})

// ─── POST /auth/refresh ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken requis' })

  const { data: tokenRow } = await supabase
    .from('refresh_tokens')
    .select('*, users(*)')
    .eq('token', refreshToken)
    .single()

  if (!tokenRow) return res.status(401).json({ message: 'Token invalide ou expiré' })
  if (new Date(tokenRow.expires_at) < new Date()) {
    await supabase.from('refresh_tokens').delete().eq('token', refreshToken)
    return res.status(401).json({ message: 'Token expiré' })
  }

  const user = tokenRow.users
  const accessToken = signAccessToken({ sub: user.id, role: user.role })
  return res.json({ accessToken })
})

// ─── GET /auth/me ──────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  return res.json(formatUser(req.user))
})

// ─── POST /auth/forgot-password ───────────────────────────
router.post('/forgot-password', resetLimiter, async (req, res) => {
  const { email } = req.body
  // Anti-énumération : toujours 200
  if (!email) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' })

  const { data: user } = await supabase.from('users').select('id, first_name').eq('email', email.toLowerCase()).single()
  if (user) {
    // Invalider les anciens tokens
    await supabase.from('password_reset_tokens').delete().eq('user_id', user.id)
    const token = uuidv4()
    await supabase.from('password_reset_tokens').insert({
      token,
      user_id: user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    try { await sendPasswordReset(email, user.first_name, token) } catch {}
  }
  return res.json({ message: 'Si cet email existe, un lien a été envoyé.' })
})

// ─── POST /auth/reset-password ────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ message: 'token et password requis' })
  if (password.length < 12) return res.status(400).json({ message: 'Mot de passe trop court (12 caractères minimum)' })

  const { data: tokenRow } = await supabase.from('password_reset_tokens').select('*').eq('token', token).single()
  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    return res.status(400).json({ message: 'Token invalide ou expiré' })
  }

  const hashed = await bcrypt.hash(password, 12)
  await supabase.from('users').update({ password: hashed }).eq('id', tokenRow.user_id)
  await supabase.from('password_reset_tokens').delete().eq('token', token)
  // Invalider tous les refresh tokens
  await supabase.from('refresh_tokens').delete().eq('user_id', tokenRow.user_id)

  return res.json({ message: 'Mot de passe réinitialisé avec succès' })
})

// ─── GET /auth/verify-email ────────────────────────────────
router.get('/verify-email', async (req, res) => {
  const { token } = req.query
  if (!token) return res.status(400).json({ message: 'Token requis' })

  const { data: tokenRow } = await supabase.from('email_verification_tokens').select('*').eq('token', token).single()
  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    return res.status(400).json({ message: 'Token invalide ou expiré' })
  }

  await supabase.from('users').update({ email_verified_at: new Date().toISOString() }).eq('id', tokenRow.user_id)
  await supabase.from('email_verification_tokens').delete().eq('token', token)

  const { data: user } = await supabase.from('users').select('*').eq('id', tokenRow.user_id).single()
  const accessToken  = signAccessToken({ sub: user.id, role: user.role })
  const refreshToken = generateRefreshToken()
  await supabase.from('refresh_tokens').insert({
    token: refreshToken,
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return res.json({ accessToken, refreshToken, user: formatUser(user) })
})

// ─── POST /auth/resend-verification ───────────────────────
router.post('/resend-verification', authenticate, async (req, res) => {
  const user = req.user
  if (user.email_verified_at) return res.status(400).json({ message: 'Email déjà vérifié' })

  await supabase.from('email_verification_tokens').delete().eq('user_id', user.id)
  const token = uuidv4()
  await supabase.from('email_verification_tokens').insert({
    token,
    user_id: user.id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
  try { await sendEmailVerification(user.email, user.first_name, token) } catch {}
  return res.json({ message: 'Email de vérification renvoyé' })
})

// ─── POST /auth/hibp-check ─────────────────────────────────
// Vérifie le mot de passe via k-anonymity (Have I Been Pwned)
import crypto from 'crypto'

router.post('/hibp-check', authenticate, async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ message: 'password requis' })

  try {
    const hash   = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
    const text  = await response.text()
    const lines = text.split('\n')
    const match = lines.find(l => l.startsWith(suffix))
    const count = match ? parseInt(match.split(':')[1]) : 0

    return res.json({ compromised: count > 0, count })
  } catch {
    return res.json({ compromised: false })
  }
})

export default router
