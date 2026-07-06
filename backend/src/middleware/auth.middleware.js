import { verifyAccessToken } from '../lib/jwt.js'
import supabase from '../lib/supabase.js'

/**
 * Middleware d'authentification JWT.
 * Lit le Bearer token depuis Authorization, le vérifie,
 * puis charge l'utilisateur depuis Supabase et l'attache à req.user.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou invalide' })
  }

  const token = authHeader.slice(7)

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return res.status(401).json({ message: 'Token expiré ou invalide' })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, first_name, last_name, phone, avatar, bio, kyc_status, kyc_verified_at, sailing_experience_years, sailing_qualifications, sailing_areas, sailor_bio, sailor_cv_status, sailor_cv_doc, sailor_cv_submitted_at, sailor_cv_reviewed_at, sailor_cv_rejection_reason, is_blocked, email_verified_at, terms_accepted_at, created_at, updated_at')
    .eq('id', payload.sub)
    .single()

  if (error || !user) {
    return res.status(401).json({ message: 'Utilisateur introuvable' })
  }

  if (user.is_blocked) {
    return res.status(403).json({ message: 'Compte suspendu. Contactez le support.' })
  }

  req.user = user
  next()
}

/**
 * Middleware de vérification de rôle.
 * Usage : requireRole('ADMIN') ou requireRole(['ADMIN', 'OWNER'])
 */
export function requireRole(...roles) {
  const allowed = roles.flat()
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' })
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    next()
  }
}

/**
 * Middleware optionnel : attache l'utilisateur si le token est présent,
 * mais ne bloque pas la requête si absent.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next()

  const token = authHeader.slice(7)
  try {
    const payload = verifyAccessToken(token)
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, avatar, is_blocked')
      .eq('id', payload.sub)
      .single()
    if (user && !user.is_blocked) req.user = user
  } catch {
    // token invalide ou expiré → on continue sans user
  }
  next()
}
