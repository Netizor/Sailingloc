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

  // select('*') : évite les erreurs si des colonnes optionnelles (ex. sailing_experience_years)
  // ne sont pas encore migrées sur Supabase — une liste explicite avec colonne manquante
  // renvoie 401 et déclenche une déconnexion côté frontend.
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
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
